/**
 * =============================================================================
 * FRAGMENTO: infrastructure_persistence.gs
 * RESPONSABILIDAD: Persistencia Atómica (Drive I/O).
 * DOGMA: INTEGRIDAD FÍSICA.
 * =============================================================================
 */

/**
 * Lee el contenido de un ADN (JSON) desde Drive.
 * @param {string} id - Drive ID del archivo.
 * @returns {Object} El ADN parseado.
 */
function infra_persistence_read(id) {
    const file = infra_identity_resolve(id, 'FILE');
    return infra_identity_validate_dna(file);
}

/**
 * Escribe un ADN (JSON) en Drive.
 * @param {string} id - Drive ID del archivo.
 * @param {Object} dna - El objeto ADN a persistir.
 * @returns {boolean} Éxito.
 */
function infra_persistence_write(id, dna) {
    if (!dna || typeof dna !== 'object') {
        throw createError('PERSISTENCE_FAILED', 'Se requiere un objeto ADN válido para escribir.');
    }

    const file = infra_identity_resolve(id, 'FILE');
    const content = JSON.stringify(dna, null, 2);
    
    try {
        file.setContent(content);
        return true;
    } catch (e) {
        logError(`[infra:pers] Fallo al escribir en archivo ${id}`, e);
        throw createError('DRIVE_WRITE_ERROR', `Error físico al guardar en Drive: ${e.message}`);
    }
}

/**
 * Renombra un recurso físico (Archivo o Carpeta).
 * @param {string} id - Drive ID.
 * @param {string} newName - Nuevo nombre solicitado.
 */
function infra_persistence_rename(id, newName) {
    if (!newName) return;
    
    try {
        // Aquí no nos importa si es archivo o carpeta para renombrar, 
        // pero usamos DriveApp genérico para flexibilidad.
        const resource = DriveApp.getFileById(id);
        if (resource.getName() !== newName) {
            resource.setName(newName);
            logDebug(`[infra:pers] Recurso ${id} renombrado a ${newName}`);
        }
    } catch (e) {
        logWarn(`[infra:pers] No se pudo renombrar el recurso ${id}: ${e.message}`);
    }
}
