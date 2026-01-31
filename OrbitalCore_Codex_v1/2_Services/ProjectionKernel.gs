/**
 * 🛰️ PROJECTION KERNEL (2_Services/ProjectionKernel.gs)
 * Version: 1.0.0 (Stark Level 2048)
 * Dharma: Destilar la realidad del Core en un Esquema de Proyección seguro para el Satélite.
 */

function createProjectionKernel({ configurator, errorHandler, laws = {} }) {
  
  if (!configurator) throw new Error('ProjectionKernel: configurator dependency is required');
  if (!errorHandler) throw new Error('ProjectionKernel: errorHandler dependency is required');

  // AXIOMA: Leyes inyectadas
  const axioms = laws.axioms || (typeof LOGIC_AXIOMS !== 'undefined' ? LOGIC_AXIOMS : {});
  const constitution = laws.constitution || (typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {});
  
  const SENSITIVE_STRINGS = axioms.SENSITIVE_TERMS || ['KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
  const MASK = '********';

  /**
   * RF-1: Proyecta todas las capacidades del sistema.
   * Filtra el stack para exponer solo lo que tiene contrato explícito.
   */
  function getProjection(executionStack) {
    const contracts = {};
    const seenObjects = new Set();
    
    // Ordenamos las llaves para procesar primero los alias si existen
    const keys = Object.keys(executionStack).sort((a, b) => a.length - b.length);

    keys.forEach(key => {
      const component = executionStack[key];
      
      // GUARD: Solo procesamos objetos con esquemas definidos
      if (typeof component === 'object' && component !== null && component.schemas) {
        // Evitamos duplicados si el mismo objeto está en varias llaves
        if (seenObjects.has(component)) return;

        const methods = Object.keys(component.schemas).filter(methodName => {
          return typeof component[methodName] === 'function' && !methodName.startsWith('_');
        });

        if (methods.length > 0) {
          contracts[key] = {
            label: component.label || key,
            description: component.description || '',
            semantic_intent: component.semantic_intent || 'STREAM',
            archetype: component.archetype || component.semantic_intent || 'ADAPTER',
            resource_weight: component.resource_weight || 'low',
            methods: methods,
            schemas: _distillSchemas(component.schemas)
          };
          seenObjects.add(component);
        }
      }
    });

    return {
      contracts: contracts,
      timestamp: new Date().toISOString(),
      version: constitution.version || '1.1.0-STARK'
    };
  }

  /**
   * RF-2: Proyecta el contexto de configuración filtrado.
   */
  function getFilteredContext() {
    try {
      const allParams = configurator.getAllParameters();
      const filteredParams = {};

      Object.keys(allParams).forEach(key => {
        const isSensitive = SENSITIVE_STRINGS.some(s => key.toUpperCase().includes(s));
        
        // Axioma #2: Masking
        if (isSensitive) {
          filteredParams[key] = MASK;
        } else {
          filteredParams[key] = allParams[key];
        }
      });

      return {
        configuration: filteredParams,
        meta: {
          environment: 'production',
          timestamp: new Date().toISOString(),
          version: constitution.version || 'OrbitalCore V1.1 (Stark Ready)'
        }
      };
    } catch (e) {
      throw errorHandler.createError('PROJECTION_ERROR', `Context distillation failed: ${e.message}`);
    }
  }

  /**
   * RF-3: Valida si un método de un ejecutor está expuesto al Satélite.
   * Centraliza la política de seguridad de exposición.
   */
  function isMethodExposed(executionStack, executorKey, methodName) {
    const component = executionStack[executorKey];
    
    // GUARD: Debe ser un componente con esquemas
    if (!component || typeof component !== 'object' || !component.schemas) return false;
    
    const schema = component.schemas[methodName];
    
    // GUARD: El método debe tener esquema y no ser interno
    if (!schema || schema.exposure === 'internal') return false;

    // GUARD: El método debe existir y no ser privado (_)
    if (typeof component[methodName] !== 'function' || methodName.startsWith('_')) return false;

    return true;
  }

  // --- Helpers Privados ---

  /**
   * Limpia y proyecta los esquemas de los métodos.
   * @private
   */
  function _distillSchemas(schemas) {
    const distilled = {};
    Object.keys(schemas).forEach(methodName => {
      const schema = schemas[methodName];
      
      // AXIOMA #5: Filtrado por Exposición Explícita
      // Si el esquema tiene exposure: 'internal', lo ignoramos en la proyección
      if (schema.exposure === 'internal') return;

      // Clonado profundo simple (Axioma #4: Inmutabilidad)
      distilled[methodName] = JSON.parse(JSON.stringify(schema));
      
      const target = distilled[methodName];

      // Enmascarar ejemplos de inputs si son sensibles
      if (target.io && target.io.inputs) {
        Object.keys(target.io.inputs).forEach(inputKey => {
          const input = target.io.inputs[inputKey];
          // Axioma #2: Masking Semántico
          if (input.role === 'security' || SENSITIVE_STRINGS.some(s => inputKey.toUpperCase().includes(s))) {
            input.example = MASK;
            if (input.default) input.default = MASK;
            delete input.validation; // Protegemos las reglas de validación de secretos (ej: regex de API keys)
          }
        });
      }

      // Sanitización de Outputs
      if (target.io && target.io.outputs) {
        Object.keys(target.io.outputs).forEach(outputKey => {
          const output = target.io.outputs[outputKey];
          if (output.role === 'security') {
            output.structure = MASK;
          }
        });
      }
    });
    return distilled;
  }

  // Interfaz Pública Congelada
  return Object.freeze({
    getProjection,
    getFilteredContext,
    isMethodExposed,
    label: 'ProjectionKernel',
    description: 'Motor de destilación semántica para proyección de interfaz.',
    archetype: 'SYSTEM_CORE',
    resource_weight: 'medium'
  });
}

