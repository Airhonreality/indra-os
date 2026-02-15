// --- CONFIGURACIÓN DE DEBUGGING ---
const DEBUG_MODE = false; // DESACTIVADO PARA PRODUCCIÓN SOBERANA

// --- FUNCIÓN DE LOGGING DE DIAGNÓSTICO ---
function _logToWebhookSite(step, data) {
  // AXIOMA: No telemetría externa hardcodeada.
  return;
}
// ======================================================================
// ARTEFACTO: 0_Entrypoints/HttpEntrypoint.gs (vFinal - MULTI-MODO)
// DHARMA: Servir como el único punto de entrada HTTP. Enruta las peticiones
//         a la lógica correcta basándose en un parámetro de modo explícito
//         ('mode') o, en su ausencia, deduciendo la intención a partir de
//         la estructura del payload (por ejemplo, webhooks de botones de Notion).
//         - 'webhook': Proceso asíncrono con Boomerang.
//         - 'worker_callback': Retorno del Boomerang.
//         - 'manual_invoke': Ejecución síncrona para la Consola Rápida.
//         - (default): API segura para Satélites.
// ======================================================================

function doPost(e) {
  _logToWebhookSite('RAW_REQUEST', e);
  try {
    const preparsedBody = _parseJsonBody(e);
    const mode = e && e.parameter ? e.parameter.mode : null;

    // Tarea 3: Robustez de la Membrana de Entrada (Axioma de Puerta Cerrada)
    const isSpecialMode = mode === 'debug_echo' || mode === 'worker_callback' || (e && e.parameter && e.parameter.flowId);
    if (!isSpecialMode && (!preparsedBody || Object.keys(preparsedBody).length === 0)) {
      return _respondJson(400, { 
        success: false, 
        error: { code: 'INVALID_ENVELOPE', message: 'Payload body is empty or malformed.' } 
      });
    }
    
    // AXIOMA: Detección Inteligente de Intención
    const rawContents = (e && e.postData && e.postData.contents) || "";
    const isApiRequest = (preparsedBody && (preparsedBody.action || preparsedBody.executor)) || 
                         rawContents.includes('"action"') || 
                         rawContents.includes('"executor"');

    // AXIOMA: Ruta rápida para Callbacks (evita ensamblaje local)
    // Solo si NO parece ser una petición de API explícita.
    if (mode === 'worker_callback' && !isApiRequest) {
      doPost_Worker_Callback(e);
      return _respondJson(200, { status: 'callback_received' });
    }

    // AXIOMA: Ruta de Diagnóstico de Salud (Echo) - MODIFICADO PARA SONDA FORENSE
    if (mode === 'debug_echo') {
      const probeStack = _assembleExecutionStack();
      const { configurator } = probeStack;
      
      const expectedToken = configurator.retrieveParameter({ key: 'INDRA_CORE_SATELLITE_API_KEY' }) || 
                            configurator.retrieveParameter({ key: 'SYSTEM_TOKEN' });

      return _respondJson(200, { 
        status: 'DIAGNOSTIC_PROBE_ACTIVE_V1', 
        timestamp: new Date().toISOString(),
        server_token_stored: expectedToken, // Revelamos el token para depuración física
        server_memory_snapshot: {
          executors_available: Object.keys(probeStack),
          has_system_alias: !!probeStack.system,
          system_equals_public: probeStack.system === probeStack.public,
          public_schemas: probeStack.public ? Object.keys(probeStack.public.schemas || {}) : []
        },
        receivedParams: e.parameter 
      });
    }

    const isNotionButton = _isNotionButtonWebhook(preparsedBody);
    const isWebhookMode = (mode === 'webhook') || isNotionButton;

    // AXIOMA: Lazy Loading / Granular Assembly
    // Si es webhook, usamos el stack ligero de ingesta (~200ms).
    // Si es API completa o ejecución manual, cargamos todo el núcleo (~3s).
    let executionStack;
    if (isWebhookMode) {
       executionStack = _assembleInjestStack();
    } else {
       executionStack = _assembleExecutionStack();
    }
    
    const { configurator, errorHandler } = executionStack;

    const systemToken = preparsedBody.Axiom || preparsedBody.systemToken || _extractBearerToken(e.headers);
    const isSovereignIdentity = SovereignGuard.verifySovereignIdentity(systemToken, configurator);

    if (isWebhookMode) {
      const result = _handleWebhookRequest(e, executionStack, preparsedBody);
      return _respondJson(result.statusCode, result.body);
    } else if (mode === 'manual_invoke') {
      const result = _handleManualInvokeRequest(e, executionStack, preparsedBody);
      return _respondJson(result.statusCode, result.body);
    } else {
      // Default: Satellite API Mode
      const result = _handleSatelliteApiRequest(e, executionStack, preparsedBody, isSovereignIdentity);
      return _respondJson(result.statusCode, result.body);
    }
  } catch (error) {
    const errorHandler = createErrorHandler();
    const stdError = (error.code) ? error : errorHandler.createError('GATEWAY_FAILURE', error.message);
    return _respondJson(500, { success: false, error: { code: stdError.code, message: stdError.message } });
  }
}


