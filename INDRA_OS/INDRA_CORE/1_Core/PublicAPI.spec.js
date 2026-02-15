// ======================================================================
// ARTEFACTO: 1_Core/PublicAPI.spec.js (VERSIÓN FINAL Y ROBUSTA)
// ======================================================================

/**
 * Helper de Setup centralizado para todos los tests de PublicAPI.
 */
function _setupPublicAPITests() {
  const originals = {};

  const mocks = {
    mockCoreOrchestrator: {
      _callLog: [],
      executeFlow: function (flow, payload) { this._callLog.push({ method: 'executeFlow', args: [flow, payload] }); return { success: true, from: 'orchestrator' }; }
    },
    mockFlowRegistry: {
      _callLog: [],
      getFlow: function (flowId) { this._callLog.push({ method: 'getFlow', args: [flowId] }); return { id: flowId, steps: [] }; }
    },
    mockJobQueueService: {
      _callLog: [],
      claimNextJob: function () { this._callLog.push({ method: 'claimNextJob' }); return null; },
      claimSpecificJob: function (jobId) { this._callLog.push({ method: 'claimSpecificJob', args: [jobId] }); return null; },
      updateJobStatus: function (jobId, status, details) { this._callLog.push({ method: 'updateJobStatus', args: [jobId, status, details] }); }
    },
    mockMonitoringService: {
      _callLog: [],
      logDebug: function (m, d) { this._callLog.push({ method: 'logDebug', args: [m, d] }); },
      logInfo: function (m, d) { this._callLog.push({ method: 'logInfo', args: [m, d] }); },
      logWarn: function (m, d) { this._callLog.push({ method: 'logWarn', args: [m, d] }); },
      logError: function (m, d) { this._callLog.push({ method: 'logError', args: [m, d] }); },
      logEvent: function (eventData) { this._callLog.push({ method: 'logEvent', args: [eventData] }); },
      sendCriticalAlert: function (error, context) { this._callLog.push({ method: 'sendCriticalAlert', args: [error, context] }); }
    },
    mockErrorHandler: {
      createError: (c, m, d) => { const e = new Error(m); e.code = c; e.details = d; return e; }
    },
    mockManifest: {
      anchorPropertyKey: 'ROOT_ID',
      VERSION: '8.0.0-TEST',
      driveSchema: { templatesFolder: { path: 'Templates' }, outputFolder: { path: 'Output' } },
      schemas: {
        dummy: { description: "Sovereign Mock Schema", io_interface: { inputs: {}, outputs: {} } }
      },
      getMCEPManifest: () => ({ version: "8.0.0-TEST", modelTooling: "enabled" })
    },
    mockDriveAdapter: {
      resolvePath: (p) => ({ folderId: `mock-path-${p.path}-id` })
    },
    mockConfigurator: {
      label: "Mock Configurator",
      description: "Mocked configuration provider for industrial tests.",
      semantic_intent: "PROBE",
      schemas: {
        retrieveParameter: { description: "Retrieves a system parameter.", io_interface: { inputs: { key: { type: 'string' } }, outputs: { value: { type: 'any' } } } }
      },
      retrieveParameter: (p) => {
        if (p.key === 'DEPLOYMENT_URL') return 'https://script.google.com/macros/s/test-deployment/exec';
        if (p.key === 'INDRA_CORE_ROOT_ID') return 'mock-root-folder-id';
        return 'mock-root-id';
      },
      getAllParameters: () => ({ DEPLOYMENT_URL: 'https://test.com', INDRA_CORE_ROOT_ID: 'root-123' }),
      isInSafeMode: () => false
    },
    mockTokenManager: {
      label: "Mock Token Manager",
      description: "Mocked token provider for industrial tests.",
      semantic_intent: "GATE",
      schemas: {
        getToken: { description: "Retrieves a technical token.", io_interface: { inputs: { provider: { type: 'string' } }, outputs: { token: { type: 'object' } } } }
      },
      getToken: (p) => ({ apiKey: 'mock-api-key' }),
      listTokenAccounts: (p) => [],
      listTokenProviders: () => ['notion', 'llm'],
      upsertToken: () => true,
      deleteToken: () => true
    },
    mockSystemContext: { user: { email: 'test@Indra.com' }, system: { version: '1.0' } },
    mockSensing: {
      label: "Mock Sensing Adapter",
      description: "Mocked sensing provider for forensic tests.",
      semantic_intent: "SENSOR",
      archetype: "ADAPTER",
      _callLog: [],
      schemas: {
        scanArtifacts: {
          description: "Industrial scan of technical artifacts.",
          semantic_intent: "SENSOR",
          io_interface: {
            inputs: { folderId: { type: 'string', role: "GATE", description: "Target folder identifier for scan." } },
            outputs: { artifacts: { type: 'array', role: "STREAM", description: "Collection of discovered artifacts." } }
          }
        },
        saveSnapshot: {
          description: "Persists a forensic state snapshot to storage.",
          semantic_intent: "STREAM",
          io_interface: {
            inputs: {
              type: { type: 'string', role: "SCHEMA", description: "Snapshot type classification." },
              content: { type: 'object', role: "STREAM", description: "Payload to persist." }
            },
            outputs: { success: { type: 'boolean', role: "PROBE", description: "Persistence status." } }
          }
        }
      },
      scanArtifacts: function (input) { this._callLog.push({ method: 'scanArtifacts', args: [input] }); return []; },
      saveSnapshot: function (payload) { this._callLog.push({ method: 'saveSnapshot', args: [payload] }); return { success: true }; }
    },
    mockGatekeeper: {
      label: "Mock Gatekeeper",
      description: "Mocked gatekeeper for tests.",
      schemas: {
        getAffinity: { description: "Calculates semantic affinity.", io_interface: { inputs: { source: { type: 'object' }, target: { type: 'object' } }, outputs: { affinityScore: { type: 'number' } } } },
        validateAllContracts: { description: "Validates all registered contracts.", io_interface: { inputs: {}, outputs: { isValid: { type: 'boolean' } } } }
      },
      validateAllContracts: function () {
        this._callLog.push({ method: 'validateAllContracts' });
        return { isValid: true, criticalErrors: [], warnings: [], auditedModules: 10 };
      },
      getAffinity: function (args) {
        this._callLog.push({ method: 'getAffinity', args: [args] });
        return { affinityScore: 1.0, compatible: true, securityWarnings: [] };
      },
      canExecute: function (t, m, c) {
        this._callLog.push({ method: 'canExecute', args: [t, m, c] });
        return true;
      }
    },
    mockBlueprintRegistry: {
      label: "Mock Blueprint Registry",
      description: "Mocked blueprint registry for tests.",
      _callLog: [],
      validatePayload: function (p, s) {
        this._callLog.push({ method: 'validatePayload', args: [p, s] });
        if (p && p.folderId === 'INVALID') return { isValid: false, errors: ['Invalid ID'] };
        return { isValid: true, errors: [] };
      }
    },

  };

  return { mocks, originals };
}

