/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system_infrastructure.gs
 * RESPONSABILIDAD: Operaciones puras de infraestructura y Drive.
 * AXIOMA: Solo gestiona la persistencia física de átomos en el Core.
 * =============================================================================
 */

// ─── CONSTANTES INTERNAS ──────────────────────────────────────────────────────


const WORKSPACES_FOLDER_NAME_ = 'workspaces';
const WORKFLOWS_FOLDER_NAME_ = 'workflows';
const SCHEMAS_FOLDER_NAME_ = 'schemas';
const FORMULAS_FOLDER_NAME_ = 'formulas';
const DOCUMENTS_FOLDER_NAME_ = 'documents';

const WORKSPACE_CLASS_ = 'WORKSPACE';
const WORKFLOW_CLASS_ = 'WORKFLOW';
const DATA_SCHEMA_CLASS_ = 'DATA_SCHEMA';
const FORMULA_CLASS_ = 'FORMULA';
const DOCUMENT_CLASS_ = 'DOCUMENT';


// ─── HANDLERS POR PROTOCOLO (INFRAESTRUCTURA) ─────────────────────────────────

/**
 * ATOM_READ: Lista todos los workspaces o lee uno específico.
 * @private
 */
function _system_handleRead(uqo) {
    let contextId = uqo.context_id;
    if (contextId === uqo.provider || contextId === 'system') contextId = 'workspaces';

    let targetClass = null;
    if (contextId === 'workspaces') targetClass = WORKSPACE_CLASS_;
    if (contextId === 'workflows') targetClass = WORKFLOW_CLASS_;
    if (contextId === 'schemas') targetClass = DATA_SCHEMA_CLASS_;
    if (contextId === 'formulas') targetClass = FORMULA_CLASS_;
    if (contextId === 'documents') targetClass = DOCUMENT_CLASS_;

    if (targetClass) {
        return _system_listAtomsByClass(targetClass, uqo.provider, uqo);
    }
    
    // AXIOMA: Si llegamos aquí y es una de las palabras protegidas pero no hay targetClass, 
    // algo falló gravemente o el core-owner lo borró. No intentamos leer un archivo llamado 'atoms' o 'schemas'.
    const protectedPlurals = ['workspaces', 'workflows', 'schemas', 'formulas', 'documents', 'atoms'];
    if (protectedPlurals.includes(contextId)) {
        return { items: [], metadata: { status: 'OK', total: 0 } };
    }

    return _system_readAtom(contextId, uqo.provider);
}

function _system_handleCreate(uqo) {
    const data = uqo.data || {};
    const label = data.handle?.label || data.label || 'Sin título';
    const atomClass = data.class || WORKSPACE_CLASS_;
    const result = _system_createAtom(atomClass, label.trim(), uqo);
    
    // Si es un WORKFLOW, sincronizamos sus disparadores (ADR-018)
    if (atomClass === WORKFLOW_CLASS_ && result.items?.[0]) {
      trigger_service_sync(result.items[0]); // → trigger_service.gs
    }
    
    return result;
}

function _system_handleDelete(uqo) {
    if (!uqo.context_id) throw createError('INVALID_INPUT', 'atom_delete requiere context_id.');
    return _system_deleteAtom(uqo.context_id);
}

function _system_handleUpdate(uqo) {
    if (!uqo.context_id || !uqo.data) throw createError('INVALID_INPUT', 'atom_update requiere context_id y data.');
    const result = _system_updateAtom(uqo.context_id, uqo.data, uqo.provider);
    
    // Resincronizar disparadores si es un WORKFLOW
    if (result.items?.[0] && result.items[0].class === WORKFLOW_CLASS_) {
      trigger_service_sync(result.items[0]); // → trigger_service.gs
    }
    
    return result;
}

/**
 * ATOM_ALIAS_RENAME: Renombrado canónico de handle.alias con propagación a pins.
 */
function _system_handleAliasRename(uqo) {
    const atomId = uqo.context_id;
    const data = uqo.data || {};
    const dryRun = !!data.dry_run;
    const traceId = _system_buildTraceId_('ATOM_ALIAS_RENAME', atomId);

    if (!atomId) throw createError('INVALID_INPUT', 'ATOM_ALIAS_RENAME requiere context_id.');
    if (!data.new_alias) throw createError('INVALID_INPUT', 'ATOM_ALIAS_RENAME requiere data.new_alias.');

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
        return { items: [], metadata: { status: 'CONFLICT', error: 'LOCK_TIMEOUT', trace_id: traceId } };
    }

    try {
        const file = _system_findAtomFile(atomId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        const currentAlias = String(doc.handle?.alias || _system_slugify_(doc.handle?.label || '')).toLowerCase();
        const nextAlias = String(_system_slugify_(data.new_alias || '')).toLowerCase();
        const nextLabel = data.new_label ? String(data.new_label).trim() : null;

        if (!nextAlias) {
            return { items: [], metadata: { status: 'ERROR', error: 'INVALID_ALIAS_EMPTY', trace_id: traceId } };
        }
        if (!_system_isValidAlias_(nextAlias)) {
            return { items: [], metadata: { status: 'ERROR', error: 'INVALID_ALIAS_FORMAT', trace_id: traceId } };
        }
        if (data.old_alias && String(data.old_alias).toLowerCase() !== currentAlias) {
            return { items: [], metadata: { status: 'ERROR', error: 'ALIAS_MISMATCH', current_alias: currentAlias, trace_id: traceId } };
        }
        // AXIOMA: Solo es un No-Op si NADA cambia (ni alias ni label).
        const aliasIsIdentical = nextAlias === currentAlias;
        const labelIsIdentical = !nextLabel || nextLabel === (doc.handle?.label || '');
        
        if (aliasIsIdentical && labelIsIdentical) {
            // Absolutamente nada que cambiar → NOOP en cualquier modo
            return {
                items: [_system_toAtom(doc, file.getId(), uqo.provider)],
                metadata: { status: 'NOOP', trace_id: traceId, old_alias: currentAlias, new_alias: nextAlias }
            };
        }
        
        if (aliasIsIdentical && !labelIsIdentical) {
            // CASO CLAVE: El alias no cambia (sin riesgo de colisión) pero el label SÍ cambió.
            // En dry_run: informamos que es seguro (NOOP de alias, pero con label pendiente).
            // En commit real: persistimos solo el nuevo label.
            if (dryRun) {
                return {
                    items: [_system_toAtom(doc, file.getId(), uqo.provider)],
                    metadata: { status: 'NOOP', trace_id: traceId, old_alias: currentAlias, new_alias: nextAlias, label_change_pending: true }
                };
            }
            // Commit: persistir el nuevo label directamente
            const labelUpdateRes = _system_updateAtom(atomId, {
                handle: { label: nextLabel }
            }, uqo.provider);
            if (nextLabel) _system_propagateNameChange(atomId, nextLabel, uqo.provider || 'system');
            return {
                items: labelUpdateRes.items || [],
                metadata: { status: 'OK', trace_id: traceId, old_alias: currentAlias, new_alias: nextAlias, label_updated: true }
            };
        }
        if (_system_aliasExistsInSystem_(nextAlias, atomId)) {
            return { items: [], metadata: { status: 'ERROR', error: 'ALIAS_COLLISION', new_alias: nextAlias, trace_id: traceId } };
        }

        const impact = _system_collectAtomAliasImpact_(atomId, uqo.provider);
        const collisions = _system_scanAliasCollisions_({
            target: 'ATOM_ALIAS',
            alias: nextAlias,
            atom_id: atomId
        });
        if (dryRun) {
            return {
                items: [_system_toAtom(doc, file.getId(), uqo.provider)],
                metadata: {
                    status: 'DRY_RUN',
                    trace_id: traceId,
                    old_alias: currentAlias,
                    new_alias: nextAlias,
                    impacted_pins: impact.impacted_pins,
                    impacted_workspaces: impact.impacted_workspaces,
                    collisions: collisions.collisions,
                    has_blockers: collisions.has_blockers
                }
            };
        }

        const updateRes = _system_updateAtom(atomId, {
            handle: {
                alias: nextAlias,
                ...(nextLabel ? { label: nextLabel } : {})
            }
        }, uqo.provider);

        if (updateRes.metadata?.status !== 'OK') {
            return { items: [], metadata: { status: 'ERROR', error: updateRes.metadata?.error || 'ATOM_UPDATE_FAILED', trace_id: traceId } };
        }

        _system_propagateAliasChange(atomId, nextAlias, uqo.provider || 'system');
        if (nextLabel) _system_propagateNameChange(atomId, nextLabel, uqo.provider || 'system');

        return {
            items: updateRes.items || [],
            metadata: {
                status: 'OK',
                trace_id: traceId,
                old_alias: currentAlias,
                new_alias: nextAlias,
                impacted_pins: impact.impacted_pins,
                impacted_workspaces: impact.impacted_workspaces
            }
        };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, trace_id: traceId } };
    } finally {
        lock.releaseLock();
    }
}

