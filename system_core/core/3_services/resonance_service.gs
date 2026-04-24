/**
 * =============================================================================
 * ARTEFACTO: 3_services/resonance_service.gs
 * RESPONSABILIDAD: Curación y Sincronización Axiomática. Resuelve el quiebre 
 *         de resonancia entre el Workspace y el Proveedor Físico.
 * =============================================================================
 */

/**
 * Protocolo de Cristalización: Inyecta el contrato V4.1 en un archivo físico 
 * que ha perdido su identidad soberana.
 * 
 * @param {Object} uqo - { provider, context_id }
 * @returns {Object} Result items: [repaired_atom]
 */
function resonance_crystallize_atom(uqo) {
    const providerId = uqo.provider || 'drive';
    const atomId = uqo.context_id || uqo.id;

    if (!atomId) throw createError('INVALID_INPUT', 'CRYSTALLIZE requiere context_id.');

    logInfo(`[resonance] Iniciando Cristalización de Átomo: ${atomId} (Provider: ${providerId})`);

    try {
        // 1. Localizar el archivo físico (solo Drive por ahora)
        const file = DriveApp.getFileById(atomId);
        const contentStr = file.getBlob().getDataAsString();
        let content;
        
        try {
            content = JSON.parse(contentStr);
        } catch (e) {
            throw createError('DATA_CORRUPT', 'El archivo físico no es JSON válido.');
        }

        // 2. Extraer identidad desde el sistema de archivos (Dharma de Nombre)
        const rawName = file.getName().replace(/\.json$/i, '');
        const label = rawName.replace(/_/g, ' ');
        const alias = _system_slugify_(label);

        // 3. Inyectar el Handle V4.1 (Sincronización Axiomática)
        content.id = atomId; // Asegurar consistencia del ID
        content.handle = {
            ns: content.handle?.ns || `com.indra.system.${content.class?.toLowerCase() || 'item'}`,
            alias: alias,
            label: label
        };

        // Purga de Legacy: El campo .name muere aquí
        if (content.name) delete content.name;

        // 4. Persistir la Verdad
        file.setContent(JSON.stringify(content, null, 2));

        logInfo(`[resonance] Cristalización exitosa: ${label} [${alias}]`);

        return {
            items: [content],
            metadata: { 
                status: 'OK', 
                message: `Átomo cristalizado con identidad V4.1: ${label}`,
                intent_type: 'SUCCESS'
            }
        };

    } catch (err) {
        logError(`[resonance] Fallo en cristalización de ${atomId}`, err);
        throw createError('RESONANCE_FAILURE', `No se pudo cristalizar la materia: ${err.message}`);
    }
}

/**
 * Protocolo de Purga Profunda: Elimina todos los huérfanos del Workspace activo.
 */
