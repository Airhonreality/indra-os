// ======================================================================
// ARTEFACTO: 3_Adapters/LowFi_PdfAdapter.gs (NUEVO - TEMPORAL)
// DHARMA: Generar un PDF de "baja fidelidad" usando APIs nativas de GAS.
//         Sirve como un sustituto funcional para el HiFi_PdfAdapter
//         durante la fase de estabilización del Core.
// ======================================================================

function createLowFi_PdfAdapter({ errorHandler }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('createLowFi_PdfAdapter: errorHandler contract not fulfilled');
  }

  /**
   * Genera un PDF a partir de un string HTML usando la conversión nativa de GAS.
   * La fidelidad del renderizado es BAJA y no es compatible con CSS complejo.
   * @param {object} payload - { htmlContent: string }
   * @returns {object} Payload enriquecido con { pdfBlob: Blob }
   */
  function generate(payload) {
    if (!payload || typeof payload.htmlContent !== 'string') {
      throw errorHandler.createError('CONFIGURATION_ERROR', 'LowFi_PdfAdapter.generate: payload.htmlContent must be a string.');
    }

    try {
      // Usar la capacidad nativa de GAS para la conversión
      const pdfBlob = Utilities.newBlob(payload.htmlContent, 'text/html', 'report.pdf').getAs('application/pdf');
      
      if (!pdfBlob || pdfBlob.getBytes().length === 0) {
        throw errorHandler.createError('SYSTEM_FAILURE', 'La conversión nativa de GAS a PDF generó un blob vacío.');
      }

      // Devolver la misma estructura que el HiFi_PdfAdapter
      return { ...payload, pdfBlob: pdfBlob };

    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('NATIVE_API_ERROR', `Fallo la conversión nativa a PDF de GAS: ${e.message}`, { originalError: e });
    }
  }

  const schemas = {
    generate: {
      description: "Transforms a technical HTML data stream into an institutional PDF document structure using native conversion circuits.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          htmlContent: { type: "string", io_behavior: "STREAM", description: "Technical HTML content stream to be converted." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          pdfBlob: { type: "object", io_behavior: "STREAM", description: "Resulting industrial PDF binary data stream." }
        } 
      }
    }
  };

  return Object.freeze({
    label: "Document Orchestrator",
    description: "Industrial engine for technical document synthesis, HTML-to-PDF transformation, and institutional reporting.",
    semantic_intent: "BRIDGE",
    schemas: schemas,
    generate
  });
}
