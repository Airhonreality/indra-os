// ============================================================
// FUNCIÓN AUXILIAR: Construcción del systemContext centralizado
// ============================================================

/**
 * Factory para el Ensamblador del Sistema.
 * AXIOMA: Punto de ignición para diagnósticos y ejecución soberana.
 */
function createSystemAssembler() {
  return {
    assembleServerStack: (overrides) => _assembleExecutionStack(overrides),
    assembleInjestStack: (overrides) => _assembleInjestStack(overrides)
  };
}

// Mantener alias global para compatibilidad legacy si fuera necesario
var SystemAssembler = createSystemAssembler();

/**
 * Construye el contexto del sistema (systemContext) a partir del configurator.
 */
function _buildSystemContext({ constitution, configurator, accountId = 'system', cosmosId = null }) {
  if (!configurator) throw new Error("_buildSystemContext requiere la dependencia 'configurator'.");
  try {
    const anchorKey = constitution?.ANCHOR_PROPERTY || 'CORE_ROOT';
    const rootFolderId = configurator.retrieveParameter({ key: anchorKey });
    const flowsFolderId = configurator.retrieveParameter({ key: 'CORE_FLOWS_ID' });
    const templatesFolderId = configurator.retrieveParameter({ key: 'CORE_TEMPLATES_ID' });
    const assetsFolderId = configurator.retrieveParameter({ key: 'CORE_ASSETS_ID' });
    const outputFolderId = configurator.retrieveParameter({ key: 'CORE_OUTPUT_ID' });
    
    return { 
      accountId, 
      cosmosId, 
      rootFolderId, 
      flowsFolderId, 
      templatesFolderId, 
      assetsFolderId, 
      outputFolderId 
    };
  } catch (e) {
    return { accountId, cosmosId };
  }
}

// ============================================================
// JERARQUÍA DE ENSAMBLADORES (Agnosticismo Soberano)
// ============================================================

/**
 * NIVEL 0: El Núcleo Puro del Servidor.
 */