/**
 * SCHEMA_FIELD_ALIAS_RENAME: Renombra alias de campo y actualiza referencias tipadas.
 */
function _system_handleSchemaFieldAliasRename(uqo) {
    const schemaId = uqo.context_id;
    const data = uqo.data || {};
    const dryRun = !!data.dry_run;
    const traceId = _system_buildTraceId_('SCHEMA_FIELD_ALIAS_RENAME', schemaId);

    if (!schemaId) throw createError('INVALID_INPUT', 'SCHEMA_FIELD_ALIAS_RENAME requiere context_id.');
    if (!data.new_alias) throw createError('INVALID_INPUT', 'SCHEMA_FIELD_ALIAS_RENAME requiere data.new_alias.');

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
        return { items: [], metadata: { status: 'CONFLICT', error: 'LOCK_TIMEOUT', trace_id: traceId } };
    }

    try {
        const schemaFile = _system_findAtomFile(schemaId);
        const schemaDoc = JSON.parse(schemaFile.getBlob().getDataAsString());
        if (schemaDoc.class !== DATA_SCHEMA_CLASS_) {
            return { items: [], metadata: { status: 'ERROR', error: 'NOT_DATA_SCHEMA', trace_id: traceId } };
        }

        const fields = Array.isArray(schemaDoc.payload?.fields) ? schemaDoc.payload.fields : [];
        const target = _system_findSchemaFieldBySelector_(fields, data.field_id, data.old_alias);
        if (!target) {
            return { items: [], metadata: { status: 'ERROR', error: 'FIELD_NOT_FOUND', trace_id: traceId } };
        }

        const oldAlias = String(target.alias || '').toLowerCase();
        const nextAlias = String(_system_slugify_(data.new_alias || '')).toLowerCase();
        if (!nextAlias || !_system_isValidAlias_(nextAlias)) {
            return { items: [], metadata: { status: 'ERROR', error: 'INVALID_ALIAS_FORMAT', trace_id: traceId } };
        }
        if (oldAlias === nextAlias) {
            return {
                items: [_system_toAtom(schemaDoc, schemaFile.getId(), uqo.provider)],
                metadata: { status: 'NOOP', trace_id: traceId, old_alias: oldAlias, new_alias: nextAlias }
            };
        }
        if (_system_schemaHasFieldAlias_(fields, nextAlias, target.id)) {
            return { items: [], metadata: { status: 'ERROR', error: 'ALIAS_COLLISION', trace_id: traceId, new_alias: nextAlias } };
        }

        const impact = _system_collectFieldAliasImpact_(schemaId, oldAlias, nextAlias);
        const collisions = _system_scanAliasCollisions_({
            target: 'FIELD_ALIAS',
            alias: nextAlias,
            schema_id: schemaId,
            field_id: target.id
        });
        if (dryRun) {
            return {
                items: [_system_toAtom(schemaDoc, schemaFile.getId(), uqo.provider)],
                metadata: {
                    status: 'DRY_RUN',
                    trace_id: traceId,
                    schema_id: schemaId,
                    field_id: target.id,
                    old_alias: oldAlias,
                    new_alias: nextAlias,
                    impacts: impact,
                    collisions: collisions.collisions,
                    has_blockers: collisions.has_blockers
                }
            };
        }

        _system_renameFieldAliasInFields_(fields, target.id, oldAlias, nextAlias);
        const schemaUpdate = _system_updateAtom(schemaId, {
            payload: { ...(schemaDoc.payload || {}), fields: fields }
        }, uqo.provider);

        if (schemaUpdate.metadata?.status !== 'OK') {
            return { items: [], metadata: { status: 'ERROR', error: schemaUpdate.metadata?.error || 'SCHEMA_UPDATE_FAILED', trace_id: traceId } };
        }

        const cascade = _system_applyFieldAliasCascade_(schemaId, oldAlias, nextAlias);

        return {
            items: schemaUpdate.items || [],
            metadata: {
                status: 'OK',
                trace_id: traceId,
                schema_id: schemaId,
                field_id: target.id,
                old_alias: oldAlias,
                new_alias: nextAlias,
                impacts: impact,
                updated_artifacts: cascade.updated_artifacts,
                updated_refs: cascade.updated_refs
            }
        };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, trace_id: traceId } };
    } finally {
        lock.releaseLock();
    }
}

/**
 * ALIAS_COLLISION_SCAN: Sensor canónico de colisiones de alias.
 */
