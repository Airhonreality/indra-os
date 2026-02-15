/**
 * ============================================================
 * RenderEngine.spec.js - Test-First Specification
 * ============================================================
 * 
 * Contrato Axiomático Ultra-Específico (de DADC Sección 4.2.5)
 * 
 * Este archivo es la FUENTE DE VERDAD. La implementación debe
 * pasar TODOS estos tests para ser considerada válida.
 * 
 * Ejecutar: RunAllTests.gs (busca funciones test* en todos .spec.js)
 */

// ============================================================
// TEST SUITE 1: AXIOMA 1 - MONOPOLIO DEL RENDERIZADO
// ============================================================

function testRenderEngine_Axiom1_OnlySourceOfPlaceholderLogic() {
  const { assert, logTestResult } = setupTest('Axiom1_OnlySourceOfPlaceholderLogic');
  let originalCreateErrorHandler;

  try {
    // Setup: Mock dependencies
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock; // Use the local mock

    const errorHandler = createErrorHandler(); // This now calls our mock
    const engine = createRenderEngine({ errorHandler });

    // REQUISITO: render() debe ser el ÚNICO método que entiende {{...}}
  const result = engine.render("Hello {{name}}", { name: "World" });

  assert.strictEqual(result, "Hello World", "AXIOM 1 FAILURE: render() debe resolver placeholders.");

    logTestResult("✅ AXIOM 1: Monopolio del Renderizado - VALIDADO");

  } finally {
    // Teardown: Restore globals
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 2: AXIOMA 2 - PUREZA FUNCIONAL
// ============================================================

function testRenderEngine_Axiom2_PureFunctionNoSideEffects() {
  const { assert, logTestResult } = setupTest('Axiom2_PureFunctionNoSideEffects');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;

    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    const context = { name: "Juan", data: { value: 42 } };
    const contextCopy = JSON.parse(JSON.stringify(context));
    const template = "{{name}} has {{data.value}}";

    // Llamada 1 y 2
  const result1 = engine.render(template, context);
  const result2 = engine.render(template, context);

  // TEST
  assert.strictEqual(result1, result2, "AXIOM 2 FAILURE: render() no es pura.");
  assert.deepEqual(context, contextCopy, "AXIOM 2 FAILURE: render() mutó el contexto.");

    logTestResult("✅ AXIOM 2: Pureza Funcional - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 3: AXIOMA 3 - CONCIENCIA CONTEXTUAL (Stack de Contextos)
// ============================================================

function testRenderEngine_Axiom3_ContextStackPriority() {
  const { assert, logTestResult } = setupTest('Axiom3_ContextStackPriority');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    const localContext = { user: "Local_User", status: "local" };
    const globalContext = { user: "Global_User", system: "Indra" };

    // TEST 3A
    const result1 = engine.render("Usuario: {{user}}", localContext, globalContext);
    assert.strictEqual(result1, "Usuario: Local_User", "AXIOM 3 FAILURE: Stack priority incorrecto.");

    // TEST 3B
    const result2 = engine.render("Sistema: {{system}}", localContext, globalContext);
    assert.strictEqual(result2, "Sistema: Indra", "AXIOM 3 FAILURE: Fallback a contexto global fallo.");

    // TEST 3C
    const result3 = engine.render("Data: {{value}}", {}, { value: "found" });
    assert.strictEqual(result3, "Data: found", "AXIOM 3 FAILURE: Fallback en contexto vacío fallo.");

    logTestResult("✅ AXIOM 3: Conciencia Contextual - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 4: AXIOMA 4 - AGNOSTICISMO SEMANTICO
// ============================================================

function testRenderEngine_Axiom4_SemanticAgnosticism() {
  const { assert, logTestResult } = setupTest('Axiom4_SemanticAgnosticism');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    // TEST 4A
    const complexPayload = {
      stepId: "step_001",
      flowId: "{{flow}}",
      metadata: { adapter: "notion", method: "query", result: "{{data}}" }
    };
    const context = { flow: "flow_abc", data: "success" };
    const result = engine.render(complexPayload, context);
    assert.strictEqual(result.flowId, "flow_abc", "AXIOM 4 FAILURE: Renderizado de estructura compleja fallo (flowId).");
    assert.strictEqual(result.metadata.result, "success", "AXIOM 4 FAILURE: Renderizado de estructura compleja fallo (metadata.result).");

    // TEST 4B
    const blobLike = { type: "Blob", data: "binary" };
    const payloadWithBlob = { content: "{{blob}}" };
    const resultWithBlob = engine.render(payloadWithBlob, { blob: blobLike });
    assert.deepEqual(resultWithBlob.content, blobLike, "AXIOM 4 FAILURE: Tipo de dato Blob no fue preservado correctamente.");

    logTestResult("✅ AXIOM 4: Agnosticismo Semantico - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 5: AXIOMA 5 - ERRORES PRECISOS (Sin información de aplicación)
// ============================================================

function testRenderEngine_Axiom5_PreciseErrorsNoApplicationContext() {
  const { assert, logTestResult } = setupTest('Axiom5_PreciseErrors');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    // TEST 5A & 5B: null y undefined lanzan error
  assert.throws(() => engine.render("Valor: {{data}}", { data: null }), 'RENDER_ERROR');
  assert.throws(() => engine.render("{{missing}}", {}), 'RENDER_ERROR');

    // TEST 5C & 5D: Mensaje de error claro y sin contexto de app
    try {
      engine.render("Usuario: {{user.profile.email}}", {});
      assert.fail("AXIOM 5 FAILURE: Error no fue lanzado para path profundo faltante.");
    } catch (e) {
      assert.isTrue(e.message.includes("user.profile.email"), "AXIOM 5 FAILURE: Mensaje de error no menciona el placeholder faltante.");
      assert.isFalse(e.message.includes("stepId"), "AXIOM 5 FAILURE: Error incluye contexto de aplicación (stepId).");
    }

    logTestResult("✅ AXIOM 5: Errores Precisos (Sin Contexto de Aplicación) - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 6: FIRMA DE FÁBRICA
// ============================================================

function testRenderEngine_FactorySignature() {
  const { assert, logTestResult } = setupTest('FactorySignature');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    // TEST
    assert.isObject(engine, "FACTORY FAILURE: createRenderEngine debe retornar un objeto.");
    assert.isFunction(engine.render, "FACTORY FAILURE: Objeto debe tener método render().");
    assert.isTrue(Object.isFrozen(engine), "FACTORY FAILURE: Objeto no está congelado.");

    logTestResult("✅ FACTORY SIGNATURE: Contrato de Fábrica - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 7: FIRMA DE MÉTODO RENDER
// ============================================================

function testRenderEngine_RenderMethodSignature() {
  const { assert, logTestResult } = setupTest('RenderMethodSignature');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    // TEST
    const result1 = engine.render("{{a}}", { a: 1 });
    assert.strictEqual(result1, 1, "TEST 7A FAILED: Pass-through de números.");

    const result2 = engine.render("{{x}}-{{y}}", { x: "A" }, { y: "B" });
    assert.strictEqual(result2, "A-B", "TEST 7B FAILED: Múltiples contextos.");

    const result3 = engine.render("{{a}}", {}, {}, { a: "found" });
    assert.strictEqual(result3, "found", "TEST 7C FAILED: Tres contextos.");

    logTestResult("✅ RENDER METHOD SIGNATURE: Argumentos Variables - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 8: RENDERIZADO DE TIPOS (Recursivo)
// ============================================================

function testRenderEngine_RecursiveRendering() {
  const { assert, logTestResult } = setupTest('RecursiveRendering');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    // TEST 8A: Arrays
    const arrayTemplate = ["Item {{id}}", "Value {{val}}"];
    const arrayResult = engine.render(arrayTemplate, { id: "A", val: 42 });
    assert.deepEqual(arrayResult, ["Item A", "Value 42"], "TEST 8A FAILED: Array rendering.");

    // TEST 8B: Nested objects
    const nestedTemplate = { user: { name: "{{name}}", email: "{{email}}" }, status: "{{status}}" };
    const nestedContext = { name: "Juan", email: "juan@example.com", status: "active" };
    const nestedResult = engine.render(nestedTemplate, nestedContext);
    assert.deepEqual(nestedResult, { user: { name: "Juan", email: "juan@example.com" }, status: "active" }, "TEST 8B FAILED: Nested object rendering.");

    // TEST 8C: Deep paths
    const deepTemplate = "{{user.profile.email.address}}";
    const deepContext = { user: { profile: { email: { address: "deep@example.com" } } } };
    const deepResult = engine.render(deepTemplate, deepContext);
    assert.strictEqual(deepResult, "deep@example.com", "TEST 8C FAILED: Deep path resolution.");

    logTestResult("✅ RECURSIVE RENDERING: Arrays, Objects, Deep Paths - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 9: PLACEHOLDER ÚNICO (Pass-Through de Objetos)
// ============================================================

function testRenderEngine_SinglePlaceholderPassThrough() {
  const { assert, logTestResult } = setupTest('SinglePlaceholderPassThrough');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    // TEST 9A
    const complexObject = { type: "ComplexData", nested: { value: 42 }, array: [1, 2, 3] };
    const result = engine.render("{{data}}", { data: complexObject });
    assert.deepEqual(result, complexObject, "TEST 9A FAILED: SinglePlaceholder no retorna objeto estructuralmente idéntico.");

    // TEST 9B
    const resultWithText = engine.render("Datos: {{data}}", { data: complexObject });
    assert.isString(resultWithText, "TEST 9B FAILED: Con texto adicional, debe convertir a string.");

    logTestResult("✅ SINGLE PLACEHOLDER: Pass-Through de Objetos Complejos - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 10: MÚLTIPLES PLACEHOLDERS (Interpolación)
// ============================================================

function testRenderEngine_MultiPlaceholderInterpolation() {
  const { assert, logTestResult } = setupTest('MultiPlaceholderInterpolation');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    // TEST 10A
    const result1 = engine.render("{{first}} and {{second}}", { first: "Alpha", second: "Beta" });
    assert.strictEqual(result1, "Alpha and Beta", "TEST 10A FAILED: Multi-placeholder interpolation.");

    // TEST 10B
    const result2 = engine.render("ID: {{id}}, Status: {{status}}, User: {{user}}", { id: "123", status: "active", user: "john" });
    assert.strictEqual(result2, "ID: 123, Status: active, User: john", "TEST 10B FAILED: Complex interpolation.");

    logTestResult("✅ MULTI PLACEHOLDER: Interpolación Compleja - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 11: PRIMITIVOS (Sin conversión innecesaria)
// ============================================================

function testRenderEngine_PrimitiveTypes() {
  const { assert, logTestResult } = setupTest('PrimitiveTypes');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

    const template = { count: "{{count}}", enabled: "{{enabled}}", rate: "{{rate}}" };
    const context = { count: 42, enabled: true, rate: 3.14 };
    const result = engine.render(template, context);

    assert.deepEqual(result, { count: 42, enabled: true, rate: 3.14 }, "TEST PRIMITIVES FAILED: Tipos primitivos no se pasaron por pass-through.");

    logTestResult("✅ PRIMITIVE TYPES: Pass-Through Correcto - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// TEST SUITE 12: VALORES NULOS Y UNDEFINED
// ============================================================

function testRenderEngine_NullAndUndefined() {
  const { assert, logTestResult } = setupTest('NullAndUndefined');
  let originalCreateErrorHandler;

  try {
    // Setup
    originalCreateErrorHandler = globalThis.createErrorHandler;
    globalThis.createErrorHandler = createErrorHandlerMock;
    const errorHandler = createErrorHandler();
    const engine = createRenderEngine({ errorHandler });

  // TEST
  assert.throws(() => engine.render("Value: {{data}}", { data: null }), 'RENDER_ERROR');
  assert.throws(() => engine.render("{{missing}}", {}), 'RENDER_ERROR');

    logTestResult("✅ NULL/UNDEFINED: Manejo Correcto - VALIDADO");

  } finally {
    // Teardown
    globalThis.createErrorHandler = originalCreateErrorHandler;
  }
}

// ============================================================
// HELPER FUNCTION: Error Handler Mock
// ============================================================

function createErrorHandlerMock() {
  return {
    createError: function(code, message) {
      const error = new Error(message);
      error.code = code;
      return error;
    }
  };
}

// ============================================================
// MASTER TEST RUNNER
// ============================================================

function runRenderEngineAllTests() {
  Logger.log("\n╔════════════════════════════════════════════════════════════════╗");
  Logger.log("║          RenderEngine.spec.js - Ejecución Completa           ║");
  Logger.log("║      (Test-First: Especificaciones como Fuente de Verdad)     ║");
  Logger.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  try {
    // Axiomas (Contratos Inmutables)
    testRenderEngine_Axiom1_OnlySourceOfPlaceholderLogic();
    testRenderEngine_Axiom2_PureFunctionNoSideEffects();
    testRenderEngine_Axiom3_ContextStackPriority();
    testRenderEngine_Axiom4_SemanticAgnosticism();
    testRenderEngine_Axiom5_PreciseErrorsNoApplicationContext();
    
    // Firma de Fábrica y Método
    testRenderEngine_FactorySignature();
    testRenderEngine_RenderMethodSignature();
    
    // Funcionalidad de Renderizado
    testRenderEngine_RecursiveRendering();
    testRenderEngine_SinglePlaceholderPassThrough();
    testRenderEngine_MultiPlaceholderInterpolation();
    testRenderEngine_PrimitiveTypes();
    testRenderEngine_NullAndUndefined();
    
    Logger.log("\n╔════════════════════════════════════════════════════════════════╗");
    Logger.log("║                  ✅ ALL TESTS PASSED                          ║");
    Logger.log("║         RenderEngine meets all Axiomatic Contracts           ║");
    Logger.log("╚════════════════════════════════════════════════════════════════╝");
    
    return true;
    
  } catch (error) {
    Logger.log("\n╔════════════════════════════════════════════════════════════════╗");
    Logger.log("║                  ❌ TEST FAILED                               ║");
    Logger.log("╚════════════════════════════════════════════════════════════════╝");
    Logger.log("\nError:\n" + error.message);
    Logger.log("\nStack:\n" + error.stack);
    
    throw error;
  }
}

// Alias para ejecución manual
function testRenderEngine() {
  return runRenderEngineAllTests();
}





