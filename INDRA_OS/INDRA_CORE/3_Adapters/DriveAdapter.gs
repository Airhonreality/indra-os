/**
 * @file DriveAdapter.gs
 * @dharma Ser el Maestro de Google Drive.
 * @description Encapsula toda la interacción con el sistema de archivos de Drive,
 * desde navegación y búsqueda hasta lectura, escritura y gestión de permisos.
 * Es la única puerta de entrada del Core a todo lo relacionado con Drive.
 * 
 * CONTRATO CANÓNICO:
 * - RF-M-1: Exporta fábrica createDriveAdapter({ errorHandler })
 * - RF-X-1: Método find(payload) para búsquedas avanzadas
 * - RF-X-2: Método resolvePath(payload) para traducir rutas semánticas
 * - RF-X-2.1: resolvePath con createIfNotExists crea carpetas idempotentemente
 * - RF-X-3: Método store(payload) unificado (por ID o por nombre)
 * - RF-X-4: Método createFolder(payload)
 * - RF-X-5: Método retrieve(payload) unificado (por ID o por nombre)
 * - RF-X-6: Método share(payload) para gestión de permisos
 * - RF-X-7: Método move(payload) para mover archivos/carpetas
 * 
 * DEPENDENCIAS:
 * - 4_Infra/ErrorHandler.gs
 */

/**
 * Factory para crear DriveAdapter
 * @param {Object} dependencies - Dependencias inyectadas
 * @returns {Object} Instancia inmutable de DriveAdapter
 */
