// ======================================================================
// ARTEFACTO: 2_Services/MathService.gs
// DHARMA: Proveer capacidades de cálculo determinista y formateo numérico.
// ======================================================================

function createMathService({ errorHandler }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('createMathService: errorHandler contract not fulfilled');
  }

  function calculate(payload) {
    const { value1, operator, value2 } = payload || {};
    const num1 = Number(value1);
    const num2 = Number(value2);
    if (isNaN(num1) || (value2 !== undefined && isNaN(num2))) {
      throw errorHandler.createError('INVALID_INPUT', `Valores no numéricos para calculate: '${value1}', '${value2}'`);
    }
    switch (operator) {
      case 'add': return { result: num1 + num2 };
      case 'subtract': return { result: num1 - num2 };
      case 'multiply': return { result: num1 * num2 };
      case 'divide':
        if (num2 === 0) throw errorHandler.createError('DATA_PROCESSING_ERROR', 'División por cero en calculate.');
        return { result: num1 / num2 };
      case 'percentage_of': return { result: (num1 * num2) / 100 };
      default:
        throw errorHandler.createError('INVALID_INPUT', `Operador desconocido en calculate: '${operator}'`);
    }
  }

  function formatCurrency(payload) {
    const { value, currencyCode = 'USD' } = payload || {};
    if (value === undefined || value === null) {
        throw errorHandler.createError('INVALID_INPUT', 'MathService.formatCurrency: la propiedad "value" es requerida.');
    }
    const number = Number(value);
    if (isNaN(number)) {
      throw errorHandler.createError("DATA_PROCESSING_ERROR", `El valor '${value}' no es un número válido para formatCurrency.`);
    }
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(number);
    } catch (e) {
      throw errorHandler.createError("DATA_PROCESSING_ERROR", `No fue posible formatear la moneda con el código '${currencyCode}'.`, { originalMessage: e.message });
    }
  }

  const schemas = {
    calculate: {
      description: "Executes a deterministic mathematical operation on a pair of numerical data streams.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          value1: { type: "number", io_behavior: "STREAM", description: "Primary numerical data stream." },
          operator: { type: "string", io_behavior: "SCHEMA", description: "Mathematical operator identifier (add, subtract, etc.)." },
          value2: { type: "number", io_behavior: "STREAM", description: "Secondary numerical data stream." }
        }, 
        outputs: {
          result: { type: "number", io_behavior: "STREAM", description: "Resulting numerical state after operation." }
        } 
      }
    },
    formatCurrency: {
      description: "Transforms a raw numerical stream into an institutional currency representation.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          value: { type: "number", io_behavior: "STREAM", description: "Numerical amount to be formatted." },
          currencyCode: { type: "string", io_behavior: "SCHEMA", description: "Target currency identifier (ISO 4217)." }
        }, 
        outputs: {
          formatted: { type: "string", io_behavior: "STREAM", description: "Formatted currency string." }
        } 
      }
    }
  };

  return Object.freeze({
    label: "Numerical Orchestrator",
    description: "Industrial engine for deterministic computation and institutional formatting.",
    semantic_intent: "LOGIC",
    archetype: "SERVICE",
    schemas: schemas,
    calculate,
    formatCurrency
  });
}

