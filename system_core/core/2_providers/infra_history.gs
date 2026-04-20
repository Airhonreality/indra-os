/**
 * INDRA INFRASTRUCTURE SILO: infra_history.gs
 * Responsabilidad: Gestión de versiones y retroceso temporal.
 */

/**
 * REVISIONS_LIST: Recupera la lista de versiones físicas de un átomo en Drive.
 */
function _system_handleRevisionsList(uqo) {
  const atomId = uqo.context_id;
  if (!atomId) throw createError('INVALID_INPUT', 'REVISIONS_LIST requiere context_id.');

  const traceId = _system_buildTraceId_('REVISIONS_LIST', atomId);
  try {
    const revisions = Drive.Revisions.list(atomId);
    const items = (revisions.revisions || []).map(rev => ({
      id: rev.id,
      class: 'REVISION',
      handle: { label: `Versión del ${rev.modifiedDate}` },
      payload: {
        modified_at: rev.modifiedDate,
        size: rev.fileSize,
        last_modifying_user: rev.lastModifyingUserName
      }
    }));

    return { items, metadata: { status: 'OK', total: items.length, trace_id: traceId } };
  } catch (err) {
    throw createError('DRIVE_ERROR', `No se pudo obtener las revisiones: ${err.message}`, { trace_id: traceId });
  }
}

/**
 * ATOM_ROLLBACK: Restaura un átomo a una versión física anterior.
 */
function _system_handleRollback(uqo) {
  const atomId = uqo.context_id;
  const revisionId = uqo.data?.revision_id;
  if (!atomId || !revisionId) throw createError('INVALID_INPUT', 'ATOM_ROLLBACK requiere context_id y data.revision_id.');

  const traceId = _system_buildTraceId_('ATOM_ROLLBACK', atomId);
  try {
    // AXIOMA: Para restaurar bajamos el contenido de la revisión y sobreescribimos el 'head'.
    const revision = Drive.Revisions.get(atomId, revisionId);
    const downloadUrl = revision.downloadUrl;
    const response = UrlFetchApp.fetch(downloadUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
    });
    
    const content = response.getContentText();
    const file = _system_findAtomFile(atomId);
    file.setContent(content);

    logInfo(`[history] ROLLBACK EXITOSO: ${atomId} restaurado a revisión ${revisionId}`);

    return { 
      items: [_system_toAtom(JSON.parse(content), atomId, uqo.provider)], 
      metadata: { status: 'OK', trace_id: traceId, revision_restored: revisionId } 
    };
  } catch (err) {
    throw createError('ROLLBACK_FAILED', `Fallo al restaurar revisión ${revisionId}: ${err.message}`, { trace_id: traceId });
  }
}
