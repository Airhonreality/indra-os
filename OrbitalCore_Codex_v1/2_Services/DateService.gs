// ======================================================================
// ARTEFACTO: 2_Services/DateService.gs
// DHARMA: Proveer capacidades de gestión temporal y formateo de fechas.
// ======================================================================

function createDateService({ errorHandler }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('createDateService: errorHandler contract not fulfilled');
  }

  function getTimestamp() {
    return new Date().toISOString();
  }

  function formatDate(payload) {
    const { date, format = 'yyyy-MM-dd' } = payload || {};
    if (!date) {
      throw errorHandler.createError('INVALID_INPUT', 'DateService.formatDate: la propiedad "date" es requerida.');
    }
    try {
      const timezone = (typeof Session !== 'undefined' && Session.getScriptTimeZone) ? Session.getScriptTimeZone() : "UTC";
      const dateObject = new Date(date);
      if (isNaN(dateObject.getTime())) {
        throw errorHandler.createError("DATA_PROCESSING_ERROR", `'${date}' no es una fecha válida para formatDate.`);
      }
      return Utilities.formatDate(dateObject, timezone, format);
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError("DATA_PROCESSING_ERROR", `No fue posible formatear la fecha '${date}' con el formato '${format}'.`, { originalMessage: e.message });
    }
  }

  const schemas = {
    getTimestamp: { 
      description: "Extracts the current institutional timestamp in high-integrity ISO 8601 format.",
      semantic_intent: "PROBE",
      io_interface: { 
        outputs: {
          timestamp: { type: "string", io_behavior: "STREAM", description: "Current temporal marker stream." }
        } 
      }
    },
    formatDate: {
      description: "Transforms a raw date stream into a standardized institutional temporal pattern.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          date: { type: "string", io_behavior: "STREAM", description: "Source date/time data stream." },
          format: { type: "string", io_behavior: "SCHEMA", description: "Institutional temporal pattern (e.g. 'yyyy-MM-dd')." }
        }, 
        outputs: {
          formatted: { type: "string", io_behavior: "STREAM", description: "Formatted temporal string stream." }
        } 
      }
    }
  };

  return Object.freeze({
    label: "Temporal Orchestrator",
    description: "Industrial engine for temporal synchronization, ISO 8601 management, and institutional date formatting.",
    semantic_intent: "LOGIC",
    archetype: "SERVICE",
    schemas: schemas,
    getTimestamp,
    formatDate
  });
}

