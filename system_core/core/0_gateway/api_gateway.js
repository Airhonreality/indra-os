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
  const mode = e && e.parameter && e.parameter.mode;

  // Modo diagnóstico: ?mode=echo — para verificar conectividad sin frontend.
  // NO requiere password — es solo verificación de vida del servidor.
  if (mode === 'echo') {
    return _buildResponse_(200, {
      items: [],
      metadata: {
        status:        'ALIVE',
        bootstrapped:  isBootstrapped(),
        timestamp:     new Date().toISOString(),
        version:       'universal-core-system/1.0',
        logs:          [],
      },
    });
  }

  // Health check estándar: cualquier GET sin modo retorna estado mínimo.
  return _buildResponse_(200, {
    items: [],
    metadata: {
      status:    isBootstrapped() ? 'OK' : 'BOOTSTRAP',
      message:   'Universal Core System activo. Usa POST para interactuar.',
      timestamp: new Date().toISOString(),
      logs:      [],
    },
  });
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
    // --- 1. Parseo defensivo del body ---
    let payload;
    try {
      payload = _parseBody_(e);
    } catch (parseError) {
      return _buildResponse_(400, {
        items: [],
        metadata: {
          status: 'ERROR',
          error:  'Request body inválido. Se esperaba JSON.',
          logs:   flushLogs(),
        },
      });
    }

    logInfo('[gateway] Request recibido.', { protocol: payload.protocol, provider: payload.provider });

    // --- 2. Bootstrap Pattern ---
    if (!isBootstrapped()) {
      return _handleBootstrap_(payload);
    }

    // --- 3. Verificación de Password (Muro de Soberanía) ---
    if (!verifyPassword(payload.password)) {
      logWarn('[gateway] Intento de acceso con credencial inválida.');
      return _buildResponse_(401, {
        items: [],
        metadata: {
          status: 'UNAUTHORIZED',
          error:  'Credencial de acceso inválida.',
          logs:   flushLogs(),
        },
      });
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
          error:  isKnownError ? routingError.message : 'Error interno del servidor.',
          code:   isKnownError ? routingError.code : 'SYSTEM_FAILURE',
        },
      };
    }

    // --- 5. Inyectar logs del ciclo ---
    result.metadata        = result.metadata || {};
    result.metadata.logs   = flushLogs();
    result.metadata.status = result.metadata.status || 'OK';

    // --- 6. Inyectar Header de Actualización (Indra v4.0 Deltas) ---
    // Si el provider no especifica update_type, por defecto es SNAPSHOT (carga completa)
    const updateType = result.metadata.update_type || 'SNAPSHOT';

    // --- 7. Muro de Contrato ---
    const contractViolation = _enforceAtomContract_(result, payload.provider || 'unknown', payload.protocol);
    if (contractViolation) {
      result = contractViolation;
      result.metadata.logs = flushLogs();
    }

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
        error:  'Falla catastrófica en el Gateway: ' + fatalError.message,
        code:   'FATAL_SERVER_ERROR',
        logs:   []
      }
    });
  }
}

/**
 * Valida que cada átomo del array `items` cumpla con el contrato IUH v3.0:
 * { id, handle: { ns, alias, label }, class, protocols: Array }.
 * Si alguno falla, intenta hidratar desde campos legacy.
 * Si la hidratación falla o el contrato estructural se rompe, retorna error.
 *
 * @param {{ items: Array, metadata: Object }} result - Resultado del provider.
 * @param {string} providerId - ID del provider para mensajes de error.
 * @param {string} protocol - Protocolo en ejecución para excepciones.
 * @returns {{ items: [], metadata: Object }|null}
 * @private
 */
function _enforceAtomContract_(result, providerId, protocol) {
  // Excepción axiomática: El motor lógico (LOGIC_EXECUTE) retorna resultados computados genéricos.
  if (protocol === 'LOGIC_EXECUTE') return null;

  if (!Array.isArray(result.items) || result.items.length === 0) return null;

  const REQUIRED_STRUCT_FIELDS = ['id', 'class'];

  for (let i = 0; i < result.items.length; i++) {
    const atom = result.items[i];
    if (!atom || typeof atom !== 'object') {
      return {
        items: [],
        metadata: {
          status: 'ERROR',
          error: `ContractViolation: item[${i}] no es un objeto en provider "${providerId}".`,
          code: 'CONTRACT_VIOLATION',
        },
      };
    }

    // 1. Integridad de Identidad (v3.0 IUH)
    // El Gateway es el último muro. Si el átomo no tiene handle, lo hidratamos aquí 
    // como red de seguridad final (Shadow Identity Protocol).
    if (!atom.handle || !atom.handle.alias || !atom.handle.label) {
      // Prioridad de Identidad: handle.label -> name -> label -> account_id -> id -> default
      const label = atom.handle?.label || atom.name || atom.label || atom.account_id || atom.id || 'Recurso';
      const alias = atom.handle?.alias || _system_slugify_(label) || 'slot_unnamed';
      
      atom.handle = {
        ns: atom.handle?.ns || `com.indra.gateway.${atom.class?.toLowerCase() || 'item'}`,
        alias: alias,
        label: label
      };
    }
    
    // Eliminación Axiomática: una vez hidratado el handle, se remueve .name
    // para forzar al frontend a usar handle.label (DATA_CONTRACTS v4.0)
    if (atom.name) delete atom.name;

    // 2. Validación de Campos Estructurales
    for (const field of REQUIRED_STRUCT_FIELDS) {
      if (atom[field] === undefined || atom[field] === null || atom[field] === '') {
        logError(`[gateway] ContractViolation: átomo sin campo "${field}" en provider "${providerId}".`, { atom_id: atom.id || '?' });
        return {
          items: [],
          metadata: {
            status: 'ERROR',
            error: `ContractViolation: átomo sin campo "${field}" en provider "${providerId}".`,
            code: 'CONTRACT_VIOLATION',
          },
        };
      }
    }

    // 3. Validación de Protocolos
    if (!Array.isArray(atom.protocols)) {
      logError(`[gateway] ContractViolation: protocols no es Array en "${providerId}".`, { atom_id: atom.id });
      return {
        items: [],
        metadata: {
          status: 'ERROR',
          error: `ContractViolation: átomo "${atom.id}" no tiene campo "protocols" como Array.`,
          code: 'CONTRACT_VIOLATION',
        },
      };
    }
  }

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
      bootstrapPassword(payload.password); // → system_config.gs
      logInfo('[gateway] Servidor bootstrapped exitosamente.');
      return _buildResponse_(200, {
        items: [],
        metadata: { 
          status: 'OK', 
          message: 'Pacto de Ignición completado. El Núcleo ha despertado.',
          intent_type: 'SUCCESS',
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
      status:  'BOOTSTRAP',
      message: 'Servidor no inicializado. Define tu contraseña de acceso.',
      logs:    flushLogs(),
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

  const keyKey  = `ACCOUNT_${providerId}_${accountId}_KEY`;
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

  // 1. Inyección de Meta-Headers Indra v4.0 (Deltas)
  if (headers['X-Indra-Update-Type']) {
    body.metadata.update_type = headers['X-Indra-Update-Type'];
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
function _system_slugify_(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')           // Reemplazar espacios por _
    .replace(/[^\w-]+/g, '')       // Eliminar caracteres no alfanuméricos (excepto _)
    .replace(/--+/g, '_')          // Reemplazar múltiples _ por uno solo
    .replace(/^-+/, '')            // Eliminar _ al inicio
    .replace(/-+$/, '');           // Eliminar _ al final
}
