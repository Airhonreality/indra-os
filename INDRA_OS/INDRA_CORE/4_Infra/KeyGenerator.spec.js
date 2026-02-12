// ======================================================================
// ARTEFACTO: 4_Infra/KeyGenerator.spec.js (VERSIÓN CONFORME AL AXIOMA 3.16)
// ======================================================================

/**
 * Helper de Setup para todos los tests de KeyGenerator.
 * Reemplaza el objeto global 'Utilities' con un mock.
 */
function _setupKeyGeneratorTests() {
  const originals = {
    Utilities: globalThis.Utilities
  };

  // Usar un objeto plano para el mock y delegar/copiar métodos del original
  const mockUtilities = {};

  const methodsToPreserve = [
    'newBlob', 'getUuid'
  ];

  methodsToPreserve.forEach(m => {
    if (globalThis._SATTVA_NATIVE?.Utilities?.[m]) {
      mockUtilities[m] = globalThis._SATTVA_NATIVE.Utilities[m];
    } else if (globalThis.Utilities?.[m]) {
      mockUtilities[m] = globalThis.Utilities[m].bind(globalThis.Utilities);
    }
  });

  mockUtilities.CryptoAlgorithm = globalThis._SATTVA_NATIVE?.Utilities?.CryptoAlgorithm || globalThis.Utilities?.CryptoAlgorithm || { AES_CBC_256: 'AES_CBC_256' };
  mockUtilities.DigestAlgorithm = globalThis._SATTVA_NATIVE?.Utilities?.DigestAlgorithm || globalThis.Utilities?.DigestAlgorithm || { SHA_256: 'SHA_256' };
  mockUtilities._callLog = [];

  // Interceptar getUuid para logging y mockeo
  mockUtilities.getUuid = function () {
    this._callLog.push(1);
    return 'mock-uuid-123456789';
  };

  globalThis.Utilities = mockUtilities;

  return { originals, mockUtilities };
}

/**
 * Helper de Teardown para restaurar el estado global.
 */
function _teardownKeyGeneratorTests(originals) {
  globalThis.Utilities = originals.Utilities;
}

// --- SUITE DE TESTS ---

/**
 * VR-S-1: Probar que la fábrica crea una instancia válida.
 */
function testKeyGenerator_Creacion_debeCrearInstanciaConMetodo() {
  const setup = _setupKeyGeneratorTests();
  try {
    // Act
    const keyGenerator = createKeyGenerator();

    // Assert
    assert.isNotNull(keyGenerator, "La instancia no debe ser nula.");
    assert.hasProperty(keyGenerator, 'generateUUID', "La instancia debe tener el método 'generateUUID'.");
    assert.isType(keyGenerator.generateUUID, 'function', "generateUUID debe ser una función.");

    return true;
  } finally {
    _teardownKeyGeneratorTests(setup.originals);
  }
}

/**
 * VR-F-1: Probar que generateUUID retorna el valor esperado del mock.
 */
function testKeyGenerator_GenerateUUID_debeRetornarElValorDelMock() {
  const setup = _setupKeyGeneratorTests();
  try {
    // Arrange
    const keyGenerator = createKeyGenerator();

    // Act
    const result = keyGenerator.generateUUID();

    // Assert
    assert.areEqual('mock-uuid-123456789', result, "El valor retornado no coincide con el del mock.");

    return true;
  } finally {
    _teardownKeyGeneratorTests(setup.originals);
  }
}

/**
 * VR-M-1: Probar que se invoca a Utilities.getUuid exactamente una vez.
 */
function testKeyGenerator_GenerateUUID_debeInvocarUtilitiesUnaVez() {
  const setup = _setupKeyGeneratorTests();
  try {
    // Arrange
    const keyGenerator = createKeyGenerator();

    // Act
    keyGenerator.generateUUID();

    // Assert
    assert.arrayLength(setup.mockUtilities._callLog, 1, "Utilities.getUuid debió ser llamado exactamente una vez.");

    return true;
  } finally {
    _teardownKeyGeneratorTests(setup.originals);
  }
}