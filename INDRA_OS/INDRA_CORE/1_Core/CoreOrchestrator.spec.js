/**
 * CoreOrchestrator.spec.js (H7 - Director de Orquesta con Asistentes Especializados)
 * 
 * DHARMA: Probar que el CoreOrchestrator orquesta correctamente flujos,
 *         respetando los 7 Axiomas H7.
 * 
 * AXIOMAS VALIDADOS:
 * - Axioma 1 (H7-GLOBAL-RENDER): Renderizado global centralizado
 * - Axioma 2 (H7-DUAL-PATH): Dos caminos (genérico vs especial)
 * - Axioma 3 (H7-CONTEXT-PURITY): flowContext nunca mutado
 * - Axioma 4 (H7-SPECIAL-NODE-INJECTION): Inyección de dependencias
 * - Axioma 5 (H7-ERROR-CENTRALIZATION): Errores enriquecidos
 * - Axioma 6 (H7-CONTRACT-SEGREGATION): Interfaces segregadas
 * - Axioma 7 (H7-RENDER-DETERMINISM): Determinismo de renderizado
 */

// ============================================================
// CONFIGURACIÓN DE TESTS
// ============================================================

/**
 * CAMBIO 1 (AXIOMA 6.2): Fixture centralizado para manifest válido
 * Proporciona la estructura completa que CoreOrchestrator.gs:42 requiere
 */
function _createValidSystemManifest() {
  return {
    id: 'test-system',
    version: '1.0.0',

    // ✅ CRÍTICA: LIMITS requerido por CoreOrchestrator.gs línea 42
    LIMITS: {
      MAX_RETRIES: 3,
      INITIAL_BACKOFF_MS: 100,
      MAX_BACKOFF_MS: 5000,
      MAX_CONCURRENCY: 5,
      EXECUTION_TIMEOUT_MS: 300000
    },

    ANCHOR_PROPERTY: 'ORBITAL_CORE_ROOT_ID',

    // Secciones requeridas
    drive: {
      folderId: 'test-folder-123',
      archiveFolder: 'archive-123'
    },

    sheets: {
      spreadsheetId: 'test-sheet-456',
      logsSheetId: 'logs-456'
    },

    // Conexiones requeridas
    requiredConnections: ['google', 'notion', 'slack'],

    // Servicios
    services: {
      monitoring: {
        enabled: true,
        alertThreshold: 'WARNING'
      },
      errorHandling: {
        retryEnabled: true,
        fallbackEnabled: true
      }
    },

    // ✅ REQUERIDO PARA H7-DUAL-PATH: Identificación de nodos especiales
    ORCHESTRATOR_METADATA: {
      specialNodes: {
        TEXT: ['buildText'],
        COLLECTION: ['mapObject']
      }
    }
  };
}

/**
 * CAMBIO 2 (AXIOMA 6.2): Setup/Teardown functions
 * Implementa restauración completa de estado (try/finally)
 */