function resonance_deep_purge_workspace(uqo) {
    const workspaceId = uqo.workspace_id || uqo.context_id;
    if (!workspaceId) throw createError('INVALID_INPUT', 'DEEP_PURGE requiere workspace_id.');

    try {
        const file = _system_findAtomFile(workspaceId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        const originalCount = (doc.pins || []).length;

        // Limpieza de Materia Desaparecida
        const sincerePins = (doc.pins || []).filter(pin => {
            try {
                const atomFile = DriveApp.getFileById(pin.id);
                return !atomFile.isTrashed();
            } catch (e) {
                return false; // Si no existe o no hay acceso, fuera.
            }
        });

        const deletedCount = originalCount - sincerePins.length;
        doc.pins = sincerePins;
        doc.updated_at = new Date().toISOString();
        
        file.setContent(JSON.stringify(doc, null, 2));

        return {
            items: [],
            metadata: { 
                status: 'OK', 
                message: `Purga profunda completada. Se eliminaron ${deletedCount} sombras del workspace.`,
                total_deleted: deletedCount
            }
        };
    } catch (err) {
        throw createError('SYSTEM_FAILURE', `Error en Deep Purge: ${err.message}`);
    }
}
/**
 * RESONANCIA DE CONTRATO (Sincronización Satélite-Core)
 * @dharma Recibe el ADN del satélite y asegura la trazabilidad de sus esquemas.
 * @param {Object} payload - { data: { contract: { schemas, workflows } } }
 */
function SYSTEM_RESONANCE_CRYSTALLIZE(payload) {
    const contract = payload.data?.contract;
    if (!contract) throw new Error("RESONANCE_FAILED: No se recibió contrato para cristalizar.");

    const satelliteToken = payload.satellite_token || 'ANONYMOUS';
    logInfo(`[resonance] Cristalizando ADN del Satélite. Token: ${satelliteToken}`);

    const incomingSchemas = contract.schemas || [];
    const incomingIds = new Set(incomingSchemas.map(s => s.id));
    const integrityWarnings = [];

    // 1. Obtener esquemas "Conocidos" por el sistema para este contexto
    // (Simulamos la recuperación de esquemas que el Core tiene vinculados en sus flujos)
    try {
        const coreWorkflows = _system_listAtomsByClass(WORKFLOW_CLASS_, 'system').items || [];
        
        const usedSchemaIds = new Set();
        coreWorkflows.forEach(wf => {
            (wf.payload?.stations || []).forEach(st => {
                if (st.config?.schema_id) usedSchemaIds.add(st.config.schema_id);
            });
        });

        // 2. Detección de Fantasmas (GHOSTING)
        // Si un esquema está en uso por el Core pero ya no viene en el contrato del Satélite...
        usedSchemaIds.forEach(id => {
            if (!incomingIds.has(id)) {
                logWarn(`[resonance] Detectada Referencia Fantasma (GHOST): ${id}`);
                integrityWarnings.push({
                    type: 'SCHEMA_GHOSTED',
                    id: id,
                    severity: 'AMBAR',
                    message: `El esquema ${id} ha sido eliminado localmente pero es vital para flujos en el Core.`
                });
            }
        });

    } catch (e) {
        logWarn("[resonance] No se pudo realizar el escaneo de integridad cruzada:", e.message);
    }

    // 3. PROTOCOLO DE GÉNESIS (CIUDADANÍA SATELITAL)
    let generatedWorkspaceId = null;
    const satelliteName = contract.satellite_name || contract.core_id || 'Nuevo Workspace';
    
    try {
        const existingWorkspaces = _system_listAtomsByClass('WORKSPACE', 'system').items || [];
        const genesisTarget = existingWorkspaces.find(ws => 
            (ws.handle?.label === satelliteName) || 
            (ws.name === satelliteName) || 
            (ws.handle?.alias === _system_slugify_(satelliteName))
        );

        if (genesisTarget) {
            logInfo(`[resonance] Ciudadanía Confirmada. Workspace existente: ${genesisTarget.id}`);
            generatedWorkspaceId = genesisTarget.id;
        } else {
            logInfo(`[resonance] Iniciando Génesis para nuevo Satélite: ${satelliteName}`);
            const genesisResponse = _system_handleCreate({
                provider: 'system',
                class: 'WORKSPACE',
                data: {
                    name: satelliteName,
                    description: `Dharma de Jurisdicción creado automáticamente para el satélite ${satelliteName}.`
                }
            });
            if (genesisResponse.items && genesisResponse.items.length > 0) {
                generatedWorkspaceId = genesisResponse.items[0].id;
                logInfo(`[resonance] Génesis Completada. Workspace asignado: ${generatedWorkspaceId}`);
            }
        }
    } catch (e) {
        logWarn(`[resonance] Error en Génesis de Workspace para ${satelliteName}`, e);
    }

    return {
        items: [],
        metadata: {
            status: 'OK',
            core_version: '0.4.5',
            message: `Resonancia establecida. ${incomingSchemas.length} esquemas cristalizados.`,
            integrity_warnings: integrityWarnings,
            handshake_timestamp: new Date().toISOString(),
            generated_workspace_id: generatedWorkspaceId
        }
    };
}
// ─── ORQUESTADOR DE RESONANCIA SOBERANA (v10.7) ───────────────────────────────

/**
 * Entrada principal para eventos de resonancia. Desacoplada de la infraestructura.
 * @param {Object} atom - El objeto átomo actualizado.
 * @param {string} eventType - UPDATE, CREATE, DELETE.
 * @param {Object} previous - El estado anterior del átomo (opcional).
 */
function resonance_service_resonate(atom, eventType, previous) {
    if (!atom || !atom.class) return;
    
    const traits = resonance_registry_get_traits(atom.class);
    if (traits.length === 0) return;

    logInfo(`[resonance] Despachando eventos para ${atom.class} (ID: ${atom.id}) | Evento: ${eventType}`);

    // Rasgo: RESONANCIA FÍSICA (Identidad)
    if (traits.includes(TRAIT.PHYSICAL_RESONANCE)) {
        // AXIOMA DE SINCERIDAD TOTAL: Sincronizamos siempre para capturar cambios en el payload
        _resonance_handle_physical_identity(atom);
    }

    // Rasgo: SINCRONIZACIÓN LÓGICA (ADN)
    if (traits.includes(TRAIT.LOGICAL_SYNC)) {
        // Reservado para futuras implementaciones de cascada de esquemas
    }
}

/**
 * MANEJADOR DE IDENTIDAD FÍSICA (Encapsulado Drive)
 * @private
 */
function _resonance_handle_physical_identity(atom) {
    const newLabel = atom.handle?.label;
    if (!newLabel) return;

    // AXIOMA DE RESONANCIA MULTI-CUERPO (Agnóstico):
    // No preguntamos qué es el átomo, sino dónde se ancla físicamente.
    const anchorTypes = resonance_registry_get_anchors(atom.class);
    const anchors = _resonance_resolve_physical_anchors_(atom, anchorTypes);

    if (anchors.length === 0) {
        logInfo(`[resonance_physical] Átomo sin anclajes físicos detectados: ${atom.id}`);
        return;
    }

    anchors.forEach(anchor => {
        if (!anchor.id) return;
        const trx = (atom.trace_id || 'LOCAL'); // Intentar capturar traza del átomo
        
        try {
            logInfo(`[resonance] [${trx}] Sincronizando anclaje [${anchor.type}] para ${anchor.id} -> ${newLabel}`);
            
            if (anchor.type === ANCHOR_TYPE.LEDGER_ROW) {
                try {
                    ledger_sync_atom(atom, atom.id);
                    logSuccess(`[resonance] [${trx}] Ledger sincronizado para ${atom.id}`);
                } catch (e) {
                    logWarn(`[resonance] [${trx}] Ledger en sombra para ${atom.id}: ${e.message}`);
                }
                return;
            }

            const resource = DriveApp.getFileById(anchor.id); // Polimorfismo GAS (File/Folder)
            const currentName = resource.getName();
            
            logDebug(`[resonance_physical] [${trx}] Evaluando recurso: ${currentName} vs ${newLabel}`);
            
            if (currentName === newLabel) {
                logInfo(`[resonance_physical] [${trx}] Anclaje ya resonante. Saltando.`);
                return;
            }
            
            if (anchor.type === ANCHOR_TYPE.DNA_FILE && (currentName === 'workspace.json' || currentName === 'manifest.json')) {
                logInfo(`[resonance_physical] [${trx}] Saltando renombrado de ADN sagrado (${currentName})`);
                return;
            }

            logInfo(`[resonance_physical] [${trx}] RENOMBRANDO: ${currentName} -> ${newLabel}`);
            resource.setName(newLabel);
            logSuccess(`[resonance_physical] [${trx}] Éxito: Anclaje [${anchor.type}] sincronizado.`);
        } catch (err) {
            logWarn(`[resonance_physical] [${trx}] Fallo al sincronizar anclaje ${anchor.type} (${anchor.id}): ${err.message}`);
        }
    });

    // Limpiar Caché de Resonancia para visibilidad inmediata en todos los listados
    CacheService.getScriptCache().remove(`res_meta_${atom.id}`);
}

/**
 * Resuelve los IDs físicos reales para cada tipo de anclaje de un átomo.
 * @private
 */
function _resonance_resolve_physical_anchors_(atom, types) {
    const anchors = [];
    if (!types || !Array.isArray(types)) return anchors;

    types.forEach(type => {
        if (type === ANCHOR_TYPE.DNA_FILE) {
            anchors.push({ type: ANCHOR_TYPE.DNA_FILE, id: atom.id });
        } else if (type === ANCHOR_TYPE.CONTAINER) {
            if (atom.payload?.cell_folder_id) {
                anchors.push({ type: ANCHOR_TYPE.CONTAINER, id: atom.payload.cell_folder_id });
            } else {
                // --- AXIOMA DE PROXIMIDAD (v11.0) ---
                try {
                    const file = DriveApp.getFileById(atom.id);
                    const parents = file.getParents();
                    if (parents.hasNext()) {
                        anchors.push({ type: ANCHOR_TYPE.CONTAINER, id: parents.next().getId() });
                    }
                } catch (e) { /* ... */ }
            }
        } else if (type === ANCHOR_TYPE.TABULAR && atom.payload?.spreadsheet_id) {
            anchors.push({ type: ANCHOR_TYPE.TABULAR, id: atom.payload.spreadsheet_id });
        } else if (type === ANCHOR_TYPE.LEDGER_ROW) {
            anchors.push({ type: ANCHOR_TYPE.LEDGER_ROW, id: atom.id });
        }
    });

    return anchors;
}