/**
 * Helper de Teardown.
 */
function _teardownPublicAPITests(originals) {
  // No hay globales que restaurar
}

// ============================================================
// SUITE DE TESTS PARA PUBLICAPI
// ============================================================

/**
 * Crea una instancia de PublicAPI con todas las dependencias mockeadas.
 */
function _createMockedPublicApi(setup) {
  return createPublicAPI({
    coreOrchestrator: setup.mocks.mockCoreOrchestrator,
    flowRegistry: setup.mocks.mockFlowRegistry,
    jobQueueService: setup.mocks.mockJobQueueService,
    monitoringService: setup.mocks.mockMonitoringService,
    errorHandler: setup.mocks.mockErrorHandler,
    manifest: setup.mocks.mockManifest,
    driveAdapter: setup.mocks.mockDriveAdapter,
    configurator: setup.mocks.mockConfigurator,
    gatekeeper: setup.mocks.mockGatekeeper,
    blueprintRegistry: setup.mocks.mockBlueprintRegistry,
    laws: { axioms: LOGIC_AXIOMS },
    mcepCore: {
      getModelTooling: () => ({ tools: [] })
    },

    nodes: {
      sensing: setup.mocks.mockSensing,
      tokenManager: setup.mocks.mockTokenManager,
      config: setup.mocks.mockConfigurator,
      intelligence: {
        label: "Mock Intelligence",
        description: "Mocked intelligence orchestrator for tests.",
        semantic_intent: "ORCHESTRATOR",
        archetype: "SYSTEM_INFRA",
        schemas: {
          processRequest: { description: "Technical processing.", io_interface: { inputs: { q: { type: 'string' } } } }
        },
        generateDigest: () => ({ summary: "Mock digest" }),
        processRequest: () => ({ response: "Mock response" })
      },
      gatekeeper: setup.mocks.mockGatekeeper
    }
  });
}

function testPublicAPI_PhaseL1_BootstrapHalt() {
  const setup = _setupPublicAPITests();
  try {
    // Simulamos fallo crítico de coherencia (menos del 70%, ajustado en PublicAPI)
    // Al pasar solo el nodo 'sensing' sin schemas, la coherencia caerá.
    setup.mocks.mockSensing.schemas = {};
    // AXIOMA: Degradar más nodos para bajar < 70% de coherencia (con 5 nodos: public, sensing, token, config, intelligence)
    // 4 validos / 5 total = 80% -> PASS
    // Necesitamos bajar a 3/5 (60%) o menos.
    setup.mocks.mockTokenManager.schemas = {};
    setup.mocks.mockConfigurator.schemas = {};
    setup.mocks.mockGatekeeper.schemas = {}; // Si se usara


    const publicApi = _createMockedPublicApi(setup);
    const report = publicApi.getGovernanceReport();
    assert.isFalse(report.isValid, "System should be invalid with zero schemas.");

    console.log("✅ testPublicAPI_PhaseL1_BootstrapHalt passed (System reported as invalid).");
    return true;
  } finally {
    _teardownPublicAPITests(setup.originals);
  }
}

