// ======================================================================
// ARTEFACTO: 3_Adapters/MonitoringAdapter.gs
// DHARMA: Exponer el MonitoringService al CoreOrchestrator.
// ======================================================================
function createMonitoringAdapter({ monitoringService }) {
  // AXIOMA: Resiliencia de Infraestructura (H7-RESILIENCE)
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, 
    logEvent: () => {}, sendCriticalAlert: () => {} 
  };

  /**
   * Envuelve a monitoringService.logEvent para ser invocado desde un flujo.
   * @param {object} payload - El objeto eventData a loguear.
   */
  function logEvent(payload) {
    _monitor.logEvent(payload);
    // Los nodos de logging no suelen devolver nada importante.
    return { logged: true, eventType: payload.eventType };
  }

  const schemas = {
    logEvent: {
      description: "Registers a technical event stream into the institutional telemetry circuit.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          eventType: { type: "string", io_behavior: "SCHEMA", description: "Technical event category identifier." },
          details: { type: "object", io_behavior: "STREAM", description: "Payload stream containing event technicalities." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
        },
        outputs: {
          logged: { type: "boolean", io_behavior: "PROBE", description: "Telemetry registration status." }
        }
      }
    },
    sendCriticalAlert: {
      description: "Dispatches a high-priority structural alert stream to the institutional monitoring sentinel.",
      semantic_intent: "ACTUATOR",
      io_interface: {
        inputs: {
          error: { type: "object", io_behavior: "STREAM", description: "Technical error data stream." },
          context: { type: "object", io_behavior: "STREAM", description: "Execution context metadata stream." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Alert dispatch status confirmation." }
        } 
      }
    }
  };

  return Object.freeze({
    label: "Telemetry Orchestrator",
    description: "Industrial engine for event registration, technical monitoring, and institutional alerting.",
    semantic_intent: "SENSOR",
    schemas: schemas,
    logEvent
  });
}
