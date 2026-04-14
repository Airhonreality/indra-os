/**
 * =============================================================================
 * ARTEFACTO: 3_services/peristaltic_service.gs
 * RESPONSABILIDAD: Implementación del Protocolo de Ingesta Peristáltica (ADR-036).
 * Mantiene el estado de subidas fragmentadas y ensambla binarios en Drive.
 * =============================================================================
 */

const PERISTALTIC_TEMP_FOLDER_ = '_indra_ingest_temp';

/**
 * INIT: Registra el inicio de una subida masiva.
 * Crea la sesión en el CacheService.
 */
function peristaltic_service_init(payload) {
  const { uploader, contact, files_manifest, session_id } = payload.data;
  const sessionId = session_id || `sess_${Date.now()}`;
  
  // Guardamos metadata de la sesión (Válida por 24h)
  const sessionMeta = {
    uploader,
    contact,
    start_at: new Date().toISOString(),
    files: files_manifest.map(f => ({ ...f, status: 'PENDING' }))
  };
  
  CacheService.getScriptCache().put(`ingest_sess_${sessionId}`, JSON.stringify(sessionMeta), 21600); // 6h
  
  logInfo(`[peristaltic] Sesión iniciada: ${sessionId}`, { uploader });
  return { items: [{ id: sessionId }], metadata: { status: 'OK' } };
}

/**
 * CHUNK: Recibe un fragmento b64 y lo anexa a un archivo temporal.
 */
function peristaltic_service_chunk(payload) {
  const { session_id, file_name, chunk_index, total_chunks, data_b64, md5 } = payload.data;
  
  // AXIOMA: Para evitar los límites de CacheService (100KB), usamos archivos temporales en Drive.
  const tempFolder = _peristaltic_getTempFolder();
  const tempFileName = `chunk_${session_id}_${file_name}_${String(chunk_index).padStart(4, '0')}`;
  
  // Guardamos el chunk como un archivo atómico e independiente
  const chunkBytes = Utilities.base64Decode(data_b64);
  const chunkBlob = Utilities.newBlob(chunkBytes, payload.data.mime_type || 'application/octet-stream');
  tempFolder.createFile(chunkBlob).setName(tempFileName);
  
  logDebug(`[peristaltic] Fragmento ${chunk_index + 1}/${total_chunks} guardado físicamente: ${tempFileName}`);
  
  return { metadata: { status: 'OK', chunk_received: chunk_index } };
}

/**
 * FINALIZE: Mueve el archivo temporal a su ubicación final y limpia.
 */
function peristaltic_service_finalize(payload) {
  const { session_id, file_name, target_folder_id, mime_type } = payload.data;
  const tempFolder = _peristaltic_getTempFolder();
  
  // Búsqueda de todos los fragmentos de este archivo en la sesión
  const chunkPrefix = `chunk_${session_id}_${file_name}_`;
  const files = tempFolder.getFiles();
  const chunks = [];
  
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName().startsWith(chunkPrefix)) chunks.push(f);
  }
  
  if (chunks.length === 0) {
    throw createError('NOT_FOUND', `No se encontraron fragmentos para finalizar: ${file_name}`);
  }
  
  // AXIOMA DE ORDENACIÓN: Reensamblar en secuencia estricta
  chunks.sort((a, b) => a.getName().localeCompare(b.getName()));
  
  const combinedBytes = [];
  chunks.forEach(chunkFile => {
    combinedBytes.push(...chunkFile.getBlob().getBytes());
  });
  
  const targetFolder = target_folder_id === 'root' ? DriveApp.getRootFolder() : DriveApp.getFolderById(target_folder_id);
  const finalFile = targetFolder.createFile(Utilities.newBlob(combinedBytes, mime_type || 'application/octet-stream', file_name));
  
  // LIMPIEZA QUIRÚRGICA: Borrar fragmentos
  chunks.forEach(chunkFile => chunkFile.setTrashed(true));
  
  logInfo(`[peristaltic] Ensamblado completado: ${file_name} (${chunks.length} fragmentos)`);
  return { items: [{ id: finalFile.getId(), url: finalFile.getUrl() }], metadata: { status: 'OK' } };
}

/**
 * Obtiene o crea la carpeta de tránsito.
 */
function _peristaltic_getTempFolder() {
  const homeRoot = _system_ensureHomeRoot();
  const folders = homeRoot.getFoldersByName(PERISTALTIC_TEMP_FOLDER_);
  if (folders.hasNext()) return folders.next();
  return homeRoot.createFolder(PERISTALTIC_TEMP_FOLDER_);
}
