/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_compute.gs
 * RESPONSABILIDAD: Capa de Procesamiento, Lógica y Cognición (Brain).
 * DHARMA: 
 *   - Transformación: Ejecución de fórmulas y streams de datos.
 *   - Cognición: Interfaz con modelos de lenguaje e inteligencia artificial.
 * =============================================================================
 */

/**
 * Manifiesto del Silo Compute. 
 * Define las capacidades de procesamiento de datos y servicios inteligentes.
 * @returns {Object} Configuración inmutable del proveedor.
 */
function CONF_COMPUTE() {
  return Object.freeze({
    id: 'compute',
    exposure: 'public',
    handle: { 
      ns: 'com.indra.system.compute', 
      alias: 'compute', 
      label: 'Indra Compute', 
      icon: 'MEMORY' 
    },
    class: 'COMPUTE_SERVICE',
    version: '1.0.0',
    capabilities: {
      // --- CAPAS DE LÓGICA (DATA TRANSFORMATION) ---
      FORMULA_EVAL: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleCompute' },
      TABULAR_STREAM: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleCompute' },
      
      // --- CAPAS COGNITIVAS (INTELLIGENCE) ---
      INTELLIGENCE_CHAT: { sync: 'BLOCKING', exposure: 'public', handler: 'handleCompute' },
      GETMCEPMANIFEST: { sync: 'BLOCKING', exposure: 'public', handler: 'handleCompute' },
      RESONANCE_ANALYZE: { description: 'Análisis cognitivo de diferencias y transformaciones.', handler: 'handleCompute' }
    }
  });
}

/**
 * Punto de entrada para el dominio de Computación.
 * @param {Object} uqo - Universal Query Object.
 */
function handleCompute(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();
  logInfo(`[provider_compute] Routing: ${protocol}`);

  // 1. Capas Lógicas (Transformación)
  if (protocol === 'FORMULA_EVAL') return system_evaluateFormula(uqo);
  if (protocol === 'TABULAR_STREAM') return _system_handleTabularStream(uqo);
  if (protocol === 'RESONANCE_ANALYZE') return _resonance_analyze(uqo);

  // 2. Capas Inteligentes (Cognición)
  if (protocol === 'INTELLIGENCE_CHAT') return _ai_handleChat(uqo);
  if (protocol === 'GETMCEPMANIFEST') return _ai_handleDiscovery(uqo);

  throw createError('PROTOCOL_NOT_FOUND', `Compute no soporta: ${protocol}`);
}
