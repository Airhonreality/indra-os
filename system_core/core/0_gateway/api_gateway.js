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
  'SYSTEM_INSTALL_HANDSHAKE',    // Nuevo: Handshake de ignición programática
  'SYSTEM_SHARE_CREATE',
  'SYSTEM_QUEUE_READ',
  'SYSTEM_TRIGGER_HUB_GENERATE',
  'PULSE_WAKEUP',
  'RESOURCE_INGEST',
  'RESOURCE_RESOLVE',
  'SYSTEM_RESONANCE_CRYSTALLIZE',
  'SYSTEM_WORKSPACE_DEEP_PURGE',
  'EMERGENCY_INGEST'
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
      if (payload.share_ticket && (payload.protocol === 'ATOM_READ' || payload.protocol === 'LOGIC_EXECUTE' || payload.protocol === 'SYSTEM_MANIFEST' || payload.protocol === 'EMERGENCY_INGEST')) {
        const artifactId = payload.context_id || (payload.data && payload.data.artifact_id);
        ticket = _share_validateTicket(payload.share_ticket, artifactId);
        
        if (!ticket) {
          logWarn('[gateway] Intento de acceso público con ticket inválido o caducado.', { ticketId: payload.share_ticket });
          return _buildResponse_(401, { items: [], metadata: { status: 'UNAUTHORIZED', error: 'Ticket de acceso inválido.' } });
        }
        
        logInfo('[gateway] Acceso de GUEST concedido via ticket.', { ticketId: payload.share_ticket, artifactId });
      } else if (payload.protocol === 'EMERGENCY_INGEST') {
        logInfo('[gateway] Bypass de Seguridad Activado: Ingesta de Urgencia (Células).');
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
 * Validador de esquemas de datos v3.0
 */
function _validatePayload_(payload) {
  return null; // Todos los átomos son válidos v3.0.
}

// ─── HANDLERS INTERNOS ────────────────────────────────────────────────────────

/**
 * Maneja la primera petición al servidor no inicializado.
 */
function _handleBootstrap_(payload) {
  const isProgrammaticHandshake = payload.protocol === 'SYSTEM_INSTALL_HANDSHAKE' && payload.satellite_key;
  
  if ((payload.password && payload.protocol === 'SYSTEM_CONFIG_WRITE') || isProgrammaticHandshake) {
    try {
      if (isProgrammaticHandshake) {
        logInfo('[gateway] Iniciando Handshake del Instalador...');
        bootstrapWithSatelliteKey(payload.satellite_key, payload.core_owner_uid);
      } else {
        bootstrapPassword(payload.password);
      }
      
      logInfo('[gateway] Servidor bootstrapped exitosamente.');

      // Generar ticket para la sesión inmediata
      const ticket = generateSessionTicket();

      return _buildResponse_(200, {
        items: [],
        metadata: {
          status: 'OK',
          message: isProgrammaticHandshake 
            ? 'Pacto de Ignición completado. El Núcleo ha despertado.'
            : 'Soberanía establecida. El Núcleo ha despertado.',
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
  logInfo('[gateway] Servidor en modo BOOTSTRAP. Esperando ignición (manual o programática).');
  return _buildResponse_(200, {
    items: [],
    metadata: {
      status: 'BOOTSTRAP',
      message: 'Servidor no inicializado. Usa el instalador o define tu contraseña.',
      logs: flushLogs(),
    },
  });
}

/**
 * Despacha protocolos de sistema que no pertenecen a ningún provider específico.
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

  if (protocol === 'EMERGENCY_INGEST') {
    logInfo('[gateway] ATENCIÓN: Ejecutando Protocolo de Emergencia (Modo Guerrilla).');
    logWarn('[gateway] Este código es una Célula Externa temporal. Extirpar en 2 semanas tras migración nativa.');
    return handleEmergencyIngest_(payload);
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
 */
function _buildResponse_(_statusCode, body, headers = {}) {
  body.metadata = body.metadata || {};

  if (headers['X-Indra-Update-Type']) {
    body.metadata.update_type = headers['X-Indra-Update-Type'];
  }
  
  try {
    body.metadata.core_id = readCoreOwnerEmail();
  } catch (e) {
    body.metadata.core_id = 'discovery_pending';
  }

  if (headers['X-Indra-Trace']) {
    body.metadata.trace = JSON.parse(headers['X-Indra-Trace']);
  }

  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Sanitiza el UQO para el Echo. Elimina credenciales.
 */
function _sanitizeTrace_(uqo) {
  if (!uqo) return null;
  const trace = { ...uqo };
  delete trace.password;
  delete trace.api_key;
  if (trace.data) {
    delete trace.data.api_key;
    delete trace.data.password;
    if (trace.data.base64) delete trace.data.base64; // Evitar el echo del video 
  }
  return trace;
}

/**
 * handleEmergencyIngest_
 * PROTOCOLO DE EMERGENCIA - DISEÑADO PARA BARICHARA (ALTA LATENCIA).
 * ADVERTENCIA: Este bloque de código debe ser eliminado tras la integración 
 * del sistema nativo de subida de Indra v4.0.
 */
function handleEmergencyIngest_(payload) {
  const data = payload.data; 
  const mode = data.mode || 'INIT'; 
  // AXIOMA: Prioridad al Satélite. Si el código manda un folder, lo respetamos (Soberanía del Dev).
  const destFolderId = data.target_folder_id || "1A3kVrjzYFI5r0LbeJM4PoswTvLzLQRq1"; 
  
  if (mode === 'INIT') {
    const uploader = data.uploader || 'Anonimo';
    const contact = data.contact || 'Sin-Contacto';
    const filename = data.filename || 'Archivo';
    
    // JERARQUÍA CRONOLÓGICA REAL: Preferimos la fecha del archivo a la de subida.
    const dateStr = data.created_at || Utilities.formatDate(new Date(), "GMT-5", "yyyy-MM-dd");
    const dailyFolder = getOrCreateFolder_(destFolderId, dateStr);
    
    // 2. Obtener o Crear Carpeta de Autor (LIMPIEZA DE IDENTIDAD: Solo nombre, sin contacto)
    const authorDirName = uploader.trim();
    const authorFolder = getOrCreateFolder_(dailyFolder.getId(), authorDirName);
    
    // 3. Generar URL de Carga Directa (Resumable Upload)
    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
    const options = {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      payload: JSON.stringify({
        name: filename,
        parents: [authorFolder.getId()],
        mimeType: data.mimeType || "application/octet-stream"
      }),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const uploadUrl = response.getHeaders()["Location"];

    return { metadata: { status: 'OK', upload_url: uploadUrl, classification: dateStr } };
  }

  if (mode === 'FINALIZE') {
    try {
      const file = DriveApp.getFileById(data.file_id);
      const rootFolder = DriveApp.getFolderById(destFolderId);
      
      let sheetFile;
      const sheets = rootFolder.getFilesByName("REGISTRO_INGESTA_INDRA");
      if (sheets.hasNext()) {
        sheetFile = SpreadsheetApp.open(sheets.next());
      } else {
        const newSheet = SpreadsheetApp.create("REGISTRO_INGESTA_INDRA");
        DriveApp.getFileById(newSheet.getId()).moveTo(rootFolder);
        sheetFile = newSheet;
        sheetFile.getSheets()[0].appendRow(["FECHA", "AUTOR", "CONTACTO", "ARCHIVO", "TIPO", "URL_DRIVE", "FILE_ID"]);
        sheetFile.getSheets()[0].setFrozenRows(1);
      }
      
      sheetFile.getSheets()[0].appendRow([
        new Date(), 
        data.created_at || "N/A", // FECHA ORIGINAL DE CAPTURA
        data.uploader || "Anonimo", 
        data.contact || "-",
        file.getName(), 
        file.getMimeType(), 
        file.getUrl()
      ]);

      return { items: [{ id: file.getId(), url: file.getUrl() }], metadata: { status: 'OK' } };
    } catch (err) {
      return { items: [], metadata: { status: 'ERROR', error: "Finalize Fail: " + err.message } };
    }
  }
}

/**
 * Utilidad Axiomática: Obtener o crear carpeta de forma segura por ID de padre.
 */
function getOrCreateFolder_(parentID, folderName) {
  const parent = DriveApp.getFolderById(parentID);
  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(folderName);
}
