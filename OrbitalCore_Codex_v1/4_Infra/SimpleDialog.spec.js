// ======================================================================
// ARTEFACTO: 4_Infra/SimpleDialog.spec.js
// PROPÓSITO: Suite de tests unitarios COMPLETA y NATIVA para SimpleDialog.gs.
// ESTRATEGIA: Mockeo completo del entorno global (SpreadsheetApp) para
//             simular la interacción con la UI y verificar la delegación
//             de llamadas y el manejo de la respuesta del usuario.
// ======================================================================

/**
 * Helper de Setup centralizado para todos los tests de SimpleDialog.
 * @returns {Object} Objeto con mocks, helpers y originales para teardown.
 */
function _setupSimpleDialogTests() {
  const originals = {
    SpreadsheetApp: globalThis.SpreadsheetApp
  };

  const mocks = {
    mockErrorHandler: {
      _callLog: [],
      createError: (code, msg, details) => {
        mocks.mockErrorHandler._callLog.push({ method: 'createError', args: [code, msg, details] });
        const e = new Error(msg);
        e.code = code;
        e.details = details;
        return e;
      }
    },
    mockUi: {
      _callLog: [],
      _promptResponse: { button: 'OK', text: 'Default Text' }, // Estado configurable
      Button: { OK: 'OK', CANCEL: 'CANCEL' }, // Mock de constantes
      ButtonSet: { OK: 'OK_SET', OK_CANCEL: 'OK_CANCEL_SET' }, // Mock de constantes
      
      prompt: (title, msg, buttons) => {
        mocks.mockUi._callLog.push({ method: 'prompt', args: [title, msg, buttons] });
        // Simula la respuesta del usuario basada en el estado configurable
        return {
          getSelectedButton: () => mocks.mockUi._promptResponse.button,
          getResponseText: () => mocks.mockUi._promptResponse.text
        };
      },
      alert: (title, msg, buttons) => {
        mocks.mockUi._callLog.push({ method: 'alert', args: [title, msg, buttons] });
      }
    }
  };
  
  globalThis.SpreadsheetApp = {
    getUi: () => mocks.mockUi
  };

  return { mocks, originals };
}

/**
 * Helper de Teardown para restaurar el estado global.
 */
function _teardownSimpleDialogTests(originals) {
  globalThis.SpreadsheetApp = originals.SpreadsheetApp;
}

// ============================================================
// SUITE DE TESTS PARA SIMPLEDIALOG
// ============================================================

/**
 * VR-G-2: Probar que `showPrompt` retorna el texto si el usuario presiona OK.
 */
function testSimpleDialog_ShowPrompt_debeRetornarTextoSiElUsuarioPresionaOK() {
  const setup = _setupSimpleDialogTests();
  try {
    // Arrange
    const simpleDialog = createSimpleDialog({ errorHandler: setup.mocks.mockErrorHandler });
    // Configurar la simulación: el usuario presiona OK y escribe "Entrada de prueba"
    setup.mocks.mockUi._promptResponse.button = setup.mocks.mockUi.Button.OK;
    setup.mocks.mockUi._promptResponse.text = "Entrada de prueba";
    
    // Act
    const result = simpleDialog.showPrompt('Título de Prueba', 'Mensaje de Prueba');
    
    // Assert
    const promptCalls = setup.mocks.mockUi._callLog.filter(c => c.method === 'prompt');
    assert.arrayLength(promptCalls, 1, 'ui.prompt debió ser llamado una vez.');
    assert.areEqual("Entrada de prueba", result, 'Debe retornar el texto ingresado por el usuario.');

    return true;
  } finally {
    _teardownSimpleDialogTests(setup.originals);
  }
}

/**
 * VR-G-2: Probar que `showPrompt` retorna `null` si el usuario presiona CANCEL.
 */
