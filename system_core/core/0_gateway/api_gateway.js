// =============================================================================
// ARTEFACTO: 0_gateway/api_gateway.gs
// CAPA: 0 — Gateway Layer (Membrana externa)
// RESPONSABILIDAD: El único doPost del sistema. Soberanía de la entrada. Todo request
//         HTTP que llega al Core pasa por aquí. Valida identidad, gestiona el
//         Bootstrap Pattern y despacha al router. Nunca toca la lógica de negocio.
//
// AXIOMAS:
//   - Un solo punto de entrada HTTP: la función `doPost`.
//   - Bootstrap Pattern: si no hay password y llega uno → bootstrapear.
//   - Si hay password → verificar. Si falla → UNAUTHORIZED en <100ms.
//   - `metadata.logs` siempre incluye el flush de monitoring_service.
//   - SYSTEM_MANIFEST y SYSTEM_CONFIG_SCHEMA se despachan a provider_registry.
//     Todo lo demás va a protocol_router.
//
// RESTRICCIONES:
//   - NO puede leer el campo `protocol` para tomar decisiones de negocio.
//   - NO puede transformar ni inspeccionar el campo `query` del UQO.
//   - NO puede hacer llamadas de red externas.
//
// DEPENDENCIAS (scope global GAS):
//   - monitoring_service.gs → logInfo, logWarn, logError, flushLogs
//   - system_config.gs      → isBootstrapped, bootstrapPassword, verifyPassword
//   - provider_registry.gs  → buildManifest, buildConfigSchema
//   - protocol_router.gs    → route
//   - error_handler.gs      → createError
// =============================================================================



/**
 * Protocolos de sistema que el gateway maneja directamente (sin provider).
 * @const {string[]}
 */
const GATEWAY_SYSTEM_PROTOCOLS = Object.freeze([
  'SYSTEM_MANIFEST',
  'SYSTEM_CONFIG_SCHEMA',
  'SYSTEM_CONFIG_WRITE',
  'SYSTEM_CONFIG_DELETE',
  'SYSTEM_SHARE_CREATE',
  'SYSTEM_QUEUE_READ',
  'SYSTEM_TRIGGER_HUB_GENERATE',
  'PULSE_WAKEUP',
  'RESOURCE_INGEST',
  'RESOURCE_RESOLVE',
  'SYSTEM_RESONANCE_CRYSTALLIZE',
  'SYSTEM_WORKSPACE_DEEP_PURGE'
]);


// ─── PUNTO DE ENTRADA HTTP ────────────────────────────────────────────────────

/**
 * Manejador GET — requerido por GAS para que el deployment funcione correctamente.
 * Sin doGet(), algunos requests redirigen a la página de login de Google,
 * lo que interfiere con CORS y produce el error 'Failed to fetch'.
 *
 * En modo normal: retorna confirmación de vida (health check).
 * En modo debug:  ?mode=echo → retorna estado de bootstrap (sin auth).
 *
 * @param {GoogleAppsScript.Events.DoGet} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;
    const mode = e && e.parameter && e.parameter.mode;
    const id = e && e.parameter && e.parameter.id;

    // ADR-019: Resolución Micelar de Tickets de Compartición (SIN AUTH)
    if (action === 'getShareTicket' && id) {
      const ticketResult = _share_getTicket(id);
      return _buildResponse_(200, ticketResult);
    }

    // Modo diagnóstico: ?mode=echo — para verificar conectividad sin frontend.
    if (mode === 'echo') {
      return _buildResponse_(200, {
        items: [],
        metadata: {
          status: 'ALIVE',
          bootstrapped: isBootstrapped(),
          timestamp: new Date().toISOString(),
          version: 'universal-core-system/1.0',
          logs: [],
        },
      });
    }

    // Health check estándar: cualquier GET sin modo retorna estado mínimo.
    return _buildResponse_(200, {
      items: [],
      metadata: {
        status: isBootstrapped() ? 'OK' : 'BOOTSTRAP',
        message: 'Universal Core System activo. Usa POST para interactuar.',
        timestamp: new Date().toISOString(),
        logs: [],
      },
    });
  } catch (err) {
    const isConflict = err.code === 'SOVEREIGNTY_CONFLICT';
    return _buildResponse_(isConflict ? 409 : 500, {
      items: [],
      metadata: {
        status: 'ERROR',
        error_code: err.code || 'SYSTEM_FAILURE',
        error: err.message || 'Error crítico en el handshake inicial.',
        logs: [],
      },
    });
  }
}

/**
 * Punto de entrada HTTP principal — todas las operaciones del sistema.
 * Invocado automáticamente por GAS en cada petición POST.
 *
 * @param {GoogleAppsScript.Events.DoPost} e - Objeto de evento de GAS.
 * @returns {GoogleAppsScript.Content.TextOutput} Response JSON.
 */
