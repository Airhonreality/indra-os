// ======================================================================
// ARTEFACTO: 0_Entrypoints/APIGateway.spec.js (SINCRONIZADO CON "BOOMERANG")
// ======================================================================

function _setupAPIGatewayTests() {
  const originals = {
    ContentService: globalThis.ContentService,
    ScriptApp: globalThis.ScriptApp,
    UrlFetchApp: globalThis.UrlFetchApp, // <-- Guardar el original
    _assembleExecutionStack: globalThis._assembleExecutionStack,
    doPost_Worker_Callback: globalThis.doPost_Worker_Callback, // <-- Guardar el original
  };

  const mocks = {
    mockErrorHandler: { createError: (code, msg, details) => { const e = new Error(msg); e.code = code; e.details = details; return e; } },
    mockConfigurator: {
      retrieveParameter: (payload) => {
        if (payload.key === 'ORBITAL_CORE_SATELLITE_API_KEY') return 'test-satellite-key';
        if (payload.key === 'WORKER_URL') return 'http://mock.worker.url/exec';
        if (payload.key === 'DEPLOYMENT_URL') return 'http://mock.deployment.url/exec';
        return null;
      },
      getAllParameters: () => ({
        'ORBITAL_CORE_SATELLITE_API_KEY': 'SECRET',
        'PROJECT_NAME': 'INDRA'
      })
    },
    mockJobQueueService: { _callLog: [], enqueue: function (jobData) { this._callLog.push(jobData); return { jobId: 'job-abc-123' }; } },
    mockPublicApi: {
      label: 'PublicAPI',
      schemas: { invoke: { description: 'test' } },
      _callLog: [],
      invoke: function (flowId, payload) { this._callLog.push({ flowId, payload }); return { success: true }; }
    },
    mockFlowRegistry: {
      label: 'FlowRegistry',
      schemas: { listFlows: { description: 'test' } },
      _callLog: [],
      listFlows: function () { this._callLog.push({}); return ['flow1', 'flow2']; }
    },
    mockProjectionKernel: {
      getProjection: (stack) => ({ contracts: { publicApi: { label: 'PublicAPI' } } }),
      getFilteredContext: () => ({ configuration: { PROJECT_NAME: 'INDRA' } }),
      isMethodExposed: (stack, exec, meth) => {
        if (exec === 'invalidExecutor' || meth === 'invalidMethod') return false;
        if (meth === 'internalMethod') return false;
        return true;
      }
    },
    mockTextOutput: { _content: null, _mimeType: null, addHeader: function () { return this; }, setMimeType: function (mime) { this._mimeType = mime; return this; } },
    // --- INICIO DE LA CORRECCIÓN: Mock para UrlFetchApp ---
    mockUrlFetchApp: {
      _callLog: [],
      fetch: function (url, options) { this._callLog.push({ url, options }); }
    }
    // --- FIN DE LA CORRECCIÓN ---
  };

  globalThis.ContentService = { createTextOutput: (c) => { mocks.mockTextOutput._content = c; return mocks.mockTextOutput; }, MimeType: { JSON: 'application/json' } };
  globalThis.ScriptApp = { newTrigger: () => ({ timeBased: () => ({ after: () => ({ create: () => { } }) }) }) }; // Mock vacío por si acaso
  globalThis.UrlFetchApp = mocks.mockUrlFetchApp; // <-- Sobrescribir con nuestro mock

  globalThis._assembleExecutionStack = () => ({
    errorHandler: mocks.mockErrorHandler,
    configurator: mocks.mockConfigurator,
    jobQueueService: mocks.mockJobQueueService,
    flowRegistry: mocks.mockFlowRegistry,
    publicApi: mocks.mockPublicApi,
    projectionKernel: mocks.mockProjectionKernel
  });

  globalThis._assembleInjestStack = () => ({
    errorHandler: mocks.mockErrorHandler,
    configurator: mocks.mockConfigurator,
    jobQueueService: mocks.mockJobQueueService,
    sheetAdapter: mocks.mockSheetAdapter || { appendRow: () => { } }
  });

  // Interceptar la llamada al callback para verificar que se invoca
  globalThis.doPost_Worker_Callback = (e) => {
    if (!globalThis._callbackSpy) globalThis._callbackSpy = { _callLog: [] };
    globalThis._callbackSpy._callLog.push(e);
  };

  const createMockEvent = (options) => ({
    parameter: options.parameter || {},
    postData: { contents: options.body || '{}' },
    headers: options.headers || {}
  });

  return { mocks, originals, createMockEvent };
}

function _teardownAPIGatewayTests(originals) {
  Object.keys(originals).forEach(key => {
    globalThis[key] = originals[key];
  });
  // Limpiar el espía global
  delete globalThis._callbackSpy;
}

// ============================================================
// SUITE DE TESTS PARA APIGATEWAY (ACTUALIZADA)
// ============================================================

