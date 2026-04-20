/**
 * INDRA INFRASTRUCTURE SILO: infra_workspaces.gs
 * Responsabilidad: Hábitat, Génesis Celular e Ignición.
 */

/**
 * SYSTEM_SATELLITE_DISCOVER: Escaneado Físico Directo (Anti-Ledger).
 */
function _system_handleSatelliteDiscover(uqo) {
    if (!uqo) throw createError('INVALID_INPUT', 'SYSTEM_SATELLITE_DISCOVER requiere UQO.');
    const trx = uqo.trace_id || 'DISCOVERY';
    logInfo(`[discovery] [${trx}] Iniciando escaneo físico de territorio...`);
    
    try {
        const homeRoot = _system_ensureHomeRoot();
        const wsFolders = homeRoot.getFoldersByName(WORKSPACES_FOLDER_NAME_);
        const wsFolder = wsFolders.hasNext() ? wsFolders.next() : null;

        if (!wsFolder) {
            return { items: [], metadata: { status: 'OK', message: 'No se encontró la carpeta de workspaces.' } };
        }

        const folders = wsFolder.getFolders();
        const discovered = [];

        while (folders.hasNext()) {
            const folder = folders.next();
            if (folder.isTrashed()) continue;

            const files = folder.getFilesByName('manifest.json');
            if (files.hasNext()) {
                const file = files.next();
                try {
                    const doc = JSON.parse(file.getBlob().getDataAsString());
                    discovered.push({
                        id: file.getId(),
                        class: 'WORKSPACE',
                        handle: {
                            label: folder.getName(),
                            alias: doc.handle?.alias || folder.getName().toLowerCase(),
                        },
                        payload: {
                            cell_folder_id: folder.getId(),
                            artifacts_folder_id: doc.payload?.artifacts_folder_id || doc.membrane?.artifacts_folder_id,
                            cell_ledger_id: doc.payload?.cell_ledger_id || doc.membrane?.ledger_id,
                            created_at: doc.created_at
                        }
                    });
                } catch (e) {
                    logWarn(`[discovery] ADN corrupto en carpeta: ${folder.getName()}`);
                }
            }
        }

        return { 
            items: discovered.map(d => ({
                ...d,
                provider: 'system',
                metadata: { ...d.metadata, status: 'OK', physical: true }
            })), 
            metadata: { 
                status: 'OK', 
                total: discovered.length,
                scan_timestamp: new Date().toISOString() 
            } 
        };
    } catch (err) {
        logError(`[discovery] FALLO CRÍTICO EN ESCANEO: ${err.message}`);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

/**
 * SYSTEM_SCHEMA_IGNITE: Protocolo de Configuración de Base de Datos.
 * Crea el almacenamiento físico y vincula el ID resultante al esquema original.
 */
function _system_handleSchemaIgnite(uqo) {
  if (!uqo || !uqo.context_id) throw createError('INVALID_INPUT', 'SYSTEM_SCHEMA_IGNITE requiere context_id.');
  const schemaId = uqo.context_id;
  const targetProvider = uqo.data?.target_provider || 'drive';
  const folderId = uqo.data?.target_folder_id || null;
  const traceId = _system_buildTraceId_('SYSTEM_SCHEMA_IGNITE', schemaId);

  // 1. Validar existencia del esquema
  const schemaAtomRes = _system_readAtom(schemaId, uqo.provider);
  const schemaAtom = schemaAtomRes.items?.[0];
  if (!schemaAtom || schemaAtom.class !== DATA_SCHEMA_CLASS_) {
    throw createError('NOT_FOUND', 'Esquema de datos no encontrado.', { trace_id: traceId });
  }

  const fields = schemaAtom.payload?.fields || [];
  if (fields.length === 0) throw createError('INVALID_STATE', 'El esquema no tiene campos para materializar.', { trace_id: traceId });

  // 2. Crear Almacenamiento Físico (Tabla/Spreadsheet)
  const createResult = route({
    provider: targetProvider,
    protocol: 'ATOM_CREATE',
    data: {
      class: 'TABULAR',
      name: schemaAtom.handle?.label || 'Nueva Tabla',
      fields: fields,
      context_id: folderId
    }
  });
  
  if (createResult.metadata?.status !== 'OK' || !createResult.items?.[0]) {
    throw createError('GENESIS_FAILED', `La creación física falló en ${targetProvider}.`, { trace_id: traceId });
  }

  const siloAtom = createResult.items[0];
  logInfo(`[ignite] Almacenamiento físico creado: ${siloAtom.id} (${siloAtom.class})`);

  // 3. VINCULACIÓN TÉCNICA (Trazabilidad Lineal)
  // Actualizamos el esquema original para que "conozca" su destino físico.
  logInfo(`[ignite] Vinculando a esquema origen: ${schemaId} (Clase: ${schemaAtom.class})`);
  const patchResult = _system_handlePatch({
    provider: uqo.provider,
    context_id: schemaId,
    data: {
      payload: {
        target_silo_id: siloAtom.id,
        target_provider: targetProvider,
        ignited_at: new Date().toISOString()
      },
      metadata: { // Inyectamos metadatos de sincronización
        last_materialization: siloAtom.id,
        materialization_status: 'OK'
      }
    }
  });

  logInfo(`[ignite] Vinculación completada. Items devueltos: ${patchResult.items.length}. Clase del primero: ${patchResult.items[0]?.class}`);

  return {
    items: patchResult.items, // Devolvemos el ESQUEMA ACTUALIZADO
    metadata: {
      status: 'OK',
      trace_id: traceId,
      silo_id: siloAtom.id,
      target_provider: targetProvider,
      core_patch_version: 'v10.1-IGNITION-FIX', // Marca de verificación
      message: 'Base de datos configurada y vinculada exitosamente.'
    }
  };
}

/**
 * GÉNESIS CELULAR DE WORKSPACE (ADR-060)
 */
function _system_genesis_cellular_workspace_(label, uqo) {
    if (!label || label.trim().length < 3) {
      throw createError('CONTRACT_VIOLATION', 'Nombre soberano inválido (mínimo 3 caracteres).');
    }

    const home = _system_ensureHomeRoot();
    const wsFolders = home.getFoldersByName(WORKSPACES_FOLDER_NAME_);
    const rootWorkspaces = wsFolders.hasNext() ? wsFolders.next() : home.createFolder(WORKSPACES_FOLDER_NAME_);
        
    const alias = _system_slugify_(label);
    const cellFolder = rootWorkspaces.createFolder(label);
    
    try {
        const cellLedgerId = ledger_initialize_cell(cellFolder.getId(), label);
        const artifactsFolderId = cellFolder.createFolder('artifacts').getId();
        const now = new Date().toISOString();

        const atomDoc = {
            handle: { ns: `com.indra.system.workspace`, alias: alias, label: label },
            class: WORKSPACE_CLASS_,
            provider: uqo.provider || 'system',
            core_id: readCoreOwnerEmail(), 
            created_at: now,
            updated_at: now,
            payload: {
                ...(uqo.data?.payload || {}),
                cell_folder_id: cellFolder.getId(),
                cell_ledger_id: cellLedgerId,
                artifacts_folder_id: artifactsFolderId
            },
            protocols: ['ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE']
        };

        // --- UNIFICACIÓN DE MANIFIESTO (v7.9.3) ---
        // Evitamos el eco: si ledger_initialize_cell ya creó el manifiesto, lo usamos.
        const existingManifest = cellFolder.getFilesByName('manifest.json');
        const identityFile = existingManifest.hasNext() 
            ? existingManifest.next() 
            : cellFolder.createFile('manifest.json', JSON.stringify(atomDoc, null, 2));
            
        const driveId = identityFile.getId();
        atomDoc.id = driveId;
        identityFile.setContent(JSON.stringify(atomDoc, null, 2));

        return { 
            items: [_system_toAtom(atomDoc, driveId, atomDoc.provider)], 
            metadata: { status: 'OK', cellular: true, cell_id: driveId } 
        };

    } catch (err) {
        cellFolder.setTrashed(true);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

function _system_get_cell_infrastructure_(workspaceId) {
    try {
        const res = _system_readAtom(workspaceId, 'system');
        const atom = res.items?.[0];
        if (atom && atom.payload?.artifacts_folder_id) {
            return {
                isCellular: true,
                cellFolder: DriveApp.getFolderById(atom.payload.cell_folder_id),
                artifactsFolder: DriveApp.getFolderById(atom.payload.artifacts_folder_id)
            };
        }
    } catch (e) {}
    return { isCellular: false };
}
