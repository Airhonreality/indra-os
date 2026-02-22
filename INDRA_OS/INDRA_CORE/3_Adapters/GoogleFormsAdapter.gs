/**
 * 📋 GOOGLE FORMS ADAPTER (3_Adapters/GoogleFormsAdapter.gs)
 * Version: 1.0.0
 * Dharma: Creación y administración dinámica de formularios de Google.
 */

function createGoogleFormsAdapter({ errorHandler, driveAdapter, tokenManager }) {

  if (!errorHandler) throw new Error('GoogleFormsAdapter: errorHandler is required');

  /**
   * @description Obtiene el token para una cuenta de Google.
   * @param {string|null} accountId 
   * @returns {string|null} Access token o null si debe usar la sesión de FormApp
   */
  function _getAccessToken(accountId) {
    if (!tokenManager) return null;
    try {
      const tokenData = tokenManager.getToken({ provider: 'google', accountId });
      return tokenData ? (tokenData.accessToken || tokenData.apiKey) : null;
    } catch (e) {
      console.warn(`GoogleFormsAdapter: No se pudo obtener token para cuenta ${accountId}, usando sesión default.`);
      return null;
    }
  }

  /**
   * Crea un nuevo formulario.
   */
  function create(payload) {
    const { title, description, folderId } = payload;
    try {
      const form = FormApp.create(title || 'Formulario Axiom');
      if (description) form.setDescription(description);
      
      const formId = form.getId();
      
      if (folderId && driveAdapter) {
        driveAdapter.move({ targetId: formId, destinationFolderId: folderId });
      }
      
      return {
        formId: formId,
        url: form.getPublishedUrl(),
        editUrl: form.getEditUrl()
      };
    } catch (e) {
      throw errorHandler.createError('SYSTEM_FAILURE', `GoogleForms create failed: ${e.message}`);
    }
  }

  /**
   * Añade preguntas al formulario.
   */
  function addItems(payload) {
    const { formId, items } = payload;
    if (!formId || !Array.isArray(items)) {
      throw errorHandler.createError('INVALID_INPUT', 'addItems: invalid formId or items array');
    }

    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(10000)) throw errorHandler.createError('LOCK_TIMEOUT', 'Forms contention');

      const form = FormApp.openById(formId);
      
      items.forEach(item => {
        switch (item.type) {
          case 'text':
            form.addTextItem().setTitle(item.title).setHelpText(item.helpText || '');
            break;
          case 'multiple':
            const mItem = form.addMultipleChoiceItem().setTitle(item.title);
            if (item.choices) mItem.setChoices(item.choices.map(c => mItem.createChoice(c)));
            break;
          case 'checkbox':
            const cItem = form.addCheckboxItem().setTitle(item.title);
            if (item.choices) cItem.setChoices(item.choices.map(c => cItem.createChoice(c)));
            break;
          case 'list':
            const lItem = form.addListItem().setTitle(item.title);
            if (item.choices) lItem.setChoices(item.choices.map(c => lItem.createChoice(c)));
            break;
        }
      });

      return { success: true, itemsAdded: items.length };
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Forms API addItems failed: ${e.message}`, { formId });
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Vincula respuestas a una hoja de cálculo.
   */
  function setDestination(payload) {
    const { formId, spreadsheetId } = payload;
    try {
      const form = FormApp.openById(formId);
      form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheetId);
      return { success: true };
    } catch (e) {
      throw errorHandler.createError('SYSTEM_FAILURE', `SetDestination failed: ${e.message}`);
    }
  }

  /**
   * Obtiene respuestas.
   */
  function getResponses(payload) {
    const { formId } = payload;
    try {
      const form = FormApp.openById(formId);
      const responses = form.getResponses();
      
      return { 
        responses: responses.map(r => _mapDataEntry(r, `form_${formId}`)) 
      };
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `getResponses failed: ${e.message}`);
    }
  }

  /**
   * Obtiene estructura básica.
   */
  function retrieve(payload) {
    const { formId } = payload;
    try {
      const form = FormApp.openById(formId);
      return { 
        title: form.getTitle(),
        description: form.getDescription(),
        publishedUrl: form.getPublishedUrl(),
        itemsCount: form.getItems().length
      };
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `FormApp retrieve failed: ${e.message}`);
    }
  }

  // --- AXIOM CANON: Normalización Semántica ---

  function _mapDataEntry(r, collectionId = 'google_form') {
    return {
      id: r.getId(),
      collection: collectionId,
      fields: {
        timestamp: r.getTimestamp() ? r.getTimestamp().toISOString() : null,
        email: r.getRespondentEmail(),
        responses: r.getItemResponses().map(ir => ({
          title: ir.getItem().getTitle(),
          response: ir.getResponse()
        }))
      },
      timestamp: r.getTimestamp() ? r.getTimestamp().toISOString() : new Date().toISOString(),
      raw: r
    };
  }



  function verifyConnection(payload = {}) {
    const accountId = payload.accountId || null;
    const accessToken = _getAccessToken(accountId);
    
    try {
        if (accessToken) {
            // Verificación vía REST API (Forms API doesn't have a simple list, but Drive API about does)
            const response = UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
               method: "get",
               headers: { "Authorization": "Bearer " + accessToken },
               muteHttpExceptions: true
            });
            if (response.getResponseCode() === 200) {
                return { status: "ACTIVE", success: true };
            } else {
                return { status: "BROKEN", success: false, error: `Forms/Drive API Error: ${response.getContentText()}` };
            }
        } else {
            const f = FormApp.create('SystemProbe_Temp');
            const id = f.getId();
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
    return retrieve({ formId: id, ...payload });
  }

  function write(payload) {
    const { id, data, items } = payload || {};
    return addItems({ formId: id, items: items || data, ...payload });
  }

  function query(payload) {
    if (driveAdapter && driveAdapter.find) {
      return driveAdapter.find({ query: "mimeType = 'application/vnd.google-apps.form'" });
    }
    return { foundItems: [] };
  }

  function queryDatabaseContent(payload) {
     return getResponses({ formId: payload.databaseId || payload.id });
  }

  const CANON = {
    id: "forms",
    label: "Axiom Forms",
    archetype: "adapter",
    domain: "data_collection",
    REIFICATION_HINTS: {
        id: "formId || id",
        label: "title || name || id",
        items: "responses || items"
    },
    CAPABILITIES: {
      "create": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Initializes a high-integrity Google Form.",
        "traits": ["STRUCTURE", "HIERARCHY"],
        "inputs": { 
          "title": { "type": "string", "desc": "The display title for the new form." },
          "description": { "type": "string", "desc": "Technical or user-facing description." },
          "folderId": { "type": "string", "desc": "Target container identifier." }
        }
      },
      "addItems": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Appends technical form elements.",
        "traits": ["UPDATE", "STRUCTURE"],
        "inputs": { 
          "formId": { "type": "string", "desc": "Target form identifier." },
          "items": { "type": "array", "desc": "Collection of form item metadata objects." }
        }
      },
      "getResponses": {
        "id": "DATA_STREAM",
        "io": "READ",
        "desc": "Extracts form entries.",
        "traits": ["STREAM", "DATABASE", "TABLE_VIEW"],
        "inputs": { 
          "formId": { "type": "string", "desc": "Target form identifier." }
        }
      },
      "retrieve": {
        "id": "READ_DATA",
        "io": "READ",
        "traits": ["DOC", "METADATA"],
        "inputs": { 
          "formId": { "type": "string", "desc": "Target form identifier." }
        }
      }
    }
  };

  return {
    id: "forms",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    description: "Industrial survey engine for dynamic form generation and automated response management.",
    CANON: CANON,
    
    // Protocol mapping (STORAGE_V1)
    read,
    write,
    query,
    queryDatabaseContent, // Mapped to getResponses for Forms
    verifyConnection,
    setTokenManager: (tm) => { tokenManager = tm; },
    
    // Original methods
    create,
    addItems,
    setDestination,
    getResponses,
    retrieve
  };

}