function testSimpleDialog_ShowPrompt_debeRetornarNullSiElUsuarioPresionaCANCEL() {
  const setup = _setupSimpleDialogTests();
  try {
    // Arrange
    const simpleDialog = createSimpleDialog({ errorHandler: setup.mocks.mockErrorHandler });
    // Configurar la simulación: el usuario presiona CANCEL
    setup.mocks.mockUi._promptResponse.button = setup.mocks.mockUi.Button.CANCEL;
    
    // Act
    const result = simpleDialog.showPrompt('Título', 'Mensaje');
    
    // Assert
    const promptCalls = setup.mocks.mockUi._callLog.filter(c => c.method === 'prompt');
    assert.arrayLength(promptCalls, 1, 'ui.prompt debió ser llamado una vez.');
    assert.areEqual(null, result, 'Debe retornar null si el usuario cancela.');

    return true;
  } finally {
    _teardownSimpleDialogTests(setup.originals);
  }
}

/**
 * VR-G-2: Probar que `showAlert` delega la llamada correctamente al método `alert` de la UI.
 */
function testSimpleDialog_ShowAlert_debeLlamarAlMetodoAlertDeLaUi() {
  const setup = _setupSimpleDialogTests();
  try {
    // Arrange
    const simpleDialog = createSimpleDialog({ errorHandler: setup.mocks.mockErrorHandler });
    
    // Act
    simpleDialog.showAlert('Título de Alerta', 'Este es un mensaje.');
    
    // Assert
    const alertCalls = setup.mocks.mockUi._callLog.filter(c => c.method === 'alert');
    assert.arrayLength(alertCalls, 1, 'ui.alert debió ser llamado una vez.');
    
    const alertArgs = alertCalls[0].args;
    assert.areEqual('Título de Alerta', alertArgs[0], 'El título de la alerta es incorrecto.');
    assert.areEqual('Este es un mensaje.', alertArgs[1], 'El mensaje de la alerta es incorrecto.');

    return true;
  } finally {
    _teardownSimpleDialogTests(setup.originals);
  }
}

/**
 * Probar que los métodos fallan si los argumentos no son del tipo string.
 */
function testSimpleDialog_Validacion_debeFallarSiLosArgumentosNoSonStrings() {
  const setup = _setupSimpleDialogTests();
  try {
    // Arrange
    const simpleDialog = createSimpleDialog({ errorHandler: setup.mocks.mockErrorHandler });
    
    // Act & Assert
    assert.throws(() => {
      simpleDialog.showPrompt(123, 'mensaje');
    }, 'CONFIGURATION_ERROR');
    
    assert.throws(() => {
      simpleDialog.showAlert('título', null);
    }, 'CONFIGURATION_ERROR');
    
    return true;
  } finally {
    _teardownSimpleDialogTests(setup.originals);
  }
}

/**
 * Probar que el módulo maneja elegantemente un fallo de la API de UI (ej. en un contexto sin UI).
 */
function testSimpleDialog_ManejoDeErrores_debeCapturarFalloDeLaApiDeUi() {
  const setup = _setupSimpleDialogTests();
  try {
    // Arrange
    // Simular que la API de UI falla (ej. al ejecutar en un trigger sin UI)
    setup.mocks.mockUi.prompt = () => { throw new Error("No UI available in this context."); };
    const simpleDialog = createSimpleDialog({ errorHandler: setup.mocks.mockErrorHandler });
    
    // Act & Assert
    assert.throws(() => {
      simpleDialog.showPrompt('Título', 'Mensaje');
    }, 'SYSTEM_FAILURE');
    
    // Verificar que el error fue reportado al errorHandler
    const errorCall = setup.mocks.mockErrorHandler._callLog.find(c => c.method === 'createError');
    assert.isNotNull(errorCall, 'errorHandler.createError debió ser llamado.');
    assert.areEqual('SYSTEM_FAILURE', errorCall.args[0], 'El código del error debe ser SYSTEM_FAILURE.');
    
    return true;
  } finally {
    _teardownSimpleDialogTests(setup.originals);
  }
}