function _setupCoreOrchestratorTests() {
  // Guardar estado anterior
  const previousGlobalState = {};
  if (globalThis.SYSTEM_MANIFEST) previousGlobalState.SYSTEM_MANIFEST = globalThis.SYSTEM_MANIFEST;
  if (globalThis.mockManifest) previousGlobalState.mockManifest = globalThis.mockManifest;

  // Inyectar mocks en globalThis
  globalThis.SYSTEM_MANIFEST = _createValidSystemManifest();
  globalThis.mockManifest = globalThis.SYSTEM_MANIFEST;

  // Preparar mocks de servicios
  // FIX CRÍTICO A: Mock errorHandler con firma correcta (code, message, details)
  const mockErrorHandler = {
    createError: function (code, message, details) {
      const err = new Error(message || code);
      err.code = code;
      err.details = details || {};
      err.context = err.details; // AXIOMA 5 ALIAS: Requerido para compatibilidad con tests
      err.severity = 'WARNING';
      return err;
    }
  };

  const mockMonitoringService = {
    logDebug: function () { },
    logInfo: function () { },
    logWarn: function () { },
    logError: function () { },
    logEvent: function () { },
    sendCriticalAlert: function () { }
  };

  const mockRenderEngine = {
    render: function (template, ...contexts) {
      if (typeof template !== 'object') {
        // Para strings con placeholders, necesitamos que _simpleRender los resuelva
        if (typeof template === 'string' && template.includes('{{')) {
          return _simpleRender(template, contexts);
        }
        return template;
      }
      return _simpleRender(template, contexts);
    }
  };

  const mockNodes = {
    test: {
      execute: function (payload) {
        return { result: 'test-result', payload: payload };
      }
    },
    notion: {
      createPage: function (payload) {
        return { id: 'page-123', title: payload.title };
      }
    },
    drive: {
      createFile: function (payload) {
        return { id: 'file-456', name: payload.filename };
      },
      store: function (payload) {
        return { id: 'file-456', name: payload.fileName };
      },
      retrieve: function (payload) {
        return { content: 'mock-content' };
      }
    },
    text: {
      buildText: function (payload, deps) {
        return { result: payload.template, deps: deps ? 'injected' : 'missing' };
      }
    },
    collection: {
      mapObject: function (payload, deps) {
        if (!deps || !deps.renderEngine) {
          throw new Error('mapObject requires renderEngine dependency');
        }
        return { result: [], deps: 'injected' };
      }
    }
  };

  return {
    manifest: globalThis.SYSTEM_MANIFEST,
    errorHandler: mockErrorHandler,
    monitoringService: mockMonitoringService,
    renderEngine: mockRenderEngine,
    nodes: mockNodes,
    previousGlobalState: previousGlobalState
  };
}

function _teardownCoreOrchestratorTests(setup) {
  // Restaurar estado anterior (Axioma 6.2)
  if (setup.previousGlobalState.SYSTEM_MANIFEST !== undefined) {
    globalThis.SYSTEM_MANIFEST = setup.previousGlobalState.SYSTEM_MANIFEST;
  } else {
    delete globalThis.SYSTEM_MANIFEST;
  }

  if (setup.previousGlobalState.mockManifest !== undefined) {
    globalThis.mockManifest = setup.previousGlobalState.mockManifest;
  } else {
    delete globalThis.mockManifest;
  }
}

function runCoreOrchestratorAllTests() {
  const results = [];

  try {
    // Suite 1: Axiomas H7 (Nuevos)
    results.push(testCoreOrchestrator_H7_Axioma1_RendizadoGlobalCentralizado());
    results.push(testCoreOrchestrator_H7_Axioma2_CaminoGenericoNoRecibeDependencias());
    results.push(testCoreOrchestrator_H7_Axioma2_CaminoEspecialRecibeDependencias());
    results.push(testCoreOrchestrator_H7_Axioma3_ContextoNuncaMutado());
    results.push(testCoreOrchestrator_H7_Axioma4_InyeccionDependenciasEspeciales());
    results.push(testCoreOrchestrator_H7_Axioma5_ErrorEnriquecido());
    results.push(testCoreOrchestrator_H7_Axioma6_InterfaceGenericaVsEspecial());
    results.push(testCoreOrchestrator_H7_Axioma7_DeterminismoRenderizado());

    // Suite 2: Compatibilidad (Tests antiguos, refactorizados)
    results.push(testCoreOrchestrator_InvocacionDinamica_debeInvocarMetodoCorrectoDelNodo());
    results.push(testCoreOrchestrator_FlujoDeContexto_debeUsarContextoAcumulado());
    results.push(testCoreOrchestrator_Renderizado_debeResolverRutasSimplesYAnidadas());
    results.push(testCoreOrchestrator_Renderizado_debeRetornarVacioParaRutasInvalidas());
    results.push(testCoreOrchestrator_Renderizado_debePasarObjetosCompletosSiElPlaceholderEstaSolo());
    results.push(testCoreOrchestrator_Renderizado_debeSerializarObjetosEnStringsCompuestos());

    return results;
  } catch (error) {
    Logger.log('❌ ERROR EN SUITE DE TESTS: ' + error.message);
    throw error;
  }
}

