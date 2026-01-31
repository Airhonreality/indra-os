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
 * @param {Object} dependencies.errorHandler - ErrorHandler instance
 * @returns {Object} Instancia inmutable de DriveAdapter
 */
function createDriveAdapter({ errorHandler }) {
    // Axioma: Fail-Fast Principle
    if (!errorHandler || typeof errorHandler.createError !== 'function') {
        throw new TypeError('createDriveAdapter: errorHandler contract not fulfilled');
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
            const f = folders.next();
            foundItems.push({
                id: f.getId(),
                name: f.getName(),
                type: 'folder',
                mimeType: 'application/vnd.google-apps.folder',
                folderId: folder.getId(),
                lastUpdated: f.getLastUpdated().toISOString()
            });
            count++;
        }
        // Archivos después
        const files = folder.getFiles();
        count = 0;
        while (files.hasNext() && count < limit) {
            const file = files.next();
            foundItems.push({
                id: file.getId(),
                name: file.getName(),
                type: 'file',
                mimeType: file.getMimeType(),
                folderId: folder.getId(),
                lastUpdated: file.getLastUpdated().toISOString()
            });
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
            // MODO 2: NAVEGACIÓN CARPETA ESPECÍFICA (Drill-down - Rápido)
            const parentMatch = query.match(/'([^']+)' in parents/);
            if (parentMatch && parentMatch[1] && !query.includes('title') && !query.includes('name')) {
                const folderId = parentMatch[1];
                const folder = DriveApp.getFolderById(folderId);
                return { foundItems: _browseFolder(folder) };
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
                    const folder = folders.next();
                    foundItems.push({
                        id: folder.getId(),
                        name: folder.getName(),
                        type: 'folder',
                        mimeType: 'application/vnd.google-apps.folder',
                        folderId: folder.getParents().hasNext() ? folder.getParents().next().getId() : null,
                        lastUpdated: folder.getLastUpdated().toISOString()
                    });
                    count++;
                }
                count = 0;
                while (files.hasNext() && count < 20) {
                    const file = files.next();
                    foundItems.push({
                        id: file.getId(),
                        name: file.getName(),
                        type: 'file',
                        mimeType: file.getMimeType(),
                        folderId: file.getParents().hasNext() ? file.getParents().next().getId() : null,
                        lastUpdated: file.getLastUpdated().toISOString()
                    });
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
                const file = DriveApp.getFileById(payload.fileId);
                const contentAsString = isBlob ? payload.content.getDataAsString() : payload.content;
                file.setContent(contentAsString);
                if (payload.mimeType) file.setMimeType(payload.mimeType);
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
                    return { fileId: existingFile.getId(), name: existingFile.getName(), mimeType: existingFile.getMimeType() };
                }

                const newFile = folder.createFile(fileBlob);
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

    const schemas = {
        find: {
            description: "Navigates and searches for files/folders using Drive-standard query syntax.",
            semantic_intent: "PROBE",
            io_interface: { 
                inputs: {
                    query: { type: "string", io_behavior: "STREAM", description: "Search query (ROOT, ID in parents, or text search)." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
                }, 
                outputs: {
                    foundItems: { type: "array", io_behavior: "STREAM", description: "List of matching file and folder metadata." }
                } 
            }
        },
        resolvePath: {
            description: "Traverses a folder path string (e.g., 'A/B/C') to locate or create a target container.",
            semantic_intent: "BRIDGE",
            io_interface: { 
                inputs: {
                    rootFolderId: { type: "string", io_behavior: "GATE", description: "Base folder identifier." },
                    path: { type: "string", io_behavior: "STREAM", description: "Forward-slash separated path." },
                    createIfNotExists: { type: "boolean", io_behavior: "GATE", description: "Flag to auto-generate missing segments." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    folderId: { type: "string", io_behavior: "PROBE", description: "Last folder identifier in the path." }
                } 
            }
        },
        store: {
            description: "Persists or updates file content and metadata within a target container.",
            semantic_intent: "STREAM",
            io_interface: { 
                inputs: {
                    fileId: { type: "string", io_behavior: "GATE", description: "Existing file identifier to update." },
                    folderId: { type: "string", io_behavior: "GATE", description: "Destination folder identifier." },
                    fileName: { type: "string", io_behavior: "STREAM", description: "File name with extension." },
                    content: { type: "any", io_behavior: "STREAM", description: "Raw or serialized payload to store." },
                    mimeType: { type: "string", io_behavior: "SCHEMA", description: "Standard MIME type for the file." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    fileId: { type: "string", io_behavior: "PROBE", description: "Identifier of the persisted resource." }
                } 
            }
        },
        createFolder: {
            description: "Initializes a new directory structure within a parent container.",
            semantic_intent: "TRIGGER",
            io_interface: { 
                inputs: {
                    parentFolderId: { type: "string", io_behavior: "GATE", description: "Parent folder identifier." },
                    folderName: { type: "string", io_behavior: "STREAM", description: "New folder display name." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    folderId: { type: "string", io_behavior: "PROBE", description: "Unique identifier of the new container." }
                } 
            }
        },
        retrieve: {
            description: "Extracts metadata and deserialized content from a target resource.",
            semantic_intent: "STREAM",
            io_interface: { 
                inputs: {
                    fileId: { type: "string", io_behavior: "GATE", description: "Unique file identifier." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    content: { type: "any", io_behavior: "STREAM", description: "Parsed file payload." }
                } 
            }
        },
        share: {
            description: "Modifies resource access permissions for external identities.",
            semantic_intent: "BRIDGE",
            io_interface: { 
                inputs: {
                    fileId: { type: "string", io_behavior: "GATE", description: "Target resource identifier." },
                    email: { type: "string", io_behavior: "GATE", description: "Target identity email." },
                    io_behavior: { type: "string", io_behavior: "SCHEMA", description: "Access level (viewer, writer, commenter)." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    success: { type: "boolean", io_behavior: "PROBE", description: "Permission update confirmation." }
                } 
            }
        },
        move: {
            description: "Relocates a resource to a different parent container.",
            semantic_intent: "TRANSFORM",
            io_interface: { 
                inputs: {
                    targetId: { type: "string", io_behavior: "GATE", description: "Element to be moved." },
                    destinationFolderId: { type: "string", io_behavior: "GATE", description: "Target container." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    success: { type: "boolean", io_behavior: "PROBE", description: "Relocation confirmation." }
                } 
            }
        },
        retrieveAsBlob: {
            description: "Extracts a resource as a native binary stream.",
            semantic_intent: "STREAM",
            io_interface: { 
                inputs: {
                    fileId: { type: "string", io_behavior: "GATE", description: "Unique file identifier." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    blob: { type: "object", io_behavior: "STREAM", description: "Binary data stream." }
                } 
            }
        },
        cleanFolderByAge: {
            description: "Performs garbage collection by trashing files older than a specified duration.",
            semantic_intent: "INHIBIT",
            io_interface: { 
                inputs: {
                    folderId: { type: "string", io_behavior: "GATE", description: "Target container for cleanup." },
                    maxAgeDays: { type: "number", io_behavior: "GATE", description: "Retention period in days." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    deletedCount: { type: "number", io_behavior: "PROBE", description: "Number of assets trashed." }
                } 
            }
        }
    };

    return Object.freeze({
        label: "Drive Orchestrator",
        description: "Industrial file system bridge for persistent storage and resource management.",
        semantic_intent: "BRIDGE",
        archetype: "ADAPTER",
        schemas: schemas,
        find,
        resolvePath,
        store,
        createFolder,
        retrieve,
        share,
        move,
        deleteItem,
        retrieveAsBlob,
        revokePermission,
        cleanFolderByAge,
        // Protocol-Standard Aliases
        createFile: store,
        updateFile: store,
        readFile: (payload) => retrieve(payload).content,
        revokeAccess: revokePermission
    });
}

