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
function resonance_service_crystallize(payload) {
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
