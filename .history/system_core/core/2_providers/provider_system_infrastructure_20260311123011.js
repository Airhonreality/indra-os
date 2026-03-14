/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system_infrastructure.gs
 * RESPONSABILIDAD: Operaciones puras de infraestructura y Drive.
 * AXIOMA: Solo gestiona la persistencia física de átomos en el Core.
 * =============================================================================
 */

// ─── CONSTANTES INTERNAS ──────────────────────────────────────────────────────

const HOME_ROOT_FOLDER_NAME_ = '.core_system';
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

    if (targetClass) {
        return _system_listAtomsByClass(targetClass, uqo.provider);
    }
    return _system_readAtom(contextId, uqo.provider);
}

function _system_handleCreate(uqo) {
    const data = uqo.data || {};
    const label = data.handle?.label || data.label || 'Sin título';
    const atomClass = data.class || WORKSPACE_CLASS_;
    return _system_createAtom(atomClass, label.trim(), data, uqo.provider);
}

function _system_handleDelete(uqo) {
    if (!uqo.context_id) throw createError('INVALID_INPUT', 'atom_delete requiere context_id.');
    return _system_deleteWorkspace(uqo.context_id);
}

function _system_handleUpdate(uqo) {
    if (!uqo.context_id || !uqo.data) throw createError('INVALID_INPUT', 'atom_update requiere context_id y data.');
    return _system_updateAtom(uqo.context_id, uqo.data, uqo.provider);
}


// ─── OPERACIONES DE ÁTOMOS EN DRIVE ───────────────────────────────────────────

