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

  // --- SOVEREIGN CANON V8.0 (Poly-Archetype) ---
  const CANON = {
      LABEL: "Math Engine",
      // AXIOMA: Identidad Compuesta. Servicio base + Capacidad de Cómputo Pura.
      ARCHETYPES: ["SERVICE", "COMPUTE"],
      ARCHETYPE: "SERVICE", // Fallback Legacy
      DOMAIN: "LOGIC",
      SEMANTIC_INTENT: "COMPUTE",
      CAPABILITIES: {
          "calculate": {
              "io": "READ",
              "desc": "Deterministic operations (add, subtract, multiply, divide, percentage_of)",
              "inputs": { 
                "value1": { "type": "number" }, 
                "operator": { "type": "string" }, 
                "value2": { "type": "number" } 
              }
          },
          "formatCurrency": {
              "io": "READ",
              "desc": "Institutional currency formatting (Intl based)",
              "inputs": { 
                "value": { "type": "number" }, 
                "currencyCode": { "type": "string", "optional": true } 
              }
          }
      },
      VITAL_SIGNS: {
          "PRECISION": { "criticality": "NOMINAL", "value": "IEEE-754", "trend": "stable" }
      }
  };

  function verifyConnection() {
    return { status: "ACTIVE", logic: "DETERMINISTIC" };
  }

  return {
    CANON,
    id: "math",
    description: "Industrial engine for deterministic computation and institutional formatting.",
    semantic_intent: "LOGIC",
    
    // Legacy Bridge
    get schemas() {
        const s = {};
        for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
            s[key] = {
                description: cap.desc,
                io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
            };
        }
        return s;
    },

    // Protocol mapping (SYS_V1)
    verifyConnection,
    // Original methods
    calculate,
    formatCurrency
  };
}

