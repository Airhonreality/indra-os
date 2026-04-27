/**
 * =============================================================================
 * FRAGMENTO: infrastructure_identity.gs
 * RESPONSABILIDAD: Resolución de IDs y Validación de Anatomía.
 * DOGMA: RUIDO Y SINCERIDAD (Fail-Fast).
 * =============================================================================
 */

/**
 * Resuelve un ID (String) a un recurso físico de Drive (File/Folder).
 * Si el recurso no cumple con las expectativas del protocolo, falla ruidosamente.
 * @param {string} rawId - El ID crudo proveniente del Protocolo.
 * @param {string} expectedType - 'FILE' | 'FOLDER' (Opcional)
 * @returns {GoogleAppsScript.Drive.File | GoogleAppsScript.Drive.Folder}
 */
function infra_identity_resolve(rawId, expectedType = 'FILE') {
    if (!rawId) throw createError('IDENTITY_REQUIRED', '[infra:ident] Se requiere un ID para la resolución.');
    
    // Limpieza de prefijos (context:id -> id)
    const atomId = rawId.includes(':') ? rawId.split(':').pop() : rawId;
    logDebug(`[infra:ident] Resolviendo ID: ${atomId} (Tipo esperado: ${expectedType})`);

    try {
        if (expectedType === 'FOLDER') {
            const folder = DriveApp.getFolderById(atomId);
            if (folder.isTrashed()) throw new Error('TRASHED');
            return folder;
        }

        // --- INTELIGENCIA DE UBICACIÓN (v7.9.1) ---
        // Si pedimos un FILE pero recibimos un FOLDER, intentamos resolver al manifest.json interno.
        let resource;
        try {
            resource = DriveApp.getFileById(atomId);
            const mime = resource.getMimeType();
            
            // Si es un archivo pero NO es JSON, y es una carpeta disfrazada (raro en GAS)
            if (mime === MimeType.FOLDER) return _resolveFolderToManifest(resource);
            
            if (resource.isTrashed()) throw new Error('TRASHED');
            return resource;
        } catch(e) {
            // Si getFileById falla, probamos si es una carpeta
            try {
                const folder = DriveApp.getFolderById(atomId);
                return _resolveFolderToManifest(folder);
            } catch(f) {
                logError(`[infra:ident] Recurso ${atomId} no existe o es inaccesible.`);
                throw createError('NOT_FOUND', `ID de recurso no válido: ${atomId}`);
            }
        }
    } catch (e) {
        if (e.code) throw e; 
        throw e;
    }
}

/**
 * Auxiliar para localizar el manifest dentro de una carpeta.
 * @private
 */
function _resolveFolderToManifest(folder) {
    logInfo(`[infra:ident] Resolviendo carpeta '${folder.getName()}' a su manifest.json...`);
    const files = folder.getFilesByName('manifest.json');
    if (files.hasNext()) return files.next();
    
    // Si no hay manifest, es una violación de soberanía
    throw createError('SOVEREIGN_VIOLATION', `La carpeta '${folder.getName()}' no es una Célula de Indra válida (Falta manifest.json).`);
}

/**
 * Valida que un archivo sea un Átomo de Indra válido (Anatomía Sincera).
 * @param {GoogleAppsScript.Drive.File} file 
 * @returns {Object} El contenido JSON validado.
 */
function infra_identity_validate_dna(file) {
    const rawContent = file.getBlob().getDataAsString();
    
    if (!rawContent || rawContent.trim() === "") {
        throw createError('DATA_CORRUPT', `Sinceridad Violada: El archivo '${file.getName()}' está físicamente vacío.`);
    }

    try {
        const dna = JSON.parse(rawContent);
        // Contrato mínimo de Átomo
        if (!dna.class || !dna.handle) {
            throw createError('ANATOMY_BROKEN', `Sinceridad Violada: El archivo '${file.getName()}' no tiene un esquema de átomo válido.`);
        }
        return dna;
    } catch (e) {
        throw createError('JSON_CORRUPT', `Sinceridad Violada: No se pudo parsear el ADN de '${file.getName()}'`);
    }
}
/**
 * Resuelve un ID a su recurso físico real (File o Folder) sin saltos lógicos.
 * @param {string} rawId 
 * @returns {GoogleAppsScript.Drive.File | GoogleAppsScript.Drive.Folder}
 */
function infra_identity_get_physical_resource(rawId) {
    if (!rawId) throw createError('IDENTITY_REQUIRED', '[infra:ident] ID requerido.');
    const atomId = rawId.includes(':') ? rawId.split(':').pop() : rawId;

    try {
        // Primero intentamos como archivo (lo más común)
        return DriveApp.getFileById(atomId);
    } catch (e) {
        try {
            // Si falla, intentamos como carpeta
            return DriveApp.getFolderById(atomId);
        } catch (f) {
            throw createError('NOT_FOUND', `Recurso físico no encontrado: ${atomId}`);
        }
    }
}