function _system_handleAliasCollisionScan(uqo) {
    const data = uqo.data || {};
    const target = String(data.target || '').toUpperCase();
    const alias = String(_system_slugify_(data.alias || '')).toLowerCase();

    if (!target) throw createError('INVALID_INPUT', 'ALIAS_COLLISION_SCAN requiere data.target.');
    if (!alias) throw createError('INVALID_INPUT', 'ALIAS_COLLISION_SCAN requiere data.alias.');

    const scan = _system_scanAliasCollisions_({
        target: target,
        alias: alias,
        schema_id: uqo.context_id || data.schema_id,
        field_id: data.field_id,
        atom_id: data.atom_id
    });

    return {
        items: [],
        metadata: {
            status: 'OK',
            target: target,
            alias: alias,
            collisions: scan.collisions,
            has_blockers: scan.has_blockers
        }
    };
}

/**
 * SERVICE_PAIR: Vincula una cuenta a un proveedor específico (ADR-041).
 * Soporta 'SYSTEM_NATIVE' para autodescubrimiento en Google Apps Script.
 * Este handler es el punto de anclaje para vincular servicios de terceros (Notion, Drive)
 * bajo la soberanía del Llavero del Core.
 */
function _system_handleServicePair(uqo) {
    const providerId = uqo.context_id || uqo.data?.provider_id;
    const credentials = uqo.data?.credentials || uqo.data || {};
    
    if (!providerId) throw createError('INVALID_INPUT', 'SERVICE_PAIR requiere provider_id.');

    let accountId = 'default';
    let label = `Cuenta ${providerId}`;

    // AXIOMA: Si el token es NATIVO, detectamos la identidad del usuario actual
    const isNative = Object.values(credentials).some(v => v === 'SYSTEM_NATIVE');
    if (isNative) {
        const userEmail = Session.getActiveUser().getEmail();
        accountId = userEmail.split('@')[0].replace(/[^\w]/g, '_');
        label = `Indra Cloud (${userEmail})`;
    }

    try {
        storeProviderAccount(providerId, accountId, credentials, label);
        logInfo(`[infrastructure] Servicio vinculado: ${providerId}:${accountId}`);
        return { items: [{ id: accountId, label }], metadata: { status: 'OK' } };
    } catch (err) {
        logError(`[infrastructure] Fallo al vincular servicio ${providerId}`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

function _system_handleServiceUnpair(uqo) {
    const providerId = uqo.context_id;
    const accountId = uqo.query?.account_id || 'default';
    if (!providerId) throw createError('INVALID_INPUT', 'SERVICE_UNPAIR requiere provider_id.');

    try {
        // Suponiendo que system_config tiene una forma de borrar (o guardar vacío)
        storeProviderAccount(providerId, accountId, null, null);
        return { items: [], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}


/**
 * REVISIONS_LIST: Obtiene el historial de versiones nativo de Google Drive.
 */
function _system_handleRevisionsList(uqo) {
    if (!uqo.context_id) throw createError('INVALID_INPUT', 'REVISIONS_LIST requiere context_id.');
    const fileId = uqo.context_id.includes(':') ? uqo.context_id.split(':').pop() : uqo.context_id;

    try {
        const revisions = Drive.Revisions.list(fileId);
        const items = (revisions.revisions || []).map(rev => ({
            id: rev.id,
            type: 'PROBE',
            status: 'VERSION',
            modified_at: rev.modifiedTime,
            size: rev.size,
            author: rev.lastModifyingUser?.displayName || 'Sistema',
            class: 'REVISION_POINTER'
        })).reverse(); // Los más recientes primero

        return { items, metadata: { status: 'OK', total: items.length } };
    } catch (err) {
        logError(`[infra] Error al listar revisiones de ${fileId}`, err);
        return { items: [], metadata: { status: 'ERROR', error: 'Para usar esta función, la API de Drive debe estar habilitada en el Core.' } };
    }
}

/**
 * ATOM_ROLLBACK: Restaura un estado anterior del archivo JSON.
 */
function _system_handleRollback(uqo) {
    const fileId = uqo.context_id.includes(':') ? uqo.context_id.split(':').pop() : uqo.context_id;
    const revisionId = uqo.data?.revision_id;

    if (!fileId || !revisionId) throw createError('INVALID_INPUT', 'ATOM_ROLLBACK requiere context_id y data.revision_id.');

    try {
        // 1. Obtener el contenido de la revisión (Apps Script Drive API v3)
        // Nota: revisions.get con alt=media devuelve el contenido binario/texto
        const revisionContent = Drive.Revisions.get(fileId, revisionId, { alt: 'media' });
        
        // 2. Sobrescribir el archivo actual con este contenido
        const file = DriveApp.getFileById(fileId);
        file.setContent(revisionContent);
        
        logInfo(`[infra] ROLLBACK exitoso en ${fileId} a versión ${revisionId}`);

        // 3. Retornar el átomo restaurado
        const updated = JSON.parse(revisionContent);
        return { items: [_system_toAtom(updated, fileId, uqo.provider)], metadata: { status: 'OK', restored_revision: revisionId } };
    } catch (err) {
        logError(`[infra] Fallo en ATOM_ROLLBACK para ${fileId}`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

/**
 * ATOM_EXISTS: Verifica la existencia física de uno o varios átomos.
 * Retorna ítems de tipo PROBE_SIGNAL: { type: 'PROBE', status: 'EXISTS'|'NOT_FOUND', ref_id }
 * Estos ítems están exentos de la validación de identidad del router (no son átomos soberanos).
 * @private
 */
function _system_handleExists(uqo) {
    const ids = uqo.data?.ids || [uqo.context_id];
    const existenceMap = _system_batchVerifyExistence_(ids);
    const items = ids.map(id => ({
        id: id,
        type: 'PROBE',
        status: existenceMap[id] ? 'EXISTS' : 'NOT_FOUND',
        ref_id: id
    }));
    return { items, metadata: { status: 'OK' } };
}


// ─── OPERACIONES DE ÁTOMOS EN DRIVE ───────────────────────────────────────────

function _system_listAtomsByClass(atomClass, providerId, uqo) {
    try {
        // AXIOMA 1: FALLO RUIDOSO. Si el sistema está bootstrapped y no hay Ledger,
        // lanzamos un error en lugar de usar Drive legacy.
        const items = ledger_list_by_class(atomClass);
        
        // Transformar a Átomos de Sistema (Contrato Universal ADR-001)
        // Nota: ledger_list_by_class ya devuelve objetos semi-formados, 
        // pero pasamos por _system_toAtom para asegurar protocolos dinámicos.
        const atoms = items.map(item => _system_toAtom(item, item.id, providerId));
        
        return { items: atoms, metadata: { status: 'OK', total: atoms.length, source: 'LEDGER' } };
    } catch (err) {
        logError(`[infrastructure] Error al listar clase ${atomClass} vía Ledger.`, err);
        // Error ruidoso: Informamos del fallo de infraestructura Ledger
        return { items: [], metadata: { status: 'ERROR', error: `LEDGER_FAILURE: ${err.message}` } };
    }
}

function _system_readAtom(atomId, providerId) {
    try {
        const file = _system_findAtomFile(atomId);
        const contentStr = file.getBlob().getDataAsString();
        const atomDoc = JSON.parse(contentStr);

        // CHEQUEO JIT (JUST-IN-TIME) DE RESILIENCIA (ADR-043):
        // Comparamos si el archivo físico en Drive es más reciente que lo que dice el Ledger.
        try {
            const driveLastUpdated = file.getLastUpdated();
            const ledgerMeta = ledger_get_by_drive_id(atomId);
            
            if (ledgerMeta) {
                const ledgerDate = new Date(ledgerMeta.updated_at);
                // Margen de 2 segundos para evitar falsos positivos
                if (driveLastUpdated.getTime() > (ledgerDate.getTime() + 2000)) {
                    logInfo(`[resilience] JIT Sync detectado para ${atomId}. Drive es más reciente. Actualizando Ledger...`);
                    ledger_sync_atom(atomDoc, atomId);
                }
            } else if (atomId !== 'workspaces') {
                // Sinceridad Total: Si el Ledger no lo conoce pero el archivo existe, lo indexamos JIT.
                logWarn(`[resilience] Puntero huérfano detectado JIT: ${atomId}. Re-indexando...`);
                ledger_sync_atom(atomDoc, atomId);
            }
        } catch (syncErr) {
            logWarn(`[resilience] Falló el chequeo JIT para ${atomId}: ${syncErr.message}`);
        }

        return { items: [_system_toAtom(atomDoc, atomId, providerId)], metadata: { status: 'OK' } };
    } catch (err) {
        logError(`[infrastructure] ATOM_READ_FAILED: ${atomId}`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message, code: 'NOT_FOUND' } };
    }
}

function _system_createAtom(atomClass, label, uqo) {
    try {
        if (!atomClass || !label) throw createError('CONTRACT_VIOLATION', '[infra] ATOM_CREATE: requiere class y handle.label.');

        const providerId = uqo.provider;
        const extraData = uqo.data || {};

        const folderName = _system_getFolderForClass(atomClass);
        const now = new Date().toISOString();
        
        // AXIOMA CELULAR (ADR-043): El átomo se gesta en la "cuna" de su Workspace/Contexto.
        const contextId = uqo.workspace_id || uqo.context_id;
        logInfo(`[infrastructure] Buscando ubicación para átomo de clase ${atomClass} en contexto: ${contextId || 'GLOBAL'}`);
        const subfolder = _system_getOrCreateSubfolder_(folderName, uqo, contextId);
        const alias = _system_slugify_(label);
        const fileName = `${alias}_${Date.now()}.json`;

        const initialPayload = extraData.payload || {};

        // AXIOMA V4.1: El átomo nace con su identidad completa (Determinismo).
        const atomDoc = {
            handle: { 
                ns: extraData.handle?.ns || `com.indra.system.${atomClass.toLowerCase()}`, 
                alias: alias, 
                label: label 
            },
            class: atomClass,
            provider: providerId || 'system',
            core_id: readCoreOwnerEmail(), 
            created_at: now,
            updated_at: now,
            payload: initialPayload,
            protocols: ['ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE'],
            raw: extraData.raw || {},
        };

        logDebug(`[infrastructure] Creando archivo: ${fileName} en folder: ${subfolder.getName()} [${subfolder.getId()}]`);
        const file = subfolder.createFile(fileName, JSON.stringify(atomDoc, null, 2));
        const driveId = file.getId();
        logInfo(`[infrastructure] Átomo creado físicamente en Drive. ID: ${driveId}`);
        atomDoc.id = driveId;
        
        // Persistir con el ID ya inyectado (Shadow Backup)
        file.setContent(JSON.stringify(atomDoc, null, 2));

        // AXIOMA: Sincronización obligatoria con el Ledger (Transaccional)
        try {
            ledger_sync_atom(atomDoc, driveId);
        } catch (ledgerErr) {
            logError(`[infrastructure] FALLO CRÍTICO EN LEDGER. Realizando Rollback físico de: ${driveId}`, ledgerErr);
            file.setTrashed(true); // Purga inmediata del "Átomo Huérfano"
            throw ledgerErr;
        }

        return { items: [_system_toAtom(atomDoc, driveId, providerId)], metadata: { status: 'OK' } };
    } catch (err) {
        logError(`[infrastructure] ATOM_CREATE_FAILED: ${atomClass}`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}


/**
 * ATOM_DELETE: Elimina un átomo de Drive y purga sus referencias
 * de todos los workspaces que lo tengan anclado.
 *
 * AXIOMA ADR-008: La eliminación es atómica. No puede quedar ningún
 * puntero muerto (pin fantasma) tras el borrado.
 */
function _system_deleteAtom(atomId) {
    try {
        // AXIOMA: La eliminación es física y determinista.
        // No escaneamos el sistema buscando referencias; la sinceridad se 
        // resuelve en el momento del acceso (Homeostasis bajo demanda).
        const file = _system_findAtomFile(atomId);
        file.setTrashed(true);
        
        // Eliminar del Ledger (Fallo Ruidoso si no se encuentra en Drive ya se encargó findAtomFile)
        ledger_remove_atom(atomId);
        
        logInfo(`[infra] Átomo eliminado de Drive y Ledger: ${atomId}`);

        return { items: [], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
    }
}

/**
 * Verifica la existencia física de una lista de IDs en Drive.
 * Utilizado por el Portal de Sinceridad para detectar huérfanos sin iteración pesada.
 * @param {string[]} ids - Lista de Drive IDs.
 * @returns {Object} Mapa de { id: boolean }
 * @private
 */
function _system_batchVerifyExistence_(ids) {
    const results = {};
    if (!ids || ids.length === 0) return results;

    // Google DriveApp searchFiles no soporta el campo 'id' en el parámetro 'q'.
    // Debemos iterar y atrapar errores para cada getFileById para verificar existencia física.
    ids.forEach(id => {
        if (!id) {
            results[id] = false;
            return;
        }
        try {
            const file = DriveApp.getFileById(id);
            results[id] = !file.isTrashed();
        } catch (e) {
            // Documento eliminado físicamente, no accesible o ID inválido
            results[id] = false;
        }
    });

    return results;
}


function _system_updateAtom(atomId, updates, providerId) {
    try {
        const file = _system_findAtomFile(atomId);
        const rawContent = file.getBlob().getDataAsString();
        if (!rawContent) throw createError('NOT_FOUND', '[infra] El archivo está vacío.');
        
        const current = JSON.parse(rawContent);

        // ADR-001: Purgar campos inmutables
        const { id, class: atomClass, provider, raw, strategy, ...pureUpdates } = updates;
        const updated = JSON.parse(JSON.stringify(current));

        // Gestión del Payload según Estrategia (ADR-001/008)
        if (pureUpdates.payload) {
            updated.payload = updated.payload || {};
            // AXIOMA: Por defecto SOBREESCRIBIMOS. El Merge es origen de entropía en ASTs.
            if (strategy === 'MERGE') {
                _indra_deepMerge_(updated.payload, pureUpdates.payload);
            } else {
                updated.payload = pureUpdates.payload;
            }
            delete pureUpdates.payload;
        }

        // Merge para la identidad (Handle) - La Verdad Central
        if (pureUpdates.handle) {
            updated.handle = { ...(updated.handle || {}), ...pureUpdates.handle };
            delete pureUpdates.handle;
        }

        Object.assign(updated, pureUpdates);
        updated.updated_at = new Date().toISOString();

        // Sincronización física de nombre de archivo (Opcional, para humanos en Drive)
        const newLabel = updated.handle?.label;
        if (newLabel && newLabel !== (current.handle?.label || current.name)) {
            const cleanName = newLabel.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
            file.setName(`${cleanName}.json`);
        }

        file.setContent(JSON.stringify(updated, null, 2));
        
        // AXIOMA: Sincronización de actualización en Ledger
        ledger_sync_atom(updated, file.getId());
        
        return { items: [_system_toAtom(updated, file.getId(), providerId)], metadata: { status: 'OK' } };

    } catch (err) {
        logError(`[infrastructure] ATOM_UPDATE_FAILED: ${atomId}`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
    }
}

// ─── INFRAESTRUCTURA DE DRIVE (PRIVADO) ───────────────────────────────────────

function _system_ensureHomeRoot() {
    const cachedId = readRootFolderId();
    if (cachedId) {
        try { 
            const folder = DriveApp.getFolderById(cachedId);
            // Si la carpeta está en la papelera, el puntero es inválido (Puntero Fantasma)
            if (folder && !folder.isTrashed()) return folder;
            logWarn(`[infrastructure] Carpeta raíz en papelera o inválida. Reseteando puntero: ${cachedId}`);
        } catch (e) { 
            logWarn(`[infrastructure] Error al recuperar carpeta raíz vinculada: ${e.message}`);
        }
    }
    
    // Búsqueda profunda en la raíz de Drive
    const existingFolders = DriveApp.getRootFolder().getFoldersByName(HOME_ROOT_FOLDER_NAME_);
    while (existingFolders.hasNext()) {
        const folder = existingFolders.next();
        if (!folder.isTrashed()) {
            storeRootFolderId(folder.getId());
            return folder;
        }
    }
    
    // GÉNESIS SI NADA EXISTE
    const newFolder = DriveApp.createFolder(HOME_ROOT_FOLDER_NAME_);
    storeRootFolderId(newFolder.getId());
    return newFolder;
}

function _system_getFolderForClass(atomClass) {
    if (atomClass === WORKFLOW_CLASS_) return WORKFLOWS_FOLDER_NAME_;
    if (atomClass === DATA_SCHEMA_CLASS_) return SCHEMAS_FOLDER_NAME_;
    if (atomClass === DOCUMENT_CLASS_) return DOCUMENTS_FOLDER_NAME_;
    if (atomClass === FORMULA_CLASS_) return FORMULAS_FOLDER_NAME_;
    return WORKSPACES_FOLDER_NAME_;
}

function _system_getOrCreateSubfolder_(folderName, contextUqo, workspaceId) {
    const homeRoot = _system_ensureHomeRoot();
    let parentFolder = homeRoot;

    // ── LÓGICA DE ARQUITECTURA CELULAR (INDRA v4.2) ──
    if (workspaceId && workspaceId !== 'system' && workspaceId !== 'workspaces') {
        const wsRoot = _system_ensureWorkspaceCell_(workspaceId);
        if (wsRoot) parentFolder = wsRoot;
    }

    // 📦 RECOLECCIÓN VÍA BRÚJULA (Solo para carpetas globales o de primer nivel de workspace)
    const infraKey = `${workspaceId || 'root'}_${folderName.toLowerCase()}`;
    const cachedId = ledger_infra_get(infraKey);
    if (cachedId) {
        try {
            return DriveApp.getFolderById(cachedId);
        } catch (e) {
            logWarn(`[infrastructure] Infra ${infraKey} perdida. Re-esculpiendo...`);
        }
    }

    let folder;
    const subFolders = parentFolder.getFoldersByName(folderName);
    folder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(folderName);

    // AXIOMA DE AISLAMIENTO SANDBOX (Mantenemos compatibilidad)
    const isSandbox = (contextUqo && (contextUqo.environment === 'SANDBOX' || contextUqo.mode === 'SANDBOX'));
    if (isSandbox) {
        const sandboxName = '.sandbox_trash';
        const sandboxFolders = folder.getFoldersByName(sandboxName);
        folder = sandboxFolders.hasNext() ? sandboxFolders.next() : folder.createFolder(sandboxName);
    }

    // Guardar en la brújula para la próxima vez
    ledger_infra_sync(infraKey, folder.getId(), folderName);

    return folder;
}

/**
 * Asegura la existencia de la carpeta 'Célula' para un workspace.
 * Ubicación: .core_system/workspaces/{id}/
 * @private
 */
function _system_ensureWorkspaceCell_(workspaceId) {
    const homeRoot = _system_ensureHomeRoot();
    const wsContainer = homeRoot.getFoldersByName(WORKSPACES_FOLDER_NAME_).hasNext() 
        ? homeRoot.getFoldersByName(WORKSPACES_FOLDER_NAME_).next() 
        : homeRoot.createFolder(WORKSPACES_FOLDER_NAME_);
        
    const cellFolders = wsContainer.getFoldersByName(workspaceId);
    return cellFolders.hasNext() ? cellFolders.next() : wsContainer.createFolder(workspaceId);
}

function _system_findAtomFile(contextId) {
    if (!contextId) throw createError('IDENTITY_VIOLATION', '[infra] Se requiere Drive ID.');
    const atomId = contextId.includes(':') ? contextId.split(':').pop() : contextId;

    try {
        const file = DriveApp.getFileById(atomId);
        if (!file || file.isTrashed()) throw createError('NOT_FOUND', `Archivo no existe: ${atomId}`);
        return file;
    } catch (e) {
        if (e.code) throw e;
        throw createError('NOT_FOUND', `Drive ID no encontrado: ${atomId}`);
    }
}

function _system_toAtom(doc, fileId, providerId) {
    if (!doc.class || !doc.handle?.label) {
        return {
            id: fileId,
            class: doc.class || 'BROKEN_ATOM',
            handle: doc.handle || { ns: 'com.indra.system.broken', alias: 'broken', label: 'INCOMPLETE' },
            protocols: [],
            payload: doc.payload || {}
        };
    }
    const payload = doc.payload || {};

    // ── GESTIÓN DE IDENTIDAD SINCERA (DEFENSA ANTE LEGADO) ──
    const safeHandle = {
        ns: doc.handle?.ns || `com.indra.system.${(doc.class || 'unknown').toLowerCase()}`,
        alias: doc.handle?.alias || _system_slugify_(doc.handle?.label || 'unnamed'),
        label: doc.handle?.label || 'ARTEFACTO_SIN_NOMBRE'
    };

    // ADR-008: Blindaje de Salida (Aduana Interna del Provider)
    if (doc.class === DATA_SCHEMA_CLASS_) {
        // PRIORIDAD: Si payload está vacío pero raw tiene campos (legacy/import), los promocionamos
        const rawFields = doc.raw?.fields || doc.fields || [];
        if ((!payload.fields || payload.fields.length === 0) && rawFields.length > 0) {
            payload.fields = JSON.parse(JSON.stringify(rawFields));
        }
        
        payload.fields = payload.fields || [];
        _system_normalizeSchemaFieldAliases_(payload.fields);
    }
    if (doc.class === WORKFLOW_CLASS_ && !Array.isArray(payload.stations)) {
        payload.stations = [];
    }
    if (doc.class === 'BRIDGE' && !Array.isArray(payload.operators)) {
        payload.operators = [];
    }

    // AXIOMA: Inject SYSTEM_SHARE_CREATE & SYSTEM_BLUEPRINT_SYNC for shareable and publishable artifacts
    let protocols = Array.isArray(doc.protocols) ? doc.protocols : [];
    if (['DATA_SCHEMA', 'DOCUMENT', 'BRIDGE', 'WORKFLOW'].includes(doc.class)) {
        if (!protocols.includes('SYSTEM_BLUEPRINT_SYNC')) protocols.push('SYSTEM_BLUEPRINT_SYNC');
        if (['DATA_SCHEMA', 'DOCUMENT'].includes(doc.class)) {
            if (!protocols.includes('SYSTEM_SHARE_CREATE')) protocols.push('SYSTEM_SHARE_CREATE');
        }
    }

    return {
        id: fileId || doc.id,
        core_id: readCoreOwnerEmail(), // Inyección dinámica de identidad v4.1
        handle: safeHandle,
        class: doc.class || 'UNKNOWN',
        protocols: protocols,
        provider: providerId || 'system',
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        payload: payload,
        raw: { ...doc, _file_id: fileId },
    };
}

function _system_normalizeSchemaFieldAliases_(fields) {
    const usedAliases = new Set();

    const collect = (list) => {
        (list || []).forEach(field => {
            const existing = String(field?.alias || '').trim().toLowerCase();
            if (existing) usedAliases.add(existing);
            if (Array.isArray(field?.children)) collect(field.children);
        });
    };

    const ensure = (list, pathPrefix = 'field') => {
        (list || []).forEach((field, index) => {
            const current = String(field?.alias || '').trim().toLowerCase();
            if (!current) {
                const rawBase = field?.id || field?.label || `${pathPrefix}_${index + 1}`;
                const base = String(_system_slugify_(rawBase || '')).toLowerCase() || `${pathPrefix}_${index + 1}`;
                let nextAlias = base;
                let seq = 2;
                while (usedAliases.has(nextAlias)) {
                    nextAlias = `${base}_${seq}`;
                    seq += 1;
                }
                field.alias = nextAlias;
                usedAliases.add(nextAlias);
            }

            if (Array.isArray(field?.children)) {
                ensure(field.children, `${pathPrefix}_${index + 1}`);
            }
        });
    };

    collect(fields || []);
    ensure(fields || []);
}

function _system_buildTraceId_(protocol, contextId) {
    const base = `${protocol || 'TRACE'}_${contextId || 'NA'}_${Date.now()}`;
    return base.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

function _system_isValidAlias_(alias) {
    return /^[a-z0-9_\-]{2,120}$/.test(String(alias || '').toLowerCase());
}

function _system_aliasExistsInSystem_(alias, excludeAtomId) {
    const candidate = String(alias || '').toLowerCase();
    if (!candidate) return false;

    const files = _system_listAllAtomFiles_();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || file.getId() === excludeAtomId) continue;
        try {
            const doc = JSON.parse(file.getBlob().getDataAsString());
            const existing = String(doc.handle?.alias || '').toLowerCase();
            if (existing && existing === candidate) return true;
        } catch (e) {}
    }
    return false;
}

function _system_scanAliasCollisions_(input) {
    const target = String(input?.target || '').toUpperCase();
    const alias = String(input?.alias || '').toLowerCase();
    const schemaId = input?.schema_id || null;
    const fieldId = input?.field_id || null;
    const atomId = input?.atom_id || null;
    const collisions = [];

    if (!alias) return { collisions: [], has_blockers: false };

    if (target === 'ATOM_ALIAS') {
        const files = _system_listAllAtomFiles_();
        files.forEach(file => {
            if (!file) return;
            if (atomId && file.getId() === atomId) return;
            try {
                const doc = JSON.parse(file.getBlob().getDataAsString());
                const existingAlias = String(doc.handle?.alias || '').toLowerCase();
                if (existingAlias === alias) {
                    collisions.push({
                        severity: 'BLOCKER',
                        scope: 'SYSTEM',
                        target: 'ATOM_ALIAS',
                        atom_id: file.getId(),
                        atom_class: doc.class || 'UNKNOWN',
                        atom_alias: existingAlias,
                        atom_label: doc.handle?.label || ''
                    });
                }
            } catch (e) {}
        });
    }

    if (target === 'FIELD_ALIAS') {
        const files = _system_listAllAtomFiles_();
        files.forEach(file => {
            if (!file) return;
            try {
                const doc = JSON.parse(file.getBlob().getDataAsString());
                if (doc.class !== DATA_SCHEMA_CLASS_) return;
                const hits = _system_collectAliasFieldHits_(doc.payload?.fields || [], alias);
                if (!hits.length) return;

                const isCurrentSchema = schemaId && file.getId() === schemaId;
                hits.forEach(hit => {
                    if (isCurrentSchema && fieldId && hit.field_id === fieldId) return;
                    collisions.push({
                        severity: isCurrentSchema ? 'BLOCKER' : 'WARNING',
                        scope: isCurrentSchema ? 'INTRA_SCHEMA' : 'CROSS_SCHEMA',
                        target: 'FIELD_ALIAS',
                        schema_id: file.getId(),
                        schema_alias: String(doc.handle?.alias || '').toLowerCase(),
                        schema_label: doc.handle?.label || '',
                        field_id: hit.field_id,
                        field_label: hit.field_label,
                        field_alias: alias
                    });
                });
            } catch (e) {}
        });
    }

    const hasBlockers = collisions.some(c => c.severity === 'BLOCKER');
    return { collisions: collisions, has_blockers: hasBlockers };
}

function _system_collectAliasFieldHits_(fields, alias) {
    const hits = [];
    const target = String(alias || '').toLowerCase();
    const walk = (list) => {
        (list || []).forEach(field => {
            if (String(field.alias || '').toLowerCase() === target) {
                hits.push({
                    field_id: field.id,
                    field_label: field.label || ''
                });
            }
            if (Array.isArray(field.children)) walk(field.children);
        });
    };
    walk(Array.isArray(fields) ? fields : []);
    return hits;
}

function _system_collectAtomAliasImpact_(atomId, providerId) {
    const provider = providerId || 'system';
    let impactedPins = 0;
    let impactedWorkspaces = 0;
    const wsFolder = _system_getOrCreateSubfolder_(WORKSPACES_FOLDER_NAME_);
    const files = wsFolder.getFiles();

    while (files.hasNext()) {
        const file = files.next();
        if (file.getMimeType() !== 'application/json') continue;
        try {
            const doc = JSON.parse(file.getBlob().getDataAsString());
            const hits = (doc.pins || []).filter(pin => pin.id === atomId && (pin.provider === provider || pin.provider === 'system'));
            if (hits.length > 0) {
                impactedWorkspaces += 1;
                impactedPins += hits.length;
            }
        } catch (e) {}
    }

    return {
        impacted_pins: impactedPins,
        impacted_workspaces: impactedWorkspaces
    };
}

function _system_findSchemaFieldBySelector_(fields, fieldId, oldAlias) {
    let found = null;
    const aliasNorm = String(oldAlias || '').toLowerCase();
    const walk = (list) => {
        for (let i = 0; i < list.length; i++) {
            const field = list[i];
            if (fieldId && field.id === fieldId) {
                found = field;
                return;
            }
            if (!fieldId && aliasNorm && String(field.alias || '').toLowerCase() === aliasNorm) {
                found = field;
                return;
            }
            if (Array.isArray(field.children)) walk(field.children);
            if (found) return;
        }
    };
    walk(Array.isArray(fields) ? fields : []);
    return found;
}

function _system_schemaHasFieldAlias_(fields, alias, excludeFieldId) {
    const candidate = String(alias || '').toLowerCase();
    let exists = false;
    const walk = (list) => {
        for (let i = 0; i < list.length; i++) {
            const field = list[i];
            if (field.id !== excludeFieldId && String(field.alias || '').toLowerCase() === candidate) {
                exists = true;
                return;
            }
            if (Array.isArray(field.children)) walk(field.children);
            if (exists) return;
        }
    };
    walk(Array.isArray(fields) ? fields : []);
    return exists;
}

function _system_replaceAliasWord_(value, oldAlias, newAlias) {
    const source = String(value || '');
    const escaped = oldAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    return source.replace(regex, newAlias);
}

function _system_renameFieldAliasInFields_(fields, fieldId, oldAlias, newAlias) {
    const walk = (list) => {
        (list || []).forEach(field => {
            if (field.id === fieldId) field.alias = newAlias;
            if (typeof field.formula_expression === 'string') {
                field.formula_expression = _system_replaceAliasWord_(field.formula_expression, oldAlias, newAlias);
            }
            if (field.config && typeof field.config.show_if === 'string') {
                field.config.show_if = _system_replaceAliasWord_(field.config.show_if, oldAlias, newAlias);
            }
            if (Array.isArray(field.children)) walk(field.children);
        });
    };
    walk(Array.isArray(fields) ? fields : []);
}

function _system_collectFieldAliasImpact_(schemaId, oldAlias, newAlias) {
    const allAtoms = ledger_list_all_records(); // Nueva función proactiva
    let impactedArtifacts = 0;
    let impactedRefs = 0;

    allAtoms.forEach(atom => {
        if (!atom || atom.id === schemaId) return;
        if (!['DOCUMENT', 'BRIDGE', 'WORKFLOW'].includes(atom.class)) return;
        
        try {
            const probe = _system_rewriteFieldAliasReferencesInDoc_(atom, oldAlias, newAlias, true);
            if (probe.refs > 0) {
                impactedArtifacts += 1;
                impactedRefs += probe.refs;
            }
        } catch (e) {}
    });

    return {
        impacted_artifacts: impactedArtifacts,
        impacted_refs: impactedRefs
    };
}

function _system_applyFieldAliasCascade_(schemaId, oldAlias, newAlias) {
    const files = _system_listAllAtomFiles_();
    let updatedArtifacts = 0;
    let updatedRefs = 0;

    files.forEach(file => {
        if (!file || file.getId() === schemaId) return;
        try {
            const doc = JSON.parse(file.getBlob().getDataAsString());
            if (!['DOCUMENT', 'BRIDGE', 'WORKFLOW'].includes(doc.class)) return;

            const rewrite = _system_rewriteFieldAliasReferencesInDoc_(doc, oldAlias, newAlias, false);
            if (rewrite.changed) {
                doc.updated_at = new Date().toISOString();
                file.setContent(JSON.stringify(doc, null, 2));
                updatedArtifacts += 1;
                updatedRefs += rewrite.refs;
            }
        } catch (e) {
            logWarn(`[infra] Cascada alias parcial fallida en ${file.getId()}: ${e.message}`);
        }
    });

    return { updated_artifacts: updatedArtifacts, updated_refs: updatedRefs };
}

function _system_rewriteFieldAliasReferencesInDoc_(doc, oldAlias, newAlias, dryRun) {
    let refs = 0;
    const sourceTokenOld = `source.${oldAlias}`;
    const sourceTokenNew = `source.${newAlias}`;
    const mustEqualKeys = {
        content_alias: true,
        source_alias: true,
        field_alias: true,
        relation_label_field: true
    };
    const expressionKeys = {
        formula_expression: true,
        show_if: true
    };

    const visit = (node, parentKey) => {
        if (node === null || node === undefined) return node;

        if (Array.isArray(node)) {
            return node.map(item => visit(item, parentKey));
        }

        if (typeof node === 'object') {
            const result = dryRun ? node : node;
            Object.keys(node).forEach(key => {
                const current = node[key];
                if (parentKey === 'handle' && key === 'alias') return;

                if (typeof current === 'string') {
                    let next = current;

                    if (mustEqualKeys[key] && current === oldAlias) {
                        next = newAlias;
                    } else if (current === sourceTokenOld) {
                        next = sourceTokenNew;
                    } else if (expressionKeys[key]) {
                        next = _system_replaceAliasWord_(current, oldAlias, newAlias);
                    }

                    const slotPattern = `{{${oldAlias}}}`;
                    if (next.indexOf(slotPattern) !== -1) {
                        next = next.split(slotPattern).join(`{{${newAlias}}}`);
                    }

                    if (next !== current) {
                        refs += 1;
                        if (!dryRun) result[key] = next;
                    }
                } else {
                    const child = visit(current, key);
                    if (!dryRun) result[key] = child;
                }
            });
            return result;
        }

        return node;
    };

    if (!dryRun) visit(doc, null);
    else visit(JSON.parse(JSON.stringify(doc)), null);
    return { changed: refs > 0, refs: refs };
}

function _system_listAllAtomFiles_() {
    const files = [];
    const root = _system_ensureHomeRoot();
    const folders = root.getFolders();
    while (folders.hasNext()) {
        const folder = folders.next();
        const subFiles = folder.getFiles();
        while (subFiles.hasNext()) {
            const file = subFiles.next();
            if (file.getMimeType() !== 'application/json') continue;
            if (file.isTrashed()) continue;
            files.push(file);
        }
    }
    return files;
}

/**
 * SYSTEM_SCHEMA_IGNITE: Protocolo de Ignición de Infraestructura.
 * Toma un DATA_SCHEMA (Idea) y lo manifiesta en un Silo Físico (Materia) via ATOM_CREATE.
 */
function _system_handleSchemaIgnite(uqo) {
  const schemaId = uqo.context_id;
  const targetProvider = uqo.data?.target_provider || 'drive';
  const folderId = uqo.data?.target_folder_id || null;
  const traceId = _system_buildTraceId_('SYSTEM_SCHEMA_IGNITE', schemaId);

  if (!schemaId) throw createError('INVALID_INPUT', 'SYSTEM_SCHEMA_IGNITE requiere context_id (schema_id).');

  // 1. Leer el ADN (Esquema)
  const schemaAtomRes = _system_readAtom(schemaId, uqo.provider);
  const schemaAtom = schemaAtomRes.items?.[0];
  if (!schemaAtom || schemaAtom.class !== DATA_SCHEMA_CLASS_) {
    throw createError('NOT_FOUND', 'Esquema de datos no encontrado para ignitar.', { trace_id: traceId });
  }

  // 2. Extraer el ADN completo de los campos (Types, Labels, Config)
  const fields = schemaAtom.payload?.fields || [];
  if (fields.length === 0) {
    throw createError('INVALID_STATE', 'El esquema no tiene campos definidos. No se puede ignitar un vacío.', { trace_id: traceId });
  }

  // 3. Ejecutar la Ignición (Creación física)
  // AXIOMA: Delegamos al Protocol Router para que la ignición sea agnóstica al provider destino.
  const createUqo = {
    provider: targetProvider,
    protocol: 'ATOM_CREATE',
    data: {
      class: 'TABULAR',
      name: schemaAtom.handle?.label || 'Nueva Tabla',
      fields: fields, // Ahora enviamos el array completo de objetos FIELD
      context_id: folderId
    }
  };

  logInfo(`[system] Iniciando ignición de esquema ${schemaId} en ${targetProvider}...`);
  
  // 'route' es la función global del protocol_router.gs (ya disponible en el scope global de GAS)
  const createResult = route(createUqo);
  
  if (createResult.metadata?.status !== 'OK' || !createResult.items?.[0]) {
    const errorMsg = createResult.metadata?.error || 'Error desconocido en el provider destino';
    throw createError('GENESIS_FAILED', `La ignición falló en el provider "${targetProvider}": ${errorMsg}`, { trace_id: traceId });
  }

  const siloAtom = createResult.items[0];
  logInfo(`[system] Silo ignitado con éxito: ${siloAtom.id} (${targetProvider})`);

  // 4. Vincular el ID y Provider en el Esquema (Incarnation)
  const updateData = {
    payload: {
      ...schemaAtom.payload,
      target_silo_id: siloAtom.id,
      target_provider: targetProvider,
      status: 'LIVE' // Marcamos como publicado al cobrar vida física
    }
  };

  const updateRes = _system_updateAtom(schemaId, updateData, uqo.provider);
  
  return {
    items: updateRes.items || [],
    metadata: {
      status: 'OK',
      trace_id: traceId,
      silo_atom: siloAtom,
      target_provider: targetProvider
    }
  };
}

/**
 * SYSTEM_CORE_DISCOVERY: Protocolo de Enlace para el Satélite Remoto.
 * Verifica un Google ID Token y retorna la URL del Core del usuario.
 * 
 * AXIOMA DE SEGURIDAD: Este endpoint es la "puerta de entrada soberana" para
 * el Satélite. Es el único protocolo que no requiere sessionSecret previo.
 */
function _system_handleCoreDiscovery(uqo) {
  const idToken = uqo.data?.id_token;
  if (!idToken) throw createError('INVALID_INPUT', 'SYSTEM_CORE_DISCOVERY requiere data.id_token.');

  // 1. Verificar el ID Token de Google via tokeninfo
  let tokenPayload;
  try {
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const response = UrlFetchApp.fetch(tokenInfoUrl, { muteHttpExceptions: true });
    const parsed = JSON.parse(response.getContentText());
    if (parsed.error) throw createError('AUTH_INVALID', `Token inválido: ${parsed.error_description}`);
    tokenPayload = parsed;
  } catch (e) {
    throw createError('AUTH_INVALID', `No se pudo verificar el ID Token: ${e.message}`);
  }

  const googleEmail = tokenPayload.email;
  if (!googleEmail) throw createError('AUTH_INVALID', 'El token no contiene un email válido.');

  // 2. Verificar que el email es el dueño del Core
  const ownerEmail = PropertiesService.getScriptProperties().getProperty('SYS_CORE_OWNER_EMAIL');
  if (ownerEmail && ownerEmail !== googleEmail) {
    throw createError('SECURITY_VIOLATION', `El email ${googleEmail} no es el propietario de este Core.`);
  }

  // 3. Leer el session_secret existente del Core
  const existingSecret = PropertiesService.getScriptProperties().getProperty('SYS_SESSION_SECRET');
  if (!existingSecret) {
    throw createError('CORE_NOT_INITIALIZED', 'El Core no está inicializado. Completa la instalación en la UI de Indra primero.');
  }

  // 4. Retornar la URL del propio script (autodescubrimiento)
  const coreUrl = ScriptApp.getService().getUrl();

  logInfo(`[system] CORE_DISCOVERY exitoso para: ${googleEmail}`);

  return {
    items: [{
      id: googleEmail,
      class: 'SATELLITE_SESSION',
      handle: { label: googleEmail },
      payload: {
        core_url: coreUrl,
        session_secret: existingSecret,
        user_handle: googleEmail.split('@')[0]
      }
    }],
    metadata: { status: 'OK' }
  };
}