function doPost(e) {
  try {
    // --- 0. INTERCEPCIÓN DE PULSOS (ADR-018 | Zero-Auth Sidechannel) ---
    const pulseResponse = pulse_router_intercept(e); // → pulse_router.gs
    if (pulseResponse) return pulseResponse;


    // --- 1. Parseo defensivo del body ---
    let payload;
    try {
      payload = _parseBody_(e);
    } catch (parseError) {
      return _buildResponse_(400, {
        items: [],
        metadata: {
          status: 'ERROR',
          error: 'Request body inválido. Se esperaba JSON.',
          logs: flushLogs(),
        },
      });
    }

    logInfo('[gateway] Request recibido.', { protocol: payload.protocol, provider: payload.provider });

    // --- 2. Bootstrap Pattern ---
    if (!isBootstrapped()) {
      return _handleBootstrap_(payload);
    }

    // --- 3. Verificación de Password (Muro de Soberanía) ---
    const isAuthenticated = verifyPassword(payload.password);
    let ticket = null;

    if (!isAuthenticated) {
      // ADR-019: ¿Es un acceso de invitado con ticket válido?
      if (payload.share_ticket && (payload.protocol === 'ATOM_READ' || payload.protocol === 'LOGIC_EXECUTE' || payload.protocol === 'SYSTEM_MANIFEST')) {
        const artifactId = payload.context_id || (payload.data && payload.data.artifact_id);
        ticket = _share_validateTicket(payload.share_ticket, artifactId);
        
        if (!ticket) {
          logWarn('[gateway] Intento de acceso público con ticket inválido o caducado.', { ticketId: payload.share_ticket });
          return _buildResponse_(401, { items: [], metadata: { status: 'UNAUTHORIZED', error: 'Ticket de acceso inválido.' } });
        }
        
        logInfo('[gateway] Acceso de GUEST concedido via ticket.', { ticketId: payload.share_ticket, artifactId });
      } else {
        logWarn('[gateway] Intento de acceso sin credencial válida.');
        return _buildResponse_(401, {
          items: [],
          metadata: {
            status: 'UNAUTHORIZED',
            error: 'Credencial de acceso inválida o ticket insuficiente.',
            logs: flushLogs(),
          },
        });
      }
    }

    // --- 4. Despacho por tipo de protocolo ---
    let result;
    try {
      if (GATEWAY_SYSTEM_PROTOCOLS.includes(payload.protocol)) {
        result = _handleSystemProtocol_(payload);
      } else {
        result = route(payload); // → protocol_router.gs
      }
    } catch (routingError) {
      logError('[gateway] Error durante el despacho.', routingError);
      const isKnownError = routingError && routingError.code;
      result = {
        items: [],
        metadata: {
          status: 'ERROR',
          error: isKnownError ? routingError.message : 'Error interno del servidor.',
          code: isKnownError ? routingError.code : 'SYSTEM_FAILURE',
        },
      };
    }

    // --- 5. Inyectar logs del ciclo ---
    result.metadata = result.metadata || {};
    result.metadata.logs = flushLogs();
    result.metadata.status = result.metadata.status || 'OK';

    // --- 6. Inyectar Header de Actualización (Indra v4.0 Deltas) ---
    // Si el provider no especifica update_type, por defecto es SNAPSHOT (carga completa)
    const updateType = result.metadata.update_type || 'SNAPSHOT';

    // --- 7. Validación Final de Contratos (AXIOMA DE SINCERIDAD V4.1) ---
    // En pre-lanzamiento, eliminamos la 'Hidratación de Piedad'.
    // El protocol_router ya valida los átomos. Si algo llega aquí sin handle, 
    // es un fallo estructural del provider.


    return _buildResponse_(200, result, {
      'X-Indra-Update-Type': updateType,
      'X-Indra-Trace': JSON.stringify(_sanitizeTrace_(payload))
    });

  } catch (fatalError) {
    // AXIOMA DE SUPERVIVENCIA: Si todo falla, JAMÁS devuelvas HTML.
    // Retornamos un JSON de error para que el front pueda diagnosticar en lugar de dar un CORS error genérico.
    console.error('FATAL_GATEWAY_ERROR:', fatalError);
    return _buildResponse_(500, {
      items: [],
      metadata: {
        status: 'ERROR',
        error: 'Falla catastrófica en el Gateway: ' + fatalError.message,
        code: 'FATAL_SERVER_ERROR',
        logs: []
      }
    });
  }
}