function testPublicAPI_PhaseL2_SecurePipe_StructuralBlock() {
  const setup = _setupPublicAPITests();
  try {
    const publicApi = _createMockedPublicApi(setup);

    // Intentamos llamar a un método con input inválido vía executeAction (Polimorfismo)
    const result = publicApi.executeAction({
      action: 'sensing:scanArtifacts',
      payload: { folderId: 'INVALID' }
    });

    assert.isFalse(result.success, "Should fail securely");
    assert.isTrue(result.error.includes('STRUCTURAL_BLOCK') || result.error_code === 'STRUCTURAL_BLOCK', "Error should match STRUCTURAL_BLOCK");

    // Verificamos que el adaptador subyacente NUNCA fue llamado
    assert.arrayLength(setup.mocks.mockSensing._callLog, 0, "El adaptador no debió ser llamado tras fallo de contrato.");

    console.log("✅ testPublicAPI_PhaseL2_SecurePipe_StructuralBlock passed.");
    return true;
  } finally {
    _teardownPublicAPITests(setup.originals);
  }
}

function testPublicAPI_PhaseL4_GovernanceReport() {
  const setup = _setupPublicAPITests();
  try {
    const publicApi = _createMockedPublicApi(setup);
    const report = publicApi.getGovernanceReport();

    assert.isDefined(report.coherenceIndex, "Debe reportar índice de coherencia");
    assert.areEqual(100, report.coherenceIndex, "Coherencia debe ser 100% con mocks limpios");
    assert.isTrue(report.isValid, "isValid debe ser true");

    console.log("✅ testPublicAPI_PhaseL4_GovernanceReport passed.");
    return true;
  } finally {
    _teardownPublicAPITests(setup.originals);
  }
}

function testPublicAPI_PhaseL5_SemanticAffinity() {
  const setup = _setupPublicAPITests();
  try {
    const publicApi = _createMockedPublicApi(setup);
    const res = publicApi.getSemanticAffinity({ source: {}, target: {} });

    assert.isDefined(res.payload.affinityScore);
    // AXIOMA v8.0: Sovereign Auto-Approval (Ya no consultamos gatekeepers externos)
    assert.areEqual(res.payload.affinityScore, 1, "Sovereign affinity should default to 1.");
    assert.areEqual(res.payload.justification, "Sovereign Auto-Approval", "Justification should match sovereign standard.");

    console.log("✅ testPublicAPI_PhaseL5_SemanticAffinity passed (now using Gatekeeper v12.0).");
    return true;
  } finally {
    _teardownPublicAPITests(setup.originals);
  }
}

function testPublicAPI_Invoke_debeDelegarAFlujoYOrquestador() {
  const setup = _setupPublicAPITests();
  try {
    const publicApi = _createMockedPublicApi(setup);
    const initialPayload = { data: 'test' };

    publicApi.invoke({
      flowId: 'test-flow',
      initialPayload: initialPayload,
      systemContext: setup.mocks.mockSystemContext
    });

    assert.arrayLength(setup.mocks.mockFlowRegistry._callLog, 1, 'getFlow debió ser llamado una vez.');
    assert.arrayLength(setup.mocks.mockCoreOrchestrator._callLog, 1, 'executeFlow debió ser llamado una vez.');

    return true;
  } finally {
    _teardownPublicAPITests(setup.originals);
  }
}

function testPublicAPI_Invoke_debeRelanzarErrores() {
  const setup = _setupPublicAPITests();
  try {
    const publicApi = _createMockedPublicApi(setup);
    setup.mocks.mockCoreOrchestrator.executeFlow = () => { throw new Error('Flow execution failed'); };

    assert.throws(() => {
      publicApi.invoke({
        flowId: 'test-flow',
        initialPayload: {},
        systemContext: setup.mocks.mockSystemContext
      });
    }, 'Flow execution failed');

    return true;
  } finally {
    _teardownPublicAPITests(setup.originals);
  }
}

// [REPLACED BY executeAction TESTS]


function testPublicAPI_GetSystemStatus_debeRetornarConfiguracionDelCore() {
  const setup = _setupPublicAPITests();
  try {
    const publicApi = _createMockedPublicApi(setup);
    const health = publicApi.getSystemStatus();

    assert.areEqual('healthy', health.status);
    assert.isDefined(health.coherenceIndex, "Health debe incluir el índice de coherencia");

    return true;
  } finally {
    _teardownPublicAPITests(setup.originals);
  }
}