// ======================================================================
// MANEJADORES DE RUTAS
// ======================================================================

/**
 * Maneja una petición de webhook entrante (asíncrono).
 */
function _handleWebhookRequest(event, dependencies, preparsedBody) {
  // GRITO #1: ¿Empezó la función? (Solo en DEBUG)
  _logToWebhookSite('handle_webhook_start', { flowId: event.parameter.flowId });

  const { errorHandler, jobQueueService, configurator } = dependencies;

  // GRITO #2: ¿Se ensamblaron las dependencias? (Solo en DEBUG)
  _logToWebhookSite('handle_webhook_deps_ok', { hasQueue: !!jobQueueService });

  if (!jobQueueService) throw new Error("Dependencia 'jobQueueService' no ensamblada.");
  if (!configurator) throw new Error("Dependencia 'configurator' no ensamblada.");

  // El body puede venir ya parseado desde doPost (preparsedBody) o lo parseamos aquí.
  const bodyPayload = preparsedBody || _parseJsonBody(event);

  // El flowId puede venir en la URL (prioridad) o en el body (por ejemplo, Notion button).
  const flowId = (event && event.parameter && event.parameter.flowId) ? event.parameter.flowId : bodyPayload && bodyPayload.flowId;

  // Validar Token de Seguridad (Axioma de Puerta Cerrada)
  const systemToken = configurator.retrieveParameter({ key: 'SYSTEM_TOKEN' });
  const providedToken = (event && event.parameter && event.parameter.token) || (bodyPayload && bodyPayload.token);
  
  if (systemToken && providedToken !== systemToken) {
    throw errorHandler.createError('UNAUTHORIZED', 'Webhook token mismatch or missing. Access denied.');
  }

  if (!flowId) {

    // GRITO #3: ¿Falló la validación del flowId? (Solo en DEBUG)
    _logToWebhookSite('handle_webhook_fail_no_flowid');
    throw errorHandler.createError('INVALID_INPUT', 'El parámetro "flowId" es obligatorio para webhooks.');
  }
  
  const urlPayload = { ...event.parameter };
  delete urlPayload.mode;
  const initialPayload = { ...bodyPayload, ...urlPayload };

  // GRITO #4: ¿Se va a intentar encolar el job? (Solo en DEBUG)
  _logToWebhookSite('handle_webhook_pre_enqueue', { flowId });

  const { jobId } = jobQueueService.enqueue({
    flowId: flowId,
    initialPayload: initialPayload,
    triggerSource: 'webhook'
  });

  // GRITO #5: ¿El job se encoló con éxito? (Solo en DEBUG)
  _logToWebhookSite('handle_webhook_enqueue_ok', { jobId });

  const workerUrl = configurator.retrieveParameter({ key: 'INDRA_WORKER_URL' });
  
  if (workerUrl) {
    try {
      const deploymentUrl = configurator.retrieveParameter({ key: 'DEPLOYMENT_URL' });
      const callbackUrl = `${deploymentUrl}?mode=worker_callback`;
      const boomerangPayload = { jobId: jobId, callbackUrl: callbackUrl };
      
      _logToWebhookSite('handle_webhook_firing_boomerang', { workerUrl, boomerangPayload });
      
      UrlFetchApp.fetch(workerUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(boomerangPayload),
        muteHttpExceptions: true
      });

    } catch (e) {
      _logToWebhookSite('handle_webhook_boomerang_fail', { error: e.message });
    }
  } else {
    _logToWebhookSite('handle_webhook_no_worker_url');
  }
  
  return {
    statusCode: 202,
    body: { success: true, message: 'Job enqueued and execution requested', jobId: jobId }
  };
}

