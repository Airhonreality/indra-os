// ======================================================================
// ARTEFACTO: 4_Infra/ConnectionTester.spec.js
// PROPÓSITO: Suite de tests unitarios para ConnectionTester.gs.
// ESTRATEGIA: Mockeo de UrlFetchApp para simular diversas respuestas HTTP
//             y verificar que el tester las interpreta correctamente.
// ======================================================================

function _setupConnectionTesterTests() {
  const originals = {
    UrlFetchApp: globalThis.UrlFetchApp,
  };

  const mockResponse = {
    _code: 200,
    _shouldThrow: false,
    getResponseCode: function() { return this._code; },
  };

  const mocks = {
    mockErrorHandler: {
      createError: (code, msg) => { const e = new Error(msg); e.code = code; return e; }
    },
    mockUrlFetchApp: {
      _callLog: [],
      fetch: function(url, options) {
        this._callLog.push({ url, options });
        if (mockResponse._shouldThrow) {
          throw new Error("Simulated network error (e.g., DNS error)");
        }
        return mockResponse;
      },
    },
    _state: {
      mockResponse
    }
  };
  
  globalThis.UrlFetchApp = mocks.mockUrlFetchApp;

  return { mocks, originals };
}

function _teardownConnectionTesterTests(originals) {
  globalThis.UrlFetchApp = originals.UrlFetchApp;
}

// ============================================================
// SUITE DE TESTS PARA CONNECTIONTESTER
// ============================================================

function testConnectionTester_Notion_debeRetornarValidoParaTokenCorrecto() {
  const setup = _setupConnectionTesterTests();
  try {
    // Arrange
    setup.mocks._state.mockResponse._code = 200;
    const tester = createConnectionTester({ errorHandler: setup.mocks.mockErrorHandler });
    
    // Act
    const result = tester.test('NOTION_API_KEY', { apiToken: 'valid-token' });
    
    // Assert
    assert.isTrue(result.isValid, 'Debe ser válido para un código 200.');
    return true;
  } finally {
    _teardownConnectionTesterTests(setup.originals);
  }
}

function testConnectionTester_Notion_debeRetornarInvalidoParaTokenIncorrecto() {
  const setup = _setupConnectionTesterTests();
  try {
    // Arrange
    setup.mocks._state.mockResponse._code = 401; // Unauthorized
    const tester = createConnectionTester({ errorHandler: setup.mocks.mockErrorHandler });
    
    // Act
    const result = tester.test('NOTION_API_KEY', { apiToken: 'invalid-token' });
    
    // Assert
    assert.isFalse(result.isValid, 'Debe ser inválido para un código 401.');
    assert.isTrue(result.reason.includes('401'), 'La razón debe mencionar el código de error.');
    return true;
  } finally {
    _teardownConnectionTesterTests(setup.originals);
  }
}

function testConnectionTester_URL_debeRetornarValidoParaUrlAccesible() {
  const setup = _setupConnectionTesterTests();
  try {
    // Arrange
    const tester = createConnectionTester({ errorHandler: setup.mocks.mockErrorHandler });
    
    // Act & Assert para código 200
    setup.mocks._state.mockResponse._code = 200;
    const result200 = tester.test('DEPLOYMENT_URL', { url: 'https://valid-url.com' });
    assert.isTrue(result200.isValid, 'Debe ser válido para un código 200.');

    // Act & Assert para código 403 (el servidor respondió, por lo tanto la URL es accesible)
    setup.mocks._state.mockResponse._code = 403;
    const result403 = tester.test('DEPLOYMENT_URL', { url: 'https://valid-but-forbidden-url.com' });
    assert.isTrue(result403.isValid, 'Debe ser válido para un código 403.');
    
    return true;
  } finally {
    _teardownConnectionTesterTests(setup.originals);
  }
}

function testConnectionTester_URL_debeRetornarInvalidoParaUrlInaccesible() {
  const setup = _setupConnectionTesterTests();
  try {
    // Arrange
    setup.mocks._state.mockResponse._code = 503; // Service Unavailable
    const tester = createConnectionTester({ errorHandler: setup.mocks.mockErrorHandler });
    
    // Act
    const result = tester.test('PDF_GENERATOR_FUNCTION_URL', { url: 'https://server-down-url.com' });
    
    // Assert
    assert.isFalse(result.isValid, 'Debe ser inválido para un código 503.');
    assert.isTrue(result.reason.includes('503'), 'La razón debe mencionar el código de error.');
    return true;
  } finally {
    _teardownConnectionTesterTests(setup.originals);
  }
}

function testConnectionTester_TiposNoValidables_debenRetornarValidoPorDefecto() {
  const setup = _setupConnectionTesterTests();
  try {
    // Arrange
    const tester = createConnectionTester({ errorHandler: setup.mocks.mockErrorHandler });
    
    // Act
    const result = tester.test('ADMIN_EMAIL', { email: 'test@example.com' });
    
    // Assert
    assert.isTrue(result.isValid, 'Debe ser válido por defecto para tipos no validables.');
    assert.isTrue(result.reason.includes('No se requiere validación'), 'La razón debe indicar que no se requiere validación.');
    return true;
  } finally {
    _teardownConnectionTesterTests(setup.originals);
  }
}

function testConnectionTester_ManejoDeErrores_nuncaDebeLanzarUnaExcepcion() {
  const setup = _setupConnectionTesterTests();
  try {
    // Arrange
    setup.mocks._state.mockResponse._shouldThrow = true; // Simular un error de red
    const tester = createConnectionTester({ errorHandler: setup.mocks.mockErrorHandler });
    let errorLanzado = false;
    let result;
    
    // Act
    try {
      result = tester.test('NOTION_API_KEY', { apiToken: 'any-token' });
    } catch (e) {
      errorLanzado = true;
    }
    
    // Assert
    assert.isFalse(errorLanzado, 'La función test NUNCA debe lanzar un error al exterior.');
    assert.isFalse(result.isValid, 'El resultado debe ser inválido si ocurre un error interno.');
    assert.isTrue(result.reason.includes('red o DNS'), 'La razón debe indicar un error de red.');
    
    return true;
  } finally {
    _teardownConnectionTesterTests(setup.originals);
  }
}