/**

  return null; // Todos los átomos son válidos v3.0.
}

// ─── HANDLERS INTERNOS ────────────────────────────────────────────────────────

/**
 * Maneja la primera petición al servidor no inicializado.
 * Si el payload incluye `password` → bootstrap.
 * Si no → retornar estado BOOTSTRAP para que el cliente muestre el formulario.
 *
 * @param {Object} payload - Payload parseado del request.
 * @returns {GoogleAppsScript.Content.TextOutput}
 * @private
 */
function _handleBootstrap_(payload) {
  if (payload.password && payload.protocol === 'SYSTEM_CONFIG_WRITE') {
    try {
      bootstrapPassword(payload.password); 
      logInfo('[gateway] Servidor bootstrapped exitosamente.');

      // Generar ticket para la sesión inmediata
      const ticket = generateSessionTicket();

      return _buildResponse_(200, {
        items: [],
        metadata: {
          status: 'OK',
          message: 'Pacto de Ignición completado. El Núcleo ha despertado.',
          intent_type: 'SUCCESS',
          session_ticket: ticket,
          logs: flushLogs()
        },
      });
    } catch (bootstrapError) {
      logError('[gateway] Error en bootstrap.', bootstrapError);
      return _buildResponse_(400, {
        items: [],
        metadata: { status: 'ERROR', error: bootstrapError.message, logs: flushLogs() },
      });
    }
  }

  // Sin password → el servidor indica que necesita ser inicializado
  logInfo('[gateway] Servidor en modo BOOTSTRAP. Esperando password inicial.');
  return _buildResponse_(200, {
    items: [],
    metadata: {
      status: 'BOOTSTRAP',
      message: 'Servidor no inicializado. Define tu contraseña de acceso.',
      logs: flushLogs(),
    },
  });
}

/**
 * Despacha protocolos de sistema que no pertenecen a ningún provider específico.
 *
 * @param {Object} payload - Payload validado del request.
 * @returns {{ items: Array, metadata: Object }}
 * @private
 */
