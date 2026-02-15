// ======================================================================
// ARTEFACTO: 2_Services/FlowRegistry.spec.js (CONTRATO ALINEADO)
// ======================================================================

function _setupFlowRegistryTests() {
  const originals = {
    CacheService: globalThis.CacheService
  };

  const cacheStorage = {};

  const mocks = {
    mockManifest: {
      ANCHOR_PROPERTY: 'TEST_ROOT_ID',
      DRIVE_SCHEMA: {
        JSON_FLOWS_FOLDER: { PATH: 'MyFlows' },
        FLOWS: { PATH: 'MyFlows' }
      }
    },
    mockDriveAdapter: {
      _callLog: [],
      resolvePath: (p) => { mocks.mockDriveAdapter._callLog.push({ method: 'resolvePath', args: [p] }); return { folderId: 'mock-flows-folder' }; },
      retrieve: (p) => { mocks.mockDriveAdapter._callLog.push({ method: 'retrieve', args: [p] }); return { content: { id: 'test-flow' } }; },
      store: (p) => { mocks.mockDriveAdapter._callLog.push({ method: 'store', args: [p] }); return { fileId: 'new-file-id', name: p.fileName }; },
      find: (p) => { mocks.mockDriveAdapter._callLog.push({ method: 'find', args: [p] }); return { foundItems: [{ name: 'flow1.json' }, { name: 'flow2.json' }] }; }
    },
    mockConfigurator: {
      _callLog: [],
      // --- INTERVENCIÓN: Actualizar a la firma de payload ---
      retrieveParameter: (payload) => {
        mocks.mockConfigurator._callLog.push({ method: 'retrieveParameter', args: [payload] });
        if (!payload || !payload.key) return null;
        if (payload.key === 'TEST_ROOT_ID') return 'mock-root-id';
        if (payload.key.startsWith && payload.key.startsWith('TEST_ROOT_ID')) return 'mock-folder-id';
        return null; // Fallback for missing keys
      }
    },
    mockErrorHandler: {
      createError: (code, msg) => { const e = new Error(msg); e.code = code; return e; }
    },
    mockCache: {
      _storage: cacheStorage,
      get: function (key) { return this._storage[key] || null; },
      put: function (key, val, exp) { this._storage[key] = val; },
      remove: function (key) { delete this._storage[key]; }
    }
  };

  globalThis.CacheService = {
    getScriptCache: () => mocks.mockCache
  };

  return { mocks, originals };
}

function _teardownFlowRegistryTests(originals) {
  globalThis.CacheService = originals.CacheService;
}

// ============================================================
// SUITE DE TESTS PARA FLOWREGISTRY
// ============================================================

/**
 * VR-S-1: Probar que la fábrica falla si el sistema no está anclado.
 */
function testFlowRegistry_Inicializacion_debeFallarSiElSistemaNoEstaAnclado() {
  const setup = _setupFlowRegistryTests();
  try {
    // Arrange: Simular que el root ID no está configurado
    setup.mocks.mockConfigurator.retrieveParameter = () => null;

    // Act & Assert: Ahora la construcción misma debe fallar
    // FIX SECUNDARIO D: Esperar código de error DADC
    assert.throws(() => {
      createFlowRegistry({
        manifest: setup.mocks.mockManifest,
        driveAdapter: setup.mocks.mockDriveAdapter,
        configurator: setup.mocks.mockConfigurator,
        errorHandler: setup.mocks.mockErrorHandler
      });
    }, 'CONFIGURATION_ERROR');

    return true;
  } finally {
    _teardownFlowRegistryTests(setup.originals);
  }
}

/**
 * VR-F-1 (Cache Miss): Probar que `getFlow` lee de DriveAdapter cuando el caché está vacío.
 */