function testAPIGateway_Webhook_debeEncolarJobYLanzarBoomerang() {
  const setup = _setupAPIGatewayTests();
  try {
    const event = setup.createMockEvent({
      parameter: { mode: 'webhook', flowId: 'my-flow' },
      body: '{"id":123}'
    });

    doPost(event);

    assert.arrayLength(setup.mocks.mockJobQueueService._callLog, 1, 'JobQueueService.enqueue debió ser llamado.');

    // --- INICIO DE LA CORRECCIÓN: Verificar la llamada UrlFetch ---
    assert.arrayLength(setup.mocks.mockUrlFetchApp._callLog, 1, 'UrlFetchApp.fetch debió ser llamado para lanzar el boomerang.');
    const fetchCall = setup.mocks.mockUrlFetchApp._callLog[0];
    assert.areEqual('http://mock.worker.url/exec', fetchCall.url);

    const payloadSent = JSON.parse(fetchCall.options.payload);
    assert.areEqual('job-abc-123', payloadSent.jobId);
    assert.areEqual('http://mock.deployment.url/exec?mode=worker_callback', payloadSent.callbackUrl);
    // --- FIN DE LA CORRECCIÓN ---

    return true;
  } finally {
    _teardownAPIGatewayTests(setup.originals);
  }
}

function testAPIGateway_Callback_debeInvocarLaFuncionDeCallbackCorrecta() {
  const setup = _setupAPIGatewayTests();
  try {
    const event = setup.createMockEvent({
      parameter: { mode: 'worker_callback' },
      body: '{"jobId":"job-from-worker"}'
    });

    doPost(event);

    assert.isNotNull(globalThis._callbackSpy, "El espía del callback no fue creado.");
    assert.arrayLength(globalThis._callbackSpy._callLog, 1, "doPost_Worker_Callback no fue invocado.");
    const receivedEvent = globalThis._callbackSpy._callLog[0];
    assert.areEqual('worker_callback', receivedEvent.parameter.mode);

    return true;
  } finally {
    _teardownAPIGatewayTests(setup.originals);
  }
}



function testAPIGateway_Api_debeDevolverContratosConGetSystemContracts() {
  const setup = _setupAPIGatewayTests();
  try {
    const event = setup.createMockEvent({
      body: '{"action":"getSystemContracts"}',
      headers: { Authorization: 'Bearer test-satellite-key' }
    });
    doPost(event);
    const responseContent = JSON.parse(setup.mocks.mockTextOutput._content);
    assert.isTrue(responseContent.success);
    assert.hasProperty(responseContent.result, 'publicApi');
    return true;
  } finally {
    _teardownAPIGatewayTests(setup.originals);
  }
}

function testAPIGateway_Api_debeEjecutarMetodoGenericoCorrectamente() {
  const setup = _setupAPIGatewayTests();
  try {
    const event = setup.createMockEvent({
      body: '{"executor":"flowRegistry","method":"listFlows","payload":{}}',
      headers: { Authorization: 'Bearer test-satellite-key' }
    });
    doPost(event);
    assert.arrayLength(setup.mocks.mockFlowRegistry._callLog, 1, 'flowRegistry.listFlows debió ser llamado.');
    return true;
  } finally {
    _teardownAPIGatewayTests(setup.originals);
  }
}

function testAPIGateway_Api_debeFallarSiElExecutorOElMetodoSonInvalidos() {
  const setup = _setupAPIGatewayTests();
  try {
    const event1 = setup.createMockEvent({
      body: '{"executor":"invalidExecutor","method":"listFlows"}',
      headers: { Authorization: 'Bearer test-satellite-key' }
    });
    doPost(event1);
    const response1 = JSON.parse(setup.mocks.mockTextOutput._content);
    assert.areEqual('UNAUTHORIZED', response1.error.code);

    const event2 = setup.createMockEvent({
      body: '{"executor":"flowRegistry","method":"invalidMethod"}',
      headers: { Authorization: 'Bearer test-satellite-key' }
    });
    doPost(event2);
    const response2 = JSON.parse(setup.mocks.mockTextOutput._content);
    assert.areEqual('UNAUTHORIZED', response2.error.code);
    return true;
  } finally {
    _teardownAPIGatewayTests(setup.originals);
  }
}

function testAPIGateway_Api_debeRechazarMetodosInternos() {
  const setup = _setupAPIGatewayTests();
  try {
    const event = setup.createMockEvent({
      body: '{"executor":"flowRegistry","method":"internalMethod"}',
      headers: { Authorization: 'Bearer test-satellite-key' }
    });
    doPost(event);
    const response = JSON.parse(setup.mocks.mockTextOutput._content);
    assert.areEqual('UNAUTHORIZED', response.error.code);
    return true;
  } finally {
    _teardownAPIGatewayTests(setup.originals);
  }
}
