// ======================================================================
// ARTEFACTO: 3_Adapters/LowFi_PdfAdapter.gs (NUEVO - TEMPORAL)
// DHARMA: Generar un PDF de "baja fidelidad" usando APIs nativas de GAS.
//         Sirve como un sustituto funcional para el HiFi_PdfAdapter
//         durante la estabilización del Core.
// ======================================================================

function createLowFi_PdfAdapter({ errorHandler }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('createLowFi_PdfAdapter: errorHandler contract not fulfilled');
  }

  // --- AXIOM CANON: Normalización Semántica ---

  function _mapDocumentRecord(blob, title) {
    return {
      id: Utilities.getUuid(),
      title: title || "Generated PDF",
      content: {
        blob: blob,
        type: 'PDF_BINARY'
      },
      url: null,
      lastUpdated: new Date().toISOString(),
      raw: { size: blob.getBytes().length }
    };
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

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
    id: "pdf_generator",
    label: "Axiom PDF Engine",
    archetype: "adapter",
    domain: "editing",
    REIFICATION_HINTS: {
        id: "id",
        label: "title || name || id",
        items: "items"
    },
    CAPABILITIES: {
      "generate": {
        "id": "TRANSFORM",
        "io": "WRITE",
        "desc": "Transforms institutional HTML streams into high-integrity PDF resources.",
        "traits": ["PUBLISHING", "EXPORT", "DOCUMENT"],
        "inputs": {
          "htmlContent": { "type": "string", "desc": "Source linguistic content in HTML format." }
        }
      }
    }
  };

  function verifyConnection() {
    return { status: "ACTIVE", info: "Native PDF Generation Circuit Ready" };
  }

  // STORAGE_V1 Aliases (Transformation adapter acting as Write-Only Storage)
  function write(payload) {
    const { content } = payload || {};
    return generate({ htmlContent: content, ...payload });
  }

  function read() {
    throw errorHandler.createError('NOT_IMPLEMENTED', 'PDF Adapter is a generator, not a storage retrieval engine.');
  }

  function query() {
    return { foundItems: [] };
  }

  function queryDatabaseContent() {
    return { results: [] };
  }

  return {
    id: "pdf_generator",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    description: "Industrial engine for technical document synthesis, HTML-to-PDF transformation, and institutional reporting.",
    CANON: CANON,
    
    // Protocol mapping (STORAGE_V1)
    write,
    read,
    query,
    queryDatabaseContent,
    verifyConnection,
    
    // Original methods
    generate
  };
}








