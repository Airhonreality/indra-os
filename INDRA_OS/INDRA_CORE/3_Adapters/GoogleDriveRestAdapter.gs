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

  // --- AXIOM CANON: Normalización Semántica ---

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

  function verifyConnection(payload = {}) {
    try {
      // Light probe: check root access
      const root = _callApi(`${BASE_URL}/root?fields=id`, { method: 'get' }, payload);
      return { status: "ACTIVE" };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
    id: "drive_rest",
    label: "Drive REST Engine",
    archetype: "adapter",
    domain: "storage",
    REIFICATION_HINTS: {
        id: "id || fileId",
        label: "name || fileName || id",
        items: "files || foundItems || items"
    },
    CAPABILITIES: {
      "find": {
        "id": "LIST_FILES",
        "io": "READ",
        "desc": "Executes technical scanning for resources.",
        "traits": ["EXPLORE", "VAULT", "BROWSE"],
        "inputs": {
            "query": { "type": "string", "desc": "Filter criteria." },
            "accountId": { "type": "string", "desc": "Isolation key." }
        }
      },
      "retrieve": {
        "id": "READ_DATA",
        "io": "READ",
        "desc": "Extracts technical payloads or metadata.",
        "traits": ["VAULT", "BINARY", "KNOWLEDGE"],
        "inputs": {
            "fileId": { "type": "string", "desc": "Target asset identifier." },
            "mode": { "type": "string", "desc": "Expected content format." }
        }
      },
      "store": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Persists technical payloads and metadata.",
        "traits": ["PERSISTENCE", "UPDATE", "STRUCTURE"],
        "inputs": {
            "content": { "type": "any", "desc": "Data stream to persist." },
            "fileName": { "type": "string", "desc": "Target filename." },
            "folderId": { "type": "string", "desc": "Destination container ID." }
        }
      },
      "createFolder": {
        "id": "WRITE_DATA",
        "io": "WRITE",
        "desc": "Initializes a technical container.",
        "traits": ["STRUCTURE", "HIERARCHY"]
      }
    }
  };

  return {
    id: "drive_rest",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    CANON: CANON,
    
    // Métodos Operativos
    verifyConnection,
    find,
    retrieve, 
    store,
    createFolder,
    deleteFile,
    resolvePath
  };
}









