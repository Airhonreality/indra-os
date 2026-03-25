/**
 * =============================================================================
 * SERVICIO: DriveDiscoveryService.js
 * RESPONSABILIDAD: El "Arqueólogo de Sistemas".
 * Encuentra y recupera el ADN del Core (manifiesto) del Drive del usuario.
 * AXIOMA: Google Drive es el registro de identidades de Indra.
 * =============================================================================
 */

const HOME_ROOT_FOLDER_NAME = '.core_system';
const MANIFEST_FILENAME = 'INDRA_MANIFEST.json';

export const DriveDiscoveryService = {
  /**
   * Busca la carpeta de sistema y el manifiesto.
   * @param {string} token - Access token de Google.
   */
  async findCoreManifest(token) {
    try {
        console.log('[DriveDiscovery] Iniciando excavación en zona visible (.core_system)...');
        
        // 1. Encontrar la Carpeta de Sistema en el espacio estándar de Drive
        const folderId = await this._findFolderId(token, HOME_ROOT_FOLDER_NAME);
        if (!folderId) {
            console.log('[DriveDiscovery] Territorio no encontrado. Estado: Instalación Limpia.');
            return { ok: false, reason: 'NO_CORE_FOUND' };
        }

        // 2. Buscar el manifiesto DENTRO de la carpeta visible
        const fileId = await this._findManifestFileId(token, folderId);
        if (!fileId) {
            console.log('[DriveDiscovery] Territorio virgen (sin manifiesto). Procediendo como Instalación Limpia.');
            return { ok: false, reason: 'NO_CORE_FOUND' };
        }

        // 3. Descargar el contenido del manifiesto
        const manifest = await this._downloadManifest(token, fileId);
        
        // 4. Verificación de Integridad
        const folderExists = await this._verifyFolderExists(token, manifest.system_root_id);
        if (!folderExists) {
            return { ok: false, reason: 'PREVIOUS_INSTALLATION_FILES_MISSING', manifest_id: fileId };
        }

        console.log('[DriveDiscovery] Manifiesto recuperado e hidratado con éxito.');
        return { ok: true, manifest };

    } catch (err) {
        console.error('[DriveDiscovery] Fallo crítico en excavación:', err);
        return { ok: false, reason: 'DRIVE_API_ERROR', error: err.message };
    }
  },


  async _verifyFolderExists(token, folderId) {
    if (!folderId) return false;
    try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,trashed`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return false;
        const data = await res.json();
        return !data.trashed;
    } catch (e) {
        return false;
    }
  },

  async _findFolderId(token, name) {
    const q = encodeURIComponent(`name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    // Cambio crucial: Buscamos en el espacio ESTÁNDAR (visible)
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.files?.[0]?.id || null;
  },

  async _findManifestFileId(token, folderId) {
    const q = encodeURIComponent(`'${folderId}' in parents and name = '${MANIFEST_FILENAME}' and trashed = false`);
    // Buscamos en el espacio ESTÁNDAR dentro de la carpeta visible
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.files?.[0]?.id || null;
  },

  async _downloadManifest(token, fileId) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al descargar el manifiesto.');
    return await res.json();
  }
};
