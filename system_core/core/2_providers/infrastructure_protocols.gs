/**
 * =============================================================================
 * FRAGMENTO: infrastructure_protocols.gs
 * RESPONSABILIDAD: Orquestación de Protocolos (CREATE, READ, UPDATE, DELETE).
 * DOGMA: FLUJO PROTOCOLARIO SINCERO.
 * =============================================================================
 */

/**
 * Orquestación de ATOM_UPDATE (v12.0)
 * Implementa la lógica de mutación de un átomo y garantiza la resonancia.
 */
function infra_protocol_update(atomId, updates, providerId) {
    logDebug(`[infra:prot] Ejecutando ATOM_UPDATE para ${atomId}`);

    // 1. Fase de Identidad y Carga (FAIL-FAST)
    const file = infra_identity_resolve(atomId, 'FILE');
    const dna = infra_identity_validate_dna(file);

    // 2. Fase de Mutación (Lógica Pura)
    const original = JSON.parse(JSON.stringify(dna));
    const { id, class: atomClass, provider, raw, strategy, ...pureUpdates } = updates;

    // Gestión de Payload
    if (pureUpdates.payload) {
        dna.payload = dna.payload || {};
        if (strategy === 'MERGE') {
            _indra_deepMerge_(dna.payload, pureUpdates.payload);
        } else {
            dna.payload = pureUpdates.payload;
        }
        delete pureUpdates.payload;
    }

    // Gestión de Identidad (Handle)
    if (pureUpdates.handle) {
        dna.handle = { ...(dna.handle || {}), ...pureUpdates.handle };
        delete pureUpdates.handle;
    }

    // Mezcla de campos restantes
    Object.assign(dna, pureUpdates);
    dna.updated_at = new Date().toISOString();
    
    // Normalización de ID Sincera
    dna.id = file.getId();

    // 3. Fase de Persistencia
    infra_persistence_write(dna.id, dna);

    // 4. Retorno de Producto (Sin disparar resonancia aquí)
    return { 
        items: [_system_toAtom(dna, dna.id, providerId)], 
        original: original, // Devolvemos el estado previo para que el servicio resuene
        metadata: { status: 'OK' } 
    };
}

/**
 * Orquestación de ATOM_READ (v12.0)
 */
function infra_protocol_read(atomId, providerId, uqo = {}) {
    const dna = infra_persistence_read(atomId);
    
    // Aquí podemos añadir lógica de "Sanación JIT" si el Ledger está desincronizado
    // (Opcional según el nivel de ruido deseado)
    
    return { 
        items: [_system_toAtom(dna, atomId, providerId)], 
        metadata: { status: 'OK', source: 'DRY_PERSISTENCE' } 
    };
}

/**
 * Orquestación de ATOM_CREATE (v12.0)
 */
function infra_protocol_create(atomClass, label, uqo) {
    if (atomClass === WORKSPACE_CLASS_) {
        return _system_genesis_cellular_workspace_(label, uqo);
    }

    try {
        const providerId = uqo.provider || 'system';
        const extraData = uqo.data || {};
        const now = new Date().toISOString();

        const folderName = atomClass === 'SATELLITE' ? SATELLITES_FOLDER_NAME_ : _system_getFolderForClass(atomClass);
        const contextId = atomClass === 'SATELLITE' ? null : (uqo.workspace_id || uqo.context_id);
        const subfolder = _system_getOrCreateSubfolder_(folderName, uqo, contextId);
        
        const alias = _system_slugify_(label);
        const fileName = `${alias}_${Date.now()}.json`;

        const atomDoc = {
            handle: { 
                ns: extraData.handle?.ns || `com.indra.system.${atomClass.toLowerCase()}`, 
                alias: alias, 
                label: label 
            },
            class: atomClass,
            provider: providerId,
            core_id: readCoreOwnerEmail(), 
            created_at: now,
            updated_at: now,
            payload: extraData.payload || {},
            protocols: ['ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE'],
            raw: extraData.raw || {},
        };

        const file = subfolder.createFile(fileName, JSON.stringify(atomDoc, null, 2));
        const driveId = file.getId();
        atomDoc.id = driveId;
        file.setContent(JSON.stringify(atomDoc, null, 2));

        // El registro en Ledger ahora es responsabilidad del orquestador o se hace vía persistencia pura
        // Para mantener compatibilidad, el protocolo solo retorna el átomo listo para ser resonado
        return { items: [_system_toAtom(atomDoc, driveId, providerId)], metadata: { status: 'OK' } };

    } catch (err) {
        logError(`[infra:prot] ATOM_CREATE_FAILED: ${atomClass}`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

/**
 * Orquestación de ATOM_DELETE (v12.0)
 */
function infra_protocol_delete(atomId, uqo = {}) {
    try {
        const file = infra_identity_resolve(atomId, 'FILE');
        
        // --- AXIOMA DE SINCERIDAD INFRAESTRUCTURAL (v14.2) ---
        // Recuperamos la clase antes de la purga para que la resonancia sepa qué está borrando.
        let atomClass = 'UNKNOWN';
        try {
          const content = JSON.parse(file.getBlob().getDataAsString());
          atomClass = content.class || 'UNKNOWN';
        } catch(e) { /* Fallback a ID-based detection if not a valid JSON atom */ }
        
        file.setTrashed(true);
        
        logInfo(`[infra:prot] Átomo ${atomClass} marcado para purga física: ${atomId}`);
        return { items: [], metadata: { status: 'OK', deleted_id: atomId, atom_class: atomClass } };
    } catch (err) {
        logError(`[infra:prot] FALLO AL ELIMINAR: ${atomId}`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}
