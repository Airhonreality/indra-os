/**
 * =============================================================================
 * INDRA PROTOCOL ROUTER (The Sovereign Gateway v10.0)
 * =============================================================================
 * AXIOMA: Es la única membrana que separa al núcleo de Indra de la materia física.
 * Ningún comando toca un provider sin pasar por esta aduana de contratos.
 * v10.0: Ahora valida la Intención Cognitiva además de la estructura.
 * =============================================================================
 */

/**
 * Valida la integridad del UQO antes de procesarlo.
 * @private
 */
function _validateInputContract_(uqo) {
  if (!uqo || typeof uqo !== 'object') {
    throw createError('INVALID_INPUT', 'El UQO debe ser un objeto válido.');
  }
  if (!uqo.trace_id) {
    uqo.trace_id = 'T_' + Math.random().toString(36).substring(2, 11);
    // logWarn(`[router] UQO entrante sin trace_id. Generando traza de emergencia: ${uqo.trace_id}`);
  }
}

/**
 * Valida el retorno de los handlers (The Return Law).
 * @private
 */
function _validateReturnLaw_(result, providerId, protocol) {
  if (!result || !result.items || !result.metadata) {
    throw createError(
      'CONTRACT_VIOLATION',
      `El provider "${providerId}" violó la Ley de Retorno (The Return Law) en protocolo "${protocol}".`
    );
  }
}

/**
 * Valida que los ítems devueltos cumplan con el contrato de átomo v10.0.
 * @private
 */
function _validateAtomContract_(items, providerId) {
  if (!Array.isArray(items)) return;
  items.forEach(item => {
    if (!item || !item.id || !item.class) {
       logWarn(`[router] Item de ${providerId} tiene contrato de átomo débil. Falta ID o CLASS.`);
       return;
    }

    // AXIOMA v10.0: Los Puentes deben ser Semánticos
    if (item.class === 'BRIDGE') {
      const p = item.payload || {};
      if (!p.ui_purpose || !p.cognitive_class) {
        logWarn(`[router] BRIDGE detected with weak semantics: ${item.id}. Recomendado: ui_purpose y cognitive_class.`);
      }
    }
  });
}

/**
 * Punto de entrada único para el despacho de protocolos.
 */
function route(uqo) {
  _validateInputContract_(uqo);

  const protocol = (uqo.protocol || '').toUpperCase();
  const providerId = uqo.provider;

  logInfo(`[protocol_router] Despachando: ${providerId} → ${protocol}`);

  // Resolver Configuración via Registry (Agnosticismo Radical)
  const providerConf = getProviderConf(providerId);
  if (!providerConf) {
    throw createError('PROVIDER_NOT_FOUND', `El provider "${providerId}" no está registrado.`);
  }

  // Verificar Implementación guiada por el manifiesto del provider
  const handlerFnName = providerConf.implements[protocol];
  if (!handlerFnName) {
    throw createError('PROTOCOL_NOT_FOUND', `El provider "${providerId}" no implementa "${protocol}".`);
  }

  // Verificar Capacidades (Valla de Seguridad v6.0)
  if (!providerConf.capabilities[protocol]) {
    throw createError('PROTOCOL_NOT_SUPPORTED', `Capacidad "${protocol}" no declarada para "${providerId}".`);
  }

  const handlerFn = globalThis[handlerFnName];
  if (typeof handlerFn !== 'function') {
    throw createError('SYSTEM_FAILURE', `Handler "${handlerFnName}" no existe.`);
  }

  let result;
  const startTime = Date.now();
  try {
    result = handlerFn(uqo);
    ledger_health_report(providerId, Date.now() - startTime);
  } catch (err) {
    logError(`[protocol_router] Fallo crítico en "${providerId}" ejecutando "${protocol}": ${err.message}`);
    ledger_health_report(providerId, Date.now() - startTime, err.message);
    
    return {
      items: [{
        id: `err_${Date.now()}`,
        class: 'ERROR_REPORT',
        payload: { 
          message: err.message, 
          provider: providerId, 
          protocol: protocol,
          code: err.code || 'HANDLER_EXECUTION_FAILED'
        }
      }],
      metadata: {
        status: 'ERROR',
        error: err.message,
        code: err.code || 'HANDLER_EXECUTION_FAILED',
        trace: _sanitizeTrace_(uqo)
      }
    };
  }

  _validateReturnLaw_(result, providerId, protocol);
  _validateAtomContract_(result.items, providerId);

  // Inyectar traza si falta
  result.metadata = result.metadata || {};
  if (!result.metadata.trace) {
    result.metadata.trace = _sanitizeTrace_(uqo);
  }
  if (!result.metadata.status) result.metadata.status = 'OK';

  return result;
}

function _sanitizeTrace_(uqo) {
  return {
    trace_id: uqo ? (uqo.trace_id || uqo.trace?.trace_id) : 'T_' + Date.now(),
    hop_count: (uqo?.hop_count || 0) + 1,
    source: uqo?.source || 'CORE_ROUTER'
  };
}
