// ======================================================================
// ARTEFACTO: 2_Services/FlowControlService.gs
// DHARMA: Proveer control de flujo y lógica de orquestación (pausas, detección de loops).
// ======================================================================

function createFlowControlService({ errorHandler }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('createFlowControlService: errorHandler contract not fulfilled');
  }

  function wait(payload) {
    const requested = payload && payload.milliseconds !== undefined ? Number(payload.milliseconds) : 1000;
    if (isNaN(requested) || requested < 0) {
      throw errorHandler.createError('INVALID_INPUT', 'wait requiere "milliseconds" numérico >= 0.');
    }
    const MAX_MS = 60000; 
    const ms = Math.min(requested, MAX_MS);
    try {
      Utilities.sleep(ms);
    } catch (e) {
      throw errorHandler.createError('ENVIRONMENT_ERROR', `wait falló al dormir ${ms}ms: ${e.message}`, { originalError: e });
    }
    return { waited: true, milliseconds: ms, timestamp: new Date().toISOString() };
  }

  function checkSyncLoop(inputMapping, dependencies) {
    const { entityId, sourceSystem, targetSystem, maxIterations = 3 } = inputMapping || {};
    const { flowContext } = dependencies || {};
    
    if (!entityId || !sourceSystem || !targetSystem) {
      throw errorHandler.createError('INVALID_INPUT', 'checkSyncLoop requiere "entityId", "sourceSystem" y "targetSystem".');
    }
    if (!flowContext || typeof flowContext !== 'object') {
      throw errorHandler.createError('INVALID_INPUT', 'checkSyncLoop requiere un flowContext (object).');
    }
    
    const syncKey = `${sourceSystem}_to_${targetSystem}_${entityId}`;
    const syncHistory = flowContext._syncHistory || {};
    const currentCount = syncHistory[syncKey] || 0;
    const newCount = currentCount + 1;
    
    if (!flowContext._syncHistory) flowContext._syncHistory = {};
    flowContext._syncHistory[syncKey] = newCount;
    
    const hasLoop = newCount > maxIterations;
    return {
      hasLoop: hasLoop,
      iterations: newCount,
      message: hasLoop 
        ? `Loop detectado: ${syncKey} procesado ${newCount} veces (límite: ${maxIterations})`
        : `Sincronización ${syncKey} en iteración ${newCount}/${maxIterations}`
    };
  }

  const schemas = {
    wait: {
      description: "Applies a temporal delay to the current execution circuit, ensuring process synchronization.",
      semantic_intent: "ACTUATOR",
      io_interface: { 
        inputs: { 
          milliseconds: { type: "number", io_behavior: "STREAM", description: "Temporal delay duration in milliseconds." } 
        },
        outputs: { 
          waited: { type: "boolean", io_behavior: "PROBE", description: "Synchronization completion status." } 
        }
      }
    },
    checkSyncLoop: {
      description: "Executes institucional loop detection to prevent algorithmic circularities within the workflow.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          entityId: { type: "string", io_behavior: "GATE", description: "Unique object identifier under inspection." },
          sourceSystem: { type: "string", io_behavior: "BRIDGE", description: "Primary data origin identifier." },
          targetSystem: { type: "string", io_behavior: "BRIDGE", description: "Target data destination identifier." },
          maxIterations: { type: "number", io_behavior: "GATE", description: "Maximum permitted technical iterations." }
        },
        outputs: { 
          hasLoop: { type: "boolean", io_behavior: "PROBE", description: "Algorithmic circularity detection status." } 
        }
      }
    }
  };

  return Object.freeze({
    label: "Orchestration Controller",
    description: "Industrial engine for execution flow regulation, temporal synchronization, and algorithmic safety.",
    semantic_intent: "KERNEL",
    archetype: "SERVICE",
    schemas: schemas,
    wait,
    checkSyncLoop
  });
}