function createDriveAdapter({ errorHandler, monitoringService, tokenManager }) {
    // Axioma: Fail-Fast Principle
    if (!errorHandler || typeof errorHandler.createError !== 'function') {
        throw new TypeError('createDriveAdapter: errorHandler contract not fulfilled');
    }

    // AXIOMA: Normalización de Monitoreo.
    const logger = {
        log: (...args) => (monitoringService && monitoringService.logInfo) ? monitoringService.logInfo(...args) : console.log(...args),
        warn: (...args) => (monitoringService && monitoringService.logWarn) ? monitoringService.logWarn(...args) : console.warn(...args),
        error: (...args) => (monitoringService && monitoringService.logError) ? monitoringService.logError(...args) : console.error(...args),
        info: (...args) => (monitoringService && monitoringService.logInfo) ? monitoringService.logInfo(...args) : console.log(...args)
    };

    // --- INDRA CANON: Normalización Semántica ---

    // Cache Root ID for normalization
    let ROOT_ID = null;
    try {
        ROOT_ID = DriveApp.getRootFolder().getId();
    } catch (e) {
        // En entornos de test o simulados, el ID de ROOT es simbólico
        ROOT_ID = 'ROOT_SYSTEM_FALLBACK';
    }

    /**
     * @description Obtiene el token para una cuenta de Google.
     * @param {string|null} accountId 
     * @returns {string|null} Access token o null si debe usar la sesión de DriveApp
     */
    function _getAccessToken(accountId) {
        if (!tokenManager) return null;
        try {
            const tokenData = tokenManager.getToken({ provider: 'google', accountId });
            return tokenData ? (tokenData.accessToken || tokenData.apiKey) : null;
        } catch (e) {
            console.warn(`DriveAdapter: No se pudo obtener token para cuenta ${accountId}, usando sesión default.`);
            return null;
        }
    }

    function _mapFileNode(item, type) {
        let parentId = null;
        if (item.getParents().hasNext()) {
            parentId = item.getParents().next().getId();
        }
        
        // Normalización Canónica: Si el padre es el Root real, lo llamamos 'ROOT'
        // para que coincida con la abstracción del Frontend.
        const normalizedParent = (parentId === ROOT_ID) ? 'ROOT' : parentId;

        // Semiótica de Ley de Jerarquía
        // Nota: En GAS, folder no tiene getMimeType().
        // type: "file" | "folder" (viene del argumento de la función)
        const isFolder = (type === 'folder');
        
        // AXIOMA: Defensive Programming (Versión a prueba de bombas)
        // Detectar capacidad funcional en lugar de confiar en etiquetas.
        let mimeType = 'application/vnd.google-apps.folder';
        if (!isFolder && typeof item.getMimeType === 'function') {
            mimeType = item.getMimeType();
        }

        return {
            id: item.getId(),
            name: item.getName(),
            type: isFolder ? 'DIRECTORY' : 'FILE', // System Hierarchy Law
            archetype: isFolder ? 'CONTAINER' : 'ITEM', // Semiotic Role
            mimeType: mimeType,
            parent: normalizedParent, 
            lastUpdated: item.getLastUpdated().toISOString(),
            raw: {
                size: !isFolder ? item.getSize() : 0,
                description: item.getDescription() || ""
            }
        };
    }

    /**
     * RF-X-1: Busca archivos/carpetas en Drive
     * @param {Object} payload - { query: string }
     * @returns {Object} { foundItems: Array<{id, name, type, mimeType}> }
     */
    // Helper seguro para obtener hijos de una carpeta concreta
    function _browseFolder(folder, limit = 20) {
        const foundItems = [];
        // Carpetas primero
        const folders = folder.getFolders();
        let count = 0;
        while (folders.hasNext() && count < limit) {
            foundItems.push(_mapFileNode(folders.next(), 'folder'));
            count++;
        }
        // Archivos después
        const files = folder.getFiles();
        count = 0;
        while (files.hasNext() && count < limit) {
            foundItems.push(_mapFileNode(files.next(), 'file'));
            count++;
        }
        return foundItems;
    }

    /**
     * RF-X-1: Busca O Navega.
     * Modos Especiales:
     * - query === 'ROOT' -> Lista la raíz del usuario.
     * - query contiene 'in parents' -> Navega dentro de una carpeta.
     * - query texto normal -> Busca en todo el Drive.
     */
    function find(payload) {

        if (!payload || typeof payload.query !== 'string') {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'find: payload.query must be string',
                { payload: payload }
            );
        }
        const query = payload.query.trim();
        try {
            // MODO 1: NAVEGACIÓN RAÍZ (Infalible)
            if (query === 'ROOT') {
                return { foundItems: _browseFolder(DriveApp.getRootFolder()) };
            }
            
            // MODO 2 HÍBRIDO: Navegación + Filtrado en Memoria
            // Si la query contiene 'in parents', usamos navegación rápida + filtro manual
            const parentMatch = query.match(/'([^']+)' in parents/);
            if (parentMatch && parentMatch[1]) {
                const folderId = parentMatch[1];
                const folder = DriveApp.getFolderById(folderId);
                let items = _browseFolder(folder);
                
                // Aplicar filtros adicionales en memoria
                // Extraer mimeType si existe en la query
                const mimeTypeMatch = query.match(/mimeType='([^']+)'/);
                if (mimeTypeMatch && mimeTypeMatch[1]) {
                    const targetMimeType = mimeTypeMatch[1];
                    items = items.filter(item => item.mimeType === targetMimeType);
                }
                
                // Filtrar por trashed si está en la query
                if (query.includes('trashed=false')) {
                    // _browseFolder ya excluye archivos en papelera por defecto
                    // No necesitamos filtrar adicional
                }
                
                return { foundItems: items };
            }
            
            // MODO 3: BÚSQUEDA GLOBAL (Texto)
            const foundItems = [];
            if (query !== '') {
                // Sanitización Axiomática: Si no es una consulta formal, buscar por título
                let sanitizedQuery = query.replace(/\bname\b/g, 'title');

                if (!sanitizedQuery.includes('=') && !sanitizedQuery.includes('contains') && !sanitizedQuery.includes('mimeType')) {
                    sanitizedQuery = `title contains '${sanitizedQuery.replace(/'/g, "\\'")}'`;
                }

                const files = DriveApp.searchFiles(sanitizedQuery);
                const folders = DriveApp.searchFolders(sanitizedQuery);
                let count = 0;
                while (folders.hasNext() && count < 10) {
                    foundItems.push(_mapFileNode(folders.next(), 'folder'));
                    count++;
                }
                count = 0;
                while (files.hasNext() && count < 20) {
                    foundItems.push(_mapFileNode(files.next(), 'file'));
                    count++;
                }
            }
            return { foundItems: foundItems };
        } catch (e) {
            throw errorHandler.createError(
                'SYSTEM_FAILURE',
                `Drive find failed: ${e.message}`,
                { query: payload.query, originalError: e.toString() }
            );
        }
    }

    /**
     * RF-X-2: Resuelve una ruta semántica a un folderId
     * RF-X-2.1: Crea carpetas intermedias si createIfNotExists es true
     * @param {Object} payload - { rootFolderId, path, createIfNotExists }
     * @returns {Object} { folderId: string }
     */
    function resolvePath(payload) {
        if (!payload || typeof payload.rootFolderId !== 'string') {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'resolvePath: payload.rootFolderId must be string',
                { payload: payload }
            );
        }

        if (typeof payload.path !== 'string') {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'resolvePath: payload.path must be string',
                { payload: payload }
            );
        }

        try {
            let currentFolder = DriveApp.getFolderById(payload.rootFolderId);
            const pathParts = payload.path.split('/').filter(part => part.trim().length > 0);

            for (const part of pathParts) {
                const folders = currentFolder.getFoldersByName(part);
                
                if (folders.hasNext()) {
                    currentFolder = folders.next();
                } else if (payload.createIfNotExists) {
                    currentFolder = currentFolder.createFolder(part);
                } else {
                    throw errorHandler.createError(
                        'RESOURCE_NOT_FOUND',
                        `Folder not found in path: ${part}`,
                        { path: payload.path, missingPart: part }
                    );
                }
            }

            return { folderId: currentFolder.getId() };
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError(
                'SYSTEM_FAILURE',
                `Drive resolvePath failed: ${e.message}`,
                { payload: payload, originalError: e.toString() }
            );
        }
    }

    /**
     * RF-X-3: Almacena un archivo en Drive (modo unificado)
     * @param {Object} payload - { fileId?, folderId?, fileName?, content, mimeType? }
     * @returns {Object} { fileId, name, mimeType }
     */
    function store(payload) {
        if (!payload || (!payload.content && payload.content !== '')) {
            throw errorHandler.createError('CONFIGURATION_ERROR', 'store: content is required.', { payload });
        }
        
        const lock = LockService.getScriptLock();
        try {
            // AXIOMA: Bloqueo de Persistencia Atómica (L7/L8)
            if (!lock.tryLock(10000)) {
                throw errorHandler.createError('LOCK_TIMEOUT', 'Drive lock contention during store operation.');
            }

            const isBlob = typeof payload.content === 'object' && payload.content.getBytes && typeof payload.content.getBytes === 'function';
            if (typeof payload.content !== 'string' && !isBlob) {
                throw errorHandler.createError('CONFIGURATION_ERROR', 'store: content must be string or Blob.', { payload });
            }

            if (payload.fileId) {
                const idStr = String(payload.fileId);
                // AXIOMA: Protección de Identidad. No intentar cargar IDs semánticos/front en Drive.
                if (idStr.startsWith('cosmos_') || idStr.startsWith('temp_')) {
                    throw errorHandler.createError('INVALID_INPUT', `Store: No se puede usar un ID semántico (${idStr}) como ID físico de Drive.`);
                }

                const file = DriveApp.getFileById(idStr);
                const contentAsString = isBlob ? payload.content.getDataAsString() : payload.content;
                file.setContent(contentAsString);
                // AXIOMA: Soporte de Metadatos (Surface Reading)
                if (payload.description) file.setDescription(payload.description);
                return { fileId: file.getId(), name: file.getName(), mimeType: file.getMimeType() };
            }

            if (payload.folderId && payload.fileName) {
                const folder = DriveApp.getFolderById(payload.folderId);
                const fileBlob = isBlob ? payload.content : Utilities.newBlob(payload.content, payload.mimeType || 'text/plain', payload.fileName);
                
                if (payload.fileName) fileBlob.setName(payload.fileName);
                if (payload.mimeType) fileBlob.setContentType(payload.mimeType);

                const existingFiles = folder.getFilesByName(payload.fileName);
                if (existingFiles.hasNext()) {
                    const existingFile = existingFiles.next();
                    existingFile.setContent(fileBlob.getDataAsString());
                    if (payload.description) existingFile.setDescription(payload.description);
                    return { fileId: existingFile.getId(), name: existingFile.getName(), mimeType: existingFile.getMimeType() };
                }

                const newFile = folder.createFile(fileBlob);
                if (payload.description) newFile.setDescription(payload.description);
                return { fileId: newFile.getId(), name: newFile.getName(), mimeType: newFile.getMimeType() };
            }

            throw errorHandler.createError('CONFIGURATION_ERROR', 'store: provide fileId or (folderId + fileName)');
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError('SYSTEM_FAILURE', `Drive store failed: ${e.message}`, { originalError: e.toString() });
        } finally {
            lock.releaseLock();
        }
    }

    /**
     * RF-X-4: Crea una carpeta
     * @param {Object} payload - { parentFolderId, folderName }
     * @returns {Object} { folderId: string }
     */
    function createFolder(payload) {
        if (!payload || typeof payload.parentFolderId !== 'string' || typeof payload.folderName !== 'string') {
            throw errorHandler.createError('CONFIGURATION_ERROR', 'createFolder: invalid payload', { payload });
        }

        const lock = LockService.getScriptLock();
        try {
            if (!lock.tryLock(5000)) throw errorHandler.createError('LOCK_TIMEOUT', 'Lock contention in createFolder');

            const parent = DriveApp.getFolderById(payload.parentFolderId);
            const existing = parent.getFoldersByName(payload.folderName);
            if (existing.hasNext()) {
                return { folderId: existing.next().getId() };
            }
            
            const newFolder = parent.createFolder(payload.folderName);
            return { folderId: newFolder.getId() };
        } catch (e) {
            throw errorHandler.createError('SYSTEM_FAILURE', `Drive createFolder failed: ${e.message}`, { originalError: e.toString() });
        } finally {
            lock.releaseLock();
        }
    }

    /**
     * RF-X-9: Revoca permisos (Burn Protocol)
     * @param {Object} payload - { fileId, email }
     * @returns {Object} { fileId, email, revoked: true }
     */
    function revokePermission(payload) {
        if (!payload || !payload.fileId || !payload.email) {
            throw errorHandler.createError('CONFIGURATION_ERROR', 'revokePermission: fileId and email required');
        }
        try {
            const file = DriveApp.getFileById(payload.fileId);
            file.removeViewer(payload.email);
            file.removeEditor(payload.email);
            return { fileId: payload.fileId, email: payload.email, revoked: true };
        } catch (e) {
            throw errorHandler.createError('SYSTEM_FAILURE', `Revoke fail: ${e.message}`);
        }
    }

    /**
     * RF-X-10: Elimina un archivo o carpeta (Mueve a papelera).
     */
    function deleteItem(payload) {
        const { id } = payload || {};
        if (!id) throw errorHandler.createError('INVALID_INPUT', 'deleteItem: id is required');
        try {
            let item;
            try { item = DriveApp.getFileById(id); } catch(e) { item = DriveApp.getFolderById(id); }
            item.setTrashed(true);
            return { id, trashed: true };
        } catch (e) {
            throw errorHandler.createError('SYSTEM_FAILURE', `Drive delete failed: ${e.message}`);
        }
    }

    /**
     * RF-X-5: Recupera un archivo de Drive (modo unificado)
     * @param {Object} payload - { fileId?, folderId?, fileName? }
     * @returns {Object} { fileId, name, mimeType, content }
     */
    function retrieve(payload) {
        if (!payload) {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'retrieve: payload is required',
                { payload: payload }
            );
        }

        try {
            let file = null;

            if (payload.fileId) {
                try {
                    file = DriveApp.getFileById(payload.fileId);
                } catch (e) {
                    return { fileId: null, name: null, mimeType: null, content: null };
                }
            }
            else if (payload.folderId && payload.fileName) {
                const folder = DriveApp.getFolderById(payload.folderId);
                const files = folder.getFilesByName(payload.fileName);
                
                console.log('[DriveAdapter.retrieve] Buscando archivo: %s', payload.fileName);
                console.log('[DriveAdapter.retrieve] En carpeta: %s', payload.folderId);
                
                if (files.hasNext()) {
                    file = files.next();
                    console.log('[DriveAdapter.retrieve] ✅ Archivo encontrado:');
                    console.log('[DriveAdapter.retrieve]    ID: %s', file.getId());
                    console.log('[DriveAdapter.retrieve]    Nombre: %s', file.getName());
                    console.log('[DriveAdapter.retrieve]    Modificado: %s', file.getLastUpdated());
                    console.log('[DriveAdapter.retrieve]    Tamaño: %s bytes', file.getSize());
                } else {
                    console.log('[DriveAdapter.retrieve] ❌ NO se encontró el archivo');
                }
            } else {
                throw errorHandler.createError(
                    'CONFIGURATION_ERROR',
                    'retrieve: must provide either fileId or (folderId + fileName)',
                    { payload: payload }
                );
            }

            if (!file) {
                return { fileId: null, name: null, mimeType: null, content: null, lastUpdated: null };
            }

            const contentString = file.getBlob().getDataAsString();
            let content = contentString;
            let isJSON = false;

            // AXIOMA: Contrato Explícito - No adivinar tipos si se pide estricto
            if (payload.type === 'json' || payload.strictJSON) {
              try {
                content = JSON.parse(contentString);
                isJSON = true;
              } catch (e) {
                throw errorHandler.createError('CORRUPTION_ERROR', `File '${file.getName()}' is not valid JSON.`, { fileId: file.getId() });
              }
            } else {
              // Heurística de retrocompatibilidad (Lote 1-4)
              try {
                const parsed = JSON.parse(contentString);
                if (parsed && typeof parsed === 'object') {
                  content = parsed;
                  isJSON = true;
                }
              } catch (e) {
                // No es JSON, se entrega como string (comportamiento legacy)
              }
            }
            return {
                fileId: file.getId(),
                name: file.getName(),
                mimeType: file.getMimeType(),
                content: content,
                isJSON: isJSON,
                lastUpdated: file.getLastUpdated().toISOString()
            };
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError(
                'SYSTEM_FAILURE',
                `Drive retrieve failed: ${e.message}`,
                { payload: payload, originalError: e.toString() }
            );
        }
    }

    /**
     * RF-X-6: Comparte un archivo/carpeta
     * @param {Object} payload - { fileId, email, role }
     * @returns {Object} { fileId, email, role }
     */
    function share(payload) {
        if (!payload || !payload.fileId || !payload.email || !payload.role) {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'share: must provide fileId, email, and role',
                { payload: payload }
            );
        }

        try {
            const file = DriveApp.getFileById(payload.fileId);
            
            if (payload.role === 'viewer' || payload.role === 'reader') {
                file.addViewer(payload.email);
            } else if (payload.role === 'writer' || payload.role === 'editor') {
                file.addEditor(payload.email);
            } else {
                throw errorHandler.createError(
                    'CONFIGURATION_ERROR',
                    'share: role must be "viewer" or "writer"',
                    { io_behavior: payload.role }
                );
            }

            return {
                fileId: payload.fileId,
                email: payload.email,
                io_behavior: payload.role
            };
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError(
                'SYSTEM_FAILURE',
                `Drive share failed: ${e.message}`,
                { payload: payload, originalError: e.toString() }
            );
        }
    }

    /**
     * RF-X-7: Mueve un archivo/carpeta a otra ubicación
     * @param {Object} payload - { targetId, destinationFolderId }
     * @returns {Object} { targetId, destinationFolderId }
     */
    function move(payload) {
        if (!payload || !payload.targetId || !payload.destinationFolderId) {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'move: must provide targetId and destinationFolderId',
                { payload: payload }
            );
        }

        try {
            let target;

            try {
                target = DriveApp.getFileById(payload.targetId);
            } catch (e) {
                target = DriveApp.getFolderById(payload.targetId);
            }
            
            const destination = DriveApp.getFolderById(payload.destinationFolderId);
            
            target.moveTo(destination);
            
            return {
                targetId: payload.targetId,
                destinationFolderId: payload.destinationFolderId
            };
        } catch (e) {
            throw errorHandler.createError(
                'SYSTEM_FAILURE',
                `Drive move failed: ${e.message}`,
                { payload: payload, originalError: e.toString() }
            );
        }
    }

    /**
     * RF-X-8: Recupera un archivo de Drive como un objeto Blob
     * @param {Object} payload - { fileId }
     * @returns {Object} { blob: Blob } o { blob: null } si no se encuentra
     */
    function retrieveAsBlob(payload) {
        if (!payload || !payload.fileId) {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'retrieveAsBlob: payload.fileId es requerido.'
            );
        }
        try {
            const file = DriveApp.getFileById(payload.fileId);
            return { blob: file.getBlob() };
        } catch (e) {
            // Si el archivo no se encuentra, la API de Drive lanza una excepción.
            console.warn(`retrieveAsBlob: No se encontró el archivo con ID ${payload.fileId}.`);
            return { blob: null };
        }
    }

    function cleanFolderByAge(payload) {
        const { folderId, maxAgeDays = 30 } = payload;
        
        if (!folderId) {
            throw errorHandler.createError('VALIDATION_ERROR', 'cleanFolderByAge requires folderId');
        }

        try {
            const folder = DriveApp.getFolderById(folderId);
            const files = folder.getFiles();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
            
            let deletedCount = 0;
            
            while (files.hasNext()) {
                const file = files.next();
                const lastUpdated = file.getLastUpdated();
                
                if (lastUpdated < cutoffDate) {
                    file.setTrashed(true);
                    deletedCount++;
                }
            }
            
            return { deletedCount };
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError('EXTERNAL_API_ERROR', `Failed to clean folder: ${e.message}`, { folderId });
        }
    }


    /**
     * @description Verifica la conectividad y validez del token para una cuenta específica.
     * @param {object} payload - { accountId? }
     * @returns {object} { status: "ACTIVE" | "BROKEN", success: boolean, error? }
     */
    function verifyConnection(payload = {}) {
        const accountId = payload.accountId || null;
        const accessToken = _getAccessToken(accountId);
        
        try {
            if (accessToken) {
                // Validación vía REST API de Google Drive
                const response = UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
                   headers: { "Authorization": "Bearer " + accessToken },
                   muteHttpExceptions: true
                });
                
                if (response.getResponseCode() === 200) {
                    return { status: "ACTIVE", success: true };
                } else {
                    return { status: "BROKEN", success: false, error: `Drive API Error: ${response.getContentText()}` };
                }
            } else {
                 // Fallback: Sesión por defecto del script
                 DriveApp.getRootFolder();
                 return { status: "ACTIVE", success: true };
            }
        } catch (e) {
            return { status: "BROKEN", success: false, error: e.message };
        }
    }

    // --- SOVEREIGN CANON V12.0 (Algorithmic Core) ---
    const CANON = {
        LABEL: "Google Drive (Native)",
        ARCHETYPES: ["ADAPTER", "VAULT"],
        ARCHETYPE: "VAULT",
        DOMAIN: "STORAGE",

        CAPABILITIES: {
            "search": { 
                "io": "READ",
                "risk": 1,
                "desc": "Global semantic search",
                "exposure": "public",
                "inputs": {
                    "query": { "type": "string", "desc": "Filter criteria (ROOT, ID, name, mimeType)." },
                    "accountId": { "type": "string", "desc": "Isolation key." }
                },
                "outputs": {
                    "foundItems": { "type": "array", "desc": "Collection of DriveAsset nodes." }
                }
            },
            "upload": { 
                "io": "WRITE",
                "risk": 2,
                "desc": "Blob storage ingestion",
                "exposure": "public",
                "inputs": {
                    "fileId": { "type": "string", "desc": "Target file ID (overwrite)." },
                    "folderId": { "type": "string", "desc": "Target folder ID (new file)." },
                    "fileName": { "type": "string", "desc": "Filename for new asset." },
                    "content": { "type": "string", "desc": "Data payload (String/Blob)." },
                    "mimeType": { "type": "string", "desc": "IANA media type." }
                }
            },
            "store": { 
                "io": "WRITE", 
                "risk": 2,
                "desc": "Unified persistence (alias of upload)"
            },
            "move": {
                "io": "WRITE",
                "risk": 2,
                "desc": "Relocate atomic unit",
                "exposure": "public",
                "inputs": {
                    "fileId": { "type": "string", "desc": "Target asset ID." },
                    "sourceId": { "type": "string", "desc": "Current parent ID." },
                    "destinationId": { "type": "string", "desc": "New parent ID." }
                }
            },
            "listContents": {
                "io": "READ",
                "risk": 1,
                "desc": "List folder contents physically",
                "exposure": "public",
                "inputs": {
                    "folderId": { "type": "string", "desc": "Target folder ID or 'ROOT'." }
                },
                "outputs": {
                    "items": { "type": "array", "desc": "List of file/folder nodes." }
                }
            },
            "share": {
                "io": "ADMIN",
                "risk": 3,
                "desc": "Permissions governance (Grant)",
                "exposure": "public",
                "inputs": {
                    "fileId": { "type": "string", "desc": "Target asset ID." },
                    "email": { "type": "string", "desc": "Target user email." },
                    "role": { "type": "string", "desc": "viewer | writer" }
                }
            },
            "deleteItem": {
                "io": "WRITE",
                "risk": 3,
                "desc": "Atomic destruction (Trash)",
                "exposure": "public",
                "inputs": {
                    "id": { "type": "string", "desc": "Asset ID to delete." }
                }
            },
            "sync": {
                 "io": "REFRESH",
                 "risk": 1,
                 "desc": "Force state consistency"
            }
        },
        PERSISTENCE_CONTRACT: {
            "vault_tree": { "ttl": 300, "scope": "COSMOS", "hydrate": true, "compute": "EAGER" },
            "folder_sizes": { "ttl": 3600, "scope": "COSMOS", "hydrate": false, "compute": "LAZY" },
            "recent_files": { "ttl": 60, "scope": "SESSION", "hydrate": true, "compute": "EAGER" }
        }
    };


    // AXIOMA: Retorno del Nodo Soberano
    const schemas = (function() {
        const s = {};
        for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
            s[key] = {
                description: cap.desc,
                exposure: cap.exposure || "private",
                risk: cap.risk || 1, // Default to low risk
                io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
            };
        }
        return s;
    })();

    return Object.freeze({
        id: "drive", // Identidad del Trabajador
        CANON: CANON,
        schemas,
        // Métodos expuestos
        retrieve,
        store,
        find,
        move,
        resolvePath,
        createFolder,
        listContents: function(payload = {}) {
            const { folderId = 'ROOT', query = '' } = payload;
            const items = [];

            try {
                // CASO 1: Búsqueda Inducida (Induced Search)
                if (query) {
                    const sanitizedQuery = `title contains '${query.replace(/'/g, "\\'")}' and trashed = false`;
                    const files = DriveApp.searchFiles(sanitizedQuery);
                    const folders = DriveApp.searchFolders(sanitizedQuery);
                    
                    while (files.hasNext() && items.length < 50) {
                        items.push(_mapFileNode(files.next(), 'file'));
                    }
                    while (folders.hasNext() && items.length < 100) {
                        items.push(_mapFileNode(folders.next(), 'folder'));
                    }
                    
                    return {
                        items,
                        metadata: {
                            total: items.length,
                            hasMore: files.hasNext() || folders.hasNext(),
                            hydrationLevel: (files.hasNext() || folders.hasNext()) ? 80 : 100
                        }
                    };
                }

                // CASO 2: Navegación de Directorio
                const id = folderId === 'ROOT' ? 'ROOT' : folderId;
                const folder = (id === 'ROOT') 
                    ? DriveApp.getRootFolder() 
                    : DriveApp.getFolderById(id);
                
                const resultItems = _browseFolder(folder);
                
                // AXIOMA: Reducción de Entropía (Esquema de Bóveda)
                const schema = {
                    columns: [
                        { id: 'name', label: 'NOMBRE', type: 'STRING' },
                        { id: 'type', label: 'TIPO', type: 'STRING' },
                        { id: 'mimeType', label: 'MIME', type: 'STRING' },
                        { id: 'lastUpdated', label: 'MODIFICADO', type: 'DATE' }
                    ]
                };

                return {
                    results: resultItems,
                    items: resultItems, // Backward compatibility
                    ORIGIN_SOURCE: 'drive',
                    SCHEMA: schema,
                    PAGINATION: {
                        hasMore: false,
                        nextToken: null,
                        total: resultItems.length,
                        count: resultItems.length
                    },
                    IDENTITY_CONTEXT: {
                        accountId: null,
                        permissions: {
                            canEdit: true,
                            role: 'owner'
                        }
                    }
                };

            } catch (e) {
                if (typeof console !== 'undefined') console.error(`[Drive:Vault] Error: ${e.message}`);
                throw e;
            }
        },
        verifyConnection,
        
        // Legacy Aliases
        get schemas() {
            const s = {};
            for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
                s[key] = {
                    description: cap.desc,
                    exposure: cap.exposure || "private",
                    risk: cap.risk || 1,
                    io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
                };
            }
            return s;
        },
        createFile: store,
        updateFile: store,
        readFile: (payload) => retrieve(payload).content,
        revokeAccess: revokePermission,
        setTokenManager: (tm) => { tokenManager = tm; }
    });
}






