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
        console.log('[DriveDiscovery] Iniciando excavación de territorio...');
        
        // 1. Encontrar la carpeta de sistema
        const folderId = await this._findFolderId(token, HOME_ROOT_FOLDER_NAME);
        if (!folderId) {
            console.log('[DriveDiscovery] Territorio no encontrado.');
            return { ok: false, reason: 'NO_CORE_FOUND' };
        }

        // 2. Encontrar el archivo de manifiesto
        const fileId = await this._findManifestFileId(token, folderId);
        if (!fileId) {
            console.warn('[DriveDiscovery] Carpeta encontrada, pero falta el ADN (INDRA_MANIFEST.json).');
            return { ok: false, reason: 'MANIFEST_MISSING' };
        }

        // 3. Descargar el contenido del manifiesto
        const manifest = await this._downloadManifest(token, fileId);
        console.log('[DriveDiscovery] Manifiesto recuperado e hidratado.');
        
        return { ok: true, manifest };

    } catch (err) {
        console.error('[DriveDiscovery] Fallo crítico en excavación:', err);
        return { ok: false, reason: 'DRIVE_API_ERROR', error: err.message };
    }
  },

  async _findFolderId(token, name) {
    const q = encodeURIComponent(`name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.files?.[0]?.id || null;
  },

  async _findManifestFileId(token, folderId) {
    const q = encodeURIComponent(`'${folderId}' in parents and name = '${MANIFEST_FILENAME}' and trashed = false`);
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
