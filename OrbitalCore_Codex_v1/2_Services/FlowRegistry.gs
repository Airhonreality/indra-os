// ======================================================================
// ARTEFACTO: FlowRegistry.gs
// CAPA: 2_Services
// DHARMA: Ser el Bibliotecario de los Flujos JSON. Orquesta la localización,
//         lectura, escritura y cacheo de las definiciones de flujo,
//         abstrayendo el almacenamiento físico mediante la delegación total
//         de operaciones de I/O al DriveAdapter.
// ======================================================================

/**
 * Factory: Crea una instancia del FlowRegistry
 * 
 * @param {Object} params - Parámetros de construcción
 * @param {Object} params.manifest - Manifiesto del sistema con la configuración
 * @param {Object} params.driveAdapter - Adaptador para operaciones de Google Drive
 * @param {Object} params.configurator - Servicio de configuración
 * @param {Object} params.errorHandler - Manejador de errores
 * @returns {Object} Instancia del FlowRegistry
 */
function createFlowRegistry({ manifest, driveAdapter, configurator, errorHandler }) {
  // --- CONSTANTES INTERNAS ---
  const JSON_MIME_TYPE = 'application/json';

  // --- VALIDACIÓN DE DEPENDENCIAS ---
  if (!manifest || typeof manifest !== 'object') {
    throw errorHandler.createError(
      'CONFIGURATION_ERROR',
      'FlowRegistry requires a valid manifest'
    );
  }

  if (!driveAdapter || typeof driveAdapter.resolvePath !== 'function') {
    throw errorHandler.createError(
      'CONFIGURATION_ERROR',
      'FlowRegistry requires a valid driveAdapter with resolvePath method'
    );
  }

  if (!configurator || typeof configurator.retrieveParameter !== 'function') {
    throw errorHandler.createError(
      'CONFIGURATION_ERROR',
      'FlowRegistry requires a valid configurator'
    );
  }

  // --- OBTENCIÓN DE CONFIGURACIÓN DEL MANIFIESTO ---
  const anchorPropertyKey = manifest.anchorPropertyKey;
  if (!anchorPropertyKey) {
    throw errorHandler.createError(
      'CONFIGURATION_ERROR',
      'Manifest is missing anchorPropertyKey'
    );
  }

  // --- VALIDACIÓN FAIL-FAST: SISTEMA ANCLADO ---
  const rootFolderId = configurator.retrieveParameter({ key: anchorPropertyKey });
  if (!rootFolderId) {
    throw errorHandler.createError(
      'CONFIGURATION_ERROR',
      'System is not anchored. Please run the installation.'
    );
  }

  // --- VARIABLES DE ESTADO INTERNO ---
  let flowsFolderId = null;
  const SCRIPT_CACHE = CacheService.getScriptCache();
  const CACHE_TTL = 21600; // 6 horas (máximo permitido por GAS en CacheService)
  const CACHE_PREFIX = 'flow_';

  // ====================================================================
  // MÉTODO PRIVADO: ensureFlowsFolderResolved
  // ====================================================================
  /**
   * Asegura que el ID de la carpeta de flujos esté resuelto.
   * Implementa un patrón de inicialización lazy.
   * 
   * @returns {string} El ID de la carpeta de flujos
   * @throws {Error} Si no se puede resolver la ruta de la carpeta
   */
  function ensureFlowsFolderResolved() {
    // Si ya está resuelto, retornar directamente
    if (flowsFolderId !== null) {
      return flowsFolderId;
    }

    // Obtener la ruta de la carpeta de flujos del manifiesto
    const flowsFolderPath = manifest.driveSchema?.jsonFlowsFolder?.path;
    if (!flowsFolderPath) {
      throw errorHandler.createError(
        'CONFIGURATION_ERROR',
        'Manifest is missing driveSchema.jsonFlowsFolder.path'
      );
    }

    try {
      // Delegar la resolución de la ruta al driveAdapter
      // NOTA: createIfNotExists es false porque SystemInitializer es responsable
      // de crear la estructura, no este servicio
      const result = driveAdapter.resolvePath({
        rootFolderId: rootFolderId,
        path: flowsFolderPath,
        createIfNotExists: false
      });

      if (!result || !result.folderId) {
        throw errorHandler.createError(
          'CONFIGURATION_ERROR',
          'Could not resolve flows folder path'
        );
      }

      // Cachear el ID de la carpeta
      flowsFolderId = result.folderId;
      return flowsFolderId;

    } catch (error) {
      // Si el error ya está estructurado (lanzado por el adapter), relanzarlo.
      if (error.code) throw error;
      // Si no, envolverlo.
      throw errorHandler.createError(
        'CONFIGURATION_ERROR',
        `Could not resolve flows folder path: ${error.message}`
      );
    }
  }

  // ====================================================================
  // MÉTODO PÚBLICO: getFlow
  // ====================================================================
  /**
   * Obtiene un flujo por su ID.
   * Implementa caché de script con expiración.
   * 
   * @param {string} flowId - ID del flujo a obtener
   * @returns {Object} Objeto del flujo parseado
   * @throws {Error} Si el flujo no existe o no se puede parsear
   */
  function getFlow(rawArg) {
    // --- [V5.5] RESOLUCIÓN SOBERANA DE ARGUMENTO ---
    const flowId = (rawArg && typeof rawArg === 'object') ? rawArg.flowId : rawArg;

    if (!flowId || typeof flowId !== 'string' || flowId.trim() === '') {
      throw errorHandler.createError(
        'VALIDATION_ERROR',
        `flowId must be a non-empty string. Received: ${typeof flowId}`
      );
    }

    const cleanFlowId = flowId.trim();
    console.log(`[FlowRegistry] LECTURA: ${cleanFlowId}`);

    const folderId = ensureFlowsFolderResolved();
    const fileName = `${cleanFlowId}.json`;
    const cacheKey = CACHE_PREFIX + cleanFlowId;

    try {
      // 1. Intentar obtener del caché
      const cached = SCRIPT_CACHE.get(cacheKey);
      if (cached) {
        console.log(`[FlowRegistry] CACHE HIT: ${cleanFlowId}`);
        return JSON.parse(cached);
      }

      console.log(`[FlowRegistry] CACHE MISS: ${cleanFlowId}. Consultando Drive...`);

      // 2. Si no está, consultar Drive
      const result = driveAdapter.retrieve({
        folderId: folderId,
        fileName: fileName,
        type: 'json'
      });

      if (!result || !result.content) {
        throw errorHandler.createError('RESOURCE_NOT_FOUND', `Flow not found: ${cleanFlowId}`);
      }

      // 3. Guardar en caché antes de retornar
      SCRIPT_CACHE.put(cacheKey, JSON.stringify(result.content), CACHE_TTL);

      return result.content;
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Retrieve failed: ${error.message}`);
    }
  }

  function saveFlow(arg1, arg2) {
    // --- [V5.5] PROTOCOLO DE CONVERGENCIA ---
    let flowId, flowObject;

    if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1) && !arg2) {
      // Caso 1: Objeto unificado { flowId, flowObject }
      flowId = arg1.flowId;
      flowObject = arg1.flowObject;
    } else {
      // Caso 2: Argumentos posicionales (flowId, flowObject)
      flowId = arg1;
      flowObject = arg2;
    }

    // Validación Axiomática
    if (!flowId || typeof flowId !== 'string' || flowId.trim() === '') {
      throw errorHandler.createError(
        'VALIDATION_ERROR',
        `flowId must be a non-empty string. Core received: ${typeof flowId}`
      );
    }

    if (!flowObject || typeof flowObject !== 'object') {
      throw errorHandler.createError(
        'VALIDATION_ERROR',
        'flowObject must be a valid object'
      );
    }

    const folderId = ensureFlowsFolderResolved();
    const cleanFlowId = flowId.trim();
    const fileName = `${cleanFlowId}.json`;
    const cacheKey = CACHE_PREFIX + cleanFlowId;

    try {
      // Invalidad caché antes de guardar para evitar inconsistencias
      SCRIPT_CACHE.remove(cacheKey);

      const jsonContent = JSON.stringify(flowObject, null, 2);
      const result = driveAdapter.store({
        folderId: folderId,
        fileName: fileName,
        content: jsonContent,
        mimeType: JSON_MIME_TYPE
      });

      return result;
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Save failed for ${cleanFlowId}: ${error.message}`);
    }
  }

  // ====================================================================
  // MÉTODO PÚBLICO: listFlows
  // ====================================================================
  /**
   * Lista todos los IDs de flujos disponibles.
   * 
   * @returns {string[]} Array de IDs de flujo (sin extensión .json)
   * @throws {Error} Si no se puede listar los flujos
   */
  function listFlows() {
    const folderId = ensureFlowsFolderResolved();

    // Construir la query para buscar archivos JSON en la carpeta de flujos
    const query = `'${folderId}' in parents and mimeType = '${JSON_MIME_TYPE}' and trashed = false`;

    try {
      // Delegar la búsqueda al driveAdapter
      const result = driveAdapter.find({
        query: query
      });

      if (!result || !Array.isArray(result.foundItems)) {
        throw errorHandler.createError(
          'EXTERNAL_API_ERROR',
          'Invalid response from driveAdapter.find'
        );
      }

      // Extraer nombres, filtrar por extensión .json y remover la extensión
      const flowIds = result.foundItems
        .map(item => item.name)
        .filter(name => name && name.endsWith('.json'))
        .map(name => name.slice(0, -5)); // Remover '.json' (5 caracteres)

      return flowIds;

    } catch (error) {
      // Re-lanzar si ya es un error manejado
      if (error.code) {
        throw error;
      }
      // Envolver otros errores
      throw errorHandler.createError(
        'EXTERNAL_API_ERROR',
        `Failed to list flows: ${error.message}`
      );
    }
  }

  // ====================================================================
  // RETORNO DE LA INTERFAZ PÚBLICA
  // ====================================================================
  const schemas = {
    getFlow: {
      description: "Extracts a high-integrity technical workflow (blueprint) by its unique identifier, utilizing industrial caching.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          flowId: { type: "string", io_behavior: "GATE", description: "Unique workflow identifier (blueprint key)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
        }, 
        outputs: {
          flowObject: { type: "object", io_behavior: "SCHEMA", description: "The canonical technical workflow definition." }
        } 
      }
    },
    saveFlow: {
      description: "Persists a technical workflow definition to the institutional blueprint registry.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          flowId: { type: "string", io_behavior: "GATE", description: "Target workflow identifier." },
          flowObject: { type: "object", io_behavior: "SCHEMA", description: "The technical workflow definition payload." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Persistence status confirmation." }
        } 
      }
    },
    listFlows: {
      description: "Extracts a comprehensive directory of available technical workflows from the registry.",
      semantic_intent: "SENSOR",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for registry discovery." }
        }, 
        outputs: {
          flowIds: { type: "array", io_behavior: "STREAM", description: "Collection of discovered workflow identifiers." }
        } 
      }
    }
  };

  return Object.freeze({
    label: "Blueprint Registry",
    description: "Industrial librarian for workflow storage, technical blueprint management, and logic orchestration.",
    semantic_intent: "SCHEMA",
    schemas: schemas,
    getFlow,
    saveFlow,
    listFlows
  });
}

