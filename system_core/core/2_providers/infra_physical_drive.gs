/**
 * INDRA INFRASTRUCTURE SILO: infra_physical_drive.gs
 * Generado automáticamente por Shredder v1.0
 */



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

    // ── LÓGICA DE ARQUITECTURA MICELAR (INDRA v7.5) ──
    if (workspaceId && workspaceId !== 'system' && workspaceId !== 'workspaces') {
        const cellInfo = _system_get_cell_infrastructure_(workspaceId);
        
        if (cellInfo.isCellular) {
            // AXIOMA: En una Célula, la carpeta 'artifacts' es la raíz para todo el contenido.
            parentFolder = cellInfo.artifactsFolder;
        } else {
            // AXIOMA: CERO FALLBACKS.
            throw createError('SOVEREIGN_VIOLATION', `El Workspace ${workspaceId} no es una Célula válida o carece de infraestructura Micelar.`);
        }
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
 * DELEGACIÓN MICELAR: Buscador de archivos atomizados.
 */
function _system_findAtomFile(contextId) {
    return infra_identity_resolve(contextId, 'FILE');
}



function _system_buildTraceId_(protocol, contextId) {
    const base = `${protocol || 'TRACE'}_${contextId || 'NA'}_${Date.now()}`;
    return base.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

