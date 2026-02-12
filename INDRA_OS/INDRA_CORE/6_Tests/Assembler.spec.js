// ======================================================================
// ARTEFACTO: 🧪 Assembler.spec.js (CORREGIDO)
// DHARMA: Ser el Test de Humo del 'Big Bang' para la pila de EJECUCIÓN.
// ======================================================================

function _setupAssemblerTest() {
  const originalPropertiesService = globalThis.PropertiesService;

  const mockStorage = {
    'ORBITAL_CORE_ROOT_ID': 'mock-root-folder-id',
    'ORBITAL_CORE_JOB_QUEUE_SHEET_ID': 'mock-job-queue-sheet-id',
    'ORBITAL_CORE_AUDIT_LOG_SHEET_ID': 'mock-audit-log-sheet-id',
    'ADMIN_EMAIL': 'admin@example.com',
    'PDF_GENERATOR_FUNCTION_URL': 'https://mock-pdf-generator.url/api/generate',
    'NOTION_API_KEY': 'secret_mock-notion-api-key',
    'DEPLOYMENT_URL': 'https://script.google.com/macros/s/mock-deployment-id/exec',
    'ORBITAL_CORE_SATELLITE_API_KEY': 'mock-satellite-api-key-uuid'
  };

  const mockProperties = {
    getProperty: function (key) { return mockStorage[key] || null; },
    setProperty: function (key, value) { mockStorage[key] = String(value); },
    deleteProperty: function (key) { delete mockStorage[key]; },
    getProperties: function () { return { ...mockStorage }; }
  };

  globalThis.PropertiesService = {
    getScriptProperties: function () { return mockProperties; }
  };

  return originalPropertiesService;
}

function _teardownAssemblerTest(original) {
  globalThis.PropertiesService = original;
}

/**
 * NOTA AXIOMÁTICA: Este test verifica que la pila de EJECUCIÓN completa
 * (`_assembleExecutionStack`) puede ser construida sin errores en un
 * entorno simulado como "ya configurado".
 */
function testAssembler_assembleExecutionStack_debeConstruirLaPilaCompletaCorrectamente() {
  const testName = 'testAssembler_assembleExecutionStack_debeConstruirLaPilaCompletaCorrectamente';
  const { assert, logTestResult, mockFactory } = setupTest(testName);

  const originalPropertiesService = globalThis.PropertiesService;
  const originalCreateRenderEngine = globalThis.createRenderEngine;

  try {
    _setupAssemblerTest();

    const mockRenderEngineInstance = { render: () => 'mocked render output' };
    const mockCreateRenderEngine = mockFactory.create((deps) => {
      assert.hasProperty(deps, 'errorHandler', 'La factory de RenderEngine debe recibir errorHandler');
      return mockRenderEngineInstance;
    });

    globalThis.createRenderEngine = mockCreateRenderEngine;

    const stack = _assembleExecutionStack();

    assert.isNotNull(stack, "La pila del sistema no debe ser nula.");
    assert.isNotNull(stack.coreOrchestrator, "El orquestador no fue ensamblado.");
    assert.isNotNull(stack.public, "La API pública no fue ensamblada.");

    assert.areEqual(1, mockCreateRenderEngine.getCallCount(), 'La factory createRenderEngine debió ser llamada exactamente una vez.');

    logTestResult(testName, true);

  } catch (e) {
    logTestResult(testName, false, `El ensamblaje falló catastróficamente: ${e.message}\n${e.stack}`);
  } finally {
    globalThis.PropertiesService = originalPropertiesService;
    globalThis.createRenderEngine = originalCreateRenderEngine;
  }
}