/**
 * =============================================================================
 * ARTEFACTO: 4_support/blueprint_manager.gs
 * RESPONSABILIDAD: Gestionar el Vault de Blueprints.
 * AXIOMA: Permite cargar y publicar piezas de automatización enteras en un silo limpio.
 * =============================================================================
 */

const BLUEPRINTS_FOLDER_NAME_ = 'blueprints';

function _blueprint_getVaultFolder() {
    const homeRoot = _system_ensureHomeRoot(); // Del provider_system_infrastructure
    const subFolders = homeRoot.getFoldersByName(BLUEPRINTS_FOLDER_NAME_);
    return subFolders.hasNext() ? subFolders.next() : homeRoot.createFolder(BLUEPRINTS_FOLDER_NAME_);
}

/**
 * Escanea la carpeta física y devuelve todos los Blueprints válidos.
 */
function _blueprint_scanVault() {
    try {
        const folder = _blueprint_getVaultFolder();
        const files = folder.getFiles();
        const blueprints = [];

        while (files.hasNext()) {
            const file = files.next();
            if (file.getMimeType() !== 'application/json') continue;
            try {
                const content = JSON.parse(file.getBlob().getDataAsString());
                
                // Un Blueprint puede ser un átomo único o un Manifiesto de múltiples átomos
                if (content.blueprint_id || content.class) {
                    blueprints.push({
                        file_id: file.getId(),
                        name: file.getName(),
                        size: file.getSize(),
                        label: content.handle?.label || content.blueprint_id || 'UNKNOWN_BLUEPRINT',
                        class: content.class || 'BLUEPRINT_COLLECTION',
                        description: content.description || 'Sin descripción',
                        capabilities: content.capabilities || []
                    });
                }
            } catch (e) {
                logWarn(`[BlueprintManager] Archivo ignorado por formato inválido: ${file.getName()}`);
            }
        }
        
        return blueprints;
    } catch(e) {
        logError(`[BlueprintManager] Error escaneando Vault.`, e);
        return [];
    }
}

/**
 * Exporta el átomo seleccionado y sus dependencias directas a la carpeta de Blueprints
 */
function _blueprint_publish(atomId, providerId) {
    try {
        const atomReq = route({
            provider: providerId || 'system',
            protocol: 'ATOM_READ',
            context_id: atomId
        });
        
        if (!atomReq || !atomReq.items || atomReq.items.length === 0) {
            throw createError('NOT_FOUND', 'Átomo base no encontrado.');
        }
        
        const atom = atomReq.items[0];
        const vault = _blueprint_getVaultFolder();
        
        // Limpieza Axiomática: Remover IDs locales
        const cleanAtom = JSON.parse(JSON.stringify(atom));
        delete cleanAtom.id;
        delete cleanAtom.core_id;
        delete cleanAtom.provider;
        delete cleanAtom.raw; // Quitar basura cruda
        delete cleanAtom._orphan;
        
        const fileName = `bp_${cleanAtom.class}_${cleanAtom.handle?.alias || Date.now()}.json`;
        vault.createFile(fileName, JSON.stringify(cleanAtom, null, 2));

        return { items: [cleanAtom], metadata: { status: 'OK', message: `Publicado en el Vault: ${fileName}` } };
    } catch (e) {
         logError(`[BlueprintManager] Publishing failed.`, e);
         return { items: [], metadata: { status: 'ERROR', error: e.message } };
    }
}

/**
 * Importa un blueprint en el Workspace por medio de la creación universal
 */
function _blueprint_install(fileId, providerId) {
    try {
        const file = DriveApp.getFileById(fileId);
        const data = JSON.parse(file.getBlob().getDataAsString());
        
        const createReq = route({
            provider: providerId || 'system',
            protocol: 'ATOM_CREATE',
            data: data
        });
        
        return createReq;
        
    } catch(e) {
        logError(`[BlueprintManager] Installation failed.`, e);
        return { items: [], metadata: { status: 'ERROR', error: e.message } };
    }
}

/**
 * PROTOCOLO UNIVERSAL
 */
function system_blueprint_sync(uqo) {
    const action = uqo.data?.action;
    
    if (action === 'SCAN') {
        const bps = _blueprint_scanVault();
        return { items: bps, metadata: { status: 'OK' } };
    }
    
    if (action === 'PUBLISH') {
        return _blueprint_publish(uqo.context_id, uqo.provider);
    }
    
    if (action === 'INSTALL') {
        return _blueprint_install(uqo.context_id, uqo.provider);
    }
    
    throw createError('INVALID_INPUT', 'Acción de blueprint desconocida.');
}
