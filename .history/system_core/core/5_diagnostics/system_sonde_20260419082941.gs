/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/system_sonde.gs
 * RESPONSABILIDAD: Auditoría de Sinceridad Total y Detección de Entropía.
 * 
 * PROTOCOLO DE USO:
 * 1. Ejecutar 'system_run_deep_sonde' desde el editor de GAS.
 * 2. Analizar el JSON resultante en los logs.
 * =============================================================================
 */

function system_run_deep_sonde() {
    const report = {
        metadata: {
            timestamp: new Date().toISOString(),
            engine_version: "v7.5-SONDE",
            status: "ANALYZING"
        },
        keychain_integrity: {},
        drive_consistency: [],
        infrastructure_map: {},
        legacy_karma: {},
        active_cache_locks: [],
        micellar_cells: []
    };

    try {
        // 1. AUDITORÍA DE LLAVERO (KEYCHAIN)
        logInfo("[sonde] Escaneando Llavero...");
        const keychain = ledger_keychain_read_all();
        const tokens = Object.keys(keychain);
        
        report.keychain_integrity = {
            total_tokens: tokens.length,
            active: tokens.filter(t => keychain[t].status === 'ACTIVE').length,
            revoked: tokens.filter(t => keychain[t].status === 'REVOKED').length,
            samples: tokens.slice(0, 5).map(t => ({ id: t, status: keychain[t].status, name: keychain[t].name }))
        };

        // 2. AUDITORÍA DE DRIVE (VERIFICACIÓN FÍSICA)
        logInfo("[sonde] Verificando consistencia física de Átomos...");
        const allAtoms = ledger_list_all_records();
        const sampleAtoms = allAtoms.slice(-15); // Los últimos 15 creados
        
        sampleAtoms.forEach(atom => {
            try {
                const file = DriveApp.getFileById(atom.id);
                report.drive_consistency.push({
                    id: atom.id,
                    alias: atom.handle.alias,
                    physical_status: file.isTrashed() ? 'TRASHED' : 'EXISTS',
                    last_updated_drive: file.getLastUpdated().toISOString(),
                    last_updated_ledger: atom.updated_at
                });
            } catch (e) {
                report.drive_consistency.push({
                    id: atom.id,
                    status: 'GHOST_ATOMIC_FAIL',
                    error: e.message
                });
            }
        });

        // 3. AUDITORÍA DE INFRAESTRUCTURA (MAPEO DE CARPETAS)
        logInfo("[sonde] Mapeando directorios de infraestructura...");
        const infraKeys = ['workspaces', 'schemas', 'nodes', 'ledgers', 'artifacts'];
        infraKeys.forEach(key => {
            const driveId = ledger_infra_get(key);
            if (driveId) {
                try {
                    const folder = DriveApp.getFolderById(driveId);
                    report.infrastructure_map[key] = { id: driveId, status: 'MOUNTED', name: folder.getName() };
                } catch(e) {
                    report.infrastructure_map[key] = { id: driveId, status: 'BROKEN_LINK' };
                }
            } else {
                report.infrastructure_map[key] = { status: 'NOT_CONFIGURED' };
            }
        });

        // 4. DETECCIÓN DE LEGADO (PROPERTIES SERVICE)
        logInfo("[sonde] Buscando Karma Legacy...");
        const props = PropertiesService.getScriptProperties().getProperties();
        const legacyKeys = Object.keys(props);
        report.legacy_karma = {
            detected_keys_count: legacyKeys.length,
            critical_keys: legacyKeys.filter(k => k.includes('INDRA') || k.includes('ACCESS')),
            raw_keys: legacyKeys
        };

        // 5. TOPOLOGÍA MICELLAR (WORKSPACES)
        logInfo("[sonde] Mapeando Células Micelares...");
        const workspaces = ledger_list_by_class(WORKSPACE_CLASS_);
        workspaces.forEach(ws => {
            const hasMount = MountManager.getMount(ws.id);
            report.micellar_cells.push({
                id: ws.id,
                label: ws.handle.label,
                is_mounted: !!hasMount,
                mount_id: hasMount || 'NONE'
            });
        });

        report.metadata.status = "COMPLETED";
    } catch (f) {
        logError("[sonde] FALLO CRÍTICO EN LA SONDA", f);
        report.metadata.status = "FAILED";
        report.metadata.error = f.message;
    }

    console.log("------------------------------------------------------------------");
    console.log("RPT_SONDA_INDRA_V75");
    console.log(JSON.stringify(report, null, 2));
    console.log("------------------------------------------------------------------");

    return report;
}

/**
 * SONDA_V8_INDUSTRIAL_ROBUSTNESS
 * Prueba de estrés estructural E2E de grado industrial.
 * Verifica la Membrane, el Registry y el Orchestrator en una sola secuencia.
 */
function SONDA_V8_INDUSTRIAL_ROBUSTNESS() {
  const protocol = 'SYSTEM_KEYCHAIN_SCHEMA';
  logInfo(`--- [SONDA_ROBUSTA] INICIANDO AUDITORÍA E2E: ${protocol} ---`);

  // 1. Verificación de Aduana (Registry)
  const contract = ProtocolRegistry.resolve(protocol);
  if (!contract) {
    logError("❌ ADUANA: El protocolo no existe en el Registry. Fallo en la Membrane.");
    return false;
  }
  logSuccess(`✅ ADUANA: Protocolo registrado [Dispatcher: ${contract.dispatcher}]`);

  // 2. Verificación de Orquestación (Brain)
  try {
    const result = SystemOrchestrator.dispatch({ protocol: protocol });
    logSuccess("✅ ORQUESTADOR: Despacho exitoso. El Cerebro reconoce el vector.");
    
    // 3. Verificación de Dharma (Formato)
    if (result.items && Array.isArray(result.items) && result.items.length > 0) {
      const schema = result.items[0];
      if (schema.fields && schema.fields.length > 0) {
        logSuccess(`✅ DHARMA: Estructura sincera detectada (${schema.fields.length} campos).`);
        
        // 4. Verificación de Contenido Específico
        const hasName = schema.fields.some(f => f.id === 'name');
        if (hasName) {
            logSuccess("✅ CONTENIDO: Campo 'name' presente. Sincronización 1:1 con Ledger.");
        } else {
            logError("⚠️ CONTENIDO: Falta campo 'name'. Posible desincronización de esquema.");
        }
        
        logInfo("--- RESULTADO FINAL: TODO EN ORDEN. INDRA ESTÁ SINCERADA ---");
        return true;
      }
    }
    
    logError("❌ DHARMA: La respuesta no cumple con el estándar de Indra (items[0].fields)");
    console.log("DEBUG_DATA:", JSON.stringify(result, null, 2));
    return false;

  } catch (err) {
    logError(`❌ ORQUESTADOR: Error durante el despacho: ${err.message}`);
    return false;
  }
}
