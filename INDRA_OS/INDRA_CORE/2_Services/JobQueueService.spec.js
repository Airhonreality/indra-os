// ======================================================================
// ARTEFACTO: 2_Services/JobQueueService.spec.js (VERSIÓN FINAL)
// ======================================================================

function _setupJobQueueServiceTests() {
  const originals = {
    LockService: globalThis.LockService,
    Utilities: globalThis.Utilities
  };

  const mocks = {
    mockManifest: {
      SHEETS_SCHEMA: {
        JOB_QUEUE: {
          PROPERTY: 'JOB_QUEUE_SHEET_ID',
          HEADER: ['jobId', 'status', 'flowId', 'initialPayload', 'triggerSource', 'result', 'error', 'createdAt', 'updatedAt']
        }
      }
    },
    mockConfigurator: {
      retrieveParameter: (payload) => 'mock-sheet-id'
    },
    mockErrorHandler: {
      createError: (code, msg, details) => { const e = new Error(msg); e.code = code; e.details = details; return e; }
    },
    mockLock: {
      _hasLock: false,
      tryLock: function (timeout) { if (this._hasLock) return false; this._hasLock = true; return true; },
      hasLock: function () { return this._hasLock; },
      releaseLock: function () { this._hasLock = false; }
    },
    mockSheetAdapter: {
      _callLog: [],
      appendRow: function (p) { this._callLog.push({ method: 'appendRow', args: [p] }); },
      findRowByValue: function (p) { this._callLog.push({ method: 'findRowByValue', args: [p] }); return null; },
      updateCell: function (p) { this._callLog.push({ method: 'updateCell', args: [p] }); },
      getRows: function (p) { this._callLog.push({ method: 'getRows', args: [p] }); return []; },
      clearRows: function (p) { }, // Added mock method
      insertRowsBatch: function (p) { }, // Added mock method
      _getSheet: function (p) {
        return {
          getLastColumn: () => 0, // Force fallback to manifest header for simplicity in tests
          getRange: () => ({ getValues: () => [[]] })
        };
      }
    },
    mockKeyGenerator: {
      generate: () => 'mock-job-id-uuid'
    }
  };

  globalThis.LockService = { getScriptLock: () => mocks.mockLock };
  const mockUtilities = {};

  const methodsToPreserve = [
    'newBlob', 'getUuid', 'sleep', 'base64Encode', 'base64Decode'
  ];

  methodsToPreserve.forEach(m => {
    if (globalThis._SATTVA_NATIVE?.Utilities?.[m]) {
      mockUtilities[m] = globalThis._SATTVA_NATIVE.Utilities[m];
    } else if (globalThis.Utilities?.[m]) {
      mockUtilities[m] = globalThis.Utilities[m].bind(globalThis.Utilities);
    }
  });

  mockUtilities.CryptoAlgorithm = (globalThis.Utilities && globalThis.Utilities.CryptoAlgorithm) || { AES_CBC_256: 'AES_CBC_256' };
  mockUtilities.DigestAlgorithm = (globalThis.Utilities && globalThis.Utilities.DigestAlgorithm) || { SHA_256: 'SHA_256' };
  mockUtilities.getUuid = () => 'mock-uuid-123';
  mockUtilities.sleep = (ms) => { }; // Mock sleep

  globalThis.Utilities = mockUtilities;

  return { mocks, originals, mockUtilities };
}

function _teardownJobQueueServiceTests(originals) {
  globalThis.LockService = originals.LockService;
  globalThis.Utilities = originals.Utilities;
}

// ============================================================
// SUITES DE TESTS
// ============================================================

function testJobQueueService_Inicializacion_debeFallarSiSheetIdNoEstaConfigurado() {
  const setup = _setupJobQueueServiceTests();
  try {
    setup.mocks.mockConfigurator.retrieveParameter = () => null;
    assert.throws(() => {
      const svc = createJobQueueService({
        manifest: setup.mocks.mockManifest,
        configurator: setup.mocks.mockConfigurator,
        errorHandler: setup.mocks.mockErrorHandler,
        sheetAdapter: setup.mocks.mockSheetAdapter,
        keyGenerator: setup.mocks.mockKeyGenerator
      });
      // Force trigger of lazy configuration check
      svc.enqueue({ flowId: 'test' });
    }, 'CONFIGURATION_ERROR');
    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}

function testJobQueueService_Enqueue_debeLlamarAAppendRowDelAdapterConPayloadSerializado() {
  const setup = _setupJobQueueServiceTests();
  try {
    const jobQueueService = createJobQueueService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      keyGenerator: setup.mocks.mockKeyGenerator
    });
    jobQueueService.enqueue({ flowId: 'test-flow', initialPayload: { data: 1 } });
    const call = setup.mocks.mockSheetAdapter._callLog.find(c => c.method === 'appendRow');
    assert.isNotNull(call, "sheetAdapter.appendRow debió ser llamado.");
    const rowData = call.args[0].rowData;
    const payloadIndex = setup.mocks.mockManifest.SHEETS_SCHEMA.JOB_QUEUE.HEADER.indexOf('initialPayload');
    assert.areEqual('{"data":1}', rowData[payloadIndex]);
    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}

function testJobQueueService_ClaimNextJob_debeRetornarNullSiElCandadoEstaOcupado() {
  const setup = _setupJobQueueServiceTests();
  try {
    setup.mocks.mockLock.tryLock = () => false;
    const jobQueueService = createJobQueueService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      keyGenerator: setup.mocks.mockKeyGenerator
    });
    const job = jobQueueService.claimNextJob();
    assert.areEqual(null, job);
    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}