function testFlowRegistry_GetFlow_debeLeerDeDriveEnCacheMiss() {
  const setup = _setupFlowRegistryTests();
  try {
    const flowRegistry = createFlowRegistry({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler
    });

    const flow = flowRegistry.getFlow('test-flow');

    const retrieveCall = setup.mocks.mockDriveAdapter._callLog.find(c => c.method === 'retrieve');
    assert.isNotNull(retrieveCall, 'driveAdapter.retrieve debió ser llamado.');
    assert.areEqual('mock-flows-folder', retrieveCall.args[0].folderId);

    assert.areEqual('test-flow', flow.id, 'El objeto de flujo retornado es incorrecto.');
    assert.isNotNull(setup.mocks.mockCache._storage['flow_test-flow'], 'El resultado debió ser guardado en caché.');

    return true;
  } finally {
    _teardownFlowRegistryTests(setup.originals);
  }
}

/**
 * VR-F-1 (Cache Hit): Probar que `getFlow` lee del caché y no de DriveAdapter.
 */
function testFlowRegistry_GetFlow_debeUsarElCacheEnCacheHit() {
  const setup = _setupFlowRegistryTests();
  try {
    const flowRegistry = createFlowRegistry({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler
    });
    setup.mocks.mockCache._storage['flow_cached-flow'] = '{"id":"from-cache"}';

    const flow = flowRegistry.getFlow('cached-flow');

    const retrieveCall = setup.mocks.mockDriveAdapter._callLog.find(c => c.method === 'retrieve');
    assert.isTrue(retrieveCall === undefined, 'driveAdapter.retrieve NO debió ser llamado en un cache hit.');

    assert.areEqual('from-cache', flow.id, 'Debió retornar el objeto del caché.');

    return true;
  } finally {
    _teardownFlowRegistryTests(setup.originals);
  }
}

/**
 * Probar que `getFlow` lanza RESOURCE_NOT_FOUND si el archivo no existe.
 */
function testFlowRegistry_GetFlow_debeFallarSiFlujoNoExiste() {
  const setup = _setupFlowRegistryTests();
  try {
    const flowRegistry = createFlowRegistry({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler
    });
    setup.mocks.mockDriveAdapter.retrieve = () => ({ content: null });

    assert.throws(() => {
      flowRegistry.getFlow('non-existent-flow');
    }, 'RESOURCE_NOT_FOUND');

    return true;
  } finally {
    _teardownFlowRegistryTests(setup.originals);
  }
}

/**
 * VR-F-2: Probar que `saveFlow` delega a `driveAdapter.store` e invalida el caché.
 */
function testFlowRegistry_SaveFlow_debeDelegarAStoreEInvalidarCache() {
  const setup = _setupFlowRegistryTests();
  try {
    const flowRegistry = createFlowRegistry({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler
    });
    setup.mocks.mockCache._storage['flow_flow-to-save'] = '{"id":"old-data"}';
    const flowObject = { id: 'new-data', steps: [] };

    const result = flowRegistry.saveFlow('flow-to-save', flowObject);

    const storeCall = setup.mocks.mockDriveAdapter._callLog.find(c => c.method === 'store');
    assert.isNotNull(storeCall, 'driveAdapter.store debió ser llamado.');

    assert.isFalse(setup.mocks.mockCache._storage.hasOwnProperty('flow_flow-to-save'), 'El caché para el flujo debió ser invalidado.');
    assert.areEqual('new-file-id', result.fileId);

    return true;
  } finally {
    _teardownFlowRegistryTests(setup.originals);
  }
}

/**
 * Probar que `listFlows` delega a `driveAdapter.find` y procesa los resultados.
 */
function testFlowRegistry_ListFlows_debeDelegarAFindYProcesarResultados() {
  const setup = _setupFlowRegistryTests();
  try {
    const flowRegistry = createFlowRegistry({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler
    });

    const flowIds = flowRegistry.listFlows();

    const findCall = setup.mocks.mockDriveAdapter._callLog.find(c => c.method === 'find');
    assert.isNotNull(findCall, 'driveAdapter.find debió ser llamado.');

    assert.arrayLength(flowIds, 2);
    assert.arrayContains(flowIds, 'flow1');
    assert.arrayContains(flowIds, 'flow2');

    return true;
  } finally {
    _teardownFlowRegistryTests(setup.originals);
  }
}