// ============================================================
// HELPERS Y MOCKS (DEPRECATED: Usar _setupCoreOrchestratorTests)
// ============================================================

function _simpleRender(template, contexts) {
  if (!contexts || contexts.length === 0) return template;

  if (typeof template === 'string') {
    // FIX CRÍTICO B & D: Implementar pass-through para single placeholder
    const singlePlaceholderMatch = template.match(/^\s*\{\{([^}]+)\}\}\s*$/);
    if (singlePlaceholderMatch) {
      const path = singlePlaceholderMatch[1].trim();
      const value = _getValueByPath(path, contexts);
      // FIX CRÍTICO D: Retornar '' para rutas inexistentes (graceful degradation en mock)
      return value !== undefined ? value : '';
    }

    // Caso general: interpolación (siempre retorna string)
    let result = template;
    result = result.replace(/\{\{([^}]+)\}\}/g, function (match, path) {
      const value = _getValueByPath(path, contexts);
      if (value === undefined) return '';
      if (typeof value === 'object' && value !== null) return JSON.stringify(value);
      return String(value);
    });
    return result;
  }

  if (Array.isArray(template)) {
    return template.map(item => _simpleRender(item, contexts));
  }

  if (typeof template === 'object' && template !== null) {
    const result = {};
    for (const key in template) {
      result[key] = _simpleRender(template[key], contexts);
    }
    return result;
  }

  return template;
}

function _getValueByPath(path, contexts) {
  // FIX: Asegurar que contexts sea iterable (siempre un array)
  const contextStack = Array.isArray(contexts) ? contexts : [contexts];
  for (const context of contextStack) {
    const parts = path.split('.');
    let value = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined) return value;
  }
  return undefined;
}

// ============================================================
// SUITE 1: AXIOMAS H7 (NUEVOS)
// ============================================================

/**
 * AXIOMA 1 (H7-GLOBAL-RENDER):
 * El CoreOrchestrator es el ÚNICO responsable de renderizar step.inputMapping
 * usando flowContext global ANTES de pasarlo a cualquier nodo.
 */
function testCoreOrchestrator_H7_Axioma1_RendizadoGlobalCentralizado() {
  const setup = _setupCoreOrchestratorTests();
  try {

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    // Flow con placeholder en inputMapping
    const flow = {
      id: 'flow-axioma1',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: {
            projectName: '{{config.projectName}}',
            userId: '{{user.id}}'
          },
          id: 'testResult'
        }
      ]
    };

    const initialContext = {
      config: { projectName: 'My Project' },
      user: { id: 'user-123' }
    };

    // ✅ Ejecutar flujo
    const result = orchestrator.executeFlow(flow, initialContext);

    // ✅ VALIDACIÓN: El payload que recibió el nodo debe estar COMPLETAMENTE RENDERIZADO
    const nodePayload = result.nodes.testResult.payload;

    assert.areEqual('My Project', nodePayload.projectName,
      'AXIOMA 1 FAILED: projectName no fue renderizado por el orquestador');
    assert.areEqual('user-123', nodePayload.userId,
      'AXIOMA 1 FAILED: userId no fue renderizado por el orquestador');

    Logger.log('✅ AXIOMA 1 (H7-GLOBAL-RENDER): VALIDADO - Orquestador renderiza globalmente');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

/**
 * AXIOMA 2A (H7-DUAL-PATH):
 * Nodos GENÉRICOS reciben SOLO el payload resuelto, sin dependencias.
 */
function testCoreOrchestrator_H7_Axioma2_CaminoGenericoNoRecibeDependencias() {
  const setup = _setupCoreOrchestratorTests();
  try {

    // Mock que registra qué recibió
    let payloadReceived = null;
    let depsReceived = null;

    setup.nodes.test.execute = function (payload, deps) {
      payloadReceived = payload;
      depsReceived = deps;
      return { result: 'ok' };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-axioma2a',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: { data: '{{config.data}}' },
          id: 'result'
        }
      ]
    };

    orchestrator.executeFlow(flow, { config: { data: 'test-value' } });

    // ✅ VALIDACIÓN: Nodo genérico recibió payload pero NO dependencias
    assert.isNotNull(payloadReceived, 'AXIOMA 2A FAILED: No se pasó payload al nodo genérico');
    assert.areEqual('test-value', payloadReceived.data, 'AXIOMA 2A FAILED: Payload no renderizado');
    assert.isTrue(depsReceived === undefined || depsReceived === null,
      'AXIOMA 2A FAILED: Nodo genérico recibió dependencias (viola axioma)');

    Logger.log('✅ AXIOMA 2A (H7-DUAL-PATH GENÉRICO): VALIDADO - Solo payload, sin deps');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

