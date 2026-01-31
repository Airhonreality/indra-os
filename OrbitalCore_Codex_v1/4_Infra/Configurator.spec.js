// ======================================================================
// ARTEFACTO: 4_Infra/Configurator.spec.js (CONTRATO ALINEADO)
// PROPÓSITO: Suite de tests unitarios COMPLETA y NATIVA para Configurator.gs.
// ESTRATEGIA: Verificar la lógica de almacenamiento y recuperación usando
//             la nueva firma de método basada en objetos 'payload'.
// ======================================================================

/**
 * Helper de Setup centralizado para todos los tests de Configurator.
 */
function _setupConfiguratorTests() {
  const originals = {
    PropertiesService: globalThis.PropertiesService
  };

  // Simulación en memoria de PropertiesService
  const storage = {};

  const mocks = {
    mockErrorHandler: {
      createError: (code, msg, details) => {
        const e = new Error(msg);
        e.code = code;
        e.details = details;
        return e;
      }
    },
    mockProperties: {
      getProperty: (key) => storage[key] || null,
      setProperty: (key, value) => { storage[key] = String(value); },
      deleteProperty: (key) => { delete storage[key]; }
    },
    _state: {
      storage
    }
  };

  globalThis.PropertiesService = {
    getScriptProperties: () => mocks.mockProperties
  };

  return { mocks, originals };
}

/**
 * Helper de Teardown para restaurar el estado global.
 */
function _teardownConfiguratorTests(originals) {
  globalThis.PropertiesService = originals.PropertiesService;
}

// ============================================================
// SUITE DE TESTS PARA CONFIGURATOR
// ============================================================

/**
 * VR-X-1.1 & VR-X-2.1: Probar el ciclo completo de escritura y lectura.
 */
function testConfigurator_CicloDeVida_debeAlmacenarYRecuperarUnParametro() {
  const setup = _setupConfiguratorTests();
  const mockManifest = { requiredConnections: {} };
  try {
    const configurator = createConfigurator({ manifest: mockManifest, errorHandler: setup.mocks.mockErrorHandler });
    const testKey = 'core:MY_API_KEY';
    const testValue = 'secret-12345';

    // --- INICIO DE INTERVENCIÓN: Usar la nueva firma ---
    configurator.storeParameter({ key: testKey, value: testValue });
    const retrievedValue = configurator.retrieveParameter({ key: testKey });
    // --- FIN DE INTERVENCIÓN ---

    assert.areEqual(testValue, retrievedValue, 'El valor recuperado no coincide con el valor almacenado.');
    return true;
  } finally {
    _teardownConfiguratorTests(setup.originals);
  }
}

/**
 * VR-X-2.2: Probar que `retrieveParameter` para una clave inexistente retorna `null`.
 */
function testConfigurator_RetrieveParameter_debeRetornarNullParaUnaClaveInexistente() {
  const setup = _setupConfiguratorTests();
  const mockManifest = { requiredConnections: {} };
  try {
    const configurator = createConfigurator({ manifest: mockManifest, errorHandler: setup.mocks.mockErrorHandler });

    // --- INICIO DE INTERVENCIÓN: Usar la nueva firma ---
    const retrievedValue = configurator.retrieveParameter({ key: 'core:NON_EXISTENT_KEY' });
    // --- FIN DE INTERVENCIÓN ---

    assert.areEqual(null, retrievedValue, 'Debe retornar null para una clave que no existe.');
    return true;
  } finally {
    _teardownConfiguratorTests(setup.originals);
  }
}

/**
 * VR-X-3.1: Probar que `getConfigurationStatus` con todas las claves presentes retorna `{ isComplete: true, missingKeys: [] }`.
 */
function testConfigurator_GetConfigurationStatus_debeRetornarCompletoSiTodasLasClavesExisten() {
  const setup = _setupConfiguratorTests();
  const mockManifest = { requiredConnections: {} };
  try {
    const configurator = createConfigurator({ manifest: mockManifest, errorHandler: setup.mocks.mockErrorHandler });
    setup.mocks._state.storage['core:KEY_1'] = 'value1';
    setup.mocks._state.storage['core:KEY_2'] = 'value2';
    const requiredKeys = ['core:KEY_1', 'core:KEY_2'];

    const status = configurator.getConfigurationStatus(requiredKeys);

    assert.isTrue(status.isComplete, 'isComplete debe ser true cuando todas las claves existen.');
    assert.arrayLength(status.missingKeys, 0, 'missingKeys debe ser un array vacío.');

    return true;
  } finally {
    _teardownConfiguratorTests(setup.originals);
  }
}

/**
 * VR-X-3.2: Probar que `getConfigurationStatus` con claves faltantes retorna `{ isComplete: false, missingKeys: [...] }`.
 */
