/**
 * =============================================================================
 * ARTEFACTO: 4_support/share_manager.gs
 * RESPONSABILIDAD: Gestión soberana de tickets de acceso público (ADR-019).
 * AXIOMA: Un ticket es una delegación temporal de capacidad sobre un átomo.
 * =============================================================================
 */

const SHARES_FOLDER_NAME_ = 'shares';

/**
 * Crea un ticket de compartición para un artefacto específico.
 * @param {Object} uqo - { data: { artifact_id, artifact_class, auth_mode, acl } }
 */
function _share_createTicket(uqo) {
  const data = uqo.data || {};
  if (!data.artifact_id || !data.artifact_class) {
    throw createError('INVALID_INPUT', 'Se requiere artifact_id y artifact_class para compartir.');
  }

  const ticketId = 'man_' + Utilities.getUuid().split('-')[0] + Date.now().toString(36);
  const ticketDoc = {
    version: '1.2',
    id: ticketId,
    core_id: readCoreOwnerEmail(),
    artifact_id: data.artifact_id,
    artifact_class: data.artifact_class,
    auth_mode: data.auth_mode || 'public',
    acl: data.acl || [],
    created_at: new Date().toISOString()
  };

  try {
    const folder = _system_getOrCreateSubfolder_(SHARES_FOLDER_NAME_);
    const fileName = `ticket_${ticketId}.json`;
    folder.createFile(fileName, JSON.stringify(ticketDoc, null, 2));

    logInfo(`[share_manager] Ticket creado: ${ticketId} para ${data.artifact_id}`);
    
    return { 
      items: [{ 
        ticket_id: ticketId, 
        core_url: ScriptApp.getService().getUrl() 
      }], 
      metadata: { status: 'OK' } 
    };
  } catch (err) {
    logError('[share_manager] Error al crear ticket.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * Recupera y valida un ticket de compartición.
 * @param {string} ticketId - ID del ticket (man_...).
 */
function _share_getTicket(ticketId) {
  if (!ticketId) throw createError('INVALID_INPUT', 'Ticket ID requerido.');

  try {
    const folder = _system_getOrCreateSubfolder_(SHARES_FOLDER_NAME_);
    const files = folder.getFilesByName(`ticket_${ticketId}.json`);
    
    if (!files.hasNext()) {
      throw createError('NOT_FOUND', 'El enlace de compartición no existe o ha expirado.');
    }

    const file = files.next();
    const ticket = JSON.parse(file.getBlob().getDataAsString());

    // VERIFICACIÓN DE ORFANDAD: ¿Sigue existiendo el artefacto original?
    try {
      DriveApp.getFileById(ticket.artifact_id);
    } catch (e) {
      logWarn(`[share_manager] Ticket huérfano detectado: ${ticketId}. El recurso ${ticket.artifact_id} ya no existe.`);
      throw createError('NOT_FOUND', 'El recurso original ha sido eliminado por el propietario.');
    }

    return { items: [ticket], metadata: { status: 'OK' } };
  } catch (err) {
    const isKnown = !!err.code;
    return { 
      items: [], 
      metadata: { 
        status: 'ERROR', 
        error: isKnown ? err.message : 'Error interno al resolver ticket.',
        code: isKnown ? err.code : 'SYSTEM_FAILURE'
      } 
    };
  }
}

/**
 * Valida si un ticket permite acceder a un recurso específico.
 * Utilizado por la Aduana (api_gateway.js).
 * @param {string} ticketId 
 * @param {string} artifactId 
 * @returns {Object|null} El ticket si es válido.
 */
function _share_validateTicket(ticketId, artifactId) {
  if (!ticketId) return null;
  try {
    const result = _share_getTicket(ticketId);
    if (result.metadata.status === 'ERROR') return null;
    const ticket = result.items[0];
    
    // Si se especifica un artifactId (context_id), debe coincidir.
    if (artifactId && ticket.artifact_id !== artifactId) return null;
    
    return ticket;
  } catch (e) {
    return null;
  }
}
