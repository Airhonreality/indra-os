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
      return { presentation };
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Slides API get failed: ${e.message}`);
    }
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

  return Object.freeze({
    label: "Presentation Orchestrator",
    description: "Industrial presentation engine for institutional slide generation, high-integrity batch updates, and dynamic asset injection.",
    semantic_intent: "BRIDGE",
    schemas: schemas,
    create,
    batchUpdate,
    replacePlaceholders,
    replacePlaceholdersWithImages,
    addSlide,
    retrieve
  });
}

