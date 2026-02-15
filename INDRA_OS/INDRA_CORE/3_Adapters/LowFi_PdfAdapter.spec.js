// ======================================================================
// ARTEFACTO: 3_Adapters/LowFi_PdfAdapter.spec.js (NUEVO)
// PROPÓSITO: Suite de tests unitarios para el adaptador de PDF de baja fidelidad.
// ESTRATEGIA: Mockear el servicio global 'Utilities' para verificar que
//             la lógica de conversión nativa es invocada correctamente.
// ======================================================================

function _setupLowFiPdfAdapterTests() {
  const originals = {
    Utilities: globalThis.Utilities,
  };

  const mocks = {
    mockErrorHandler: {
      createError: (code, msg, details) => {
        const e = new Error(msg);
        e.code = code;
        e.details = details;
        return e;
      }
    },
    mockBlob: {
      _bytes: [1, 2, 3, 4], // Simular un PDF no vacío
      getBytes: function () { return this._bytes; }
    }
  };

  const mockUtilities = {};

  const methodsToPreserve = [
    'newBlob', 'getUuid', 'base64Encode', 'base64Decode'
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
  mockUtilities._callLog = { newBlob: 0, getAs: 0 };

  mockUtilities.newBlob = function (data, contentType, name) {
    this._callLog.newBlob++;
    // Devolver un objeto que encadena el siguiente método mockeado
    return {
      getAs: (targetContentType) => {
        this._callLog.getAs++;
        if (targetContentType === 'application/pdf') {
          return mocks.mockBlob;
        }
        return null;
      }
    };
  };

  globalThis.Utilities = mockUtilities;

  return { mocks, originals, mockUtilities };
}

function _teardownLowFiPdfAdapterTests(originals) {
  globalThis.Utilities = originals.Utilities;
}

// ============================================================
// SUITE DE TESTS PARA LOWFI_PDFADAPTER
// ============================================================

function testLowFiPdfAdapter_Generate_debeLlamarALaConversionNativaDeGas() {
  const setup = _setupLowFiPdfAdapterTests();
  try {
    // Arrange
    const adapter = createLowFi_PdfAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    const payload = { htmlContent: '<h1>Test</h1>' };

    // Act
    const result = adapter.generate(payload);

    // Assert
    assert.areEqual(1, setup.mockUtilities._callLog.newBlob, "Utilities.newBlob debió ser llamado una vez.");
    assert.areEqual(1, setup.mockUtilities._callLog.getAs, ".getAs('application/pdf') debió ser llamado una vez.");

    assert.isNotNull(result.pdfBlob, "El resultado debe contener la propiedad pdfBlob.");
    assert.areEqual(setup.mocks.mockBlob, result.pdfBlob, "El blob retornado debe ser el del mock.");

    return true;
  } finally {
    _teardownLowFiPdfAdapterTests(setup.originals);
  }
}

function testLowFiPdfAdapter_Generate_debeFallarSiNoHayHtmlContent() {
  const setup = _setupLowFiPdfAdapterTests();
  try {
    // Arrange
    const adapter = createLowFi_PdfAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Act & Assert
    assert.throws(() => {
      adapter.generate({}); // Payload vacío
    }, 'CONFIGURATION_ERROR');

    assert.throws(() => {
      adapter.generate({ htmlContent: null }); // Payload con null
    }, 'CONFIGURATION_ERROR');

    return true;
  } finally {
    _teardownLowFiPdfAdapterTests(setup.originals);
  }
}

function testLowFiPdfAdapter_Generate_debeManejarErrorDeLaApiNativa() {
  const setup = _setupLowFiPdfAdapterTests();
  try {
    // Arrange
    // Simular que la API de GAS falla
    setup.mockUtilities.newBlob = () => {
      throw new Error("Límite de tamaño excedido");
    };
    const adapter = createLowFi_PdfAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Act & Assert
    assert.throws(() => {
      adapter.generate({ htmlContent: '<h1>Test</h1>' });
    }, "NATIVE_API_ERROR");

    return true;
  } finally {
    _teardownLowFiPdfAdapterTests(setup.originals);
  }
}





