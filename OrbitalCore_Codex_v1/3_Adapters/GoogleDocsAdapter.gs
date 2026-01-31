/**
 * 📄 GOOGLE DOCS ADAPTER (3_Adapters/GoogleDocsAdapter.gs)
 * Version: 1.0.0
 * Dharma: Automatización documental de alta precisión mediante batchUpdate y sync Markdown.
 */

function createGoogleDocsAdapter({ errorHandler, driveAdapter }) {

  if (!errorHandler) throw new Error('GoogleDocsAdapter: errorHandler is required');

  /**
   * Crea un nuevo documento y lo ubica en una carpeta si se especifica.
   */
  function create(payload) {
    const { title, folderId } = payload;
    try {
      const doc = DocumentApp.create(title || 'Nuevo Documento Orbital');
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
  function retrieve(payload) {
    const { documentId } = payload;
    try {
      const doc = Docs.Documents.get(documentId);
      return { document: doc };
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
      // Para esta v1.1 robusta, aplicaremos estilos sobre el texto tal cual, 
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

  const schemas = {
    create: { 
      description: "Initializes a high-integrity Google Document within an optional target container.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: { 
          title: { type: "string", io_behavior: "STREAM", description: "The display title for the new document." },
          folderId: { type: "string", io_behavior: "GATE", description: "Target container identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: { 
          documentId: { type: "string", io_behavior: "PROBE", description: "Unique document identifier." },
          url: { type: "string", io_behavior: "BRIDGE", description: "Direct access URL." }
        }
      }
    },
    syncFromMarkdown: { 
      description: "Applies complex Markdown content to a document via high-performance batch operations.",
      semantic_intent: "STREAM",
      io_interface: {
        inputs: { 
          documentId: { type: "string", io_behavior: "GATE", description: "Target document identifier." },
          markdown: { type: "string", io_behavior: "STREAM", description: "Markdown source content stream." },
          mode: { type: "string", io_behavior: "GATE", description: "Application mode (append/replace)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }
      }
    },
    exportDocument: { 
      description: "Transforms the document into standard industrial formats (PDF, DOCX).",
      semantic_intent: "BRIDGE",
      io_interface: {
        inputs: { 
          documentId: { type: "string", io_behavior: "GATE", description: "Target document identifier." },
          format: { type: "string", io_behavior: "GATE", description: "MIME-standard format selector." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: { 
          blob: { type: "object", io_behavior: "STREAM", description: "Exported binary data stream." }
        }
      }
    }
  };

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

  return Object.freeze({
    label: "Documentation Orchestrator",
    description: "Industrial documentation engine for advanced content generation and format transformation.",
    semantic_intent: "BRIDGE",
    schemas,
    create,
    batchUpdate,
    retrieve,
    syncFromMarkdown,
    exportDocument
  });
}

