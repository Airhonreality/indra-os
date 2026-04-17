/**
 * =============================================================================
 * ARTEFACTO: 1_logic/induction_orchestrator.gs
 * RESPONSABILIDAD: Orquestación de inducción industrial con ticket de estado.
 * AXIOMA: Frontera estricta + Return Law + anti-colisión de aliases.
 * =============================================================================
 */

const INDUCTION_TICKET_TTL_SECONDS_ = 60 * 60 * 6;

function _system_induction_cache_() {
  return CacheService.getScriptCache();
}

function _system_induction_ticketKey_(ticketId) {
  return `indra_induction_ticket_${ticketId}`;
}

function _system_induction_generateTicketId_() {
  const nonce = Math.random().toString(36).slice(2, 10);
  return `ind_${Date.now()}_${nonce}`;
}

function _system_induction_readTicket_(ticketId) {
  if (!ticketId) return null;
  const raw = _system_induction_cache_().get(_system_induction_ticketKey_(ticketId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function _system_induction_writeTicket_(ticket) {
  if (!ticket || !ticket.ticket_id) return;
  ticket.updated_at = new Date().toISOString();
  _system_induction_cache_().put(
    _system_induction_ticketKey_(ticket.ticket_id),
    JSON.stringify(ticket),
    INDUCTION_TICKET_TTL_SECONDS_
  );
}

function _system_induction_validateInput_(sourceArtifact, streamResult) {
  if (!sourceArtifact || typeof sourceArtifact !== 'object') {
    throw createError('INPUT_CONTRACT_VIOLATION', 'INDUCTION requiere data.source_artifact.');
  }

  if (!sourceArtifact.id || !sourceArtifact.provider || !sourceArtifact.class) {
    throw createError('INPUT_CONTRACT_VIOLATION', 'source_artifact requiere id/provider/class.');
  }

  if (!streamResult || !streamResult.metadata || streamResult.metadata.status !== 'OK') {
    throw createError('CONTRACT_VIOLATION', 'TABULAR_STREAM inválido para inducción.');
  }

  const fields = streamResult.metadata?.schema?.fields;
  if (!Array.isArray(fields) || fields.length === 0) {
    throw createError('CONTRACT_VIOLATION', 'TABULAR_STREAM requiere metadata.schema.fields no vacío.');
  }
}

function _system_induction_namespaceAlias_(sourceArtifact, field) {
  const fieldLabel = field.handle?.label || field.label || field.id || 'field';
  const fieldAlias = _system_slugify_(fieldLabel);
  const sourceId = (sourceArtifact.id || 'src').replace(/[\-\s]/g, '_').toLowerCase();

  if (sourceArtifact.provider && sourceArtifact.provider.split(':')[0] === 'notion') {
    return `${sourceId}_${fieldAlias}`;
  }

  const providerScope = _system_slugify_(sourceArtifact.provider || 'provider');
  return `${providerScope}_${sourceId}_${fieldAlias}`;
}

function _system_induction_mapType_(canonicalType) {
  const t = String(canonicalType || '').toUpperCase();
  if (['NUMBER', 'INTEGER', 'FLOAT', 'DECIMAL'].includes(t)) return 'NUMBER';
  if (['BOOLEAN', 'BOOL', 'CHECKBOX'].includes(t)) return 'BOOLEAN';
  if (['DATE', 'DATETIME', 'TIME'].includes(t)) return 'DATE';
  if (['RELATION', 'REFERENCE'].includes(t)) return 'RELATION';
  if (['EMAIL'].includes(t)) return 'EMAIL';
  if (['URL'].includes(t)) return 'URL';
  if (['SELECT', 'MULTI_SELECT'].includes(t)) return t;
  if (['COMPUTED', 'FORMULA', 'ROLLUP'].includes(t)) return 'COMPUTED';
  return 'STRING';
}

function _system_induction_collectStream_(uqo, sourceArtifact) {
  const providedStream = uqo.data?.tabular_stream;
  if (providedStream && providedStream.metadata?.schema?.fields) return providedStream;

  return route({
    provider: sourceArtifact.provider,
    protocol: 'TABULAR_STREAM',
    context_id: sourceArtifact.id,
    query: { limit: 5 }
  });
}

function _system_induction_buildSchemaFields_(sourceArtifact, streamResult, mutedFields) {
  const streamFields = streamResult.metadata.schema.fields || [];
  const mutedSet = {};
  (mutedFields || []).forEach(function (id) { mutedSet[id] = true; });

  return streamFields
    .filter(function (field) { return !mutedSet[field.id]; })
    .map(function (field) {
      const namespacedAlias = _system_induction_namespaceAlias_(sourceArtifact, field);
      return {
        id: namespacedAlias,
        handle: {
          ns: 'com.indra.system.schema.field',
          alias: namespacedAlias,
          label: field.handle?.label || field.label || field.id
        },
        type: _system_induction_mapType_(field.type),
        source_id: field.id,
        source_alias: field.handle?.alias || _system_slugify_(field.handle?.label || field.label || field.id),
        source_provider: sourceArtifact.provider,
        source_context_id: sourceArtifact.id,
        formula_expression: field.formula_expression || null,
        options: field.options || []
      };
    });
}

function _system_induction_buildFingerprint_(fields) {
  const ids = (fields || []).map(function (f) { return f.id; }).sort();
  return Utilities.base64EncodeWebSafe(JSON.stringify(ids));
}

function _system_induction_start(uqo) {
  const data = uqo.data || {};
  const sourceArtifact = data.source_artifact;
  const mutedFields = Array.isArray(data.muted_fields) ? data.muted_fields : [];
  const workspaceId = uqo.workspace_id || data.workspace_id || null;
  const publishImmediately = !!data.publish_immediately;

  const ticket = {
    ticket_id: _system_induction_generateTicketId_(),
    status: 'IN_PROGRESS',
    step: 'VALIDATING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    workspace_id: workspaceId,
    source_artifact: sourceArtifact,
    errors: [],
    warnings: []
  };
  _system_induction_writeTicket_(ticket);

  try {
    const streamResult = _system_induction_collectStream_(uqo, sourceArtifact);
    _system_induction_validateInput_(sourceArtifact, streamResult);

    ticket.step = 'INDUCING_SCHEMA';
    _system_induction_writeTicket_(ticket);

    const schemaFields = _system_induction_buildSchemaFields_(sourceArtifact, streamResult, mutedFields);
    if (schemaFields.length === 0) {
      throw createError('CONTRACT_VIOLATION', 'No hay campos activos para inducir DATA_SCHEMA.');
    }

    const sourceFieldIds = (streamResult.metadata.schema.fields || []).map(function (f) { return f.id; });
    const schemaLabel = `Schema ${sourceArtifact.handle?.label || sourceArtifact.id}`;
    const schemaCreate = route({
      provider: 'system',
      protocol: 'ATOM_CREATE',
      data: {
        class: 'DATA_SCHEMA',
        handle: { label: schemaLabel },
        payload: {
          fields: schemaFields,
          resonance_source: {
            provider: sourceArtifact.provider,
            context_id: sourceArtifact.id,
            source_label: sourceArtifact.handle?.label || sourceArtifact.id,
            source_field_ids: sourceFieldIds,
            source_fingerprint: _system_induction_buildFingerprint_(streamResult.metadata.schema.fields || []),
            induced_at: new Date().toISOString()
          }
        }
      }
    });
    const schemaAtom = schemaCreate.items?.[0];
    if (!schemaAtom || !schemaAtom.id) {
      throw createError('SYSTEM_FAILURE', 'No se pudo crear DATA_SCHEMA inducido.');
    }

    ticket.step = 'GENERATING_BRIDGE';
    _system_induction_writeTicket_(ticket);

    const bridgeLabel = `Bridge ${sourceArtifact.handle?.label || sourceArtifact.id}`;
    const defaultMapping = {};
    schemaFields.forEach(function (field) {
      defaultMapping[field.id] = `source.${field.handle.alias}`;
    });

    const bridgeCreate = route({
      provider: 'system',
      protocol: 'ATOM_CREATE',
      data: {
        class: 'BRIDGE',
        handle: { label: bridgeLabel },
        payload: {
          operators: [],
          sources: [sourceArtifact.id],
          sourceConfigs: {
            [sourceArtifact.id]: {
              alias: `${(sourceArtifact.id || 'src').replace(/[\-\s]/g, '_').toLowerCase()}_${_system_slugify_(sourceArtifact.handle?.label || 'source')}`,
              activeFields: schemaFields.map(function (f) { return f.id; })
            }
          },
          targets: [schemaAtom.id],
          mappings: {
            [schemaAtom.id]: defaultMapping
          }
        }
      }
    });
    const bridgeAtom = bridgeCreate.items?.[0];
    if (!bridgeAtom || !bridgeAtom.id) {
      throw createError('SYSTEM_FAILURE', 'No se pudo crear BRIDGE inducido.');
    }

    route({
      provider: 'system',
      protocol: 'ATOM_UPDATE',
      context_id: schemaAtom.id,
      data: {
        payload: {
          ...(schemaAtom.payload || {}),
          bridge_id: bridgeAtom.id,
          induction_ticket_id: ticket.ticket_id,
          publish_immediately: publishImmediately
        }
      }
    });

    if (workspaceId) {
      route({ provider: 'system', protocol: 'SYSTEM_PIN', workspace_id: workspaceId, data: { atom: schemaAtom } });
      route({ provider: 'system', protocol: 'SYSTEM_PIN', workspace_id: workspaceId, data: { atom: bridgeAtom } });
    }

    ticket.step = 'COMPLETED';
    ticket.status = 'COMPLETED';
    ticket.result = {
      schema_id: schemaAtom.id,
      bridge_id: bridgeAtom.id,
      field_count: schemaFields.length,
      mapping_count: Object.keys(defaultMapping).length,
      publish_immediately: publishImmediately
    };
    _system_induction_writeTicket_(ticket);

    return {
      items: [],
      metadata: {
        status: 'OK',
        step: 'COMPLETED',
        ticket_id: ticket.ticket_id,
        ticket: ticket,
        schema_atom: schemaAtom,
        bridge_atom: bridgeAtom
      }
    };
  } catch (err) {
    ticket.status = 'ERROR';
    ticket.step = 'FAILED';
    ticket.errors = [...(ticket.errors || []), err.message || 'UNKNOWN_INDUCTION_ERROR'];
    _system_induction_writeTicket_(ticket);

    return {
      items: [],
      metadata: {
        status: 'ERROR',
        step: ticket.step,
        ticket_id: ticket.ticket_id,
        ticket: ticket,
        error: err.message,
        code: err.code || 'INDUCTION_FAILED'
      }
    };
  }
}

function _system_induction_status(uqo) {
  const ticketId = uqo.query?.ticket_id || uqo.data?.ticket_id || uqo.context_id;
  if (!ticketId) {
    return { items: [], metadata: { status: 'ERROR', code: 'INVALID_INPUT', error: 'INDUCTION_STATUS requiere ticket_id.' } };
  }

  const ticket = _system_induction_readTicket_(ticketId);
  if (!ticket) {
    return { items: [], metadata: { status: 'ERROR', code: 'TICKET_NOT_FOUND', error: 'Ticket de inducción no encontrado o expirado.', ticket_id: ticketId } };
  }

  return {
    items: [],
    metadata: {
      status: 'OK',
      ticket_id: ticketId,
      ticket: ticket,
      step: ticket.step,
      induction_status: ticket.status
    }
  };
}

function _system_induction_cancel(uqo) {
  const ticketId = uqo.query?.ticket_id || uqo.data?.ticket_id || uqo.context_id;
  if (!ticketId) {
    return { items: [], metadata: { status: 'ERROR', code: 'INVALID_INPUT', error: 'INDUCTION_CANCEL requiere ticket_id.' } };
  }

  const ticket = _system_induction_readTicket_(ticketId);
  if (!ticket) {
    return { items: [], metadata: { status: 'ERROR', code: 'TICKET_NOT_FOUND', error: 'Ticket de inducción no encontrado.' } };
  }

  ticket.status = 'CANCELLED';
  ticket.step = 'CANCELLED';
  ticket.cancelled_at = new Date().toISOString();
  _system_induction_writeTicket_(ticket);

  return {
    items: [],
    metadata: {
      status: 'OK',
      ticket_id: ticketId,
      step: 'CANCELLED',
      ticket: ticket
    }
  };
}

function _system_induction_driftCheck(uqo) {
  const schemaId = uqo.context_id || uqo.data?.schema_id;
  if (!schemaId) {
    return { items: [], metadata: { status: 'ERROR', code: 'INVALID_INPUT', error: 'INDUCTION_DRIFT_CHECK requiere schema_id/context_id.' } };
  }

  try {
    const schemaRead = route({ provider: 'system', protocol: 'ATOM_READ', context_id: schemaId });
    const schemaAtom = schemaRead.items?.[0];
    if (!schemaAtom) {
      throw createError('NOT_FOUND', `Schema no encontrado: ${schemaId}`);
    }

    const resonanceSource = schemaAtom.payload?.resonance_source;
    if (!resonanceSource || !resonanceSource.provider || !resonanceSource.context_id) {
      return {
        items: [],
        metadata: {
          status: 'OK',
          drift_detected: false,
          reason: 'NO_RESONANCE_SOURCE',
          schema_id: schemaId
        }
      };
    }

    const streamResult = route({
      provider: resonanceSource.provider,
      protocol: 'TABULAR_STREAM',
      context_id: resonanceSource.context_id,
      query: { limit: 1 }
    });

    const currentFields = streamResult.metadata?.schema?.fields || [];
    const currentIds = currentFields.map(function (f) { return f.id; });
    const baselineIds = Array.isArray(resonanceSource.source_field_ids) ? resonanceSource.source_field_ids : [];

    const baselineMap = {};
    baselineIds.forEach(function (id) { baselineMap[id] = true; });
    const currentMap = {};
    currentIds.forEach(function (id) { currentMap[id] = true; });

    const added = currentIds.filter(function (id) { return !baselineMap[id]; });
    const removed = baselineIds.filter(function (id) { return !currentMap[id]; });
    const driftDetected = added.length > 0 || removed.length > 0;

    return {
      items: [],
      metadata: {
        status: 'OK',
        schema_id: schemaId,
        drift_detected: driftDetected,
        added_fields: added,
        removed_fields: removed,
        baseline_count: baselineIds.length,
        current_count: currentIds.length,
        source: {
          provider: resonanceSource.provider,
          context_id: resonanceSource.context_id,
          label: resonanceSource.source_label || resonanceSource.context_id
        }
      }
    };
  } catch (err) {
    return {
      items: [],
      metadata: {
        status: 'ERROR',
        code: err.code || 'DRIFT_CHECK_FAILED',
        error: err.message
      }
    };
  }
}
