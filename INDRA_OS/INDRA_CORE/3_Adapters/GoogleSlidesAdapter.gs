/**
 * 🎴 GOOGLE SLIDES ADAPTER (3_Adapters/GoogleSlidesAdapter.gs)
 * Version: 1.0.0
 * Dharma: Automatización y manipulación de presentaciones de Google mediante Slides API v1.
 */

function createGoogleSlidesAdapter({ errorHandler, driveAdapter, tokenManager }) {

  if (!errorHandler) throw new Error('GoogleSlidesAdapter: errorHandler is required');

  /**
   * @description Obtiene el token para una cuenta de Google.
   * @param {string|null} accountId 
   * @returns {string|null} Access token o null si debe usar la sesión de SlidesApp
   */
  function _getAccessToken(accountId) {
    if (!tokenManager) return null;
    try {
      const tokenData = tokenManager.getToken({ provider: 'google', accountId });
      return tokenData ? (tokenData.accessToken || tokenData.apiKey) : null;
    } catch (e) {
      console.warn(`GoogleSlidesAdapter: No se pudo obtener token para cuenta ${accountId}, usando sesión default.`);
      return null;
    }
  }

  /**
   * Crea una nueva presentación.
   */
  function create(payload) {
    const { title, folderId } = payload;
    try {
      const presentation = SlidesApp.create(title || 'Presentación Indra');
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

    // --- AXIOM CANON: Normalización Semántica ---

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

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
    id: "slides",
    label: "Axiom Slides",
    archetype: "adapter",
    domain: "editing",
    REIFICATION_HINTS: {
        id: "presentationId || id",
        label: "title || name || id",
        items: "slides || items"
    },
    CAPABILITIES: {
      "create": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Initializes a high-integrity institutional presentation.",
        "traits": ["STRUCTURE", "DOCUMENT"],
        "inputs": { 
          "title": { "type": "string", "desc": "Display identifier for the new presentation." },
          "folderId": { "type": "string", "desc": "Target container industrial identifier." }
        }
      },
      "replacePlaceholders": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Applies bulk institutional content replacements across all technical slides.",
        "traits": ["UPDATE", "EDITOR"],
        "inputs": { 
          "presentationId": { "type": "string", "desc": "Target industrial presentation identifier." },
          "mapping": { "type": "object", "desc": "Key-value dictionary of linguistic mappings." }
        }
      },
      "addSlide": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Appends a new technical slide with a specified layout.",
        "traits": ["STRUCTURE", "EDITOR"],
        "inputs": { 
          "presentationId": { "type": "string", "desc": "Target presentation identifier." },
          "predefinedLayout": { "type": "string", "desc": "Standard industrial layout identifier." }
        }
      },
      "retrieve": {
        "id": "READ_DATA",
        "io": "READ",
        "desc": "Extracts an industrial PresentationRecord with structural metadata.",
        "traits": ["DOC", "CONTENT", "KNOWLEDGE"],
        "inputs": { 
          "presentationId": { "type": "string", "desc": "Target presentation identifier." }
        }
      }
    }
  };

  function verifyConnection(payload = {}) {
    const accountId = payload.accountId || null;
    const accessToken = _getAccessToken(accountId);
    
    try {
        if (accessToken) {
            // Verificación vía REST API
            const response = UrlFetchApp.fetch("https://slides.googleapis.com/v1/presentations/1KiV3XNf_HkK6Y4A8E5fO5n7_xQ7m2tX_K9BvY5w6FzE?fields=id", {
               method: "get",
               headers: { "Authorization": "Bearer " + accessToken },
               muteHttpExceptions: true
            });
            // Nota: El ID anterior es un placeholder. Mejor usar Drive API about para validez general de token.
            const driveResponse = UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
               method: "get",
               headers: { "Authorization": "Bearer " + accessToken },
               muteHttpExceptions: true
            });

            if (driveResponse.getResponseCode() === 200) {
                return { status: "ACTIVE", success: true };
            } else {
                return { status: "BROKEN", success: false, error: `Slides/Drive API Error: ${driveResponse.getContentText()}` };
            }
        } else {
            const p = SlidesApp.create('SystemProbe_Temp');
            const id = p.getId();
            DriveApp.getFileById(id).setTrashed(true);
            return { status: "ACTIVE", success: true };
        }
    } catch (e) {
      return { status: "BROKEN", success: false, error: e.message };
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

  return {
    id: "slides",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    description: "Industrial presentation engine for institutional slide generation, high-integrity batch updates, and dynamic asset injection.",
    CANON: CANON,
    
    // Protocol mapping (STORAGE_V1)
    read,
    write,
    query,
    queryDatabaseContent,
    verifyConnection,
    setTokenManager: (tm) => { tokenManager = tm; },
    
    // Original methods
    create,
    batchUpdate,
    replacePlaceholders,
    replacePlaceholdersWithImages,
    addSlide,
    retrieve
  };
}









