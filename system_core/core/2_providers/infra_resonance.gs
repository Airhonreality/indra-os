/**
 * INDRA INFRASTRUCTURE SILO: infra_resonance.gs
 * Generado automáticamente por Shredder v1.0
 */


function RELATION_SYNC(uqo)     { return _system_handleRelationSync(uqo); }



/**
 * RELATION_SYNC: Registra un vínculo semántico entre dos átomos.
 * @private
 */
function _system_handleRelationSync(uqo) {
    const data = uqo.data || {};
    if (!data.source_gid || !data.target_gid || !data.type) {
        throw createError('INVALID_INPUT', 'RELATION_SYNC requiere source_gid, target_gid y type.');
    }

    ledger_sync_relation(
        data.source_gid,
        data.target_gid,
        data.type,
        data.strength || 1.0,
        uqo
    );

    return { 
        items: [], 
        metadata: { 
            status: 'OK', 
            message: 'RELATION_RESONATED',
            uid: `${data.source_gid}_${data.target_gid}_${data.type}`
        } 
    };
}



/**
 * MOTOR DE RESONANCIA FÍSICA (v8.5)
 * Hidrata una lista de átomos con la verdad del plano físico (Drive).
 * @param {Object[]} items - Lista de átomos ligeros del Ledger.
 */
function _system_resonate_identity_(items) {
    if (!items || items.length === 0) return;
    
    const cache = CacheService.getScriptCache();
    const startTime = Date.now();
    let cacheHits = 0;
    let driveCalls = 0;

    items.forEach(item => {
        const driveId = item.id;
        const cacheKey = `res_meta_${driveId}`;
        const cached = cache.get(cacheKey);

        if (cached) {
            const meta = JSON.parse(cached);
            item.handle.label = meta.name;
            item.updated_at = meta.updated;
            cacheHits++;
        } else {
            try {
                let name = "";
                let updated = "";
                
                try {
                    const folder = DriveApp.getFolderById(driveId);
                    name = folder.getName();
                    updated = folder.getLastUpdated().toISOString();
                } catch (e) {
                    const file = DriveApp.getFileById(driveId);
                    const parents = file.getParents();
                    if (parents.hasNext()) {
                        const parent = parents.next();
                        name = parent.getName();
                        updated = parent.getLastUpdated().toISOString();
                    } else {
                        name = file.getName().replace('.json', '');
                        updated = file.getLastUpdated().toISOString();
                    }
                }
                
                // --- AXIOMA: SANACIÓN JIT (v11.0) ---
                // Si el nombre físico difiere del lógico que traemos, curamos el átomo en memoria.
                // Nota: El Ledger se curará solo en la próxima onda de resonancia o lectura profunda.
                if (item.handle.label !== name && item.handle.label !== '[RESONANCE_PENDING]') {
                    logInfo(`[resonator] JIT: Curando identidad stale: ${item.handle.label} -> ${name}`);
                }

                item.handle.label = name;
                item.updated_at = updated;
                
                cache.put(cacheKey, JSON.stringify({ name, updated }), 300);
                driveCalls++;
            } catch (e) {
                logWarn(`[resonator] Falla de resonancia física para ${driveId}: ${e.message}`);
                item.handle.label = item.handle.label || '[IDENTIDAD_PERDIDA]';
            }
        }
    });

    logDebug(`[resonator] Resonancia completada en ${Date.now() - startTime}ms. Hits: ${cacheHits}, Drive: ${driveCalls}`);
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



/**
 * Helper: Procesa vínculos relacionales iniciales del átomo.
 * @private
 */
function _system_process_initial_relations_(atomDoc, uqo) {
    const initialRelations = uqo.data?.relations || [];
    const gid = atomDoc.gid || `GID-${atomDoc.id.substring(0,8)}`;
    
    initialRelations.forEach(rel => {
        if (!rel.target_gid || !rel.type) return;
        ledger_sync_relation(gid, rel.target_gid, rel.type, rel.strength || 1.0, uqo);
    });
}

