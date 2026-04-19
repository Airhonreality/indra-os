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
