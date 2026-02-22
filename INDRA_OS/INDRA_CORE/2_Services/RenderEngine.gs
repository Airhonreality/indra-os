/**
 * ============================================================
 * RenderEngine.gs - Intérprete Universal de Placeholders
 * ============================================================
 * Dharma: Ser el Intérprete Universal de Placeholders para el
 * Indra Core, siguiendo un conjunto de axiomas estrictos.
 *
 * Responsabilidades Clave:
 * 1. Reemplazar placeholders `{{key}}` en strings, objetos y arrays.
 * 2. Operar como una función pura, sin efectos secundarios.
 * 3. Manejar un stack de contextos con prioridad definida.
 * 4. Ser agnóstico a la semántica de los datos que procesa.
 * 5. Proveer errores precisos cuando un placeholder no puede ser resuelto.
 *
 * @see {@link RenderEngine.spec.js} para el contrato axiomático completo.
 */

/**
 * Factory para crear una instancia del RenderEngine.
 * Esta es la única función global expuesta por este módulo.
 *
 * @param {object} dependencies - Dependencias inyectadas.
 * @param {object} dependencies.errorHandler - El manejador de errores del sistema.
 * @returns {object} Una instancia inmutable (congelada) del RenderEngine.
 */
function createRenderEngine({ errorHandler, monitoringService }) {

  if (!errorHandler) {
    throw new Error("RenderEngine Factory Error: 'errorHandler' is a required dependency.");
  }

  // AXIOMA: Resiliencia de Infraestructura
  // Garantizar que el motor no muera si no hay monitor (ej: en tests unitarios)
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, 
    logEvent: () => {}, sendCriticalAlert: () => {} 
  };

  /**
   * Filtros disponibles para transformar valores en placeholders.
   * Uso: {{key | filterName}}
   * @private
   */
  const FILTERS = {
    'values': function(obj) {
      if (typeof obj !== 'object' || obj === null) return obj;
      return Object.values(obj);
    },
    'keys': function(obj) {
      if (typeof obj !== 'object' || obj === null) return obj;
      return Object.keys(obj);
    },
    'length': function(arr) {
      if (Array.isArray(arr)) return arr.length;
      if (typeof arr === 'string') return arr.length;
      if (typeof arr === 'object' && arr !== null) return Object.keys(arr).length;
      return 0;
    },
    'first': function(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      return arr[0];
    },
    'last': function(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      return arr[arr.length - 1];
    },
    'upper': function(str) {
      if (typeof str !== 'string') return str;
      return str.toUpperCase();
    },
    'lower': function(str) {
      if (typeof str !== 'string') return str;
      return str.toLowerCase();
    },
    'trim': function(str) {
      if (typeof str !== 'string') return str;
      return str.trim();
    }
  };

  /**
   * Resuelve un path anidado con soporte de arrays.
   * 
   * AXIOMAS IMPLEMENTADOS:
   * - AXIOMA 1: Soporta sintaxis unificada (objetos, arrays, mixto)
   * - AXIOMA 2: Normaliza paths antes de navegación
   * - AXIOMA 3: Distingue índices numéricos vs keys de objeto
   * - AXIOMA 4: Cortocircuito en valores no navegables
   * - AXIOMA 7: No lanza excepciones, retorna undefined
   * 
   * Ejemplos válidos:
   *   "user.name" → Objeto anidado
   *   "items[0]" → Array con índice
   *   "data.users[1].name" → Navegación mixta
   *   "matrix[0][1]" → Arrays multidimensionales
   * 
   * @private
   * @param {string} path - El path a resolver (puede contener [índices])
   * @param {object} context - El objeto/array en el cual buscar
   * @returns {*} El valor encontrado, o `undefined` si no se encuentra
   */
  function _resolvePath(path, context) {
    // AXIOMA 2: Normalización de path
    // Convertir "data[0].key[1]" a "data.0.key.1"
    const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1');
    
    // Dividir en segmentos y filtrar vacíos
    const segments = normalizedPath.split('.').filter(s => s.length > 0);
    
    let current = context;
    
    // AXIOMA 4: Navegación con cortocircuito
    for (const segment of segments) {
      // Cortocircuito: valores nulos o indefinidos
      if (current === null || current === undefined) {
        return undefined;
      }
      
      // AXIOMA 3: Distinción de tipo por segmento
      const isNumericIndex = /^\d+$/.test(segment);
      
      if (isNumericIndex) {
        // Tipo A: Índice numérico
        const index = parseInt(segment, 10);
        
        if (Array.isArray(current)) {
          current = current[index];
        } else {
          // Intentando indexar algo que no es array
          // Pero podría ser una key numérica en un objeto (caso edge)
          if (typeof current === 'object' && segment in current) {
            current = current[segment];
          } else {
            return undefined;
          }
        }
      } else {
        // Tipo B: Key de objeto
        if (typeof current !== 'object') {
          // Cortocircuito: no se puede acceder a properties de primitivos
          return undefined;
        }
        
        current = current[segment];
      }
    }
    
    // AXIOMA 5: Resultado predictible
    return current;
  }

  /**
   * Busca un valor para una clave de placeholder a través del stack de contextos.
   * Soporta filtros usando pipe: {{key | filter1 | filter2}}
   * @private
   * @param {string} key - La clave del placeholder (sin los bigotes `{{}}`).
   * @param {Array<object>} contexts - El array de contextos a buscar.
   * @returns {*} El valor encontrado (potencialmente transformado por filtros), o `undefined`.
   */
  function _findValueInContexts(key, contexts) {
    // Detectar si hay filtros (ej: "db.properties | values")
    const parts = key.split('|').map(p => p.trim());
    const basePath = parts[0];
    const filterNames = parts.slice(1);
    
    // DIAGNÓSTICO CRÍTICO: Log del stack de contextos
    _monitor.logDebug(`[RenderEngine] Buscando key: "${key}"`);
    _monitor.logDebug(`[RenderEngine] Base path: "${basePath}"`);
    if (filterNames.length > 0) {
      _monitor.logDebug(`[RenderEngine] Filtros detectados: [${filterNames.join(', ')}]`);
    }
    _monitor.logDebug(`[RenderEngine] Número de contextos: ${contexts.length}`);
    
    // Buscar el valor base en los contextos
    let value = undefined;
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      _monitor.logDebug(`[RenderEngine] Contexto[${i}] keys: [${Object.keys(context).join(', ')}]`);
      
      value = _resolvePath(basePath, context);
      if (value !== undefined) {
        _monitor.logDebug(`[RenderEngine] ✅ Valor base encontrado en contexto[${i}]`);
        break;
      } else {
        _monitor.logDebug(`[RenderEngine] ❌ Valor NO encontrado en contexto[${i}]`);
      }
    }
    
    if (value === undefined) {
      _monitor.logDebug(`[RenderEngine] Key "${basePath}" no encontrada en los contextos proporcionados.`);
      return undefined;
    }
    
    // Aplicar filtros secuencialmente
    for (const filterName of filterNames) {
      const filter = FILTERS[filterName];
      if (!filter) {
        _monitor.logError(`[RenderEngine] ❌ Filtro desconocido: "${filterName}"`);
        throw errorHandler.createError('INVALID_TEMPLATE', `Unknown filter: "${filterName}"`);
      }
      
      _monitor.logDebug(`[RenderEngine] Aplicando filtro: ${filterName}`);
      value = filter(value);
    }
    
    return value;
  }

  /**
   * La función de renderizado principal. Procesa un template (string, objeto o array)
   * y lo interpola con los datos del stack de contextos.
   *
   * @param {*} template - El template a procesar.
   * @param {...object} contexts - Una lista variable de objetos de contexto.
   * @returns {*} El template renderizado.
   * @throws {Error} Un error creado por el `errorHandler` si un placeholder no puede ser resuelto.
   */
  function render(template, ...contexts) {
    // Si el template no es un string, es un objeto o array, se procesa recursivamente.
    if (typeof template !== 'string') {
      return _renderRecursive(template, contexts);
    }

    // Expresión regular para encontrar todos los placeholders {{key}}
    const placeholderRegex = /\{\{([^}]+)\}\}/g;

    // Caso especial: Si el template es SÓLO un placeholder (ej. "{{data}}")
    const singlePlaceholderMatch = template.match(/^\{\{([^}]+)\}\}$/);
    if (singlePlaceholderMatch) {
      const key = singlePlaceholderMatch[1].trim();
      const value = _findValueInContexts(key, contexts);

      if (value === undefined || value === null) {
        throw errorHandler.createError('RENDER_ERROR', `Placeholder '{{${key}}}' could not be resolved.`);
      }
      // Retorna el valor original (objeto, array, número) sin convertirlo a string.
      return value;
    }

    // Caso general: Interpolación de uno o más placeholders en un string.
    const renderedString = template.replace(placeholderRegex, (match, key) => {
      const trimmedKey = key.trim();
      const value = _findValueInContexts(trimmedKey, contexts);

      if (value === undefined || value === null) {
        throw errorHandler.createError('RENDER_ERROR', `Placeholder '{{${trimmedKey}}}' could not be resolved.`);
      }
      
      // Si el valor es un objeto, se serializa a un string genérico.
      if (typeof value === 'object') {
        return '[object Object]';
      }

      return value;
    });

    return renderedString;
  }

  /**
   * Ayudante recursivo para renderizar objetos y arrays.
   * @private
   * @param {*} data - El objeto o array a procesar.
   * @param {Array<object>} contexts - El stack de contextos.
   * @returns {*} La estructura de datos renderizada.
   */
  function _renderRecursive(data, contexts) {
    if (Array.isArray(data)) {
      return data.map(item => render(item, ...contexts));
    }

    if (typeof data === 'object' && data !== null) {
      const newObj = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          newObj[key] = render(data[key], ...contexts);
        }
      }
      return newObj;
    }

    // Para primitivos (strings, números, etc.) que no están en un string de template,
    // la función `render` los devolverá directamente.
    return data;
  }

  const schemas = {
    render: {
      description: "Executes industrial template orchestration by interpolating technical placeholders with a multi-context data stream.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          template: { type: "any", io_behavior: "SCHEMA", description: "Technical template pattern (string, object, or array)." },
          contexts: { type: "array", io_behavior: "STREAM", description: "Ordered collection of technical data streams for interpolation." }
        }, 
        outputs: {
          result: { type: "any", io_behavior: "STREAM", description: "Rendered technical product." }
        } 
      }
    }
  };

  return Object.freeze({
    id: "service_render_engine",
    label: "Template Master",
    description: "Industrial engine for path-based interpolation, recursive rendering, and technical document generation.",
    semantic_intent: "LOGIC",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    schemas: schemas,
    render,
    _testResolvePath: _resolvePath
  });
}

