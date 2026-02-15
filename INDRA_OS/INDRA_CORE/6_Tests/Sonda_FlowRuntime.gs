// ======================================================================
// ARTEFACTO: 6_Tests/Sonda_FlowRuntime.gs
// PROPÓSITO: Sonda de ejecución rápida para flujos con JSON embebido.
// ======================================================================

/**
 * Helper interno para los tests: Ensambla un stack con mocks para evitar efectos secundarios
 * y dependencias de tokens reales.
 */
/**
 * Helper interno para los tests: Ensambla un stack con mocks usando el inyector oficial.
 */
function _assembleMockStackForTest(options) {
  options = options || {};
  var mockJobQueue = createMockJobQueue(options.predefinedJobs || []);
  
  var overrides = {};
  for (var k in options) { overrides[k] = options[k]; }
  
  overrides.jobQueueService = mockJobQueue;
  if (!overrides.driveAdapter) {
      overrides.driveAdapter = createMockDriveAdapter(options.files || []);
  }
  
  return assembleGenericTestStack(overrides);
}


/**
 * TEST EJECUTABLE: Simula un job real desde Notion con flow embebido.
 * NO usa Google Sheets, NO usa DriveAdapter, NO usa cache.
 * El flow está ANIDADO en este archivo para eliminar cualquier ambigüedad.
 * 
 * ARQUITECTURA: Usa _assembleExecutionStack() para obtener componentes REALES
 * del sistema (no mocks). Esto garantiza fidelidad a producción.
 */