function _assembleServerOnlyStack(factories, monitoringService, overrides = {}, laws = {}) {
  const { createRenderEngine } = factories;
  if (!createRenderEngine) throw new Error('_assembleServerOnlyStack requiere { createRenderEngine } factory.');

  const constitution = laws.constitution || (typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {});
  const errorHandler = overrides.errorHandler || (typeof createErrorHandler === 'function' ? createErrorHandler() : null);
  const configurator = overrides.configurator || createConfigurator({ manifest: constitution, errorHandler });
  const keyGenerator = overrides.keyGenerator || createKeyGenerator();
  const connectionTester = overrides.connectionTester || createConnectionTester({ errorHandler });
  const effectiveMonitor = overrides.monitoringService || monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {},
    logEvent: () => {}, sendCriticalAlert: () => {}
  };

  const driveAdapter = overrides.driveAdapter || createDriveAdapter({ errorHandler, monitoringService: effectiveMonitor });
  const sheetAdapter = overrides.sheetAdapter || createSheetAdapter({ errorHandler, driveAdapter });
  const cipherAdapter = overrides.cipherAdapter || createCipherAdapter({ errorHandler });

  let tokenManager;
  try {
    tokenManager = overrides.tokenManager || createTokenManager({ driveAdapter, configurator, errorHandler, cipherAdapter, monitoringService: effectiveMonitor });
  } catch (e) {
    if (effectiveMonitor.logError) effectiveMonitor.logError(`[ServerStack] Critical failure creating TokenManager: ${e.message}`);
    tokenManager = { label: 'BROKEN_TokenManager', isBroken: true, error: e.message };
  }

  const googleDocsAdapter = overrides.googleDocsAdapter || createGoogleDocsAdapter({ errorHandler, driveAdapter, tokenManager });
  const googleSlidesAdapter = overrides.googleSlidesAdapter || createGoogleSlidesAdapter({ errorHandler, driveAdapter, tokenManager });
  const googleFormsAdapter = overrides.googleFormsAdapter || createGoogleFormsAdapter({ errorHandler, driveAdapter, tokenManager });
  const googleDriveRestAdapter = overrides.googleDriveRestAdapter || createGoogleDriveRestAdapter({ errorHandler, tokenManager });
  
  if (configurator && configurator.setTokenManager) configurator.setTokenManager(tokenManager);
  if (driveAdapter.setTokenManager) driveAdapter.setTokenManager(tokenManager);
  if (sheetAdapter.setTokenManager) sheetAdapter.setTokenManager(tokenManager);
  if (googleDocsAdapter.setTokenManager) googleDocsAdapter.setTokenManager(tokenManager);
  if (googleSlidesAdapter.setTokenManager) googleSlidesAdapter.setTokenManager(tokenManager);
  if (googleFormsAdapter.setTokenManager) googleFormsAdapter.setTokenManager(tokenManager);

  const renderEngine = overrides.renderEngine || createRenderEngine({ errorHandler, monitoringService: effectiveMonitor });
  const calendarAdapter = overrides.calendarAdapter || createCalendarAdapter({ errorHandler, tokenManager });
  if (calendarAdapter.setTokenManager) calendarAdapter.setTokenManager(tokenManager);

  const blueprintRegistry = overrides.blueprintRegistry || createBlueprintRegistry({ laws });
  const flowCompiler = overrides.flowCompiler || createFlowCompiler({ errorHandler, blueprintRegistry });

  // AXIOMA: FrontContextManager removido (Ghost Artifact).
  // La lógica de contexto ahora reside en CosmosEngine.
  const frontContextManager = null;

  const webSocketManager = overrides.webSocketManager || createWebSocketManager({
    errorHandler,
    configurator
  });

  // --- AXIOMA: Capa 8 - Control Gateway (The Membrane) ---
  const protocolTransmitter = overrides.protocolTransmitter || createProtocolTransmitter({ driveAdapter, monitoringService: effectiveMonitor });
  const schemaLexicon = overrides.schemaLexicon || createSchemaLexicon({ monitoringService: effectiveMonitor });
  const realityValidator = overrides.realityValidator || createRealityValidator({ 
    monitoringService: effectiveMonitor,
    errorHandler: errorHandler 
  });
  const discoverySonda = overrides.discoverySonda || createDiscoverySonda({ driveAdapter, configurator, monitoringService: effectiveMonitor });
  const sessionCommander = overrides.sessionCommander || createSessionCommander({ 
    protocolTransmitter, 
    schemaLexicon, 
    realityValidator, 
    monitoringService: effectiveMonitor 
  });

  return { 
    manifest: constitution, laws, errorHandler, configurator, keyGenerator, 
    connectionTester, sheetAdapter, driveAdapter, googleDriveRestAdapter,
    googleDocsAdapter, googleSlidesAdapter, googleFormsAdapter,
    tokenManager, cipherAdapter, renderEngine, calendarAdapter,
    flowCompiler, blueprintRegistry, frontContextManager, webSocketManager,
    protocolTransmitter, schemaLexicon, realityValidator, discoverySonda, sessionCommander, // L8 Members
    monitoringService: effectiveMonitor
  };
}

/**
 * NIVEL 1: Pila para Acciones de Menú (Contexto con UI).
 */
function _assembleMenuActionStack(overrides = {}) {
  const serverStack = _assembleServerOnlyStack({ createRenderEngine: globalThis.createRenderEngine }, null, overrides);
  const simpleDialog = overrides.simpleDialog || createSimpleDialog({ errorHandler: serverStack.errorHandler });
  const systemInitializer = overrides.systemInitializer || createSystemInitializer({ ...serverStack });
  return { ...serverStack, simpleDialog, systemInitializer };
}

/**
 * NIVEL 2: Pila de Ejecución Completa (Contexto de Servidor).
 */