// ============================================================
// TESTS DE VALIDACIÓN DE AXIOMAS (Para ejecución manual)
// ============================================================

/**
 * Ejecuta tests de validación de los axiomas de navegación de paths.
 * Llama a esta función manualmente desde el editor para verificar la implementación.
 * 
 * @returns {object} Resultado de los tests con estadísticas
 */
function testRenderEngineAxioms() {
  const errorHandler = {
    createError: function(code, message) {
      return { code, message };
    }
  };
  
  const engine = createRenderEngine({ errorHandler });
  
  // AXIOMA 5: Casos de Prueba Canónicos
  const testData = {
    simple: "value",
    nested: { deep: { value: 42 } },
    array: [10, 20, 30],
    mixed: [
      { id: 1, name: "first" },
      { id: 2, name: "second" }
    ],
    matrix: [
      [1, 2, 3],
      [4, 5, 6]
    ],
    edge: {
      "0": "string-key-zero",
      items: [{ "0": "nested-string-key" }]
    },
    nullValue: null,
    undefinedValue: undefined,
    emptyString: "",
    zero: 0,
    falseBool: false
  };
  
  const tests = [
    // Tests básicos de objeto
    { path: "simple", expected: "value", desc: "Acceso simple a propiedad" },
    { path: "nested.deep.value", expected: 42, desc: "Navegación anidada en objeto" },
    
    // Tests de arrays
    { path: "array[0]", expected: 10, desc: "Acceso a primer elemento de array" },
    { path: "array[1]", expected: 20, desc: "Acceso a segundo elemento de array" },
    { path: "array[2]", expected: 30, desc: "Acceso a tercer elemento de array" },
    
    // Tests de navegación mixta
    { path: "mixed[0].id", expected: 1, desc: "Navegación mixta: array → objeto" },
    { path: "mixed[0].name", expected: "first", desc: "Navegación mixta: array → objeto → propiedad" },
    { path: "mixed[1].name", expected: "second", desc: "Navegación mixta: segundo elemento" },
    
    // Tests de arrays multidimensionales
    { path: "matrix[0][0]", expected: 1, desc: "Matriz: posición [0][0]" },
    { path: "matrix[0][2]", expected: 3, desc: "Matriz: posición [0][2]" },
    { path: "matrix[1][1]", expected: 5, desc: "Matriz: posición [1][1]" },
    { path: "matrix[1][2]", expected: 6, desc: "Matriz: posición [1][2]" },
    
    // Tests de casos edge (keys numéricas en objetos)
    { path: "edge.0", expected: "string-key-zero", desc: "Key numérica en objeto (no array)" },
    { path: "edge.items[0].0", expected: "nested-string-key", desc: "Key numérica anidada" },
    
    // Tests de valores especiales (NO deben ser undefined)
    { path: "emptyString", expected: "", desc: "String vacío es válido" },
    { path: "zero", expected: 0, desc: "Número cero es válido" },
    { path: "falseBool", expected: false, desc: "Boolean false es válido" },
    
    // Tests de valores realmente undefined/null
    { path: "nullValue", expected: null, desc: "Null es retornado como null" },
    { path: "undefinedValue", expected: undefined, desc: "Undefined es retornado como undefined" },
    
    // Tests de paths inexistentes (deben retornar undefined)
    { path: "nonexistent", expected: undefined, desc: "Path inexistente retorna undefined" },
    { path: "array[99]", expected: undefined, desc: "Índice fuera de rango retorna undefined" },
    { path: "simple.impossible", expected: undefined, desc: "Navegación en primitivo retorna undefined" },
    { path: "array.key", expected: undefined, desc: "Acceso a key en array retorna undefined" },
    { path: "nested.deep.nonexistent", expected: undefined, desc: "Path parcialmente válido retorna undefined" }
  ];
  
  const results = {
    total: tests.length,
    passed: 0,
    failed: 0,
    errors: []
  };
  
  Logger.log("═══════════════════════════════════════════════════════");
  Logger.log("🧪 TESTS DE AXIOMAS - RENDERENGINE PATH NAVIGATION");
  Logger.log("═══════════════════════════════════════════════════════\n");
  
  tests.forEach((test, index) => {
    try {
      const actual = engine._testResolvePath(test.path, testData);
      const passed = actual === test.expected;
      
      if (passed) {
        results.passed++;
        Logger.log(`✅ Test ${index + 1}/${tests.length}: ${test.desc}`);
        Logger.log(`   Path: "${test.path}" → ${JSON.stringify(actual)}`);
      } else {
        results.failed++;
        results.errors.push({
          test: test.desc,
          path: test.path,
          expected: test.expected,
          actual: actual
        });
        Logger.log(`❌ Test ${index + 1}/${tests.length}: ${test.desc}`);
        Logger.log(`   Path: "${test.path}"`);
        Logger.log(`   Expected: ${JSON.stringify(test.expected)}`);
        Logger.log(`   Actual: ${JSON.stringify(actual)}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        test: test.desc,
        path: test.path,
        error: error.message
      });
      Logger.log(`💥 Test ${index + 1}/${tests.length}: ${test.desc} - EXCEPTION`);
      Logger.log(`   Error: ${error.message}`);
    }
    Logger.log("");
  });
  
  Logger.log("═══════════════════════════════════════════════════════");
  Logger.log(`📊 RESULTADOS: ${results.passed}/${results.total} tests pasaron`);
  Logger.log(`   ✅ Pasados: ${results.passed}`);
  Logger.log(`   ❌ Fallidos: ${results.failed}`);
  Logger.log("═══════════════════════════════════════════════════════");
  
  if (results.failed > 0) {
    Logger.log("\n🔍 DETALLES DE FALLOS:");
    results.errors.forEach((err, idx) => {
      Logger.log(`\n${idx + 1}. ${err.test}`);
      Logger.log(`   Path: "${err.path}"`);
      if (err.error) {
        Logger.log(`   Exception: ${err.error}`);
      } else {
        Logger.log(`   Expected: ${JSON.stringify(err.expected)}`);
        Logger.log(`   Actual: ${JSON.stringify(err.actual)}`);
      }
    });
  }
  
  return results;
}







