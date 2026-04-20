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
        } catch(e) {
            // Podría ser una carpeta? Google Drive API a veces lanza error al pedir File con ID de Folder.
            resource = DriveApp.getFolderById(atomId);
        }

        const mime = resource.getMimeType();
        if (mime === MimeType.FOLDER) {
            logInfo(`[infra:ident] Detectado puntero de Carpeta. Resolviendo a manifest.json...`);
            const files = resource.getFilesByName('manifest.json');
            if (files.hasNext()) {
                return files.next();
            }
            throw createError('SOVEREIGN_VIOLATION', `La ubicación ${atomId} no contiene un 'manifest.json' válido.`);
        }

        if (resource.isTrashed()) throw new Error('TRASHED');
        return resource;

    } catch (e) {
        if (e.code) throw e; 
        logError(`[infra:ident] Error en resolución de ${atomId}: ${e.message}`);
        throw createError('NOT_FOUND', `ID de recurso no válido o inaccesible: ${atomId} (Esperado: ${expectedType})`);
    }
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