function _assembleExecutionStack(overrides = {}) {
  // AXIOMA: Soberanía de Leyes (Layer 0)
  const SOVEREIGN_LAWS = Object.freeze({
    id: "sovereign_laws",
    label: "Sovereign Laws",
    description: "Aggregation of all axiomatic laws.",
    archetype: "REGISTRY",
    domain: "SYSTEM_CORE",
    semantic_intent: "SCHEMA",
    constitution: typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {},
    axioms: typeof LOGIC_AXIOMS !== 'undefined' ? LOGIC_AXIOMS : {},
    topology: typeof SYSTEM_HIERARCHY !== 'undefined' ? SYSTEM_HIERARCHY : {}
  });

  const laws = overrides.laws || SOVEREIGN_LAWS;
  const constitution = laws.constitution || (typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {});
  console.log('🚀 [SystemAssembler] INDRA CORE V8.4 - HYDRATION_RESONANCE_READY');
  console.log('[SystemAssembler] Constitution loaded?', !!constitution.ANCHOR_PROPERTY, 'Keys:', Object.keys(constitution));

  const errorHandler = overrides.errorHandler || createErrorHandler();
  const configurator = overrides.configurator || createConfigurator({ manifest: constitution, errorHandler });
  const sheetAdapter = overrides.sheetAdapter || createSheetAdapter({ errorHandler });
  
  const initialMonitoringService = overrides.monitoringService || createMonitoringService({ 
    configurator, errorHandler, manifest: constitution, sheetAdapter,
    emailAdapter: { send: () => {} }
  });

  const serverStack = _assembleServerOnlyStack({ createRenderEngine: globalThis.createRenderEngine }, initialMonitoringService, overrides, laws);
  
  // AXIOMA v8.0: La validación de contratos centralizada ha sido sustituida por reflexión en runtime (Soberanía Inherente).
  // No gatekeeper needed.

  function _safeCreate(label, factory, deps) {
    try {
      return factory(deps);
    } catch (e) {
      console.error(`[SystemAssembler] FALLO CRÍTICO al crear ${label}: ${e.message} \nStack: ${e.stack}`);
      initialMonitoringService.logError(`[SystemAssembler] FALLO CRÍTICO al crear ${label}: ${e.message}`);
      // Retornar un nodo "fantasma" que el Gatekeeper detectará como inválido
      return { 
        label: `BROKEN_${label}`, 
        error: e.message, 
        isBroken: true,
        schemas: {} 
      };
    }
  }

  // ============================================================
  // AXIOMA V8.4: Inyección Centralizada de Dependencias
  // ============================================================
  
  const baseAdapterDeps = {
    errorHandler: serverStack.errorHandler,
    tokenManager: serverStack.tokenManager,
    monitoringService: serverStack.monitoringService,
    configurator: serverStack.configurator,
    driveAdapter: serverStack.driveAdapter,
    keyGenerator: serverStack.keyGenerator
  };

  /**
   * AXIOMA V14: Auto-Descubrimiento Universal (ADR-006)
   * Escanea el entorno global e instaura la soberanía de los adaptadores.
   * Ahora incluye agregadores (Messenger, YouTube) resolviendo sus dependencias en runtime.
   */
  function _discoverAllAdapters(baseDeps, overrides) {
    const discovered = {};
    const global = (typeof globalThis !== 'undefined') ? globalThis : (function() { return this; })();
    
    // Lista de fábricas disponibles
    const factories = Object.keys(global).filter(key => key.startsWith('create') && key.endsWith('Adapter'));

    // 1. Instanciar Adaptadores Atómicos (Los que no dependen de otros adaptadores)
    factories.forEach(key => {
      const adapterName = key.replace('create', '').replace('Adapter', '');
      const nodeKey = adapterName.toLowerCase();
      
      // AXIOMA: Filtrado de Identidad (No instanciar mocks ni núcleos protegidos)
      if (adapterName.startsWith('Mock')) return;

      const protectedList = [
        'DriveAdapter', 'SheetAdapter', 'CalendarAdapter', 'TokenManager', 
        'PublicAPI', 'CognitiveSensingAdapter', 'SpatialProjectionAdapter',
        'IntelligenceOrchestrator'
      ];
      
      if (protectedList.includes(adapterName + 'Adapter') || protectedList.includes(adapterName) || overrides[nodeKey] || overrides[nodeKey + 'Adapter']) return;

      try {
        if (typeof global[key] === 'function') {
          // Inyectamos las dependencias base.
          discovered[nodeKey] = _safeCreate(adapterName + 'Adapter', global[key], baseDeps);
        }
      } catch (e) {
        console.warn(`[SystemAssembler] Salto inicial de ${key}: ${e.message}`);
      }
    });

    // 2. Resolver Dependencias Cruzadas (Agregadores)
    factories.forEach(key => {
      const adapterName = key.replace('create', '').replace('Adapter', '');
      const nodeKey = adapterName.toLowerCase();
      
      const isAggregator = ['Messenger', 'YouTube'].includes(adapterName);
      if (isAggregator) {
        const aggregatorDeps = {
          ...baseDeps,
          adapters: discovered,
          sensingService: discovered.oracle
        };
        discovered[nodeKey] = _safeCreate(adapterName + 'Adapter', global[key], aggregatorDeps);
      }
    });
    
    return discovered;
  }

  // --- IGNICIÓN DE DESCUBRIMIENTO ---
  const discovered = _discoverAllAdapters(baseAdapterDeps, overrides);
  
  // Debug Adapter (Logging Control)
  const debugAdapter = overrides.debugAdapter || _safeCreate('DebugAdapter', createDebugAdapter, { 
    monitoringService: serverStack.monitoringService,
    configurator: serverStack.configurator
  });

  // AXIOMA V12: Sheet Audit Logger (ADR 003) - Timeline forense de sincronizaciones
  const sheetAuditLogger = overrides.sheetAuditLogger || _safeCreate('SheetAuditLogger', createSheetAuditLogger, {
    configurator: serverStack.configurator,
    monitoringService: serverStack.monitoringService
  });
  
  const sensingAdapter = overrides.sensingAdapter || _safeCreate('CognitiveSensingAdapter', createCognitiveSensingAdapter, {
    ...serverStack,
    blueprintRegistry: serverStack.blueprintRegistry,
    monitoringService: serverStack.monitoringService,
    auditLogger: sheetAuditLogger // Inyectamos el logger
  });
  
  const spatialProjectionAdapter = overrides.spatialProjectionAdapter || _safeCreate('SpatialProjectionAdapter', createSpatialProjectionAdapter, {
    errorHandler: serverStack.errorHandler,
    renderEngine: serverStack.renderEngine,
    sensingAdapter: sensingAdapter,
    validator: serverStack.realityValidator // Inyección de la conciencia temporal (L8)
  });
  
  const flowRegistry = overrides.flowRegistry || _safeCreate('FlowRegistry', createFlowRegistry, { ...serverStack, laws });
  const jobQueueService = overrides.jobQueueService || _safeCreate('JobQueueService', createJobQueueService, { ...serverStack });
  const projectionKernel = overrides.projectionKernel || _safeCreate('ProjectionKernel', createProjectionKernel, { configurator: serverStack.configurator, errorHandler: serverStack.errorHandler, laws });
  const adminTools = overrides.adminTools || _safeCreate('AdminTools', createAdminTools, { ...serverStack, jobQueueService });
  const metabolicService = overrides.metabolicService || _safeCreate('MetabolicService', createMetabolicService, { ...serverStack, jobQueueService });

  // 🌐 NETWORK DISPATCHER (Burst Mode Infrastructure)
  const networkDispatcher = overrides.networkDispatcher || _safeCreate('NetworkDispatcher', createNetworkDispatcher, {
    errorHandler: serverStack.errorHandler,
    monitoringService: serverStack.monitoringService,
    tokenManager: serverStack.tokenManager
  });

  // 📦 GRANULAR LOGIC NODES (Axioma 2: Reducción de Entropía)
  const mathService = createMathService({ errorHandler: serverStack.errorHandler });
  const textService = createTextService({ errorHandler: serverStack.errorHandler, renderEngine: serverStack.renderEngine });
  const dateService = createDateService({ errorHandler: serverStack.errorHandler });
  const collectionService = createCollectionService({ errorHandler: serverStack.errorHandler, renderEngine: serverStack.renderEngine });
  const flowControlService = createFlowControlService({ errorHandler: serverStack.errorHandler });

  const cosmosEngine = overrides.cosmosEngine || _safeCreate('CosmosEngine', createCosmosEngine, {
    driveAdapter: serverStack.driveAdapter,
    configurator: serverStack.configurator,
    monitoringService: serverStack.monitoringService,
    errorHandler: serverStack.errorHandler,
    validator: serverStack.realityValidator // Mapeo correcto: realityValidator -> validator
  });

  // --- REGISTRO CENTRAL DE NODOS ---
  const initialNodes = {
    drive: serverStack.driveAdapter, 
    sheet: serverStack.sheetAdapter,
    calendar: serverStack.calendarAdapter,
    googleDriveRest: serverStack.googleDriveRestAdapter,
    googleDocs: serverStack.googleDocsAdapter,
    googleSlides: serverStack.googleSlidesAdapter,
    googleForms: serverStack.googleFormsAdapter,
    cipher: serverStack.cipherAdapter,
    debug: debugAdapter
  };

  const nodesRegistry = { 
    ...initialNodes,
    ...discovered,
    isk: spatialProjectionAdapter,
    monitoring: serverStack.monitoringService,
    config: serverStack.configurator,
    sensing: sensingAdapter, 
    tokenManager: serverStack.tokenManager,
    metabolism: metabolicService,
    networkDispatcher: networkDispatcher, // Burst mode infrastructure
    adminTools: adminTools,
    // CAPA 8: CONTROL GATEWAY (Federal Agents)
    commander: serverStack.sessionCommander,
    validator: serverStack.realityValidator,
    transmitter: serverStack.protocolTransmitter,
    lexicon: serverStack.schemaLexicon,
    sonda: serverStack.discoverySonda,
    // AXIOMA: App Logic Engine (Service Bus)
    cosmos: cosmosEngine,
    // Pure Granular Logic
    math: mathService,
    text: textService,
    date: dateService,
    collection: collectionService,
    flow: flowControlService,
    websocket: serverStack.webSocketManager
  };

  // 🔬 ONTOLOGICAL DECORATION (Axiom: Discovery over Hardcoding)
  // AXIOMA: Reificación Dinámica (Unfreeze for decoration)
  const registryMetadata = JSON.parse(JSON.stringify(constitution.COMPONENT_REGISTRY || {}));
  
  // Sobrescribir en la copia local de laws para que PublicAPI lo vea
  if (laws.constitution) laws.constitution.COMPONENT_REGISTRY = registryMetadata;

  
  /**
   * Imbue un componente con su identidad soberana definida en la Constitución.
   * AXIOMA: Soberanía L0 (Sobre-escritura directa de metadatos hardcodeados).
   */
  function _decorate(key, node) {
    if (!node || typeof node !== 'object') return node;

    // AXIOMA: Mutability for Decoration
    if (Object.isFrozen(node)) {
      node = { ...node }; 
    }

    // AXIOMA V8.0: Auto-Descubrimiento Canónico
    const internalCanon = (typeof node.getCanon === 'function') ? node.getCanon() : (node.CANON || {});
    const centralConfig = registryMetadata[key.toUpperCase()] || {};

    // Fusión de Identidad V15 (Technical Sovereignty)
    // LABEL y DESCRIPTION son GENOTIPO (Autodefinición del Adaptador).
    // ICON y otros metadatos visuales son FENOTIPO (Capa Skin).
    const sovereignCanon = {
        id: key.toLowerCase(), 
        LABEL: internalCanon.LABEL || centralConfig.LABEL || key,
        DESCRIPTION: internalCanon.DESCRIPTION || centralConfig.DESCRIPTION || node.description || "",
        ARCHETYPE: internalCanon.ARCHETYPE || centralConfig.ARCHETYPE || "SERVICE", 
        DOMAIN: internalCanon.DOMAIN || centralConfig.DOMAIN || "SYSTEM_CORE",
        CAPABILITIES: internalCanon.CAPABILITIES || centralConfig.CAPABILITIES || node.schemas || {},
        DATA_CONTRACT: internalCanon.DATA_CONTRACT || centralConfig.DATA_CONTRACT || node.schemas || {} 
    };

    // Propiedades Visuales (Fenotipo) - Se extraen del Canon para la Skin
    const fenotype = {
        SEMANTIC_INTENT: internalCanon.SEMANTIC_INTENT || centralConfig.SEMANTIC_INTENT || "STREAM"
        // VITAL_SIGNS ha sido removido del Core por falta de claridad ontológica
    };

    node.canon = sovereignCanon; // ✅ Canon Técnico (Genotipo)
    
    // Inyectar propiedades legacy en el nodo para compatibilidad
    node.id = key;
    node.label = sovereignCanon.LABEL;
    node.description = sovereignCanon.DESCRIPTION; // Restaurado como Genotipo
    node.archetype = sovereignCanon.ARCHETYPE;
    node.archetypes = [sovereignCanon.ARCHETYPE];
    node.domain = sovereignCanon.DOMAIN;
    node.schemas = sovereignCanon.CAPABILITIES;
    // node.semantic_intent = fenotype.SEMANTIC_INTENT; // Descomentar si rompe algo legacy

    // ACTUALIZACIÓN DE SEGURIDAD: Si existe node.CANON (Mayúsculas), lo purificamos también
    if (node.CANON) {
        node.CANON = sovereignCanon;
    }
    
    return node;
  }

  // AXIOMA: Decoración Universal (No discriminación de nodos)
  Object.keys(nodesRegistry).forEach(key => {
    nodesRegistry[key] = _decorate(key, nodesRegistry[key]);
  });

  // AXIOMA: Motor de Inferencia de Capacidades (MCEP Sovereign)
  const mcepCore = overrides.mcepCore || createMCEP_Core({ 
    laws, 
    nodesRegistry, 
    errorHandler: serverStack.errorHandler, 
    monitoringService: serverStack.monitoringService 
  });

  // Intelligence Orchestrator Creation
  const intelligenceNode = overrides.intelligenceOrchestrator || createIntelligenceOrchestrator({ 
    errorHandler: serverStack.errorHandler, 
    monitoringService: serverStack.monitoringService,
    flowCompiler: serverStack.flowCompiler,
    configurator: serverStack.configurator,
    driveAdapter: serverStack.driveAdapter,
    mcepCore: mcepCore,
    laws: laws
  });

  // Decorar el nodo de inteligencia post-creación e insertar en el registro
  nodesRegistry.intelligence = _decorate('intelligence', intelligenceNode);

  // AXIOMA: Registro de Nodos mutable durante el ensamblaje
  const nodes = {
    id: "system_nodes",
    label: "System Node Registry",
    domain: "SYSTEM_CORE",
    archetype: "REGISTRY",
    description: "Central registry of all system adapters and services for dependency resolution.",
    semantic_intent: "SCHEMA",
    schemas: {
      getAllNodes: {
        description: "Returns the complete registry of system nodes.",
        semantic_intent: "PROBE",
        io_interface: {
          outputs: {
            registry: { type: "object", role: "SCHEMA", description: "Complete node registry mapping." }
          }
        }
      }
    },
    getAllNodes: () => nodesRegistry,
    ...nodesRegistry
  };
  
  if (serverStack.tokenManager && serverStack.tokenManager.setNodesRegistry) {
    serverStack.tokenManager.setNodesRegistry(nodes);
  }

  const coreOrchestrator = overrides.coreOrchestrator || _safeCreate('CoreOrchestrator', createCoreOrchestrator, { 
    manifest: serverStack.manifest,
    laws: serverStack.laws,
    monitoringService: serverStack.monitoringService, 
    errorHandler: serverStack.errorHandler, 
    nodes,
    renderEngine: serverStack.renderEngine,
    flowCompiler: serverStack.flowCompiler
  });


  const publicApi = overrides.publicApi || createPublicAPI({
    coreOrchestrator,
    flowRegistry,
    jobQueueService,
    monitoringService: serverStack.monitoringService,
    errorHandler: serverStack.errorHandler,
    manifest: serverStack.manifest,
    laws: serverStack.laws,
    driveAdapter: serverStack.driveAdapter,
    configurator: serverStack.configurator,
    tokenManager: serverStack.tokenManager,
    nodes,
    sensing: sensingAdapter,
    blueprintRegistry: serverStack.blueprintRegistry,
    flowCompiler: serverStack.flowCompiler,
    mcepCore: mcepCore
  });
  
  const decoratedPublic = _decorate('public', publicApi);
  
  Object.freeze(nodes);

  function teardown() {
    const _monitor = serverStack.monitoringService || { logInfo: () => {}, logError: () => {} };
    _monitor.logInfo("[SystemAssembler] 🔄 Iniciando Teardown Sistémico...");
    
    Object.keys(nodesRegistry).forEach(key => {
      const node = nodesRegistry[key];
      if (node && typeof node.teardown === 'function') {
        try {
          node.teardown();
        } catch (e) {
          _monitor.logError(`[SystemAssembler] Fallo en teardown de '${key}': ${e.message}`);
        }
      }
    });
  }

  return {
    ...serverStack,
    ...discovered,
    blueprintRegistry: serverStack.blueprintRegistry,
    jobQueueService,
    notionAdapter: discovered.notion, 
    coreOrchestrator,
    public: decoratedPublic,
    nodes: nodes,
    validator: serverStack.realityValidator, // Explicit for Audit Compliance
    cosmosEngine: cosmosEngine, 
    monitoringService: serverStack.monitoringService,
    adminTools,
    system: decoratedPublic,
    projectionKernel,
    spatialProjectionAdapter,
    blueprintRegistry: serverStack.blueprintRegistry,
    sensing: {
      ...sensingAdapter,
      scanArtifacts: (input) => publicApi.executeAction({ action: 'sensing:scanArtifacts', payload: input }),
      saveSnapshot: (payload) => publicApi.executeAction({ action: 'sensing:saveSnapshot', payload: payload })
    },
    manifest: _decorate('manifest', { ...constitution }),
    flows: _decorate('flows', flowRegistry),
    intelligence: nodes.intelligence,
    teardown, 
    systemInitializer: _decorate('systemInitializer', createSystemInitializer({ ...serverStack }))
  };
}