function _handleSystemProtocol_(payload) {
  const protocol = payload.protocol;

  if (protocol === 'SYSTEM_MANIFEST') {
    logInfo('[gateway] Despachando SYSTEM_MANIFEST.');
    return buildManifest(); // → provider_registry.gs
  }

  if (protocol === 'SYSTEM_CONFIG_SCHEMA') {
    logInfo('[gateway] Despachando SYSTEM_CONFIG_SCHEMA.');
    return buildConfigSchema(); // → provider_registry.gs
  }

  if (protocol === 'SYSTEM_CONFIG_WRITE') {
    logInfo('[gateway] Despachando SYSTEM_CONFIG_WRITE.');
    return handleConfigWrite_(payload); // definido abajo
  }

  if (protocol === 'SYSTEM_CONFIG_DELETE') {
    logInfo('[gateway] Despachando SYSTEM_CONFIG_DELETE.');
    return handleConfigDelete_(payload); // definido abajo
  }

  if (protocol === 'SYSTEM_SHARE_CREATE') {
    logInfo('[gateway] Despachando SYSTEM_SHARE_CREATE.');
    return _share_createTicket(payload);
  }

  if (protocol === 'SYSTEM_QUEUE_READ') {
    logInfo('[gateway] Despachando SYSTEM_QUEUE_READ.');
    try {
      const items = pulse_ledger_getPending(); // → pulse_ledger.gs
      return { items, metadata: { status: 'OK', total: items.length } };
    } catch (queueError) {
      logWarn('[gateway] SYSTEM_QUEUE_READ fallo (ledger unavailable)', queueError);
      // Graceful fallback: retorne empty queue sin lanzar error
      return { items: [], metadata: { status: 'OK', queue_unavailable: true, message: 'Queue backend unavailable' } };
    }
  }
  
  if (protocol === 'PULSE_WAKEUP') {
    logInfo('[gateway] Despachando PULSE_WAKEUP.');
    pulse_service_process_next();
    return { items: [], metadata: { status: 'OK' } };
  }

  if (protocol === 'SYSTEM_TRIGGER_HUB_GENERATE') {
    logInfo('[gateway] Despachando SYSTEM_TRIGGER_HUB_GENERATE.');
    const workflowId = payload.data?.workflow_id;
    if (!workflowId) throw createError('INVALID_INPUT', 'Requiere workflow_id.');
    const webhookId = trigger_hub_getWebhookId(workflowId);
    const selfUrl = ScriptApp.getService().getUrl();
    return { 
      items: [{ id: webhookId, url: `${selfUrl}?webhook_id=${webhookId}` }], 
      metadata: { status: 'OK' } 
    };
  }

  if (protocol === 'RESOURCE_INGEST') {
    logInfo('[gateway] Despachando RESOURCE_INGEST.');
    const data = payload.data || {};
    if (!data.base64) throw createError('INVALID_INPUT', 'Requiere base64.');
    const grid = resource_broker_ingest(data.base64, data.mimeType, data.fileName);
    return {
      items: [],
      metadata: { status: 'OK', grid: grid }
    };
  }

  if (protocol === 'RESOURCE_RESOLVE') {
    logInfo('[gateway] Despachando RESOURCE_RESOLVE.');
    const grid = payload.context_id || payload.data?.grid;
    if (!grid) throw createError('INVALID_INPUT', 'Requiere grid en context_id.');
    const url = resource_broker_resolve(grid);
    return {
      items: [],
      metadata: { status: 'OK', url: url }
    };
  }

  if (protocol === 'SYSTEM_RESONANCE_CRYSTALLIZE') {
    logInfo('[gateway] Despachando SYSTEM_RESONANCE_CRYSTALLIZE.');
    return resonance_crystallize_atom(payload); // → resonance_service.gs
  }

  if (protocol === 'SYSTEM_WORKSPACE_DEEP_PURGE') {
    logInfo('[gateway] Despachando SYSTEM_WORKSPACE_DEEP_PURGE.');
    return resonance_deep_purge_workspace(payload); // → resonance_service.gs
  }

  // Protocolo de sistema no reconocido
  const err = createError(
    'PROTOCOL_NOT_FOUND',
    `Protocolo de sistema desconocido: "${protocol}".`
  );
  return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
}

/**
 * Persiste los valores enviados por el cliente en SYSTEM_CONFIG_WRITE.
 * Itera `payload.values` y guarda cada par clave/valor de forma AGNÓSTICA:
 * no conoce el nombre de ningún provider, solo delega a `system_config.gs`.
 *
 * @param {Object} payload - Payload con `values: { providerId, accountId, apiKey, label }`.
 * @returns {{ items: Array, metadata: Object }}
 * @private
 */
