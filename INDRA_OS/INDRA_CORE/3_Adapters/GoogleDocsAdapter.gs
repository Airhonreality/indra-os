/**
 * 📄 GOOGLE DOCS ADAPTER (3_Adapters/GoogleDocsAdapter.gs)
 * Version: 1.0.0
 * Dharma: Automatización documental de alta precisión mediante batchUpdate y sync Markdown.
 */

function createGoogleDocsAdapter({ errorHandler, driveAdapter, tokenManager }) {

  if (!errorHandler) throw new Error('GoogleDocsAdapter: errorHandler is required');

  /**
   * @description Obtiene el token para una cuenta de Google.
   * @param {string|null} accountId 
   * @returns {string|null} Access token o null si debe usar la sesión de DocumentApp
   */
  function _getAccessToken(accountId) {
    if (!tokenManager) return null;
    try {
      const tokenData = tokenManager.getToken({ provider: 'google', accountId });
      return tokenData ? (tokenData.accessToken || tokenData.apiKey) : null;
    } catch (e) {
      console.warn(`GoogleDocsAdapter: No se pudo obtener token para cuenta ${accountId}, usando sesión default.`);
      return null;
    }
  }

  /**
   * Crea un nuevo documento y lo ubica en una carpeta si se especifica.
   */
  function create(payload) {
    const { title, folderId } = payload;
    try {
      const doc = DocumentApp.create(title || 'Nuevo Documento Axiom');
      const documentId = doc.getId();
      
      if (folderId && driveAdapter) {
        driveAdapter.move({ targetId: documentId, destinationFolderId: folderId });
      }
      
      return {
        documentId: documentId,
        url: doc.getUrl()
      };
    } catch (e) {
      throw errorHandler.createError('SYSTEM_FAILURE', `GoogleDocs create failed: ${e.message}`);
    }
  }

  /**
   * Ejecuta actualizaciones en bloque usando la API avanzada.
   */
  function batchUpdate(payload) {
    const { documentId, requests } = payload;
    if (!documentId || !requests || !Array.isArray(requests)) {
      throw errorHandler.createError('INVALID_INPUT', 'batchUpdate: invalid documentId or requests array');
    }

    try {
      const response = Docs.Documents.batchUpdate({ requests: requests }, documentId);
      return {
        documentId: documentId,
        replies: response.replies
      };
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Docs API batchUpdate failed: ${e.message}`, { documentId });
    }
  }

  /**
   * Obtiene la estructura JSON del documento.
   */
  // --- AXIOM CANON: Normalización Semántica ---

  function _mapDocumentRecord(doc) {
    return {
      id: doc.documentId,
      title: doc.title,
      content: doc.body ? {
        segments: doc.body.content,
        type: 'GOOGLE_DOCS_JSON'
      } : null,
      url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
      lastUpdated: new Date().toISOString(), // Docs API no lo da directo en get básico
      raw: doc
    };
  }

  function retrieve(payload) {
    const { documentId } = payload;
    try {
      const doc = Docs.Documents.get(documentId);
      return _mapDocumentRecord(doc);
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Docs API get failed: ${e.message}`);
    }
  }

  /**
   * Sincroniza contenido Markdown al documento.
   * AXIOMA: Procesa el documento en batch para minimizar latencia.
   */
  function syncFromMarkdown(payload) {
    const { documentId, markdown, mode = 'append' } = payload;
    
    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(10000)) throw errorHandler.createError('LOCK_TIMEOUT', 'Docs contention');

      if (mode === 'replace') {
        const doc = DocumentApp.openById(documentId);
        doc.getBody().clear();
        // Nota: Al borrar todo queda un newline residual at index 0. 
        // Empezamos en index 1.
      }

      const requests = _parseMarkdownToRequests(markdown);
      if (requests.length === 0) return { success: true, message: 'Empty content' };

      return batchUpdate({ documentId, requests: requests });
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * MOTOR INTERNO: Traductor de Markdown a Batch Requests.
   * AXIOMA: REVERSE INDEXING (Final -> Inicio).
   * @private
   */
  function _parseMarkdownToRequests(markdown) {
    const requests = [];
    const lines = markdown.split('\n');
    const reversedLines = [...lines].reverse();

    reversedLines.forEach((line) => {
      if (!line.trim() && line !== '') return;

      let cleanText = line;
      let paragraphStyle = 'NORMAL_TEXT';
      
      // 1. Heading Detection
      if (line.startsWith('# ')) { cleanText = line.substring(2); paragraphStyle = 'HEADING_1'; }
      else if (line.startsWith('## ')) { cleanText = line.substring(3); paragraphStyle = 'HEADING_2'; }
      else if (line.startsWith('### ')) { cleanText = line.substring(4); paragraphStyle = 'HEADING_3'; }
      
      const textToInsert = cleanText + '\n';
      
      // Inserción Atómica en el frente (Index 1)
      requests.push({
        insertText: {
          text: textToInsert,
          location: { index: 1 }
        }
      });

      // Estilo de Párrafo
      requests.push({
        updateParagraphStyle: {
          paragraphStyle: { namedStyleType: paragraphStyle },
          range: { startIndex: 1, endIndex: 1 + textToInsert.length },
          fields: 'namedStyleType'
        }
      });

      // 2. Inline Styles (Bold / Italic / Links)
      // Usamos una aproximación de "limpieza" para que el doc final no tenga los asteriscos
      // Nota: En una v2 más compleja usaríamos regex globales y offsets calculados.
      // Para esta implementación robusta, aplicaremos estilos sobre el texto tal cual, 
      // pero habilitamos el soporte de links.

      // Link Detection: [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(cleanText)) !== null) {
        requests.push({
          updateTextStyle: {
            textStyle: { link: { url: match[2] } },
            range: { startIndex: 1 + match.index, endIndex: 1 + match.index + match[0].length },
            fields: 'link'
          }
        });
      }

      // Bold Detection: **text**
      const boldRegex = /\*\*([^*]+)\*\*/g;
      while ((match = boldRegex.exec(cleanText)) !== null) {
        requests.push({
          updateTextStyle: {
            textStyle: { bold: true },
            range: { startIndex: 1 + match.index, endIndex: 1 + match.index + match[0].length },
            fields: 'bold'
          }
        });
      }
    });

    return requests;
  }



  /**
   * Exporta el documento a formatos estándar.
   */
  function exportDocument(payload) {
    const { documentId, format } = payload;
    if (!documentId) throw errorHandler.createError('INVALID_INPUT', 'exportDocument: documentId is required');

    try {
      const file = DriveApp.getFileById(documentId);
      let mimeType = MimeType.PDF;
      let extension = 'pdf';
      
      switch ((format || 'pdf').toLowerCase()) {
        case 'docx': 
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          extension = 'docx';
          break;
        case 'txt':
          mimeType = MimeType.PLAIN_TEXT;
          extension = 'txt';
          break;
        case 'pdf':
        default:
          mimeType = MimeType.PDF;
          extension = 'pdf';
      }
      
      const blob = file.getAs(mimeType).setName(file.getName() + '.' + extension);
      return { blob };
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `GoogleDocs export failed: ${e.message}`, { documentId });
    }
  }

  function verifyConnection(payload = {}) {
    const accountId = payload.accountId || null;
    const accessToken = _getAccessToken(accountId);
    
    try {
        if (accessToken) {
            // Verificación vía REST API
            const response = UrlFetchApp.fetch("https://docs.googleapis.com/v1/documents?pageSize=1", {
               method: "get",
               headers: { "Authorization": "Bearer " + accessToken },
               muteHttpExceptions: true
            });
            if (response.getResponseCode() === 200) {
                return { status: "ACTIVE", success: true };
            } else {
                return { status: "BROKEN", success: false, error: `Docs API Error: ${response.getContentText()}` };
            }
        } else {
            // Light probe para sesión nativa
            const doc = DocumentApp.create('SystemProbe_Temp');
            const id = doc.getId();
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
    return retrieve({ documentId: id, ...payload });
  }

  function write(payload) {
    const { id, data, content } = payload || {};
    return syncFromMarkdown({ documentId: id, markdown: content || data, ...payload });
  }

  function query(payload) {
    // Delegate discovery to Drive Adapter
    if (driveAdapter && driveAdapter.find) {
      return driveAdapter.find({ query: "mimeType = 'application/vnd.google-apps.document'" });
    }
    return { foundItems: [] };
  }

  function queryDatabaseContent(payload) {
    return { results: [], message: "Not a database engine" };
  }

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
    id: "docs",
    label: "Axiom Docs",
    archetype: "adapter",
    domain: "editing",
    REIFICATION_HINTS: {
        id: "documentId || id",
        label: "title || name || id",
        items: "content || items"
    },
    CAPABILITIES: {
      "create": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Initializes a high-integrity institutional document.",
        "traits": ["STRUCTURE", "DOCUMENT"],
        "inputs": {
          "title": { "type": "string", "desc": "Target document title identifier." },
          "folderId": { "type": "string", "desc": "Destination container (folder) identifier." }
        }
      },
      "syncFromMarkdown": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Orchestrates high-fidelity linguistic synchronization from Markdown source.",
        "traits": ["UPDATE", "EDITOR"],
        "inputs": {
          "documentId": { "type": "string", "desc": "Target document identifier." },
          "markdown": { "type": "string", "desc": "Source linguistic content stream." },
          "mode": { "type": "string", "desc": "Synchronization strategy (append, replace)." }
        }
      },
      "exportDocument": {
        "id": "TRANSFORM",
        "io": "STREAM",
        "desc": "Transforms an institutional document resource into standard industrial formats.",
        "traits": ["PUBLISHING", "EXPORT"],
        "inputs": {
          "documentId": { "type": "string", "desc": "Source document identifier." },
          "format": { "type": "string", "desc": "Target transformation format (pdf, docx, txt)." }
        }
      },
      "retrieve": {
        "id": "READ_DATA",
        "io": "READ",
        "desc": "Extracts an industrial DocumentRecord with structural metadata.",
        "traits": ["DOC", "CONTENT", "KNOWLEDGE"],
        "inputs": {
          "documentId": { "type": "string", "desc": "Target document identifier." }
        }
      }
    }
  };

  return {
    id: "docs",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    description: "Industrial documentation engine for advanced content generation and format transformation.",
    CANON: CANON,
    
    // Protocol mapping (STORAGE_V1)
    read,
    write,
    query,
    queryDatabaseContent,
    verifyConnection,
    setTokenManager: (tm) => { tokenManager = tm; },
    
    create,
    batchUpdate,
    retrieve,
    syncFromMarkdown,
    exportDocument
  };
}









