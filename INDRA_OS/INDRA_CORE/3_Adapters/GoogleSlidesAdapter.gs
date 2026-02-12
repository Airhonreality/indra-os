/**
 * 🎴 GOOGLE SLIDES ADAPTER (3_Adapters/GoogleSlidesAdapter.gs)
 * Version: 1.0.0
 * Dharma: Automatización y manipulación de presentaciones de Google mediante Slides API v1.
 */

function createGoogleSlidesAdapter({ errorHandler, driveAdapter }) {

  if (!errorHandler) throw new Error('GoogleSlidesAdapter: errorHandler is required');

  /**
   * Crea una nueva presentación.
   */
  function create(payload) {
    const { title, folderId } = payload;
    try {
      const presentation = SlidesApp.create(title || 'Presentación Orbital');
      const presentationId = presentation.getId();
      
      if (folderId && driveAdapter) {
        driveAdapter.move({ targetId: presentationId, destinationFolderId: folderId });
      }
      
      return {
        presentationId: presentationId,
        url: presentation.getUrl()
      };
    } catch (e) {
      throw errorHandler.createError('SYSTEM_FAILURE', `GoogleSlides create failed: ${e.message}`);
    }
  }

  /**
   * Ejecuta actualizaciones en bloque (BatchUpdate).
   */
  function batchUpdate(payload) {
    const { presentationId, requests } = payload;
    if (!presentationId || !requests || !Array.isArray(requests)) {
      throw errorHandler.createError('INVALID_INPUT', 'batchUpdate: invalid presentationId or requests array');
    }

    try {
      const response = Slides.Presentations.batchUpdate({ requests: requests }, presentationId);
      return {
        presentationId: presentationId,
        replies: response.replies
      };
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Slides API batchUpdate failed: ${e.message}`, { presentationId });
    }
  }

  /**
   * Reemplaza marcadores de posición en toda la presentación.
   * Utiliza replaceAllShapesWithText para mayor eficiencia.
   */
  function replacePlaceholders(payload) {
    const { presentationId, mapping } = payload;
    if (!mapping || typeof mapping !== 'object') return { occurrencesReplaced: 0 };

    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(10000)) throw errorHandler.createError('LOCK_TIMEOUT', 'Slides contention');

      const requests = Object.keys(mapping).map(key => ({
        replaceAllShapesWithText: {
          replaceText: String(mapping[key]),
          containsText: { text: key, matchCase: false }
        }
      }));

      const result = batchUpdate({ presentationId, requests });
      
      const occurrences = (result.replies || []).reduce((acc, curr) => {
        return acc + (curr.replaceAllShapesWithText ? curr.replaceAllShapesWithText.occurrencesChanged : 0);
      }, 0);

      return { occurrencesReplaced: occurrences };
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Reemplaza formas que contienen un texto con imágenes externas.
   */
  function replacePlaceholdersWithImages(payload) {
    const { presentationId, imageMapping } = payload; // { "{{logo}}": "http://..." }
    if (!imageMapping) return { success: false };

    const requests = Object.keys(imageMapping).map(key => ({
      replaceAllShapesWithImage: {
        imageUrl: imageMapping[key],
        containsText: { text: key, matchCase: false },
        replaceMethod: 'CENTER_INSIDE'
      }
    }));

    return batchUpdate({ presentationId, requests });
  }

  /**
   * Añade una diapositiva.
   */
  function addSlide(payload) {
    const { presentationId, predefinedLayout = 'TITLE_AND_BODY', insertionIndex } = payload;
    
    const requests = [{
      createSlide: {
        insertionIndex: insertionIndex,
        slideLayoutReference: { predefinedLayout: predefinedLayout }
      }
    }];

    const result = batchUpdate({ presentationId, requests });
    const slideId = result.replies[0].createSlide.objectId;
    
    return { slideId };
  }

  /**
   * Obtiene la estructura JSON.
   */
    function retrieve(payload) {
      const { presentationId } = payload;
      try {
        const presentation = Slides.Presentations.get(presentationId);
        return _mapDocumentRecord(presentation);
      } catch (e) {
        throw errorHandler.createError('EXTERNAL_API_ERROR', `Slides API get failed: ${e.message}`);
      }
    }

    // --- INDRA CANON: Normalización Semántica ---

    function _mapDocumentRecord(pres) {
        return {
            id: pres.presentationId,
            title: pres.title,
            content: {
                slides: pres.slides,
                type: 'GOOGLE_SLIDES_JSON'
            },
            url: `https://docs.google.com/presentation/d/${pres.presentationId}/edit`,
            lastUpdated: new Date().toISOString(),
            raw: pres
        };
    }

  const schemas = {
    create: { 
      description: "Initializes a high-integrity institutional presentation within an optional target container circuit.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: { 
          title: { type: "string", io_behavior: "STREAM", description: "Display identifier for the new presentation industrial asset." },
          folderId: { type: "string", io_behavior: "GATE", description: "Target container industrial identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier registry routing." }
        },
        outputs: { 
          presentationId: { type: "string", io_behavior: "PROBE", description: "Unique institutional presentation identifier." },
          url: { type: "string", io_behavior: "BRIDGE", description: "Direct access technical URL." }
        }
      }
    },
    replacePlaceholders: { 
      description: "Applies bulk institutional content replacements across all technical slides via high-performance BatchUpdate circuit.",
      semantic_intent: "TRANSFORM",
      io_interface: {
        inputs: { 
          presentationId: { type: "string", io_behavior: "GATE", description: "Target industrial presentation identifier." },
          mapping: { type: "object", io_behavior: "STREAM", description: "Key-value dictionary stream of linguistic mappings." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        },
        outputs: {
          occurrencesReplaced: { type: "number", io_behavior: "PROBE", description: "Total industrial count of modified shape records." }
        }
      }
    },
    replacePlaceholdersWithImages: {
      description: "Injects dynamic external image streams into target shape identifiers within the institutional presentation.",
      semantic_intent: "TRANSFORM",
      io_interface: {
        inputs: {
          presentationId: { type: "string", io_behavior: "GATE", description: "Target presentation identifier." },
          imageMapping: { type: "object", io_behavior: "STREAM", description: "Dictionary mapping linguistic keys to asset URL streams." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }
      }
    },
    addSlide: { 
      description: "Appends a new technical slide with a specified industrial layout to the target institutional asset.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: { 
          presentationId: { type: "string", io_behavior: "GATE", description: "Target presentation identifier." },
          predefinedLayout: { type: "string", io_behavior: "SCHEMA", description: "Standard industrial layout identifier (e.g., TITLE_AND_BODY)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        },
        outputs: {
          slideId: { type: "string", io_behavior: "PROBE", description: "Unique identifier of the created technical slide." }
        }
      }
    }
  };

  function verifyConnection(payload = {}) {
    try {
      const p = SlidesApp.create('SystemProbe_Temp');
      const id = p.getId();
      DriveApp.getFileById(id).setTrashed(true);
      return { status: "ACTIVE" };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

  // STORAGE_V1 Aliases
  function read(payload) {
    const { id } = payload || {};
    return retrieve({ presentationId: id, ...payload });
  }

  function write(payload) {
    const { id, data, content } = payload || {};
    // Default to placeholder replacement if data is flat object, else batchRequest
    return replacePlaceholders({ presentationId: id, mapping: content || data, ...payload });
  }

  function query(payload) {
    if (driveAdapter && driveAdapter.find) {
      return driveAdapter.find({ query: "mimeType = 'application/vnd.google-apps.presentation'" });
    }
    return { foundItems: [] };
  }

  function queryDatabaseContent(payload) {
    return { results: [], message: "Not a database engine" };
  }

    // --- SOVEREIGN CANON V8.0 ---
  const CANON = {
    LABEL: "Slides Interface",
    ARCHETYPE: "ADAPTER",
    DOMAIN: "DOCUMENT_ENGINE",
    SEMANTIC_INTENT: "EDITOR",
    CAPABILITIES: {
      "create": {
        "io": "WRITE",
        "desc": "Initialize high-integrity presentation",
        "inputs": {
          "title": { "type": "string", "desc": "Display identifier for the new presentation." },
          "folderId": { "type": "string", "desc": "Target container identifier." },
          "accountId": { "type": "string", "desc": "Account selector." }
        },
        "outputs": {
          "presentationId": { "type": "string", "desc": "Unique institutional presentation identifier." },
          "url": { "type": "string", "desc": "Direct access technical URL." }
        }
      },
      "replacePlaceholders": {
        "io": "TRANSFORM",
        "desc": "Bulk content replacement",
        "inputs": {
          "presentationId": { "type": "string", "desc": "Target presentation identifier." },
          "mapping": { "type": "object", "desc": "Key-value dictionary stream." },
          "accountId": { "type": "string", "desc": "Account selector." }
        },
        "outputs": {
          "occurrencesReplaced": { "type": "number", "desc": "Total count of modified shapes." }
        }
      },
      "replacePlaceholdersWithImages": {
        "io": "TRANSFORM",
        "desc": "Dynamic image injection",
        "inputs": {
          "presentationId": { "type": "string", "desc": "Target presentation identifier." },
          "imageMapping": { "type": "object", "desc": "Dictionary mapping keys to image URLs." },
          "accountId": { "type": "string", "desc": "Account selector." }
        }
      },
      "addSlide": {
        "io": "WRITE",
        "desc": "Append technical slide",
        "inputs": {
          "presentationId": { "type": "string", "desc": "Target presentation identifier." },
          "predefinedLayout": { "type": "string", "desc": "Standard layout identifier (e.g., TITLE_AND_BODY)." },
          "accountId": { "type": "string", "desc": "Account selector." }
        },
        "outputs": {
          "slideId": { "type": "string", "desc": "Unique identifier of the created slide." }
        }
      },
      "retrieve": {
        "io": "READ",
        "desc": "Extract PresentationRecord",
        "inputs": {
          "presentationId": { "type": "string", "desc": "Target presentation identifier." }
        },
        "outputs": {
          "document": { "type": "object", "desc": "Indra PresentationRecord structure." }
        }
      }
    },
    VITAL_SIGNS: {
       "SLIDES_API": { "criticality": "NOMINAL", "value": "ACTIVE", "trend": "flat" }
    },
    UI_LAYOUT: {
      "SIDE_PANEL": "ENABLED",
      "TERMINAL_STREAM": "ENABLED"
    }
  };

  return {
    description: "Industrial presentation engine for institutional slide generation, high-integrity batch updates, and dynamic asset injection.",
    semantic_intent: "EDITOR",
    // Sovereign Identity
    CANON: CANON,
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
    // Protocol mapping (STORAGE_V1)
    read,
    write,
    query,
    queryDatabaseContent,
    verifyConnection,
    // Original methods
    id: "googleSlides", // Will be overridden
    create,
    batchUpdate,
    replacePlaceholders,
    replacePlaceholdersWithImages,
    addSlide,
    retrieve
  };
}

