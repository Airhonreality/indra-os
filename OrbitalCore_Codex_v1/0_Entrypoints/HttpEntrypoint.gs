// --- CONFIGURACIÓN DE DEBUGGING ---
const DEBUG_MODE = false; // CAMBIAR A false EN PRODUCCIÓN

// --- FUNCIÓN DE LOGGING DE DIAGNÓSTICO ---
function _logToWebhookSite(step, data) {
  if (!DEBUG_MODE) return; // GUARD: No logging en producción
  
  try {
    const url = `https://webhook.site/ff62c426-6556-44ee-aabe-533843301350?step=${step}&data=${encodeURIComponent(JSON.stringify(data))}`;
    UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
  } catch (e) {
    // No hacer nada si el logging falla.
  }
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
  try {
    const preparsedBody = _parseJsonBody(e);
    const mode = e && e.parameter ? e.parameter.mode : null;
    
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

    // AXIOMA: Ruta de Diagnóstico de Salud (Echo)
    // Permite verificar conectividad pura sin cargar dependencias.
    if (mode === 'debug_echo') {
      return _respondJson(200, { 
        status: 'ONLINE_VERIFIED_V157_FIX', 
        timestamp: new Date().toISOString(),
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

    // AXIOMA: Body-Key (L7) - Verificación de Seguridad
    const systemToken = preparsedBody.systemToken || _extractBearerToken(e.headers);
    
    // Intentamos recuperar la clave esperada probando los dos nombres canónicos (Sovereignty Fallback)
    const expectedToken = configurator.retrieveParameter({ key: 'ORBITAL_CORE_SATELLITE_API_KEY' }) || 
                          configurator.retrieveParameter({ key: 'SYSTEM_TOKEN' });
                          
    const systemTokenStr = (systemToken || "").toString().trim();
    const expectedTokenStr = (expectedToken || "").toString().trim();
                          
    const isAuthorized = systemTokenStr && expectedTokenStr && (systemTokenStr === expectedTokenStr);

    if (isWebhookMode) {
      const result = _handleWebhookRequest(e, executionStack, preparsedBody);
      return _respondJson(result.statusCode, result.body);
    } else if (mode === 'manual_invoke') {
      const result = _handleManualInvokeRequest(e, executionStack, preparsedBody);
      return _respondJson(result.statusCode, result.body);
    } else {
      // Default: Satellite API Mode
      const result = _handleSatelliteApiRequest(e, executionStack, preparsedBody, isAuthorized);
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
  // NOTE: la URL original contenía un punto extra después de 'webhook.site.'
  // Esto causa fallo DNS/HTTP silencioso. Usamos la URL correcta abajo.
  const sismografoUrl = 'https://webhook.site/ff62c426-6556-44ee-aabe-533843301350';

  // GRITO #1: ¿Empezó la función? (Solo en DEBUG)
  if (DEBUG_MODE) {
    try { UrlFetchApp.fetch(sismografoUrl + '?step=1_start'); } catch (e) { console.warn('Sismografo step1 failed: ' + e.message); }
  }

  const { errorHandler, jobQueueService, configurator } = dependencies;

  // GRITO #2: ¿Se ensamblaron las dependencias? (Solo en DEBUG)
  if (DEBUG_MODE) {
    try { UrlFetchApp.fetch(sismografoUrl + '?step=2_deps_ok'); } catch (e) { console.warn('Sismografo step2 failed: ' + e.message); }
  }

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
    if (DEBUG_MODE) {
      try { UrlFetchApp.fetch(sismografoUrl + '?step=3_fail_no_flowid'); } catch (e) { console.warn('Sismografo step3 failed: ' + e.message); }
    }
    throw errorHandler.createError('INVALID_INPUT', 'El parámetro "flowId" es obligatorio para webhooks.');
  }
  
  const urlPayload = { ...event.parameter };
  delete urlPayload.mode;
  const initialPayload = { ...bodyPayload, ...urlPayload };

  // GRITO #4: ¿Se va a intentar encolar el job? (Solo en DEBUG)
  if (DEBUG_MODE) {
    try { UrlFetchApp.fetch(sismografoUrl + '?step=4_pre_enqueue&flowId=' + encodeURIComponent(flowId)); } catch (e) { console.warn('Sismografo step4 failed: ' + e.message); }
  }

  const { jobId } = jobQueueService.enqueue({
    flowId: flowId,
    initialPayload: initialPayload,
    triggerSource: 'webhook'
  });

  // GRITO #5: ¿El job se encoló con éxito? (Solo en DEBUG)
  if (DEBUG_MODE) {
    try { UrlFetchApp.fetch(sismografoUrl + '?step=5_enqueue_ok&jobId=' + encodeURIComponent(jobId)); } catch (e) { console.warn('Sismografo step5 failed: ' + e.message); }
  }

  const workerUrl = configurator.retrieveParameter({ key: 'WORKER_URL' });
  
  if (workerUrl) {
    try {
      const deploymentUrl = configurator.retrieveParameter({ key: 'DEPLOYMENT_URL' });
      const callbackUrl = `${deploymentUrl}?mode=worker_callback`;
      const boomerangPayload = { jobId: jobId, callbackUrl: callbackUrl };
      
      // console.log(`[DIAG_GATEWAY] Lanzando Boomerang. Target: ${workerUrl}. Payload: ${JSON.stringify(boomerangPayload)}`);
      
      UrlFetchApp.fetch(workerUrl, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(boomerangPayload),
        muteHttpExceptions: true
      });
      // console.log(`DIAGNÓSTICO: Boomerang lanzado al Worker para el Job ID: ${jobId}`);

    } catch (e) {
      console.error(`APIGateway: Fallo crítico al lanzar el Boomerang al Worker. El job ${jobId} queda encolado. Error: ${e.message}`);
    }
  } else {
    console.error(`ADVERTENCIA SEVERA: WORKER_URL no está configurada. El job ${jobId} fue encolado pero NO será procesado automáticamente.`);
  }
  
  return {
    statusCode: 202,
    body: { success: true, message: 'Job enqueued and execution requested', jobId: jobId }
  };
}

/**
 * Maneja una petición de la API de Satélite (síncrono, genérico).
 */
function _handleSatelliteApiRequest(event, executionStack, preparsedBody, isAuthorized) {
  const { errorHandler } = executionStack;
  const body = preparsedBody || _parseJsonBody(event);

  // AXIOMA: Safe Harbor para Discovery (La Puerta del Templo siempre está abierta para los peregrinos)
  const discoveryMethods = ['getSystemStatus', 'getSystemContext', 'getSovereignLaws', 'getSystemContracts', 'getDistributionSite'];
  const rawContents = (event && event.postData && event.postData.contents) || "";

  let isDiscoveryCall = discoveryMethods.includes(body.method) || 
                          discoveryMethods.includes(body.action) ||
                          discoveryMethods.some(m => rawContents.includes(`"${m}"`)) ||
                          discoveryMethods.some(m => rawContents.includes(`'${m}'`));

  if (!isAuthorized && !isDiscoveryCall) {
     throw errorHandler.createError('UNAUTHORIZED', 'System token missing or invalid (Body-Key Axiom).');
  }

  // --- INICIO DE LA MODIFICACIÓN ---

  if (body.action) {
    const { projectionKernel } = executionStack;

    if (body.action === 'getSystemContracts') {
      const projection = projectionKernel.getProjection(executionStack);
      return { statusCode: 200, body: { success: true, result: projection.contracts } };
    } else if (body.action === 'getSystemContext') {
      const systemContext = projectionKernel.getFilteredContext();
      return { statusCode: 200, body: { success: true, result: systemContext } };
    } else if (body.action === 'invoke') {
      // Passthrough: 'invoke' es un verbo auxiliar para indicar ejecución explícita.
      // Permitimos que continúe hacia la lógica de Executor/Method.
    } else {
      throw errorHandler.createError('INVALID_INPUT', `La acción '${body.action}' es desconocida.`);
    }
  }

  let { executor, method, payload } = body;
  if (executor === 'publicAPI') executor = 'public';
  const { projectionKernel } = executionStack;

  // Modificar el mensaje de error para mayor claridad.
  if (!executor || !method) {
    throw errorHandler.createError('INVALID_INPUT', 'La petición debe incluir una clave "action", o las claves "executor" y "method".');
  }

  // Axioma: Solo ejecución de lo Proyectado (Exposure Control)
  if (!projectionKernel.isMethodExposed(executionStack, executor, method)) {
    throw errorHandler.createError('UNAUTHORIZED', `El acceso al método '${method}' en el ejecutor '${executor}' está prohibido o no existe en el contrato público.`);
  }

  const executorInstance = executionStack[executor];

  // --- [V5.5] ARITY-AWARE DISPATCHER (Defensa de Protocolo) ---
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


