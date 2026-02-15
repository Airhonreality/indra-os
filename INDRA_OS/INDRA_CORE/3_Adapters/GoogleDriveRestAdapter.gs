/**
 * 🌐 GOOGLE DRIVE REST ADAPTER (3_Adapters/GoogleDriveRestAdapter.gs)
 * Version: 1.0.0
 * Dharma: Proveer soberanía de archivos en cuentas externas mediante REST API v3.
 */

function createGoogleDriveRestAdapter({ errorHandler, tokenManager }) {
  
  const BASE_URL = 'https://www.googleapis.com/drive/v3/files';
  const LOCK_TIMEOUT_MS = 10000;

  /**
   * Helper privado para inyectar autorización y realizar llamadas HTTP
   */
  function _callApi(endpoint, options = {}, authPayload = {}) {
    let token = authPayload.accessToken;
    
    // Si no hay token directo, intentar obtenerlo del TokenManager
    if (!token && authPayload.accountId && tokenManager) {
      const credentials = tokenManager.getToken({ 
        provider: 'google', 
        accountId: authPayload.accountId 
      });
      token = credentials.apiKey || credentials.refreshToken; 
    }

    if (!token) {
      throw errorHandler.createError('AUTH_REQUIRED', 'GoogleDriveRestAdapter: accessToken or accountId is required.');
    }

    const fetchOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(endpoint, fetchOptions);
    const statusCode = response.getResponseCode();
    const headers = response.getAllHeaders();
    const contentType = headers['Content-Type'] || headers['content-type'] || '';
    
    // Si es un error
    if (statusCode >= 400) {
      const errorText = response.getContentText();
      let errorDetail;
      try { errorDetail = JSON.parse(errorText); } catch(e) { errorDetail = errorText; }
      throw errorHandler.createError('DRIVE_REST_API_ERROR', `Google Drive REST API Error (${statusCode})`, { detail: errorDetail, endpoint });
    }

    // Si es descarga de contenido (alt=media)
    if (endpoint.includes('alt=media')) {
      return response.getBlob(); 
    }

    const content = response.getContentText();
    if (!content) return null;

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(content);
      } catch (e) {
        return content;
      }
    }
    return content;
  }

  // --- INDRA CANON: Normalización Semántica ---

  function _mapFileNode(f) {
    return {
      id: f.id,
      name: f.name,
      type: f.mimeType === 'application/vnd.google-apps.folder' ? 'FOLDER' : 'FILE',
      mimeType: f.mimeType,
      parentId: null, // REST API requiere campos extra para parents, se asume null por ahora en list básico
      lastUpdated: f.modifiedTime,
      raw: f
    };
  }

  function _validatePayload(payload, fields) {
    if (!payload || typeof payload !== 'object') {
      throw errorHandler.createError('INVALID_INPUT', 'Payload must be an object');
    }
    fields.forEach(field => {
      if (payload[field] === undefined || payload[field] === null) {
        throw errorHandler.createError('INVALID_INPUT', `Missing required field: ${field}`);
      }
    });
  }

  /**
   * Busca archivos.
   * @param {object} payload - { query, accountId, accessToken }
   */
  function find(payload) {
    _validatePayload(payload, ['query']);
    const { query } = payload;
    
    // Soporte para palabras clave simplificadas (ROOT)
    let sanitizedQuery = query;
    if (query === 'ROOT') sanitizedQuery = "'root' in parents";
    
    const endpoint = `${BASE_URL}?q=${encodeURIComponent(sanitizedQuery)}`;
    const result = _callApi(endpoint, { method: 'get' }, payload);
    
    return {
      foundItems: (result.files || []).map(f => _mapFileNode(f))
    };
  }

  /**
   * Obtiene contenido o metadatos.
   */
  function retrieve(payload) {
    _validatePayload(payload, ['fileId']);
    const { fileId, mode = 'content' } = payload;
    
    if (mode === 'metadata') {
      const result = _callApi(`${BASE_URL}/${fileId}`, { method: 'get' }, payload);
      return { metadata: result };
    }

    const blob = _callApi(`${BASE_URL}/${fileId}?alt=media`, { method: 'get' }, payload);
    const contentString = blob.getDataAsString();
    let content = contentString;
    let isJSON = false;

    try {
      content = JSON.parse(contentString);
      isJSON = true;
    } catch (e) {
      // Not JSON, return as string
    }

    return {
      fileId,
      content,
      isJSON,
      blob: blob,
      mimeType: blob.getContentType()
    };
  }

  /**
   * Crea o actualiza un archivo.
   * Implementación Robusta con Metadatos.
   */
  function store(payload) {
    _validatePayload(payload, ['content']);
    const { fileName, content, mimeType, folderId, fileId } = payload;
    
    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(LOCK_TIMEOUT_MS)) throw errorHandler.createError('LOCK_TIMEOUT', 'Drive REST contention.');

      let resultFileId = fileId;
      
      // PASO 1: Subir Contenido
      let uploadEndpoint = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media';
      let method = 'post';

      if (fileId) {
        uploadEndpoint = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
        method = 'patch';
      }

      const uploadResult = _callApi(uploadEndpoint, {
        method: method,
        contentType: mimeType || 'text/plain',
        payload: content
      }, payload);

      resultFileId = uploadResult.id;

      // PASO 2: Actualizar Metadatos (Name, Parents)
      const metadata = {};
      if (fileName) metadata.name = fileName;
      
      const queryParams = [];
      if (!fileId && folderId) queryParams.push(`addParents=${folderId}`);
      
      const metadataEndpoint = `${BASE_URL}/${resultFileId}${queryParams.length ? '?' + queryParams.join('&') : ''}`;
      
      const finalMetadata = _callApi(metadataEndpoint, {
        method: 'patch',
        contentType: 'application/json',
        payload: JSON.stringify(metadata)
      }, payload);

      return {
        fileId: resultFileId,
        name: finalMetadata.name,
        mimeType: finalMetadata.mimeType,
        url: `https://drive.google.com/open?id=${resultFileId}`
      };
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Crea una carpeta.
   */
  function createFolder(payload) {
    _validatePayload(payload, ['folderName', 'parentFolderId']);
    const { folderName, parentFolderId } = payload;

    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(LOCK_TIMEOUT_MS)) throw errorHandler.createError('LOCK_TIMEOUT', 'Drive REST contention.');

      // Verificar si existe para idempotencia
      const q = `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const search = _callApi(`${BASE_URL}?q=${encodeURIComponent(q)}`, { method: 'get' }, payload);

      if (search.files && search.files.length > 0) {
        return { folderId: search.files[0].id, created: false };
      }

      const result = _callApi(BASE_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId]
        })
      }, payload);

      return { folderId: result.id, created: true };
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Envía a la papelera.
   */
  function deleteFile(payload) {
    _validatePayload(payload, ['fileId']);
    const { fileId } = payload;
    
    _callApi(`${BASE_URL}/${fileId}`, {
      method: 'patch',
      contentType: 'application/json',
      payload: JSON.stringify({ trashed: true })
    }, payload);

    return { success: true, fileId };
  }

  /**
   * Resuelve una ruta semántica.
   */
  function resolvePath(payload) {
    _validatePayload(payload, ['rootFolderId', 'path']);
    const { path, createIfNotExists = false } = payload;
    
    const parts = path.split('/').filter(p => p.trim());
    let currentFolderId = payload.rootFolderId;

    for (const part of parts) {
      const q = `'${currentFolderId}' in parents and name = '${part}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const search = _callApi(`${BASE_URL}?q=${encodeURIComponent(q)}`, { method: 'get' }, payload);

      if (search.files && search.files.length > 0) {
        currentFolderId = search.files[0].id;
      } else if (createIfNotExists) {
        const newFolder = createFolder({ ...payload, folderName: part, parentFolderId: currentFolderId });
        currentFolderId = newFolder.folderId;
      } else {
        throw errorHandler.createError('RESOURCE_NOT_FOUND', `Path part not found: ${part}`);
      }
    }

    return { folderId: currentFolderId };
  }

  const schemas = {
    find: {
      description: "Executes technical scanning for resources within an external registry using advanced V3 query syntax.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: { 
          query: { type: "string", io_behavior: "STREAM", description: "V3 standard search query (e.g., 'root' in parents)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for target repository." }
        },
        outputs: { 
          foundItems: { type: "array", io_behavior: "STREAM", description: "Collection of Indra FileNode: { id, name, type, mimeType, parentId, lastUpdated, raw }" } 
        }
      }
    },
    retrieve: {
      description: "Extracts technical payloads or metadata from a specific external resource identifier.",
      semantic_intent: "STREAM",
      io_interface: {
        inputs: { 
          fileId: { type: "string", io_behavior: "GATE", description: "Unique external resource identifier." },
          mode: { type: "string", io_behavior: "GATE", description: "Extraction mode (content or metadata)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: { 
          content: { type: "object", io_behavior: "STREAM", description: "Primary resource payload stream." },
          blob: { type: "object", io_behavior: "BRIDGE", description: "Binary data bridge for large payloads." }
        }
      }
    },
    store: {
      description: "Persists technical payloads and metadata to the target external registry.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: { 
          content: { type: "string", io_behavior: "STREAM", description: "Data stream to be persisted." }, 
          fileName: { type: "string", io_behavior: "STREAM", description: "Identifier string for the resource." },
          folderId: { type: "string", io_behavior: "GATE", description: "Target container identifier." },
          fileId: { type: "string", io_behavior: "GATE", description: "Optional resource identifier for atomic updates." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: { 
          fileId: { type: "string", io_behavior: "PROBE", description: "Assigned resource identifier confirmation." } 
        }
      }
    },
    createFolder: {
      description: "Initializes a technical container within the target external registry.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: { 
          folderName: { type: "string", io_behavior: "STREAM", description: "Display identifier for the container." }, 
          parentFolderId: { type: "string", io_behavior: "GATE", description: "Target container root." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: { 
          folderId: { type: "string", io_behavior: "PROBE", description: "Unique container identifier." } 
        }
      }
    }
  };


  function verifyConnection(payload = {}) {
    try {
      // Light probe: check root access
      const root = _callApi(`${BASE_URL}/root?fields=id`, { method: 'get' }, payload);
      return { status: "ACTIVE" };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

  // --- SOVEREIGN CANON V12.0 (Algorithmic Core) ---
  const CANON = {
    LABEL: "Google Drive (REST)",
    ARCHETYPE: "VAULT",
    DOMAIN: "SYSTEM_INFRA",
    CAPABILITIES: schemas
  };

  return {
    id: "googleDriveRest",
    CANON: CANON,
    
    // Métodos Operativos
    verifyConnection,
    find,
    retrieve, 
    store,
    createFolder,
    deleteFile,
    resolvePath,
    schemas: schemas
  };
}






