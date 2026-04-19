/**
 * PROTOCOLO: SYSTEM_WORKSPACE_DEEP_PURGE
 * El "Exterminador Atómico": Borra rastro lógico, físico e identitario.
 */
function SYSTEM_WORKSPACE_DEEP_PURGE(uqo) {
    const workspaceId = uqo.data?.workspace_id || uqo.workspace_id;
    if (!workspaceId) throw createError('INVALID_INPUT', 'DEEP_PURGE requiere workspace_id.');

    logWarn(`☢️ [deep_purge] INICIANDO EXTERMINIO DEL WORKSPACE: ${workspaceId}`);

    try {
        // 1. FASE DE IDENTIDAD: Invalidar llaves asociadas
        _keychain_purge_keys_by_workspace_(workspaceId);
        logInfo(`[deep_purge] 1/3: Llavero purgado de accesos para ${workspaceId}`);

        // 2. FASE FÍSICA: Trashed en Drive
        try {
            // Intentar encontrar la carpeta por nombre canónico o por ID guardado en Ledger
            const folderName = `[INDRA_WORKSPACE_${workspaceId}]`;
            const folders = DriveApp.getFoldersByName(folderName);
            while (folders.hasNext()) {
                const folder = folders.next();
                folder.setTrashed(true);
                logInfo(`[deep_purge] 2/3: Carpeta física enviada a la papelera: ${folderName}`);
            }
            
            // También buscamos el archivo del Átomo de Workspace
            const atomFileName = `ws_atoms_${workspaceId}.json`;
            const files = DriveApp.getFilesByName(atomFileName);
            while (files.hasNext()) {
                files.next().setTrashed(true);
            }
        } catch (err) {
            logWarn(`[deep_purge] Advertencia en fase física: ${err.message}`);
        }

        // 3. FASE LÓGICA: Borrado en Ledger
        ledger_workspaces_delete(workspaceId);
        logInfo(`[deep_purge] 3/3: Ledger de Workspaces purgado.`);

        return { 
            metadata: { 
                status: 'OK', 
                message: 'Exterminio completado. El espacio y su rastro físico han sido purgados.' 
            } 
        };

    } catch (err) {
        logError(`[deep_purge] FALLO EN EXTERMINIO: ${workspaceId}`, err);
        return { 
            metadata: { 
                status: 'ERROR', 
                error: err.message,
                code: 'PURGE_FAILURE'
            } 
        };
    }
}

/**
 * Purga todas las llaves del Keychain que tengan acceso a este workspace.
 */
function _keychain_purge_keys_by_workspace_(workspaceId) {
    const ledger = ledger_keychain_read_all();
    let changed = false;

    Object.keys(ledger).forEach(token => {
        const entry = ledger[token];
        // Si el scope es ALL o incluye el workspace_id, lo revocamos 
        // (Nota: Si es ALL, decidimos si lo dejamos o no. En este caso solo revocamos si es SCOPED al ws)
        if (entry.scopes && entry.scopes.includes(workspaceId)) {
            ledger_keychain_delete(token);
            changed = true;
        }
    });

    return changed;
}
