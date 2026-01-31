// ======================================================================
// ARTEFACTO: 0_Entrypoints/Triggers.spec.js (REFACTORIZADO PARA "BOOMERANG")
// ======================================================================

function _setupTriggersTests() {
  const originals = {
    LockService: globalThis.LockService,
    console: globalThis.console,
    ScriptApp: globalThis.ScriptApp,
    Session: globalThis.Session,
    _assembleExecutionStack: globalThis._assembleExecutionStack,
    // --- NUEVO: Necesitamos acceso a la función privada para probarla ---
    _processJobById: globalThis._processJobById
  };

  const mocks = {
    mockLock: {
      _callLog: [], _hasLock: false,
      tryLock: function(t) { this._callLog.push('tryLock'); if (this._hasLock) return false; this._hasLock = true; return true; },
      hasLock: function() { return this._hasLock; },
      releaseLock: function() { this._callLog.push('releaseLock'); this._hasLock = false; }
    },
    mockConsole: { _callLog: [], log: function(m){}, warn: function(m){}, error: function(...args){} },
    mockScriptApp: {
      _triggers: [], _callLog: { getProjectTriggers: 0, deleteTrigger: 0 },
      getProjectTriggers: function() { this._callLog.getProjectTriggers++; return this._triggers.map(t => ({ getHandlerFunction: () => t.handler, getTriggerSource: () => t.source, getUniqueId: () => t.id })); },
      deleteTrigger: function(t) { this._callLog.deleteTrigger++; },
      TriggerSource: { CLOCK: 'CLOCK' }
    },
    // --- INICIO DE LA CORRECCIÓN: Mocks para las nuevas dependencias ---
    mockJobQueueService: {
      _callLog: [],
      claimSpecificJob: function(jobId) { this._callLog.push({ method: 'claimSpecificJob', args: [jobId] }); return null; }
    },
    mockPublicApi: {
      _callLog: [],
      processNextJobInQueue: function() { this._callLog.push({ method: 'processNextJobInQueue' }); },
      processSpecificJob: function(job) { this._callLog.push({ method: 'processSpecificJob', args: [job] }); }
    }
    // --- FIN DE LA CORRECCIÓN ---
  };
  
  globalThis.Session = { getEffectiveUser: () => ({ getEmail: () => '' }), getActiveUser: () => ({ getEmail: () => '' }) };
  globalThis.LockService = { getScriptLock: () => mocks.mockLock };
  globalThis.console = mocks.mockConsole;
  globalThis.ScriptApp = mocks.mockScriptApp;

  globalThis._assembleExecutionStack = () => ({
    publicApi: mocks.mockPublicApi,
    jobQueueService: mocks.mockJobQueueService // <-- Devolver el mock
  });

  return { mocks, originals };
}

function _teardownTriggersTests(originals) {
  Object.keys(originals).forEach(key => {
    globalThis[key] = originals[key];
  });
}

// ============================================================
// SUITE DE TESTS PARA LA NUEVA ARQUITECTURA "BOOMERANG"
// ============================================================

function testTriggers_ProcessJobById_debeAdquirirCandadoYReclamarJob() {
  const setup = _setupTriggersTests();
  try {
    const testJob = { jobId: 'job-xyz' };
    setup.mocks.mockJobQueueService.claimSpecificJob = (jobId) => {
        setup.mocks.mockJobQueueService._callLog.push({ method: 'claimSpecificJob', args: [jobId] });
        return testJob;
    };

    // Llamar a la función privada directamente para probarla
    _processJobById('job-xyz');

    assert.isTrue(setup.mocks.mockLock._callLog.includes('tryLock'), "tryLock debió ser invocado.");
    assert.arrayLength(setup.mocks.mockJobQueueService._callLog, 1, "claimSpecificJob debió ser llamado una vez.");
    assert.areEqual('job-xyz', setup.mocks.mockJobQueueService._callLog[0].args[0]);
    assert.arrayLength(setup.mocks.mockPublicApi._callLog, 1, "publicApi.processSpecificJob debió ser llamado.");
    assert.areEqual(testJob, setup.mocks.mockPublicApi._callLog[0].args[0]);
    assert.isTrue(setup.mocks.mockLock._callLog.includes('releaseLock'), "releaseLock debió ser invocado.");

    return true;
  } finally {
    _teardownTriggersTests(setup.originals);
  }
}

function testTriggers_ProcessJobById_noDebeProcesarSiElJobYaFueReclamado() {
  const setup = _setupTriggersTests();
  try {
    // claimSpecificJob retorna null por defecto en el mock
    
    _processJobById('job-already-claimed');

    assert.arrayLength(setup.mocks.mockJobQueueService._callLog, 1, "claimSpecificJob debió ser llamado.");
    assert.arrayLength(setup.mocks.mockPublicApi._callLog, 0, "publicApi.processSpecificJob NO debió ser llamado.");
    assert.isTrue(setup.mocks.mockLock._callLog.includes('releaseLock'), "releaseLock debió ser invocado igualmente.");

    return true;
  } finally {
    _teardownTriggersTests(setup.originals);
  }
}

function testTriggers_doPostWorkerCallback_debeExtraerJobIdYDelegar() {
  const setup = _setupTriggersTests();
  try {
    let calledWithJobId = null;
    // Interceptar la llamada a la función privada que queremos probar
    globalThis._processJobById = (jobId) => {
        calledWithJobId = jobId;
    };
    
    const mockEvent = {
        postData: {
            contents: JSON.stringify({ jobId: 'callback-job-123' })
        }
    };
    
    doPost_Worker_Callback(mockEvent);

    assert.areEqual('callback-job-123', calledWithJobId, "No se delegó el jobId correcto.");

    return true;
  } finally {
    _teardownTriggersTests(setup.originals);
  }
}

// ============================================================
// SUITE DE TESTS DE LEGADO (Para retrocompatibilidad)
// ============================================================

function testTriggers_processSingleJobTrigger_debeDelegarAPublicApi() {
  const setup = _setupTriggersTests();
  try {
    processSingleJobTrigger();
    assert.arrayLength(setup.mocks.mockPublicApi._callLog, 1, 'PublicAPI.processNextJobInQueue debió ser llamado una vez.');
    assert.areEqual('processNextJobInQueue', setup.mocks.mockPublicApi._callLog[0].method);
    return true;
  } finally {
    _teardownTriggersTests(setup.originals);
  }
}