function testConfigurator_GetConfigurationStatus_debeRetornarIncompletoConLasClavesFaltantes() {
  const setup = _setupConfiguratorTests();
  const mockManifest = { requiredConnections: {} };
  try {
    const configurator = createConfigurator({ manifest: mockManifest, errorHandler: setup.mocks.mockErrorHandler });
    setup.mocks._state.storage['core:KEY_1'] = 'value1';
    const requiredKeys = ['core:KEY_1', 'core:MISSING_KEY_A', 'core:MISSING_KEY_B'];

    const status = configurator.getConfigurationStatus(requiredKeys);

    assert.isFalse(status.isComplete, 'isComplete debe ser false cuando faltan claves.');
    assert.arrayLength(status.missingKeys, 2, 'Debe reportar 2 claves faltantes.');
    assert.arrayContains(status.missingKeys, 'core:MISSING_KEY_A');
    assert.arrayContains(status.missingKeys, 'core:MISSING_KEY_B');

    return true;
  } finally {
    _teardownConfiguratorTests(setup.originals);
  }
}

/**
 * Probar que la validación de `storeParameter` rechaza una clave inválida en el payload.
 */
function testConfigurator_Validacion_storeParameterDebeRechazarPayloadInvalido() {
  const setup = _setupConfiguratorTests();
  const mockManifest = { requiredConnections: {} };
  try {
    const configurator = createConfigurator({ manifest: mockManifest, errorHandler: setup.mocks.mockErrorHandler });

    // FIX CRÍTICO B & C: Todas las aserciones deben esperar el código de error correcto
    assert.throws(() => {
      configurator.storeParameter({ key: null, value: 'value' });
    }, 'NAMESPACE_ERROR');

    assert.throws(() => {
      configurator.storeParameter({ key: '   ', value: 'value' });
    }, 'NAMESPACE_ERROR');

    assert.throws(() => {
      configurator.storeParameter({ key: 'NO_PREFIX', value: 'value' });
    }, 'NAMESPACE_ERROR');

    return true;
  } finally {
    _teardownConfiguratorTests(setup.originals);
  }
}

/**
 * Probar que la validación de `storeParameter` rechaza un valor que no es string en el payload.
 */
function testConfigurator_Validacion_storeParameterDebeRechazarValorNoString() {
  const setup = _setupConfiguratorTests();
  const mockManifest = { requiredConnections: {} };
  try {
    const configurator = createConfigurator({ manifest: mockManifest, errorHandler: setup.mocks.mockErrorHandler });

    // FIX CRÍTICO C: Esperar código DADC en lugar de mensaje literal
    assert.throws(() => {
      configurator.storeParameter({ key: 'core:MY_KEY', value: 123 });
    }, 'CONFIGURATION_ERROR');

    assert.throws(() => {
      configurator.storeParameter({ key: 'core:MY_KEY', value: { a: 1 } });
    }, 'CONFIGURATION_ERROR');

    assert.throws(() => {
      configurator.storeParameter({ key: 'core:MY_KEY', value: null });
    }, 'CONFIGURATION_ERROR');

    assert.throws(() => {
      configurator.storeParameter({ key: 'core:MY_KEY', value: undefined });
    }, 'CONFIGURATION_ERROR');


    return true;
  } finally {
    _teardownConfiguratorTests(setup.originals);
  }
}

/**
 * Test para la capa de compatibilidad: debe redirigir a TokenManager si la clave es _API_KEY y no existe en PS.
 */
function testConfigurator_BackwardCompatibility_debeRedirigirATokenManager() {
  const setup = _setupConfiguratorTests();
  const mockManifest = {
    requiredConnections: {
      'NOTION_API_KEY': { legacyKey: 'NOTION_API_KEY', provider: 'notion' }
    }
  };
  try {
    const mockTokenManager = {
      getToken: ({ provider }) => {
        if (provider === 'notion') {
          return { apiKey: 'token-legacy-notion' };
        }
        return null;
      }
    };

    const configurator = createConfigurator({ manifest: mockManifest, errorHandler: setup.mocks.mockErrorHandler });
    configurator.setTokenManager(mockTokenManager);

    // CASO 1: Clave _API_KEY inexistente -> Redirige
    const valueNotion = configurator.retrieveParameter({ key: 'NOTION_API_KEY' });
    assert.areEqual('token-legacy-notion', valueNotion, 'Debe retornar el token desde TokenManager');

    // CASO 2: Clave _API_KEY existente en PS -> NO redirige, usa valor de PS
    setup.mocks._state.storage['NOTION_API_KEY'] = 'direct-ps-value';
    const valueDirect = configurator.retrieveParameter({ key: 'NOTION_API_KEY' });
    assert.areEqual('direct-ps-value', valueDirect, 'Debe retornar el valor directo de PropertiesService si existe');

    // CASO 3: Clave que NO termina en _API_KEY -> No redirige
    const valueOther = configurator.retrieveParameter({ key: 'OTHER_KEY' });
    assert.isNull(valueOther, 'No debe redirigir si no es _API_KEY');

    return true;
  } finally {
    _teardownConfiguratorTests(setup.originals);
  }
}