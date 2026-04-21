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

// ─── GESTIÓN DE SESIONES DE TRANSFERENCIA (INDUSTRIAL) ─────────────────────────

/**
 * Crea un Ticket de Ingesta Persistente.
 * Se guarda como un Átomo de clase SYSTEM_TICKET para auditoría y resiliencia.
 */
function _peristaltic_createPersistentTicket(uqo) {
    const data = uqo.data || {};
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const ticketAtom = {
        id: ticketId,
        class: 'SYSTEM_TICKET',
        handle: {
            ns: 'com.indra.system.peristalsis',
            alias: ticketId,
            label: `Ingesta: ${data.source_provider || 'unknown'} -> ${data.target_provider || 'unknown'}`
        },
        payload: {
            status: 'INITIALIZING',
            progress: 0,
            cursor: 0,
            total_expected: data.total_expected || 0,
            chunk_size: data.chunk_size || 100,
            source: data.source || {},
            target: data.target || {},
            history: [{ timestamp: new Date().toISOString(), event: 'LOG_GENESIS' }]
        }
    };

    // Persistimos físicamente en el Ledger de Sistema
    const createRes = route({
        provider: 'system',
        protocol: 'ATOM_CREATE',
        data: ticketAtom
    });

    return createRes.items?.[0] || ticketAtom;
}

/**
 * INDUCTION_PULSE: Ejecuta un micro-salto de ingesta.
 * Es el corazón rítmico del sistema industrial.
 */
function _peristaltic_handlePulse(uqo) {
    const ticketId = uqo.data?.ticket_id;
    if (!ticketId) throw createError('INVALID_INPUT', 'Se requiere ticket_id para el pulso.');

    // 1. HIDRATACIÓN DEL ESTADO
    const readRes = route({ provider: 'system', protocol: 'ATOM_READ', context_id: ticketId });
    const ticket = readRes.items?.[0];
    if (!ticket) throw createError('NOT_FOUND', 'Ticket de ingesta no encontrado o expirado.');

    if (ticket.payload.status === 'COMPLETED') return { items: [ticket], metadata: { status: 'OK', msg: 'Ya completado.' } };

    const { cursor, chunk_size, source, target } = ticket.payload;

    try {
        // 2. EXTRACCIÓN (Source)
        const sourceRes = route({
            provider: source.provider,
            protocol: 'TABULAR_STREAM',
            context_id: source.id,
            query: { 
                cursor: ticket.payload.next_source_cursor || null,
                limit: chunk_size 
            }
        });

        const items = sourceRes.items || [];
        if (items.length === 0) {
            ticket.payload.status = 'COMPLETED';
            ticket.payload.progress = 1;
        } else {
            // 3. CRISTALIZACIÓN (Target)
            const syncRes = route({
                provider: 'automation',
                protocol: 'INDUSTRIAL_SYNC',
                data: {
                    target_provider: target.provider,
                    silo_id: target.id,
                    sat_payload: { items },
                    source_provider: source.provider,
                    source_id: source.id
                }
            });

            // 4. ACTUALIZACIÓN DE CURSOR
            ticket.payload.cursor += items.length;
            ticket.payload.next_source_cursor = sourceRes.metadata?.next_cursor;
            ticket.payload.status = sourceRes.metadata?.has_more ? 'IN_PROGRESS' : 'COMPLETED';
            
            if (ticket.payload.total_expected > 0) {
                ticket.payload.progress = Math.min(0.99, ticket.payload.cursor / ticket.payload.total_expected);
            }
        }

        if (ticket.payload.status === 'COMPLETED') ticket.payload.progress = 1;

        // 5. PERSISTENCIA DEL AVANCE
        route({
            provider: 'system',
            protocol: 'ATOM_PATCH',
            context_id: ticketId,
            data: { payload: ticket.payload }
        });

        return { 
            items: [ticket], 
            metadata: { 
                status: 'OK', 
                progress: ticket.payload.progress,
                pulse_count: items.length 
            } 
        };

    } catch (e) {
        ticket.payload.status = 'ERROR';
        ticket.payload.last_error = e.message;
        route({ provider: 'system', protocol: 'ATOM_PATCH', context_id: ticketId, data: { payload: ticket.payload } });
        throw e;
    }
}