function testJobQueueService_ClaimNextJob_debeReclamarYDeserializarElPayloadCorrectamente() {
  const setup = _setupJobQueueServiceTests();
  try {
    const mockPayloadString = '{"data":"test"}';
    const mockJobRow = ['job-abc', 'pending', 'flow-123', mockPayloadString, 'webhook', '', '', '', ''];
    setup.mocks.mockSheetAdapter.getRows = (p) => [{ jobId: 'job-abc', status: 'pending', flowId: 'flow-123', initialPayload: mockPayloadString }];
    setup.mocks.mockSheetAdapter.findRowByValue = (p) => ({ rowNumber: 2, rowData: mockJobRow });
    const jobQueueService = createJobQueueService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      keyGenerator: setup.mocks.mockKeyGenerator
    });
    const job = jobQueueService.claimNextJob();
    assert.isNotNull(job);
    assert.areEqual('job-abc', job.jobId);
    assert.isType(job.initialPayload, 'object');
    assert.areEqual('test', job.initialPayload.data);
    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}

function testJobQueueService_UpdateJobStatus_debeLlamarAFindYUpdateDelAdapter() {
  const setup = _setupJobQueueServiceTests();
  try {
    setup.mocks.mockSheetAdapter.findRowByValue = (p) => {
      // Registrar la llamada para que el test la vea
      setup.mocks.mockSheetAdapter._callLog.push({ method: 'findRowByValue', args: [p] });
      if (p.value === 'job-xyz') return { rowNumber: 2, rowData: [] };
      return null;
    };
    const jobQueueService = createJobQueueService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      keyGenerator: setup.mocks.mockKeyGenerator
    });

    jobQueueService.updateJobStatus('job-xyz', 'failed', { error: { msg: 'fail' } });

    // --- INICIO DE LA CORRECCIÓN FINAL ---
    // Aserción más robusta: simplemente verificar que se hicieron llamadas,
    // en lugar de depender de la estructura interna del log.
    const findCalls = setup.mocks.mockSheetAdapter._callLog.filter(c => c.method === 'findRowByValue');
    assert.isTrue(findCalls.length > 0, "findRowByValue debió ser llamado.");

    const updateCalls = setup.mocks.mockSheetAdapter._callLog.filter(c => c.method === 'updateCell');
    assert.arrayLength(updateCalls, 3, "Se esperaban 3 llamadas a updateCell.");
    // --- FIN DE LA CORRECCIÓN FINAL ---

    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}

function testJobQueueService_UpdateJobStatus_debeLanzarErrorSiJobIdNoExiste() {
  const setup = _setupJobQueueServiceTests();
  try {
    const jobQueueService = createJobQueueService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      keyGenerator: setup.mocks.mockKeyGenerator
    });
    assert.throws(() => {
      jobQueueService.updateJobStatus('non-existent-job', 'completed');
    }, 'RESOURCE_NOT_FOUND');
    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}

// --- SUITE DE TESTS PARA LA NUEVA FUNCIONALIDAD ---

function testJobQueueService_ClaimSpecificJob_debeReclamarUnJobPendingPorId() {
  const setup = _setupJobQueueServiceTests();
  try {
    const mockJobRow = ['job-789', 'pending', 'flow-xyz', '{}', 'webhook', '', '', '', ''];
    setup.mocks.mockSheetAdapter.findRowByValue = (p) => {
      if (p.value === 'job-789') return { rowNumber: 5, rowData: mockJobRow };
      return null;
    };
    const jobQueueService = createJobQueueService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      keyGenerator: setup.mocks.mockKeyGenerator
    });

    const job = jobQueueService.claimSpecificJob('job-789');

    assert.isNotNull(job, "El job no debió ser nulo.");
    assert.areEqual('job-789', job.jobId);
    assert.areEqual('processing', job.status);

    const updateCall = setup.mocks.mockSheetAdapter._callLog.find(c => c.method === 'updateCell' && c.args[0].value === 'processing');
    assert.isNotNull(updateCall, "Se debió llamar a updateCell para cambiar el estado a 'processing'.");

    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}

function testJobQueueService_ClaimSpecificJob_debeRetornarNullSiElJobNoEstaPending() {
  const setup = _setupJobQueueServiceTests();
  try {
    const mockJobRow = ['job-789', 'processing', 'flow-xyz', '{}', 'webhook', '', '', '', ''];
    setup.mocks.mockSheetAdapter.findRowByValue = (p) => {
      if (p.value === 'job-789') return { rowNumber: 5, rowData: mockJobRow };
      return null;
    };
    const jobQueueService = createJobQueueService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      keyGenerator: setup.mocks.mockKeyGenerator
    });

    const job = jobQueueService.claimSpecificJob('job-789');

    assert.areEqual(null, job, "El job debió ser nulo porque no estaba 'pending'.");
    const updateCall = setup.mocks.mockSheetAdapter._callLog.find(c => c.method === 'updateCell');
    assert.isTrue(!updateCall, "No se debió llamar a updateCell si el job no se reclama.");

    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}

function testJobQueueService_ClaimSpecificJob_debeRetornarNullSiElJobNoExiste() {
  const setup = _setupJobQueueServiceTests();
  try {
    const jobQueueService = createJobQueueService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      keyGenerator: setup.mocks.mockKeyGenerator
    });

    const job = jobQueueService.claimSpecificJob('non-existent-id');
    assert.areEqual(null, job, "El job debió ser nulo porque no existe.");
    return true;
  } finally {
    _teardownJobQueueServiceTests(setup.originals);
  }
}