// ======================================================================
// ARTEFACTO: 1_Core/BlueprintRegistry.gs
// DHARMA: El Guardián de los Blueprints Sagrados (L0.5 Foundation)
// 
// PROPÓSITO: Define la esencia y estructura de los artefactos del sistema 
//            (COSMOS, LAYOUT, FLOW). Es la "Báscula de Precisión" que 
//            valida la integridad estructural de los datos.
// ======================================================================

/**
 * Factory para crear el BlueprintRegistry.
 * @returns {Object} Instancia con las leyes de forma y validación.
 */
function createBlueprintRegistry({ laws = {} } = {}) {
  
  /**
   * Valida un payload de entrada contra un esquema técnico.
   * Utilizado tanto para validación de archivos como para argumentos de API.
   * AXIOMA: Lógica de validación pura desacoplada de la fuente del esquema.
   */
  function validatePayload(payload, inputsSchema) {
    if (!inputsSchema) return { isValid: true, errors: [] };
    const globalErrors = [];

    function _validateItem(value, config, path) {
      if (config.validation && config.validation.required && (value === undefined || value === null || value === '')) {
        globalErrors.push(`El campo '${path}' (${config.label || path}) es obligatorio.`);
        return;
      }

      if (value !== undefined && value !== null) {
        if (config.type === 'number' && typeof value !== 'number') globalErrors.push(`El campo '${path}' debe ser numérico.`);
        if (config.type === 'string' && typeof value !== 'string') globalErrors.push(`El campo '${path}' debe ser un texto.`);
        if (config.type === 'array' && !Array.isArray(value)) globalErrors.push(`El campo '${path}' debe ser una lista.`);
        if (config.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) globalErrors.push(`El campo '${path}' debe ser un objeto.`);

        if (config.type === 'number' && config.validation && config.validation.range) {
          const [min, max] = config.validation.range;
          if (value < min || value > max) globalErrors.push(`El campo '${path}' debe estar entre ${min} y ${max}.`);
        }

        if (config.type === 'string' && config.validation && config.validation.pattern) {
          const regex = new RegExp(config.validation.pattern);
          if (!regex.test(value)) globalErrors.push(`El campo '${path}' no cumple con el formato requerido.`);
        }

        if (config.type === 'object' && config.structure && typeof value === 'object') {
           Object.keys(config.structure).forEach(subKey => {
               _validateItem(value[subKey], config.structure[subKey], `${path}.${subKey}`);
           });
        }

        if (config.type === 'array' && config.structure && config.structure.items && Array.isArray(value)) {
            value.forEach((item, index) => {
                _validateItem(item, config.structure.items, `${path}[${index}]`);
            });
        }
      }
    }

    Object.keys(inputsSchema).forEach(key => {
        _validateItem(payload[key], inputsSchema[key], key);
    });

    return { isValid: globalErrors.length === 0, errors: globalErrors };
  }

  // LEYES DE FORMA (Artifact Blueprints)
  const ARTIFACT_SCHEMAS = {
    "COSMOS_V1": {
      "identity": { type: "object", label: "Identidad", validation: { required: true }, structure: {
          "label": { type: "string" },
          "description": { type: "string" }
      }},
      "namespace": { type: "object", structure: {
          "ui": { type: "string" },
          "logic": { type: "string" },
          "data": { type: "string" }
      }}
    },
    "LAYOUT_V1": {
      "perspectives": { type: "object", validation: { required: true } },
      "slots": { type: "object" }
    },
    "FLOW_V1": {
      "steps": { type: "array", validation: { required: true } },
      "connections": { type: "array" }
    }
  };

  /**
   * Canoniza un artefacto físico basado en su indx_schema.
   */
  function canonize(artifact) {
    if (!artifact || typeof artifact !== 'object') return { isValid: false, errors: ['Artifact not an object'] };
    const schemaVersion = artifact.indx_schema;
    const targetSchema = ARTIFACT_SCHEMAS[schemaVersion];
    if (!targetSchema) return { isValid: false, errors: [`Unknown schema: ${schemaVersion}`] };
    const validation = validatePayload(artifact, targetSchema);
    return { isValid: validation.isValid, type: schemaVersion.split('_')[0], schemaVersion, errors: validation.errors };
  }

  return Object.freeze({
    id: "blueprint_registry",
    label: "Blueprint Orchestrator",
    description: "Industrial validator for technical artifact and payload integrity.",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    semantic_intent: "SCHEMA",
    validatePayload,
    canonize,
    ARTIFACT_SCHEMAS
  });
}