/**
 * Maneja una petición de la API de Satélite (síncrono, genérico).
 */
function _handleSatelliteApiRequest(event, executionStack, preparsedBody, isSovereignIdentity) {
  const { errorHandler, configurator } = executionStack;
  // AXIOMA: Safe Harbor for Discovery (Delegated to Projection Kernel)
  const body = preparsedBody || _parseJsonBody(event);
  const providedToken = body.Axiom || body.systemToken || _extractBearerToken(event?.headers);

  // Normalización de ejecutor y método
  // AXIOMA: Si action es "methodName", se asume "public:methodName"
  const actionParts = body.action ? body.action.split(':') : [];
  let executor = body.executor || (actionParts.length > 1 ? actionParts[0] : (actionParts.length === 1 ? 'public' : undefined));
  let method = body.method || (actionParts.length > 1 ? actionParts[1] : (actionParts.length === 1 ? actionParts[0] : undefined));
  let payload = body.payload;

  const { projectionKernel } = executionStack;

  // AXIOMA V12: Autodiscubrimiento Soberano.
  // Si el método tiene exposición 'public' en el contrato, permitimos el Safe Harbor.
  const isDiscoveryCall = projectionKernel.isMethodPublic(executionStack, executor, method);

  if (!isSovereignIdentity && !isDiscoveryCall) {
     const maskedProvided = (providedToken || "").toString().substring(0, 3) + "...";
     throw errorHandler.createError('UNAUTHORIZED', `System token missing or invalid (Body-Key Axiom). Received: ${maskedProvided}`);
  }

  // AXIOMA: Fin de la Mentira de los Alias. Cada ejecutor mantiene su identidad propia.  const { projectionKernel } = executionStack;

  // Modificar el mensaje de error para mayor claridad.
  if (!executor || !method) {
    throw errorHandler.createError('INVALID_INPUT', 'La petición debe incluir una clave "action", o las claves "executor" y "method".');
  }

  // Axioma: Solo ejecución de lo Proyectado (Exposure Control)
  if (!projectionKernel.isMethodExposed(executionStack, executor, method)) {
    const isotope = new Date().getTime().toString().substr(-6);
    throw errorHandler.createError('EXPOSURE_BLOCK', `[ISOTOPE:${isotope}] El acceso al método '${method}' en el ejecutor '${executor}' está prohibido por política de exposición.`);
  }

  // AXIOMA: Resolución Jerárquica de Ejecutores (Deep Discovery)
  // 1. Buscar en el Stack raíz (ej: 'publicApi')
  // 2. Buscar en el Registro de Nodos (ej: 'drive', 'email')
  let executorInstance = executionStack[executor];
  
  if (!executorInstance && executionStack.nodes && executionStack.nodes[executor]) {
      executorInstance = executionStack.nodes[executor];
  }
  
  if (!executorInstance) {
      throw errorHandler.createError('CONFIGURATION_ERROR', `Ejecutor '${executor}' no encontrado en el stack ni en el registro de nodos.`);
  }

  // --- ARITY-AWARE DISPATCHER (Defensa de Protocolo) ---
  // Si el método espera más de un argumento y recibimos un objeto, lo desglosamos.
  const targetMethod = executorInstance[method];
  const payloadData = payload || {};
  let result;

  if (targetMethod.length > 1 && typeof payloadData === 'object' && !Array.isArray(payloadData)) {
    // Caso: Método posicional (ej: saveFlow(id, obj)) recibiendo {id, obj}
    // Intentamos mapear por nombre si es posible, o por orden si no.
    // En GAS no podemos ver los nombres de los parámetros fácilmente, 
    // pero por convención de INDRA, el desglosamiento ocurre en el servicio.
    // Aquí implementamos el "Pasaporte de Gracia":
    result = targetMethod.call(executorInstance, payloadData); 
    // Nota: Dejamos que el método interno maneje el desglose (Axioma de Desglose Universal)
  } else {
    // Caso estándar: Un solo payload
    result = targetMethod.call(executorInstance, payloadData);
  }

  return { statusCode: 200, body: { success: true, result: result } };
}

