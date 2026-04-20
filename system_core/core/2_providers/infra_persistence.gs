/**
 * INDRA INFRASTRUCTURE SILO: infra_persistence.gs
 * Generado automáticamente por Shredder v1.0
 */

/**
 * =============================================================================
 */
// --- INTERFAZ GLOBAL PAD (Protocol Auto-Discovery) ---
// Estos alias permiten que el SystemOrchestrator descubra y ejecute los protocolos
// de infraestructura directamente, activando la resonancia axiomática.
function ATOM_READ(uqo)   { return _system_handleRead(uqo); }
function ATOM_CREATE(uqo) { return _system_handleCreate(uqo); }
function ATOM_UPDATE(uqo) { return _system_handleUpdate(uqo); }
function ATOM_PATCH(uqo)  { return _system_handlePatch(uqo); }
function ATOM_DELETE(uqo) { return _system_handleDelete(uqo); }
function ATOM_EXISTS(uqo) { return _system_handleExists(uqo); }
function ATOM_ALIAS_RENAME(uqo) { return _system_handleAliasRename(uqo); }

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
        // AXIOMA: Los Workspaces son SOBERANOS y FÍSICOS. El resto de átomos pueden usar el Ledger.
        if (targetClass === WORKSPACE_CLASS_) {
            return _system_handleSatelliteDiscover(uqo);
        }
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
    if (!uqo || !uqo.data) throw createError('INVALID_INPUT', 'ATOM_CREATE requiere data.');
    const data = uqo.data || {};
    const atomClass = data.class || WORKSPACE_CLASS_;
    const label = data.handle?.label || data.label || 'Sin título';
    
    // DELEGACIÓN MICELAR: Orquestación del nacimiento
    const result = _system_createAtom(atomClass, label.trim(), uqo);
    return { items: result.items, metadata: result.metadata };
}

function _system_handleUpdate(uqo) {
    if (!uqo || !uqo.context_id || !uqo.data) throw createError('INVALID_INPUT', 'ATOM_UPDATE requiere context_id y data.');
    
    // DELEGACIÓN MICELAR: El protocolo ahora lo maneja el fragmento especializado
    const result = _system_updateAtom(uqo.context_id, uqo.data, uqo.provider);
    return { items: result.items, metadata: result.metadata };
}

function _system_handlePatch(uqo) {
    if (!uqo || !uqo.context_id || !uqo.data) throw createError('INVALID_INPUT', 'ATOM_PATCH requiere context_id y data.');
    
    const result = _system_patchAtom(uqo.context_id, uqo.data, uqo.provider);
    return { items: result.items, metadata: result.metadata };
}

function _system_handleDelete(uqo) {
    if (!uqo || !uqo.context_id) throw createError('INVALID_INPUT', 'ATOM_DELETE requiere context_id.');
    
    // DELEGACIÓN MICELAR: Orquestación de la purga
    const result = _system_deleteAtom(uqo.context_id, uqo);
    return { items: result.items, metadata: result.metadata };
}

/**
 * ATOM_EXISTS: Verifica la existencia física de uno o varios átomos.
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

/**
 * ATOM_READ_PHYSICAL: Lee un átomo desde Drive con validación de resonancia inteligente.
 */
function _system_readAtom(atomId, providerId, uqo = {}) {
    try {
        const file = _system_findAtomFile(atomId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        
        // --- AXIOMA: RESONANCIA JIT ---
        const atomRes = _system_toAtom(doc, atomId, providerId);
        if (atomRes.class === WORKSPACE_CLASS_) {
            _system_resonate_identity_([atomRes]);
        }
        
        return { items: [atomRes], metadata: { status: 'OK' } };
    } catch (err) {
        logError(`[infrastructure] ATOM_READ_FAILED: ${atomId}`, err);
        return { 
            items: [], 
            metadata: { 
                status: 'ERROR', 
                error: err.message, 
                code: 'NOT_FOUND',
                atom_id: atomId
            } 
        };
    }
}

/**
 * ATOM_CREATE_PHYSICAL: Orquesta la creación de un átomo en Drive y Ledger.
 */
function _system_createAtom(atomClass, label, uqo) {
    if (atomClass === WORKSPACE_CLASS_) {
        return _system_genesis_cellular_workspace_(label, uqo);
    }

    try {
        const providerId = uqo.provider || 'system';
        const extraData = uqo.data || {};
        const now = new Date().toISOString();

        const folderName = _system_getFolderForClass(atomClass);
        const contextId = uqo.workspace_id || uqo.context_id;
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

        return { items: [_system_toAtom(atomDoc, driveId, providerId)], metadata: { status: 'OK' } };
    } catch (err) {
        logError(`[infrastructure] ATOM_CREATE_FAILED: ${atomClass}`, err);
        return { 
            items: [], 
            metadata: { status: 'ERROR', error: err.message } 
        };
    }
}

function _system_updateAtom(atomId, updates, providerId) {
    try {
        const file = _system_findAtomFile(atomId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        
        // Merge profundo de updates
        const nextDoc = { ...doc, ...updates, updated_at: new Date().toISOString() };
        file.setContent(JSON.stringify(nextDoc, null, 2));
        
        return { items: [_system_toAtom(nextDoc, atomId, providerId)], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

function _system_patchAtom(atomId, delta, providerId) {
    try {
        const file = _system_findAtomFile(atomId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        
        // AXIOMA: Mezcla selectiva del payload
        if (delta.payload) {
            doc.payload = { ...doc.payload, ...delta.payload };
            delete delta.payload;
        }

        // Merge del resto de propiedades (metadata)
        const nextDoc = { 
            ...doc, 
            ...delta, 
            updated_at: new Date().toISOString() 
        };
        
        file.setContent(JSON.stringify(nextDoc, null, 2));
        return { items: [_system_toAtom(nextDoc, atomId, providerId)], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

function _system_deleteAtom(atomId, uqo = {}) {
    try {
        const file = _system_findAtomFile(atomId);
        file.setTrashed(true);
        ledger_remove_atom(atomId, uqo);
        return { items: [], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

function _system_toAtom(doc, fileId, providerId) {
    if (!doc.class || !doc.handle?.label) {
        return { id: fileId, class: 'BROKEN_ATOM' };
    }
    const safeHandle = {
        ns: doc.handle?.ns || `com.indra.system.${doc.class.toLowerCase()}`,
        alias: doc.handle?.alias || _system_slugify_(doc.handle?.label),
        label: doc.handle?.label
    };

    return {
        id: fileId || doc.id,
        core_id: readCoreOwnerEmail(),
        handle: safeHandle,
        class: doc.class,
        protocols: doc.protocols || [],
        provider: providerId || 'system',
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        payload: doc.payload || {},
        raw: { ...doc, _file_id: fileId },
    };
}

function _system_listAtomsByClass(atomClass, providerId, uqo) {
    try {
        const items = ledger_list_by_class(atomClass, uqo);
        if (atomClass === WORKSPACE_CLASS_) {
            _system_resonate_identity_(items);
        }
        const atoms = items.map(item => _system_toAtom(item, item.id, providerId));
        return { items: atoms, metadata: { status: 'OK', total: atoms.length } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

/**
 * _system_listAllAtomFiles_: Buscador global de archivos atomizados.
 */
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
