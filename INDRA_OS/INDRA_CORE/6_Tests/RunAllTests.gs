// ======================================================================
// ARTEFACTO: 🧪 RunAllTests.gs
// DHARMA: Maestro de Ceremonias de la Verificación.
// ======================================================================

// ======================================================================
// CONFIGURACIÓN DE LA SUITE DE PRUEBAS
// ======================================================================
/**
 * Objeto de configuración para controlar qué pruebas se ejecutan.
 * - Para ejecutar TODAS las pruebas, establece `runAll` en `true`.
 * - Para ejecutar pruebas específicas, establece `runAll` en `false` y
 *   marca como `true` las capas o artefactos individuales que deseas probar.
 */
const _TestConfig = {
  // Pruebas que requieren ejecución aislada (NO incluir en RunAllTests)
  // Pruebas que requieren ejecución aislada (NO incluir en RunAllTests)
  excludedTests: [],

  // --- INICIO DE INTERVENCIÓN (Paso Final: Habilitar ejecución completa) ---
  runAll: true, // INTERRUPTOR PRINCIPAL: ¡Listo para el juicio final!
  // --- FIN DE INTERVENCIÓN ---

  // Interruptores por Capa
  runLayer: {
    Infra: false,
    Adapters: false,
    Services: false,
    Core: false,
    Entrypoints: false
  },

  // Interruptores por Artefacto Individual (más granular)
  runFile: {
    // Capa Infra
    ErrorHandler: false,
    Configurator: false,
    SimpleDialog: false,
    ConnectionTester: false, // Añadido para completitud
    CipherAdapter: true,

    // Capa Adapters
    DriveAdapter: false,
    EmailAdapter: false,
    HiFiPdfAdapter: false,
    NotionAdapter: false,
    CalendarAdapter: true,
    SpatialProjectionAdapter: true,
    GoogleDriveRestAdapter: true,
    GoogleDocsAdapter: true,
    GoogleSlidesAdapter: true,
    GoogleFormsAdapter: true,
    InstagramAdapter: true,
    TikTokAdapter: true,
    MapsAdapter: true,
    MessengerAdapter: true,
    OracleAdapter: true,
    AudioAdapter: true,
    YouTubeAdapter: true,





    // Capa Services
    FlowRegistry: false,
    FlowUtilsService: true, // ✅ HABILITADO: Suite de tests para lookupValue, checkSyncLoop, mapObjects (13 tests)
    JobQueueService: false,
    MonitoringService: false,
    RenderEngine: false, 
    RenderService: false,
    ProjectionKernel: true, 
    
    // Capa Core
    SystemManifest: false,
    SystemInitializer: false,
    CoreOrchestrator: false,
    PublicAPI: false,
    TokenManager: true, // ✅ NEW: Multi-account token system

    // Capa Entrypoints
    MainMenu: false,
    APIGateway: false,
    Triggers: false,
    
    // Meta
    RunAllTests: false, // Para probar el propio runner
    DifferentialTesting: false, // [ERRADICADO]
    ContractCompliance: false, // 🕵️ [DEPRECATED] Sustituido por Sovereignty_Tests.gs
    Integration: false, // [ERRADICADO] CORE-SPATIAL muerto
    Sonda: true, // 📡 NEW: Sondas de ejecución rápida
    SovereignPurity: false, // 🏛️ MOVED: Movida a RunSovereigntyTests() para no sobrecargar el despliegue
    IntelligenceOrchestrator: true // 🧠 NEW: AI Architect reasoning logic
  }
};


// ======================================================================
// CONSTANTES Y LÓGICA DEL EJECUTOR (NO MODIFICAR)
// ======================================================================

const TEST_FUNCTION_PATTERN = /^test[A-Z]/;

function RunAllTests() {
  const startTime = Date.now();
  const summary = { total: 0, passed: 0, failed: 0, failures: [] };
  
  const testNames = _discoverTestFunctions();
  summary.total = testNames.length;

  console.log('========================================');
  console.log('🧪 ORBITAL CORE - TEST RUNNER');
  console.log('========================================');
  
  if (testNames.length === 0) {
    console.warn('No se descubrieron pruebas para la configuración actual. Verifica _TestConfig.');
  } else {
    console.log(`Descubiertas ${testNames.length} pruebas para ejecutar...`);
  }
  console.log('');
  
  console.log('=== 🔬 INTEGRATION FORENSIC CHECK ===');
  try {
    const startAssembly = new Date().getTime();
    console.log('Ensamblando sistema para validación preliminar...');
    const stack = (typeof _assembleExecutionStack === 'function') ? _assembleExecutionStack() : null;
    
    if (stack) {
       // El assembaje fue exitoso (si hubiera fallado, PublicAPI habría lanzado el error detallado)
       console.log(`✅ Sistema ensamblado y auditado correctamente en ${new Date().getTime() - startAssembly}ms.`);
       console.log('La Soberanía Axiomática ha certificado la pureza estructural.');
    } else {
       console.log('⚠️ _assembleExecutionStack no encontrado o no retornó el stack. Saltando validación preliminar.');
    }
  } catch (e) {
    console.error('\n🛑 [ARCHITECTURAL_HALT] PRE-FLIGHT CHECK FAILED');
    console.error('El runner ha abortado la ejecución porque el sistema viola los contratos fundamentales.');
    console.error('---------------------------------------------------');
    console.error(e.message);
    console.error('---------------------------------------------------');
    // Abortar todo
    throw new Error('TEST RUNNER ABORTED: System integrity check failed. See logs for details.');
  }

  for (let i = 0; i < testNames.length; i++) {
    _runSingleTest(testNames[i], summary);
  }
  
  _logSummary(summary, startTime);
  
  if (summary.failed > 0) {
    const error = new Error(`${summary.failed} de ${summary.total} pruebas fallaron.`);
    error.summary = summary; // Adjuntar el resumen al error
    throw error;
  }
  
  return summary;
}