function _system_listAtomsByClass(atomClass, providerId) {
    try {
        const folderName = _system_getFolderForClass(atomClass);
        const folder = _system_getOrCreateSubfolder_(folderName);
        const files = folder.getFiles();
        const items = [];

        while (files.hasNext()) {
            const file = files.next();
            if (file.getMimeType() !== 'application/json') continue;
            try {
                const content = JSON.parse(file.getBlob().getDataAsString());
                if (content.class !== atomClass) continue;
                items.push(_system_toAtom(content, file.getId(), providerId));
            } catch (parseError) {
                logWarn(`[infrastructure] Archivo JSON inválido ignorado: ${file.getName()}`);
            }
        }
        return { items, metadata: { status: 'OK' } };
    } catch (err) {
        logError(`[infrastructure] Error al listar clase ${atomClass}.`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

function _system_readAtom(atomId, providerId) {
    try {
        const file = _system_findAtomFile(atomId);
        const content = JSON.parse(file.getBlob().getDataAsString());
        return { items: [_system_toAtom(content, file.getId(), providerId)], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
    }
}

function _system_createAtom(atomClass, label, extraData, providerId) {
    try {
        if (!atomClass || !label) throw createError('CONTRACT_VIOLATION', '[infra] ATOM_CREATE: requiere class y handle.label.');

        const folderName = _system_getFolderForClass(atomClass);
        const now = new Date().toISOString();
        const subfolder = _system_getOrCreateSubfolder_(folderName);
        const alias = _system_slugify_(label);
        const fileName = `${alias}_${Date.now()}.json`;

        const initialPayload = extraData.payload || {};

        // ADR-008: Garantía de Sinceridad en la Cuna
        if (atomClass === DATA_SCHEMA_CLASS_ && !Array.isArray(initialPayload.fields)) {
            initialPayload.fields = [];
        }
        if (atomClass === WORKFLOW_CLASS_ && !Array.isArray(initialPayload.stations)) {
            initialPayload.stations = [];
        }
        if (atomClass === 'BRIDGE' && !Array.isArray(initialPayload.operators)) {
            initialPayload.operators = [];
        }

        const atomDoc = {
            handle: { ns: extraData.handle?.ns || `com.indra.system.${atomClass.toLowerCase()}`, alias: alias, label: label },
            class: atomClass,
            provider: providerId,
            created_at: now,
            updated_at: now,
            payload: initialPayload,
            protocols: ['ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE'],
            raw: extraData.raw || {},
        };
        const file = subfolder.createFile(fileName, JSON.stringify(atomDoc, null, 2));
        const driveId = file.getId();
        atomDoc.id = driveId;
        file.setContent(JSON.stringify(atomDoc, null, 2));

        return { items: [_system_toAtom(atomDoc, driveId, providerId)], metadata: { status: 'OK' } };
    } catch (err) {
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
        // 1. Encontrar y mover a papelera el archivo origen
        const file = _system_findAtomFile(atomId);
        file.setTrashed(true);
        logInfo(`[infra] Átomo eliminado de Drive: ${atomId}`);

        // 2. Purgar referencias en TODOS los workspaces (anti-pin-fantasma)
        _system_purgeAtomFromAllWorkspaces_(atomId);

        return { items: [], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
    }
}

/**
 * Recorre todos los workspace.json y elimina cualquier pin que apunte al atomId dado.
 * @private
 */
function _system_purgeAtomFromAllWorkspaces_(atomId) {
    try {
        const wsFolder = _system_getOrCreateSubfolder_(WORKSPACES_FOLDER_NAME_);
        const files = wsFolder.getFiles();
        let purgedCount = 0;

        while (files.hasNext()) {
            const file = files.next();
            if (file.getMimeType() !== 'application/json') continue;
            try {
                const doc = JSON.parse(file.getBlob().getDataAsString());
                const before = (doc.pins || []).length;
                doc.pins = (doc.pins || []).filter(p => p.id !== atomId);
                const after = doc.pins.length;

                if (after < before) {
                    doc.updated_at = new Date().toISOString();
                    file.setContent(JSON.stringify(doc, null, 2));
                    purgedCount++;
                    logInfo(`[infra] Pin fantasma purgado de workspace ${file.getName()} → atom ${atomId}`);
                }
            } catch (parseErr) {
                logWarn(`[infra] No se pudo procesar workspace ${file.getName()} durante purga: ${parseErr.message}`);
            }
        }

        if (purgedCount > 0) {
            logInfo(`[infra] Purga completada. ${purgedCount} workspace(s) saneados.`);
        }
    } catch (err) {
        logError('[infra] Fallo crítico durante purga de pins fantasma.', err);
    }
}


function _system_updateAtom(atomId, updates, providerId) {
    try {
        const file = _system_findAtomFile(atomId);
        const current = JSON.parse(file.getBlob().getDataAsString());

        const { id, class: atomClass, provider, raw, ...pureUpdates } = updates;
        const updated = JSON.parse(JSON.stringify(current));

        // deepMerge from indra_utils
        if (pureUpdates.payload) {
            updated.payload = updated.payload || {};
            _indra_deepMerge_(updated.payload, pureUpdates.payload);
            delete pureUpdates.payload;
        }

        if (pureUpdates.handle) {
            updated.handle = { ...(updated.handle || {}), ...pureUpdates.handle };
            delete pureUpdates.handle;
        }

        Object.assign(updated, pureUpdates);
        updated.updated_at = new Date().toISOString();

        const newLabel = updated.handle?.label;
        if (newLabel && newLabel !== (current.handle?.label || current.name)) {
            const cleanName = newLabel.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
            file.setName(`${cleanName}.json`);
            _system_propagateNameChange(atomId, newLabel, providerId);
        }

        file.setContent(JSON.stringify(updated, null, 2));
        return { items: [_system_toAtom(updated, file.getId(), providerId)], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
    }
}

// ─── INFRAESTRUCTURA DE DRIVE (PRIVADO) ───────────────────────────────────────

function _system_ensureHomeRoot() {
    const cachedId = readRootFolderId();
    if (cachedId) {
        try { return DriveApp.getFolderById(cachedId); } catch (e) { }
    }
    const existingFolders = DriveApp.getRootFolder().getFoldersByName(HOME_ROOT_FOLDER_NAME_);
    if (existingFolders.hasNext()) {
        const folder = existingFolders.next();
        if (!folder.isTrashed()) {
            storeRootFolderId(folder.getId());
            return folder;
        }
    }
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

function _system_getOrCreateSubfolder_(folderName) {
    const homeRoot = _system_ensureHomeRoot();
    const subFolders = homeRoot.getFoldersByName(folderName);
    return subFolders.hasNext() ? subFolders.next() : homeRoot.createFolder(folderName);
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

    // ADR-008: Blindaje de Salida (Aduana Interna del Provider)
    if (doc.class === DATA_SCHEMA_CLASS_ && !Array.isArray(payload.fields)) {
        payload.fields = [];
    }
    if (doc.class === WORKFLOW_CLASS_ && !Array.isArray(payload.stations)) {
        payload.stations = [];
    }
    if (doc.class === 'BRIDGE' && !Array.isArray(payload.operators)) {
        payload.operators = [];
    }

    return {
        id: fileId || doc.id,
        handle: doc.handle,
        class: doc.class,
        protocols: Array.isArray(doc.protocols) ? doc.protocols : [],
        provider: providerId || 'system',
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        payload: payload,
        raw: { ...doc, _file_id: fileId },
    };
}