/**
 * NIVEL 3: Pila de Ingesta Ligera (Para Webhooks y Boomerangs).
 * Axioma: Velocidad sobre Completitud. No carga inteligencia ni orquestación pesada.
 */
function _assembleInjestStack(overrides = {}) {
  const rawConstitution = typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {};
  const manifest = Object.freeze({
    id: "MANIFEST",
    label: "System Manifest",
    description: "Constitutional manifest of system components and schemas.",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    semantic_intent: "CONFIG",
    ...rawConstitution
  });
  const errorHandler = overrides.errorHandler || createErrorHandler();
  const configurator = overrides.configurator || createConfigurator({ manifest, errorHandler });
  const sheetAdapter = overrides.sheetAdapter || createSheetAdapter({ errorHandler });
  const driveAdapter = overrides.driveAdapter || createDriveAdapter({ errorHandler });
  
  const cipherAdapter = overrides.cipherAdapter || createCipherAdapter({ errorHandler });
  const tokenManager = overrides.tokenManager || createTokenManager({ driveAdapter, configurator, errorHandler, cipherAdapter });
  
  const jobQueueService = overrides.jobQueueService || createJobQueueService({ 
    manifest, 
    configurator,
    errorHandler, 
    sheetAdapter,
    keyGenerator: overrides.keyGenerator || createKeyGenerator() 
  });

  return { 
    manifest, 
    errorHandler, 
    configurator, 
    jobQueueService, 
    sheetAdapter, 
    driveAdapter,
    tokenManager
  };
}





