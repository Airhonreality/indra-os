/**
 * =============================================================================
 * ARTEFACTO: 3_services/resource_broker.gs
 * RESPONSABILIDAD: Implementación del Agnostic Resource Protocol (ARP).
 * Mantiene la 'Crystallization' física de recursos en el Vault Local (Drive),
 * garantizando deduplicación mediante Hashing (CAS).
 * =============================================================================
 */

const RESOURCE_VAULT_FOLDER_NAME_ = 'system_resources';

/**
 * Obtiene o crea la bóveda local de recursos y la hace pública para lectura 
 * (necesario para que las imágenes se puedan renderizar en UIs agnósticas).
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function _resource_getVault() {
  const homeRoot = _system_ensureHomeRoot(); // De provider_system_infrastructure.gs
  const subFolders = homeRoot.getFoldersByName(RESOURCE_VAULT_FOLDER_NAME_);
  let folder;
  if (subFolders.hasNext()) {
    folder = subFolders.next();
  } else {
    folder = homeRoot.createFolder(RESOURCE_VAULT_FOLDER_NAME_);
    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      logWarn('[resource_broker] No se pudo hacer pública la carpeta de recursos. Requiere permisos avanzados.', e);
    }
  }
  return folder;
}

/**
 * Ingiere un archivo al Vault Local, nombrandolo con su Hash (CAS) para deduplicar.
 * @param {string} base64Data - El contenido b64 del archivo.
 * @param {string} mimeType - El mimeType (e.g. image/png).
 * @param {string} originalName - El nombre original (ej: logo.png).
 * @returns {string} El GRID resoluble (ej: indra://system/hash12345).
 */
function resource_broker_ingest(base64Data, mimeType, originalName) {
  const folder = _resource_getVault();
  
  // Limpiamos el prefijo de base64 si viene del frontend (data:image/png;base64,...)
  const b64Str = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
  const decodedBlob = Utilities.newBlob(Utilities.base64Decode(b64Str), mimeType, originalName);
  
  // 1. Calcular Hash (SHA-256)
  const hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, decodedBlob.getBytes());
  // Convertir bytes a string Hexadecimal
  const hashStr = hashBytes.map(function(b) {
      return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
  
  const ext = originalName && originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  const canonicalName = `${hashStr}.${ext}`;
  
  // 2. Comprobar si ya existe (Deduplicación)
  const existingFiles = folder.getFilesByName(canonicalName);
  if (existingFiles.hasNext()) {
    logInfo(`[resource_broker] Recurso ya cristalizado (CAS Deduplication): ${canonicalName}`);
    return `indra://system/${hashStr}`;
  }
  
  // 3. Cristalizar (Subir a Drive)
  decodedBlob.setName(canonicalName);
  folder.createFile(decodedBlob);
  logInfo(`[resource_broker] Nuevo recurso cristalizado: ${canonicalName}`);
  
  return `indra://system/${hashStr}`;
}

/**
 * Resuelve un GRID y devuelve un Link Físico (Público de lectura).
 * @param {string} grid - Global Resource ID (ej: indra://system/hash12345).
 * @returns {string} La URL física (Drive uc?id=...).
 */
function resource_broker_resolve(grid) {
  if (!grid || !grid.startsWith('indra://')) {
    // Si no es un GRID, asumimos que es una URL legado y la devolvemos tal cual.
    return grid;
  }
  
  const parts = grid.replace('indra://', '').split('/');
  const provider = parts[0];
  const hash = parts[1];
  
  if (provider !== 'system') {
    throw createError('NOT_SUPPORTED', `Provider '${provider}' no soportado para resolución de recursos en beta.`);
  }
  
  const folder = _resource_getVault();
  
  // Búsqueda aproximada por Hash (ya que el nombre tiene extensión original)
  const files = folder.searchFiles(`title contains '${hash}'`);
  if (!files.hasNext()) {
    logWarn(`[resource_broker] Recurso huérfano (No encontrado en Vault): ${hash}`);
    throw createError('NOT_FOUND', 'Recurso no encontrado en el Local Vault.');
  }
  
  const file = files.next();
  // Transformamos el URL interno a un "Direct Image Render Url"
  return `https://drive.google.com/uc?id=${file.getId()}`;
}