function _discoverTestFunctions() {
  const globalObject = this;
  const allNames = Object.keys(globalObject);

  const testNames = allNames.filter(name => {
    if (!TEST_FUNCTION_PATTERN.test(name) || typeof globalObject[name] !== 'function') {
      return false;
    }

    // Filtrar pruebas explícitamente excluidas (ej. pruebas nativas aisladas)
    if (_TestConfig.excludedTests && _TestConfig.excludedTests.includes(name)) {
      return false;
    }


    if (_TestConfig.runAll) {
      return true; // El interruptor principal está activado, ejecutar todo.
    }
    
    // Mapeo de prefijos a interruptores de configuración
    const configMap = {
      // --- INICIO DE INTERVENCIÓN (Mejora de Mantenibilidad) ---
      // Se añade la entrada para el nuevo artefacto ConnectionTester.
      'testErrorHandler': _TestConfig.runFile.ErrorHandler || _TestConfig.runLayer.Infra,
      'testConfigurator': _TestConfig.runFile.Configurator || _TestConfig.runLayer.Infra,
      'testSimpleDialog': _TestConfig.runFile.SimpleDialog || _TestConfig.runLayer.Infra,
      'testConnectionTester': _TestConfig.runFile.ConnectionTester || _TestConfig.runLayer.Infra,
      'testCipherAdapter': _TestConfig.runFile.CipherAdapter || _TestConfig.runLayer.Infra,
      // --- FIN DE INTERVENCIÓN ---
      
      'testDriveAdapter': _TestConfig.runFile.DriveAdapter || _TestConfig.runLayer.Adapters,
      'testEmailAdapter': _TestConfig.runFile.EmailAdapter || _TestConfig.runLayer.Adapters,
      'testHiFiPdfAdapter': _TestConfig.runFile.HiFiPdfAdapter || _TestConfig.runLayer.Adapters,
      'testNotionAdapter': _TestConfig.runFile.NotionAdapter || _TestConfig.runLayer.Adapters,
      'testCalendarAdapter': _TestConfig.runFile.CalendarAdapter || _TestConfig.runLayer.Adapters,
      'testSpatialProjection': _TestConfig.runFile.SpatialProjectionAdapter || _TestConfig.runLayer.Adapters,
      'testGoogleDriveRestAdapter': _TestConfig.runFile.GoogleDriveRestAdapter || _TestConfig.runLayer.Adapters,
      'testGoogleDocsAdapter': _TestConfig.runFile.GoogleDocsAdapter || _TestConfig.runLayer.Adapters,
      'testGoogleSlidesAdapter': _TestConfig.runFile.GoogleSlidesAdapter || _TestConfig.runLayer.Adapters,
      'testGoogleFormsAdapter': _TestConfig.runFile.GoogleFormsAdapter || _TestConfig.runLayer.Adapters,
      'testInstagramAdapter': _TestConfig.runFile.InstagramAdapter || _TestConfig.runLayer.Adapters,
      'testTikTokAdapter': _TestConfig.runFile.TikTokAdapter || _TestConfig.runLayer.Adapters,
      'testMapsAdapter': _TestConfig.runFile.MapsAdapter || _TestConfig.runLayer.Adapters,
      'testMessengerAdapter': _TestConfig.runFile.MessengerAdapter || _TestConfig.runLayer.Adapters,
      'testOracleAdapter': _TestConfig.runFile.OracleAdapter || _TestConfig.runLayer.Adapters,
      'testAudioAdapter': _TestConfig.runFile.AudioAdapter || _TestConfig.runLayer.Adapters,
      'testYouTubeAdapter': _TestConfig.runFile.YouTubeAdapter || _TestConfig.runLayer.Adapters,




      'testFlowRegistry': _TestConfig.runFile.FlowRegistry || _TestConfig.runLayer.Services,
      'testFlowCompiler': true, // Auto-enabled for verification
      'testFlowUtilsService': _TestConfig.runFile.FlowUtilsService || _TestConfig.runLayer.Services,
      'testJobQueueService': _TestConfig.runFile.JobQueueService || _TestConfig.runLayer.Services,
      'testMonitoringService': _TestConfig.runFile.MonitoringService || _TestConfig.runLayer.Services,
      'testRenderEngine': _TestConfig.runFile.RenderEngine || _TestConfig.runLayer.Services,
      'testRenderService': _TestConfig.runFile.RenderService || _TestConfig.runLayer.Services,
      'testProjectionKernel': _TestConfig.runFile.ProjectionKernel || _TestConfig.runLayer.Services,
      
      'testSystemManifest': _TestConfig.runFile.SystemManifest || _TestConfig.runLayer.Core,
      'testSystemInitializer': _TestConfig.runFile.SystemInitializer || _TestConfig.runLayer.Core,
      'testCoreOrchestrator': _TestConfig.runFile.CoreOrchestrator || _TestConfig.runLayer.Core,
      'testPublicAPI': _TestConfig.runFile.PublicAPI || _TestConfig.runLayer.Core,
      'testTokenManager': _TestConfig.runFile.TokenManager || _TestConfig.runLayer.Core,
      'testDifferential': _TestConfig.runFile.DifferentialTesting,
      'testGlobal': _TestConfig.runFile.ContractCompliance,
      'testL5ContractVerification': true, // Auto-enabled for verification
      'testSovereignHandshake': true, // Auto-enabled for verification
      
      'testMainMenu': _TestConfig.runFile.MainMenu || _TestConfig.runLayer.Entrypoints,
      'testAPIGateway': _TestConfig.runFile.APIGateway || _TestConfig.runLayer.Entrypoints,
      'testTriggers': _TestConfig.runFile.Triggers || _TestConfig.runLayer.Entrypoints,
      
      'testSovereignPurity': _TestConfig.runFile.SovereignPurity || _TestConfig.runLayer.Core,
      'testIntelligenceOrchestrator': _TestConfig.runFile.IntelligenceOrchestrator || _TestConfig.runLayer.Core,
      'testIntegration': _TestConfig.runFile.Integration,
      'testSonda': _TestConfig.runFile.Sonda,
      'testRunAllTests': _TestConfig.runFile.RunAllTests
    };

    // Encontrar el prefijo que coincide con el nombre de la función
    for (const prefix in configMap) {
      if (name.startsWith(prefix)) {
        return configMap[prefix];
      }
    }
    
    return false; // Si no coincide con ningún prefijo, no ejecutar
  });
  
  testNames.sort();
  return testNames;
}