function handleConfigWrite_(payload) {
  const { provider_id: providerId, account_id: accountId, api_key: apiKey, label: manualLabel } = payload;

  if (!providerId || !apiKey) {
    const err = createError('INVALID_INPUT', 'SYSTEM_CONFIG_WRITE requiere provider_id y api_key.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  const accId = accountId || 'default';
  let finalLabel = manualLabel;

  // ── HANDSHAKE AXIOMÁTICO (Discovery Protocol v4.1) ──
  if (!finalLabel || finalLabel === accId) {
    try {
      logInfo(`[gateway] Iniciando Handshake de Identidad para ${providerId}...`);
      const discoveryResult = route({
        provider: providerId,
        protocol: 'ACCOUNT_RESOLVE',
        data: { api_key: apiKey },
        account_id: accId
      });

      if (discoveryResult.items && discoveryResult.items[0]) {
        finalLabel = discoveryResult.items[0].handle?.label || accId;
        logInfo(`[gateway] Identidad descubierta: ${finalLabel}`);
      }
    } catch (discoveryError) {
      logWarn(`[gateway] Fallo Handshake: ${discoveryError.message}. Usando ID técnico.`);
      finalLabel = finalLabel || accId;
    }
  }

  storeProviderAccount(providerId, accId, apiKey, finalLabel);

  logInfo(`[gateway] Cuenta guardada: ${providerId}:${accId} as "${finalLabel}"`);
  return {
    items: [],
    metadata: {
      status: 'OK',
      message: `Cuenta "${finalLabel}" linealizada exitosamente en ${providerId}.`,
      intent_type: 'SUCCESS'
    }
  };
}

/**
 * Elimina una cuenta de provider de PropertiesService.
 * @param {Object} payload - Payload con `provider_id` y `account_id`.
 * @returns {{ items: Array, metadata: Object }}
 * @private
 */
function handleConfigDelete_(payload) {
  const { provider_id: providerId, account_id: accountId } = payload;

  if (!providerId || !accountId) {
    const err = createError('INVALID_INPUT', 'SYSTEM_CONFIG_DELETE requiere provider_id y account_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  const keyKey = `ACCOUNT_${providerId}_${accountId}_KEY`;
  const metaKey = `ACCOUNT_${providerId}_${accountId}_META`;

  deleteConfig(keyKey);  // → system_config.gs
  deleteConfig(metaKey); // → system_config.gs

  logInfo(`[gateway] Cuenta eliminada: ${providerId}:${accountId}`);
  return {
    items: [],
    metadata: {
      status: 'OK',
      message: `La cuenta "${accountId}" ha sido purgada de ${providerId}.`,
      intent_type: 'SUCCESS'
    }
  };
}

// ─── UTILIDADES INTERNAS ──────────────────────────────────────────────────────

/**
 * Parsea de forma defensiva el body de la petición HTTP.
 * @param {GoogleAppsScript.Events.DoPost} e - Evento de GAS.
 * @returns {Object} Payload parseado.
 * @throws {Error} Si el body no es JSON válido.
 * @private
 */
function _parseBody_(e) {
  const rawBody = e && e.postData && e.postData.contents;
  if (!rawBody) {
    throw new Error('Request body vacío.');
  }
  return JSON.parse(rawBody);
}

/**
 * Construye el response HTTP estándar de GAS con Content-Type JSON.
 * @param {number} _statusCode - Código HTTP (ignorado por GAS Apps Script, pero documentado).
 * @param {Object} body        - El objeto response a serializar.
 * @returns {GoogleAppsScript.Content.TextOutput}
 * @private
 */
function _buildResponse_(_statusCode, body, headers = {}) {
  // Nota: GAS siempre retorna HTTP 200 en doPost. El status real
  // se comunica en metadata.status del body JSON.

  body.metadata = body.metadata || {};

  // 1. Inyección de Meta-Headers Indra v4.0 (Deltas e Identidad)
  if (headers['X-Indra-Update-Type']) {
    body.metadata.update_type = headers['X-Indra-Update-Type'];
  }
  
  // AXIOMA DE IDENTIDAD: El Core siempre firma quién es (Sinceridad de Origen)
  try {
    body.metadata.core_id = readCoreOwnerEmail();
    
    // Si la autenticación fue con password real, inyectamos un ticket para futuras requests
    // (Aduana de un solo paso)
    if (_statusCode === 200 && !body.metadata.session_ticket) {
       // Solo si el usuario envió password en este request, devolvemos un ticket.
       // detectamos si el payload original tenía password buscando el trace si estuviera disponible, 
       // pero una forma más limpia es inyectarlo opcionalmente desde cada handler.
       // Por ahora, el handshake inicial de bootstrap ya inyecta el ticket.
    }
  } catch (e) {
    body.metadata.core_id = 'discovery_pending';
  }

  // 2. Inyección de Traza Transaccional (UQO Echo v4.1)
  if (headers['X-Indra-Trace']) {
    body.metadata.trace = JSON.parse(headers['X-Indra-Trace']);
  }

  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Sanitiza el UQO para el Echo. Elimina credenciales.
 * @private
 */
function _sanitizeTrace_(uqo) {
  if (!uqo) return null;
  const trace = { ...uqo };
  delete trace.password;
  delete trace.api_key;
  if (trace.data) {
    delete trace.data.api_key;
    delete trace.data.password;
  }
  return trace;
}

/**
 * Genera un slug válido para el alias (Sincronizado con el frontend IdentityManager).
 * Sigue la Restricción C1: Solo minúsculas, números y guiones bajos.
 * @param {string} text
 * @returns {string}
 */
// _system_slugify_ ha sido movido a 0_utils/indra_utils.gs
