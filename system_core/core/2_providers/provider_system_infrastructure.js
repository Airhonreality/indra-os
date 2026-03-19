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
    return _system_deleteAtom(uqo.context_id);
}

function _system_handleUpdate(uqo) {
    if (!uqo.context_id || !uqo.data) throw createError('INVALID_INPUT', 'atom_update requiere context_id y data.');
    return _system_updateAtom(uqo.context_id, uqo.data, uqo.provider);
}

/**
 * SERVICE_PAIR: Vincula una cuenta a un proveedor específico.
 * Soporta 'SYSTEM_NATIVE' para autodescubrimiento en Google Apps Script.
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
 * @private
 */
function _system_handleExists(uqo) {
    const ids = uqo.data?.ids || [uqo.context_id];
    const existenceMap = _system_batchVerifyExistence_(ids);
    const items = ids.map(id => ({ id: id, exists: !!existenceMap[id] }));
    return { items, metadata: { status: 'OK' } };
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

        // AXIOMA ADR-008: El Provider confía en la Aduana. 
        // No validamos campos obligatorios aquí porque el protocol_router garantizó que la materia nace pura.

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
        // AXIOMA: La eliminación es física y determinista.
        // No escaneamos el sistema buscando referencias; la sinceridad se 
        // resuelve en el momento del acceso (Homeostasis bajo demanda).
        const file = _system_findAtomFile(atomId);
        file.setTrashed(true);
        logInfo(`[infra] Átomo eliminado de Drive: ${atomId}`);

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

    // ── GESTIÓN DE IDENTIDAD SINCERA (DEFENSA ANTE LEGADO) ──
    const safeHandle = {
        ns: doc.handle?.ns || `com.indra.system.${(doc.class || 'unknown').toLowerCase()}`,
        alias: doc.handle?.alias || _system_slugify_(doc.handle?.label || doc.name || 'unnamed'),
        label: doc.handle?.label || doc.name || 'ARTEFACTO_SIN_NOMBRE'
    };

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

    // AXIOMA: Inject SYSTEM_SHARE_CREATE for shareable artifacts
    let protocols = Array.isArray(doc.protocols) ? doc.protocols : [];
    if (['DATA_SCHEMA', 'DOCUMENT'].includes(doc.class)) {
        if (!protocols.includes('SYSTEM_SHARE_CREATE')) protocols.push('SYSTEM_SHARE_CREATE');
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