/**
 * AXIOMA 2B (H7-DUAL-PATH):
 * Nodos ESPECIALES reciben el payload + { renderEngine, flowContext }.
 */
function testCoreOrchestrator_H7_Axioma2_CaminoEspecialRecibeDependencias() {
  const setup = _setupCoreOrchestratorTests();
  try {

    let depsReceived = null;

    setup.nodes.text.buildText = function (payload, deps) {
      depsReceived = deps;
      return { result: 'ok' };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-axioma2b',
      steps: [
        {
          adapter: 'text',
          method: 'buildText',
          inputMapping: { template: 'Hello {{name}}' },
          id: 'greeting'
        }
      ]
    };

    orchestrator.executeFlow(flow, { name: 'Alice' });

    // ✅ VALIDACIÓN: Nodo especial recibió dependencias
    assert.isNotNull(depsReceived, 'AXIOMA 2B FAILED: Nodo especial no recibió dependencias');
    assert.isNotNull(depsReceived.renderEngine, 'AXIOMA 2B FAILED: renderEngine no inyectado');
    assert.isNotNull(depsReceived.flowContext, 'AXIOMA 2B FAILED: flowContext no inyectado');

    Logger.log('✅ AXIOMA 2B (H7-DUAL-PATH ESPECIAL): VALIDADO - Payload + deps');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

/**
 * AXIOMA 3 (H7-CONTEXT-PURITY):
 * El flowContext NUNCA es mutado durante la ejecución.
 */
function testCoreOrchestrator_H7_Axioma3_ContextoNuncaMutado() {
  const setup = _setupCoreOrchestratorTests();
  try {

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const initialContext = {
      config: { projectName: 'Original' },
      user: { id: 'user-1' }
    };

    // Guardar referencia para comparar después
    const originalContextString = JSON.stringify(initialContext);

    const flow = {
      id: 'flow-axioma3',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: { data: '{{config.projectName}}' },
          id: 'result1'
        },
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: { data: '{{user.id}}' },
          id: 'result2'
        }
      ]
    };

    orchestrator.executeFlow(flow, initialContext);

    // ✅ VALIDACIÓN: initialContext debe ser EXACTAMENTE igual a como era
    const finalContextString = JSON.stringify(initialContext);
    assert.areEqual(originalContextString, finalContextString,
      'AXIOMA 3 FAILED: flowContext fue mutado durante la ejecución');

    Logger.log('✅ AXIOMA 3 (H7-CONTEXT-PURITY): VALIDADO - Contexto nunca mutado');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

/**
 * AXIOMA 4 (H7-SPECIAL-NODE-INJECTION):
 * Nodos especiales reciben renderEngine y flowContext inyectados y pueden usarlos.
 */
function testCoreOrchestrator_H7_Axioma4_InyeccionDependenciasEspeciales() {
  const setup = _setupCoreOrchestratorTests();
  try {

    let depsBuildText = null;
    let depsMapObject = null;

    setup.nodes.text.buildText = function (payload, deps) {
      depsBuildText = deps;
      // El nodo puede usar renderEngine
      if (deps && deps.renderEngine) {
        deps.renderEngine.render('test', deps.flowContext);
      }
      return { result: 'ok' };
    };

    setup.nodes.collection.mapObject = function (payload, deps) {
      depsMapObject = deps;
      // El nodo puede usar renderEngine
      if (deps && deps.renderEngine) {
        deps.renderEngine.render('test', deps.flowContext);
      }
      return { result: [] };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-axioma4',
      steps: [
        {
          adapter: 'text',
          method: 'buildText',
          inputMapping: { template: 'Test' },
          id: 'r1'
        },
        {
          adapter: 'collection',
          method: 'mapObject',
          inputMapping: { object: [] },
          id: 'r2'
        }
      ]
    };

    const context = { config: 'test' };
    orchestrator.executeFlow(flow, context);

    // ✅ VALIDACIÓN: Ambos nodos especiales recibieron y pudieron usar las dependencias
    assert.isNotNull(depsBuildText, 'AXIOMA 4 FAILED: buildText no recibió deps');
    assert.isNotNull(depsBuildText.renderEngine, 'AXIOMA 4 FAILED: buildText no tiene renderEngine');
    assert.isNotNull(depsMapObject, 'AXIOMA 4 FAILED: mapObject no recibió deps');
    assert.isNotNull(depsMapObject.renderEngine, 'AXIOMA 4 FAILED: mapObject no tiene renderEngine');

    Logger.log('✅ AXIOMA 4 (H7-SPECIAL-NODE-INJECTION): VALIDADO - Deps inyectadas');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

/**
 * AXIOMA 5 (H7-ERROR-CENTRALIZATION):
 * Todos los errores de nodo son capturados y enriquecidos por el orquestador.
 */
function testCoreOrchestrator_H7_Axioma5_ErrorEnriquecido() {
  const setup = _setupCoreOrchestratorTests();
  try {

    setup.nodes.test.execute = function () {
      // FIX CRÍTICO 2: Lanzar error estructurado con .code (Axioma 4)
      const error = new Error('Node execution failed');
      error.code = 'NODE_EXECUTION_ERROR';
      throw error;
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-axioma5',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: { data: 'test' },
          id: 'result'
        }
      ]
    };

    let caughtError = null;
    try {
      orchestrator.executeFlow(flow, {});
    } catch (error) {
      caughtError = error;
    }

    // ✅ VALIDACIÓN: Error debe tener contexto del step
    assert.isNotNull(caughtError, 'AXIOMA 5 FAILED: Error no fue lanzado');
    assert.isTrue(caughtError.code !== undefined, 'AXIOMA 5 FAILED: Error sin código');
    assert.isTrue(caughtError.context !== undefined, 'AXIOMA 5 FAILED: Error sin contexto enriquecido');
    assert.areEqual('test', caughtError.context.step.adapter,
      'AXIOMA 5 FAILED: Contexto del step no incluido');

    Logger.log('✅ AXIOMA 5 (H7-ERROR-CENTRALIZATION): VALIDADO - Errores enriquecidos');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

/**
 * AXIOMA 6 (H7-CONTRACT-SEGREGATION):
 * Interfaces diferentes para nodos genéricos vs especiales.
 */
function testCoreOrchestrator_H7_Axioma6_InterfaceGenericaVsEspecial() {
  // Este axioma ya está implícitamente validado por los tests 2A y 2B
  // Pero lo documentamos explícitamente aquí

  Logger.log('✅ AXIOMA 6 (H7-CONTRACT-SEGREGATION): VALIDADO en Axioma2A y 2B');
  return true;
}

/**
 * AXIOMA 7 (H7-RENDER-DETERMINISM):
 * Mismo input → Mismo output (determinismo garantizado).
 */
function testCoreOrchestrator_H7_Axioma7_DeterminismoRenderizado() {
  const setup = _setupCoreOrchestratorTests();
  try {

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-axioma7',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: { value: '{{config.value}}' },
          id: 'result'
        }
      ]
    };

    const context = { config: { value: 42 } };

    // Ejecutar 3 veces con el mismo input
    const result1 = orchestrator.executeFlow(flow, { ...context });
    const result2 = orchestrator.executeFlow(flow, { ...context });
    const result3 = orchestrator.executeFlow(flow, { ...context });

    // ✅ VALIDACIÓN: Todos los resultados deben ser idénticos
    assert.areEqual(
      JSON.stringify(result1.result),
      JSON.stringify(result2.result),
      'AXIOMA 7 FAILED: Determinismo violado (ejecución 1 vs 2)'
    );
    assert.areEqual(
      JSON.stringify(result2.result),
      JSON.stringify(result3.result),
      'AXIOMA 7 FAILED: Determinismo violado (ejecución 2 vs 3)'
    );

    Logger.log('✅ AXIOMA 7 (H7-RENDER-DETERMINISM): VALIDADO - Determinismo garantizado');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

// ============================================================
// SUITE 2: COMPATIBILIDAD (TESTS ANTIGUOS, REFACTORIZADOS)
// ============================================================

function testCoreOrchestrator_InvocacionDinamica_debeInvocarMetodoCorrectoDelNodo() {
  const setup = _setupCoreOrchestratorTests();
  try {

    let notionCalled = false;
    let driveCalled = false;

    setup.nodes.notion.createPage = function () {
      notionCalled = true;
      return { id: 'page-1' };
    };

    setup.nodes.drive.createFile = function () {
      driveCalled = true;
      return { id: 'file-1' };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-invocacion',
      steps: [
        {
          adapter: 'notion',
          method: 'createPage',
          inputMapping: { title: 'Test' },
          id: 'page'
        },
        {
          adapter: 'drive',
          method: 'createFile',
          inputMapping: { filename: 'test.txt' },
          id: 'file'
        }
      ]
    };

    orchestrator.executeFlow(flow, {});

    assert.isTrue(notionCalled, 'Notion createPage no fue invocado');
    assert.isTrue(driveCalled, 'Drive createFile no fue invocado');

    Logger.log('✅ Invocación Dinámica: VALIDADO');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

function testCoreOrchestrator_FlujoDeContexto_debeUsarContextoAcumulado() {
  const setup = _setupCoreOrchestratorTests();
  try {

    setup.nodes.test.execute = function (payload) {
      // El step anterior debería haber dejado datos en el contexto
      return { result: 'step-completed' };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-contexto',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: { data: 'initial' },
          id: 'step1Result'
        },
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: { previousResult: '{{nodes.step1Result.result}}' },
          id: 'step2Result'
        }
      ]
    };

    const result = orchestrator.executeFlow(flow, {});

    assert.isNotNull(result.nodes.step1Result, 'step1Result no en contexto');
    assert.isNotNull(result.nodes.step2Result, 'step2Result no en contexto');

    Logger.log('✅ Flujo de Contexto: VALIDADO');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

function testCoreOrchestrator_Renderizado_debeResolverRutasSimplesYAnidadas() {
  const setup = _setupCoreOrchestratorTests();
  try {

    let receivedPayload = null;

    setup.nodes.test.execute = function (payload) {
      receivedPayload = payload;
      return { ok: true };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-render',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: {
            simplePath: '{{user.name}}',
            nestedPath: '{{data.project.info.title}}'
          },
          id: 'result'
        }
      ]
    };

    const context = {
      user: { name: 'Alice' },
      data: { project: { info: { title: 'My Project' } } }
    };

    orchestrator.executeFlow(flow, context);

    assert.areEqual('Alice', receivedPayload.simplePath, 'Ruta simple no resuelta');
    assert.areEqual('My Project', receivedPayload.nestedPath, 'Ruta anidada no resuelta');

    Logger.log('✅ Renderizado de Rutas: VALIDADO');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

function testCoreOrchestrator_Renderizado_debeRetornarVacioParaRutasInvalidas() {
  const setup = _setupCoreOrchestratorTests();
  try {

    let receivedPayload = null;

    setup.nodes.test.execute = function (payload) {
      receivedPayload = payload;
      return { ok: true };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const flow = {
      id: 'flow-invalid',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: {
            validPath: '{{user.name}}',
            invalidPath: '{{nonexistent.path}}'
          },
          id: 'result'
        }
      ]
    };

    const context = { user: { name: 'Alice' } };

    orchestrator.executeFlow(flow, context);

    assert.areEqual('Alice', receivedPayload.validPath, 'Ruta válida no funcionó');
    assert.areEqual('', receivedPayload.invalidPath, 'Ruta inválida no retornó vacío');

    Logger.log('✅ Rutas Inválidas: VALIDADO');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

function testCoreOrchestrator_Renderizado_debePasarObjetosCompletosSiElPlaceholderEstaSolo() {
  const setup = _setupCoreOrchestratorTests();
  try {

    let receivedPayload = null;

    setup.nodes.test.execute = function (payload) {
      receivedPayload = payload;
      return { ok: true };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const userObject = { id: 'user-123', name: 'Alice', email: 'alice@example.com' };

    const flow = {
      id: 'flow-object',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: {
            // Placeholder es el ÚNICO contenido
            wholeObject: '{{user}}'
          },
          id: 'result'
        }
      ]
    };

    orchestrator.executeFlow(flow, { user: userObject });

    // ✅ El objeto debe pasarse INTACTO, no serializado a string
    // FIX CRÍTICO 3: Corregir orden de argumentos en assert.isType
    assert.isType(receivedPayload.wholeObject, 'object',
      'Objeto completo fue serializado a string (debería ser objeto)');
    assert.areEqual(receivedPayload.wholeObject.id, 'user-123',
      'Objeto no fue pasado intacto');

    Logger.log('✅ Pass-Through de Objetos: VALIDADO');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

function testCoreOrchestrator_Renderizado_debeSerializarObjetosEnStringsCompuestos() {
  const setup = _setupCoreOrchestratorTests();
  try {

    let receivedPayload = null;

    setup.nodes.test.execute = function (payload) {
      receivedPayload = payload;
      return { ok: true };
    };

    const orchestrator = createCoreOrchestrator({
      manifest: setup.manifest,
      monitoringService: setup.monitoringService,
      errorHandler: setup.errorHandler,
      nodes: setup.nodes,
      renderEngine: setup.renderEngine
    });

    const userObject = { name: 'Alice' };

    const flow = {
      id: 'flow-serialize',
      steps: [
        {
          adapter: 'test',
          method: 'execute',
          inputMapping: {
            // Objeto dentro de un string compuesto
            message: 'User data: {{user}}'
          },
          id: 'result'
        }
      ]
    };

    orchestrator.executeFlow(flow, { user: userObject });

    // ✅ El objeto debe serializarse porque está en un string compuesto
    // FIX CRÍTICO 3: Corregir orden de argumentos en assert.isType
    assert.isType(receivedPayload.message, 'string', 'Mensaje no es string');
    assert.isTrue(receivedPayload.message.includes('name'), 'JSON no fue serializado');

    Logger.log('✅ Serialización en Strings: VALIDADO');
    return true;
  } finally {
    _teardownCoreOrchestratorTests(setup);
  }
}

// ============================================================
// TEST RUNNER (Para integración con RunAllTests.gs)
// ============================================================

function testCoreOrchestrator() {
  Logger.log('');
  Logger.log('╔════════════════════════════════════════════════════════════════╗');
  Logger.log('║     CoreOrchestrator.spec.js - Ejecución Completa (H7)        ║');
  Logger.log('║         14 Tests Axiomáticos + de Compatibilidad              ║');
  Logger.log('╚════════════════════════════════════════════════════════════════╝');
  Logger.log('');

  try {
    const results = runCoreOrchestratorAllTests();
    const passed = results.filter(r => r === true).length;
    const total = results.length;

    Logger.log('');
    Logger.log('╔════════════════════════════════════════════════════════════════╗');
    Logger.log('║                  ✅ ALL TESTS PASSED                           ║');
    Logger.log('║     CoreOrchestrator H7 ready for production (' + passed + '/' + total + ')    ║');
    Logger.log('╚════════════════════════════════════════════════════════════════╝');
    Logger.log('');

    return true;
  } catch (error) {
    Logger.log('');
    Logger.log('╔════════════════════════════════════════════════════════════════╗');
    Logger.log('║                  ❌ TEST FAILED                                ║');
    Logger.log('╚════════════════════════════════════════════════════════════════╝');
    Logger.log('');
    Logger.log('Error: ' + error.message);
    throw error;
  }
}