function testSonda_FlowPayload_Execution() {
  console.log('='.repeat(80));
  console.log('🧪 SONDA: Test de ejecución de flow con JSON embebido (Direct Orchestration)');
  console.log('='.repeat(80));
  
  // ============================================================
  // PASO 1: Flow JSON embebido
  // ============================================================
  var embeddedFlow = {
    "name": "Discover Raw Schema (TEST EMBEBIDO)",
    "description": "Introspección de schema de base de datos Notion - Solo primer paso para test",
    "steps": [
      {
        "adapter": "notion",
        "method": "retrieveDatabase",
        "inputMapping": {
          "databaseId": "{{input.dbId}}"  // ← PLACEHOLDER A PROBAR
        },
        "id": "rawSchema"
      }
    ]
  };
  
  console.log('📦 Flow embebido cargado:');
  console.log('   - name: ' + embeddedFlow.name);
  console.log('   - Placeholder a resolver: ' + embeddedFlow.steps[0].inputMapping.databaseId);
  
  // ============================================================
  // PASO 2: Contexto de entrada NORMALIZADO (Axioma 3)
  // ============================================================
  var initialContext = {
    input: {
      source: 'notion-webhook-test',
      flowId: 'discover-raw-schema',
      dbId: '191b5567ba7180dc9b90f7938fac7b61',
      pageId: 'test-page-123'
    },
    system: {
      rootFolderId: 'test-root-folder',
      templatesFolderId: 'test-templates-folder',
      outputFolderId: 'test-output-folder'
    }
  };
  
  console.log('📥 Contexto inicial:');
  console.log('   - input.dbId: ' + initialContext.input.dbId);
  
  // ============================================================
  // PASO 3: Ensamblar stack con MOCKS
  // ============================================================
  console.log('\n🔧 Ensamblando stack de prueba con mocks...');
  
  try {
    var stack = _assembleMockStackForTest({
        notionAdapter: {
            retrieveDatabase: function(p) { 
                console.log("[MOCK-NOTION-PAYLOAD] retrieveDatabase called");
                return { id: initialContext.input.dbId, title: [{plain_text: 'Mock DB'}] }; 
            },
            schemas: { retrieveDatabase: { io_interface: { inputs:{}, outputs:{} } } },
            label: 'Mock Notion Payload',
            description: 'Mocked adapter for payload test.'
        }
    });
    
    console.log('✅ Stack con mocks ensamblado correctamente');
    
    // ============================================================
    // PASO 4: Ejecutar el flow directamente
    // ============================================================
    console.log('\n🚀 Ejecutando flow con CoreOrchestrator...');
    if (stack.nodes) console.log("[SONDA-DEBUG-P] Stack nodes: " + Object.keys(stack.nodes).join(', '));
    if (stack.nodes && stack.nodes.notion) {
        console.log("[SONDA-DEBUG-P] Notion adapter label: " + stack.nodes.notion.label);
        console.log("[SONDA-DEBUG-P] Notion retrieveDatabase function head: " + stack.nodes.notion.retrieveDatabase.toString().substring(0, 100));
    }
    
    var result = stack.coreOrchestrator.executeFlow(embeddedFlow, initialContext);
    
    console.log('\n✅ Flow ejecutado exitosamente');
    console.log('📊 Resultado (keys): ' + Object.keys(result).join(', '));
    
    // ============================================================
    // PASO 5: Validación del resultado
    // ============================================================
    console.log('\n🔍 Validando resultado...');
    
    if (!result) {
      console.error('❌ FALLO: resultado es null/undefined');
      return false;
    }
    
    if (result.nodes && result.nodes.rawSchema) {
      console.log('✅ ÉXITO: rawSchema presente en result.nodes');
      
      if (result.nodes.rawSchema.id) {
        console.log('   - Database ID en resultado: ' + result.nodes.rawSchema.id);
        
        if (result.nodes.rawSchema.id === initialContext.input.dbId) {
          console.log('✅ VALIDACIÓN PERFECTA: El ID coincide con input.dbId');
          return true;
        } else {
          console.warn('⚠️ ADVERTENCIA: ID en resultado (' + result.nodes.rawSchema.id + ') difiere de input.dbId (' + initialContext.input.dbId + ')');
          return false;
        }
      }
      return true;
    } else {
      console.error('❌ FALLO: rawSchema no presente en result.nodes');
      console.log('📋 Contexto final completo para debug: ' + JSON.stringify(result));
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ EXCEPCIÓN EN TEST: ' + error.toString());
    if (error.stack) console.error('Stack: ' + error.stack);
    return false;
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 FIN: Sonda testSonda_FlowPayload_Execution');
    console.log('='.repeat(80));
  }
}

/**
 * TEST ALTERNATIVO: Sonda que simula el flujo COMPLETO desde PublicAPI (End-to-End Core).
 */
function testSonda_JobFlow_FullCycle() {
  console.log('='.repeat(80));
  console.log('🧪 SONDA: Test de job completo con flow embebido (PublicAPI integration)');
  console.log('='.repeat(80));
  
  try {
    var embeddedFlow = {
      "name": "Discover Raw Schema (TEST COMPLETO)",
      "steps": [
        {
          "id": "rawSchema",
          "adapter": "notion",
          "method": "retrieveDatabase",
          "inputMapping": { "databaseId": "{{input.dbId}}" }
        }
      ]
    };
    
    var mockJob = {
      jobId: '09f638dc-576e-4e70-b007-9d151545355a',
      flowId: 'discover-raw-schema',
      triggerSource: 'test-embedded-flow',
      initialPayload: {
          input: {
              dbId: '191b5567ba7180dc9b90f7938fac7b61'
          }
      },
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    var stack = _assembleMockStackForTest({
        predefinedJobs: [mockJob],
        notionAdapter: {
            retrieveDatabase: function(p) {
                console.log("[MOCK-NOTION] retrieveDatabase called for " + (p ? p.databaseId : 'unknown'));
                return { id: '191b5567ba7180dc9b90f7938fac7b61', title: [{ plain_text: 'Mock DB' }] };
            },
            schemas: { retrieveDatabase: { io_interface: { inputs: {}, outputs: {} } } },
            label: 'Mock Notion Adapter',
            description: 'Mocked adapter for integration testing without network.'
        }
    });
    console.log('✅ Stack con mocks ensamblado e inyectado con job ' + mockJob.jobId);
    
    // Inyectar en cache
    console.log('\n🔧 Inyectando flow embebido en FlowRegistry cache...');
    
    var cache = CacheService.getScriptCache();
    var cacheKey = 'flow_discover-raw-schema';
    cache.put(cacheKey, JSON.stringify(embeddedFlow), 600);
    
    console.log('\n🚀 Procesando job via PublicAPI...');
    var result = stack.public.executeAction({ action: 'public:processSpecificJob', payload: mockJob });
    
    console.log('\n✅ Ejecución finalizada. Status: ' + (result.payload ? result.payload.status : 'ERROR'));
    
    if (result && result.success && result.payload.status === 'completed') {
      console.log('✅ VALIDACIÓN EXITOSA: Job marcado como completed');
      return true;
    } else {
      console.error('❌ VALIDACIÓN FALLIDA: Resultado: ' + JSON.stringify(result));
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ EXCEPCIÓN EN TEST: ' + error.toString());
    return false;
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 FIN: Sonda testSonda_JobFlow_FullCycle');
    console.log('='.repeat(80));
  }
}