function _runSingleTest(testName, summary) {
  console.log(`Running test: ${testName}...`);
  try {
    const testFunction = globalThis[testName] || this[testName];
    const result = testFunction();
    if (result === false) {
      throw new Error('Test retornó false explícitamente');
    }
    summary.passed++;
    console.log(`  ✅ PASSED: ${testName}`);
  } catch (error) {
    summary.failed++;
    summary.failures.push({
      name: testName,
      message: error.message || String(error),
      stack: error.stack || 'No stack trace available'
    });
    console.error(`  ❌ FAILED: ${testName} - ${error.message}`);
  }
}

function _logSummary(summary, startTime) {
  const duration = Date.now() - startTime;
  const durationSeconds = (duration / 1000).toFixed(2);
  
  console.log('');
  console.log('========================================');
  console.log('📊 RESUMEN DE EJECUCIÓN');
  console.log('========================================');
  console.log(`Total de pruebas:   ${summary.total}`);
  console.log(`Pruebas pasadas:    ${summary.passed} ✅`);
  console.log(`Pruebas falladas:   ${summary.failed} ❌`);
  console.log(`Duración:           ${durationSeconds}s`);
  console.log('');
  
  if (summary.failed > 0) {
    console.log('========================================');
    console.log('🔍 DETALLES DE FALLOS');
    console.log('========================================');
    
    for (let i = 0; i < summary.failures.length; i++) {
      const failure = summary.failures[i];
      console.log('');
      console.log(`[${i + 1}] ${failure.name}`);
      console.log(`    Mensaje: ${failure.message}`);
      if (failure.stack) {
        console.log(`    Stack:\n    ${failure.stack.split('\n').join('\n    ')}`);
      }
    }
    
    console.log('');
    console.log('========================================');
    console.log('❌ RESULTADO: TESTS FALLIDOS');
    console.log('========================================');
  } else if (summary.total > 0) {
    console.log('========================================');
    console.log('✅ RESULTADO: TODOS LOS TESTS PASARON');
    console.log('========================================');
  } else {
    console.log('========================================');
    console.log('⚠️ RESULTADO: NO SE EJECUTARON TESTS');
    console.log('========================================');
  }
}

/**
 * Global Test Helper: Obtiene una instancia de PublicAPI ensamblada.
 */
function _getPublicAPI() {
  if (globalThis._memoizedPublicAPI) return globalThis._memoizedPublicAPI;
  const stack = _assembleExecutionStack();
  globalThis._memoizedPublicAPI = stack.public;
  return stack.public;
}