// ============================================================
// --- INICIO DE NUEVO MANEJADOR DE RUTA ---
// ============================================================
/**
 * Maneja una petición de ejecución manual desde la "Consola Rápida" (síncrono).
 * Esta ruta DEBE estar protegida para no ser invocada públicamente.
 * @param {object} event - El objeto de evento de GAS.
 * @param {object} dependencies - La pila de ejecución completa.
 * @returns {{statusCode: number, body: object}}
 */
function _handleManualInvokeRequest(event, dependencies) {
  const { publicApi, errorHandler } = dependencies;
  
  // Como esta ruta no se expone públicamente, la "seguridad" es que el
  // usuario debe estar logueado en su cuenta de Google para invocarla
  // desde el menú de Sheets. Se podría añadir una capa de token si fuera necesario.

  const flowId = event.parameter.flowId;
  if (!flowId) {
    throw errorHandler.createError('INVALID_INPUT', 'El parámetro "flowId" es obligatorio para la invocación manual.');
  }
  
  // El payload viene en el cuerpo de la petición que hace el MainMenu
  const initialPayload = _parseJsonBody(event);
  
  // Llamada síncrona a la PublicAPI
  const resultContext = publicApi.invoke(flowId, initialPayload);
  
  return {
    statusCode: 200,
    body: { success: true, result: resultContext }
  };
}
// ============================================================
// --- FIN DE NUEVO MANEJADOR DE RUTA ---
// ============================================================


// ======================================================================
// FUNCIONES AUXILIARES
// ======================================================================

function _extractBearerToken(headers) {
  if (!headers || !headers.Authorization) return null;
  const match = headers.Authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function _parseJsonBody(event) {
  if (event && event.postData && event.postData.contents) {
    try {
      const contents = event.postData.contents;
      if (contents.trim() !== '') return JSON.parse(contents);
    } catch (e) {
      throw new Error(`El cuerpo de la petición (postData.contents) contiene JSON inválido: ${e.message}`);
    }
  }
  return {};
}

function _respondJson(statusCode, payload) {
  let jsonString;
  try {
    jsonString = JSON.stringify(payload);
  } catch (e) {
    // Si falla la serialización (ej: referencia circular), devolvemos error seguro
    jsonString = JSON.stringify({
      success: false,
      error: {
        code: 'SERIALIZATION_ERROR',
        message: 'Fatal error serializing response: ' + e.message
      }
    });
    statusCode = 500;
  }

  const response = ContentService
    .createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
  // Las cabeceras CORS las maneja automáticamente Google Apps Script para ContentService
  return response;
}

/**
 * Heurística simple para detectar webhooks generados por botones de Notion.
 * Retorna true si el body parece contener tanto pageId como flowId.
 */
function _isNotionButtonWebhook(body) {
  if (!body || typeof body !== 'object') return false;
  // Heurística conservadora: requerimos pageId y flowId.
  return (body.pageId && body.flowId) ? true : false;
}





