// ======================================================================
// ARTEFACTO: 1_Core/SchemaRegistry.gs
// DHARMA: Ser el Guardián de los Blueprints Sagrados. Define la estructura 
//         mínima requerida para que un artefacto sea considerado válido.
// ======================================================================

/**
 * Factory para crear el SchemaRegistry.
 * @returns {Object} Instancia inmutable con los esquemas del sistema.
 */
function createSchemaRegistry({ laws = {} } = {}) {
  
  /**
   * ACCESO A BLUEPRINTS CENTRALIZADOS (0_Laws)
   * En Indra OS v5.5, el SchemaRegistry es solo un motor de validación.
   * La "verdad" de las estructuras reside en Contract_Blueprints.gs.
   */
  const BLUEPRINTS = laws.blueprints || (typeof CONTRACT_BLUEPRINTS !== 'undefined' ? 
                     CONTRACT_BLUEPRINTS : {});


  /**
   * Valida un payload de entrada contra el esquema io.inputs de un método operativo.
   * Soporta recursividad axiomática para estructuras profundas.
   * @param {Object} payload - Los datos enviados por el Satélite.
   * @param {Object} inputsSchema - El bloque 'io.inputs' del contrato.
   * @returns {Object} { isValid: boolean, errors: Array }
   */
  function validatePayload(payload, inputsSchema) {
    if (!inputsSchema) return { isValid: true, errors: [] };
    const globalErrors = [];

    // Función interna recursiva para validar cualquier ítem
    function _validateItem(value, config, path) {
      // 1. Verificación de Obligatoriedad
      if (config.validation && config.validation.required && (value === undefined || value === null || value === '')) {
        globalErrors.push(`El campo '${path}' (${config.label || path}) es obligatorio.`);
        return;
      }

      if (value !== undefined && value !== null) {
        // 2. Verificación de Tipos Básicos
        if (config.type === 'number' && typeof value !== 'number') {
           globalErrors.push(`El campo '${path}' debe ser numérico.`);
        }
        if (config.type === 'string' && typeof value !== 'string') {
           globalErrors.push(`El campo '${path}' debe ser un texto.`);
        }
        if (config.type === 'array' && !Array.isArray(value)) {
           globalErrors.push(`El campo '${path}' debe ser una lista.`);
        }
        if (config.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
           globalErrors.push(`El campo '${path}' debe ser un objeto.`);
        }

        // 3. Verificación de Rangos
        if (config.type === 'number' && config.validation && config.validation.range) {
          const [min, max] = config.validation.range;
          if (value < min || value > max) {
            globalErrors.push(`El campo '${path}' debe estar entre ${min} y ${max}.`);
          }
        }

        // 4. Verificación de Patrones (Regex)
        if (config.type === 'string' && config.validation && config.validation.pattern) {
          const regex = new RegExp(config.validation.pattern);
          if (!regex.test(value)) {
            globalErrors.push(`El campo '${path}' no cumple con el formato requerido.`);
          }
        }

        // 5. Verificación Recursiva (Objetos Anidados)
        if (config.type === 'object' && config.structure && typeof value === 'object') {
           Object.keys(config.structure).forEach(subKey => {
               const subConfig = config.structure[subKey];
               const subValue = value[subKey];
               _validateItem(subValue, subConfig, `${path}.${subKey}`);
           });
        }

        // 6. Verificación Recursiva (Arrays)
        if (config.type === 'array' && config.structure && config.structure.items && Array.isArray(value)) {
            const itemConfig = config.structure.items; // Estructura del ítem
            value.forEach((item, index) => {
                _validateItem(item, itemConfig, `${path}[${index}]`);
            });
        }
      }
    }

    // Iniciar validación desde la raíz
    Object.keys(inputsSchema).forEach(key => {
        _validateItem(payload[key], inputsSchema[key], key);
    });

    return {
      isValid: globalErrors.length === 0,
      errors: globalErrors
    };
  }

  /**
   * Valida un objeto contra un blueprint.
   */
  function validate(artifact, type) {
    const blueprint = BLUEPRINTS[type];
    if (!blueprint) return { isValid: false, errors: [`Unknown schema type: ${type}`] };

    const errors = [];
    blueprint.required.forEach(prop => {
      if (!(prop in artifact)) {
        errors.push(`Missing required property: ${prop}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  const schemas = {
    validatePayload: {
      description: "Benchmarks an input data stream against a technical IO interface definition.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          payload: { type: "object", io_behavior: "STREAM", description: "The data stream to be validated." },
          inputsSchema: { type: "object", io_behavior: "SCHEMA", description: "The technical IO interface schema." }
        }, 
        outputs: {
          isValid: { type: "boolean", io_behavior: "PROBE", description: "Structural validation status." },
          errors: { type: "array", io_behavior: "STREAM", description: "Collection of structural failure messages." }
        } 
      }
    },
    validate: {
      description: "Benchmarks a technical artifact against an institutional blueprint.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          artifact: { type: "object", io_behavior: "STREAM", description: "The technical artifact to validate." },
          type: { type: "string", io_behavior: "SCHEMA", description: "Institutional blueprint identifier." }
        }, 
        outputs: {
          isValid: { type: "boolean", io_behavior: "PROBE", description: "Blueprint compliance status." },
          errors: { type: "array", io_behavior: "STREAM", description: "Collection of blueprint compliance failures." }
        } 
      }
    }
  };

  return Object.freeze({
    label: "Blueprint Orchestrator",
    description: "Industrial validator for institucional blueprints and technical payload integrity.",
    semantic_intent: "SCHEMA",
    schemas: schemas,
    validate,
    validatePayload,
    getBlueprint: (type) => BLUEPRINTS[type] || null
  });
}

