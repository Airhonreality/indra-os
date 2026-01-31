// ============================================================
// FUNCIÓN AUXILIAR: Construcción del systemContext centralizado
// ============================================================
/**
 * Construye el contexto del sistema (systemContext) a partir del configurator.
 */
function _buildSystemContext({ configurator, accountId = 'system', cosmosId = null }) {
  if (!configurator) throw new Error("_buildSystemContext requiere la dependencia 'configurator'.");
  try {
    const rootFolderId = configurator.retrieveParameter({ key: 'ORBITAL_CORE_ROOT_ID' });
    const jsonFlowsFolderId = configurator.retrieveParameter({ key: 'system_folder_jsonFlowsFolder_id' });
    const templatesFolderId = configurator.retrieveParameter({ key: 'system_folder_templatesFolder_id' });
    const assetsFolderId = configurator.retrieveParameter({ key: 'system_folder_assetsFolder_id' });
    const outputFolderId = configurator.retrieveParameter({ key: 'system_folder_outputFolder_id' });
    
    // ADN Transaccional (Estado de Gracia)
    return { 
      accountId, 
      cosmosId, 
      rootFolderId, 
      jsonFlowsFolderId, 
      templatesFolderId, 
      assetsFolderId, 
      outputFolderId 
    };
  } catch (e) {
    return { accountId, cosmosId };
  }
}

// ============================================================
// JERARQUÍA DE ENSAMBLADORES (Agnosticismo V7.0)
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
  const sheetAdapter = overrides.sheetAdapter || createSheetAdapter({ errorHandler });
  const driveAdapter = overrides.driveAdapter || createDriveAdapter({ errorHandler });
  
  const googleDocsAdapter = overrides.googleDocsAdapter || createGoogleDocsAdapter({ errorHandler, driveAdapter });
  const googleSlidesAdapter = overrides.googleSlidesAdapter || createGoogleSlidesAdapter({ errorHandler, driveAdapter });
  const googleFormsAdapter = overrides.googleFormsAdapter || createGoogleFormsAdapter({ errorHandler, driveAdapter });
  const cipherAdapter = overrides.cipherAdapter || createCipherAdapter({ errorHandler });
  
  const effectiveMonitor = overrides.monitoringService || monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {},
    logEvent: () => {}, sendCriticalAlert: () => {}
  };

  let tokenManager;
  try {
    tokenManager = overrides.tokenManager || createTokenManager({ driveAdapter, configurator, errorHandler, cipherAdapter, monitoringService: effectiveMonitor });
  } catch (e) {
    if (effectiveMonitor.logError) effectiveMonitor.logError(`[ServerStack] Critical failure creating TokenManager: ${e.message}`);
    tokenManager = { label: 'BROKEN_TokenManager', isBroken: true, error: e.message };
  }
  const googleDriveRestAdapter = overrides.googleDriveRestAdapter || createGoogleDriveRestAdapter({ errorHandler, tokenManager });
  
  if (configurator && configurator.setTokenManager) configurator.setTokenManager(tokenManager);

  const renderEngine = overrides.renderEngine || createRenderEngine({ errorHandler, monitoringService: effectiveMonitor });
  const calendarAdapter = overrides.calendarAdapter || createCalendarAdapter({ errorHandler });

  const schemaRegistry = overrides.schemaRegistry || createSchemaRegistry({ laws });
  const flowCompiler = overrides.flowCompiler || createFlowCompiler({ errorHandler, schemaRegistry });

  return { 
    manifest: constitution, laws, errorHandler, configurator, keyGenerator, 
    connectionTester, sheetAdapter, driveAdapter, googleDriveRestAdapter,
    googleDocsAdapter, googleSlidesAdapter, googleFormsAdapter,
    tokenManager, cipherAdapter, renderEngine, calendarAdapter,
    flowCompiler, schemaRegistry, // Added to stack
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
    label: "Sovereign Laws",
    description: "Aggregation of all axiomatic laws.",
    constitution: typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {},
    axioms: typeof LOGIC_AXIOMS !== 'undefined' ? LOGIC_AXIOMS : {},
    topology: typeof TOPOLOGY_LAWS !== 'undefined' ? TOPOLOGY_LAWS : {},
    blueprints: typeof CONTRACT_BLUEPRINTS !== 'undefined' ? CONTRACT_BLUEPRINTS : {},
    visual: typeof VISUAL_GRAMMAR !== 'undefined' ? VISUAL_GRAMMAR : {},
    distribution: typeof UI_DISTRIBUTION !== 'undefined' ? UI_DISTRIBUTION : {},
    spatial: typeof SPATIAL_PHYSICS !== 'undefined' ? SPATIAL_PHYSICS : {}
  });

  const laws = overrides.laws || SOVEREIGN_LAWS;
  const constitution = laws.constitution || (typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {});
  console.log('[SystemAssembler] Constitution loaded?', !!constitution.anchorPropertyKey, 'Keys:', Object.keys(constitution));

  const errorHandler = overrides.errorHandler || createErrorHandler();
  const configurator = overrides.configurator || createConfigurator({ manifest: constitution, errorHandler });
  const sheetAdapter = overrides.sheetAdapter || createSheetAdapter({ errorHandler });
  
  const initialMonitoringService = overrides.monitoringService || createMonitoringService({ 
    configurator, errorHandler, manifest: constitution, sheetAdapter,
    emailAdapter: { send: () => {} }
  });

  const serverStack = _assembleServerOnlyStack({ createRenderEngine: globalThis.createRenderEngine }, initialMonitoringService, overrides, laws);
  
  const gatekeeper = overrides.gatekeeper || createContractGatekeeper({ laws });

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

  // Adaptadores con creación segura
  const lowFiPdfAdapter = overrides.lowFiPdfAdapter || _safeCreate('LowFi_PdfAdapter', createLowFi_PdfAdapter, { errorHandler: serverStack.errorHandler });
  const notionAdapter = overrides.notionAdapter || _safeCreate('NotionAdapter', createNotionAdapter, { 
    tokenManager: serverStack.tokenManager, 
    errorHandler: serverStack.errorHandler,
    driveAdapter: serverStack.driveAdapter, // Added dependency
    configurator: serverStack.configurator 
  });
  if (!notionAdapter) console.error('[SystemAssembler] CRITICAL: NotionAdapter is UNDEFINED after creation attempt.');
  const emailAdapter = overrides.emailAdapter || _safeCreate('EmailAdapter', createEmailAdapter, { errorHandler: serverStack.errorHandler, tokenManager: serverStack.tokenManager });
  const llmAdapter = overrides.llmAdapter || _safeCreate('LLMAdapter', createLLMAdapter, { errorHandler: serverStack.errorHandler, tokenManager: serverStack.tokenManager, configurator: serverStack.configurator });
  const mapsAdapter = overrides.mapsAdapter || _safeCreate('MapsAdapter', createMapsAdapter, { errorHandler: serverStack.errorHandler });
  
  const whatsappAdapter = overrides.whatsappAdapter || _safeCreate('WhatsAppAdapter', createWhatsAppAdapter, { errorHandler: serverStack.errorHandler, tokenManager: serverStack.tokenManager });
  const instagramAdapter = overrides.instagramAdapter || _safeCreate('InstagramAdapter', createInstagramAdapter, { errorHandler: serverStack.errorHandler, tokenManager: serverStack.tokenManager });
  const tiktokAdapter = overrides.tiktokAdapter || _safeCreate('TikTokAdapter', createTikTokAdapter, { errorHandler: serverStack.errorHandler, tokenManager: serverStack.tokenManager });

  const messengerAdapter = overrides.messengerAdapter || _safeCreate('MessengerAdapter', createMessengerAdapter, { 
    errorHandler: serverStack.errorHandler,
    adapters: {
      whatsapp: whatsappAdapter,
      instagram: instagramAdapter,
      tiktok: tiktokAdapter
    }
  });

  const oracleAdapter = overrides.oracleAdapter || _safeCreate('OracleAdapter', createOracleAdapter, { errorHandler: serverStack.errorHandler, tokenManager: serverStack.tokenManager });
  const audioAdapter = overrides.audioAdapter || _safeCreate('AudioAdapter', createAudioAdapter, { errorHandler: serverStack.errorHandler, tokenManager: serverStack.tokenManager });
  const youtubeAdapter = overrides.youtubeAdapter || _safeCreate('YouTubeAdapter', createYouTubeAdapter, { errorHandler: serverStack.errorHandler, tokenManager: serverStack.tokenManager, sensingService: oracleAdapter });
  
  const schemaRegistry = overrides.schemaRegistry || createSchemaRegistry({ laws });
  
  const sensingAdapter = overrides.sensingAdapter || _safeCreate('CognitiveSensingAdapter', createCognitiveSensingAdapter, {
    ...serverStack,
    schemaRegistry,
    monitoringService: serverStack.monitoringService,
    gatekeeper: gatekeeper
  });
  
  const spatialProjectionAdapter = overrides.spatialProjectionAdapter || _safeCreate('SpatialProjectionAdapter', createSpatialProjectionAdapter, {
    errorHandler: serverStack.errorHandler,
    renderEngine: serverStack.renderEngine,
    sensingAdapter: sensingAdapter 
  });
  
  const flowRegistry = overrides.flowRegistry || createFlowRegistry({ ...serverStack, laws });
  const jobQueueService = overrides.jobQueueService || _safeCreate('JobQueueService', createJobQueueService, { ...serverStack });
  const projectionKernel = overrides.projectionKernel || createProjectionKernel({ configurator: serverStack.configurator, errorHandler: serverStack.errorHandler });
  const adminTools = overrides.adminTools || createAdminTools({ ...serverStack, jobQueueService });
  const metabolicService = overrides.metabolicService || createMetabolicService({ ...serverStack, jobQueueService });

  const indra = overrides.indraAdapter || sensingAdapter; // Alias a Sensing

  // 📦 GRANULAR LOGIC NODES (Axioma 2: Reducción de Entropía)
  const mathService = createMathService({ errorHandler: serverStack.errorHandler });
  const textService = createTextService({ errorHandler: serverStack.errorHandler, renderEngine: serverStack.renderEngine });
  const dateService = createDateService({ errorHandler: serverStack.errorHandler });
  const collectionService = createCollectionService({ errorHandler: serverStack.errorHandler, renderEngine: serverStack.renderEngine });
  const flowControlService = createFlowControlService({ errorHandler: serverStack.errorHandler });




  const nodesRegistry = { 
    drive: serverStack.driveAdapter, 
    sheet: serverStack.sheetAdapter, 
    email: emailAdapter, 
    notion: notionAdapter,
    llm: llmAdapter,
    maps: mapsAdapter,
    messenger: messengerAdapter,
    whatsapp: whatsappAdapter,
    instagram: instagramAdapter,
    tiktok: tiktokAdapter,
    oracle: oracleAdapter,
    audio: audioAdapter,
    youtube: youtubeAdapter,
    monitoring: serverStack.monitoringService,
    calendar: serverStack.calendarAdapter,
    config: serverStack.configurator,
    sensing: sensingAdapter, 
    spatial: spatialProjectionAdapter,
    tokenManager: serverStack.tokenManager,
    metabolism: metabolicService,
    googleDriveRest: serverStack.googleDriveRestAdapter,
    googleDocs: serverStack.googleDocsAdapter,
    googleSlides: serverStack.googleSlidesAdapter,
    googleForms: serverStack.googleFormsAdapter,
    adminTools: adminTools,
    // Pure Granular Logic
    math: mathService,
    text: textService,
    date: dateService,
    collection: collectionService,
    flow: flowControlService,
    indra: { 
      id: "INDRA_CORE_BRIDGE",
      label: "Indra System Bridge",
      description: "Gateway for spatial kernel communication and front-end synchronization.",
      archetype: "BRIDGE",
      semantic_intent: "GATE",
      ...indra 
    }
  };

  // AXIOMA: Motor de Inferencia de Capacidades (MCEP Sovereign)
  // Instanciamos el traductor cognitivo que servirá a la IA y a la API.
  const mcepService = createMCEPService({ 
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
    gatekeeper: gatekeeper,
    configurator: serverStack.configurator,
    driveAdapter: serverStack.driveAdapter,
    mcepService: mcepService,
    laws: laws
  });

  intelligenceNode.label = "Intelligence Orchestrator";
  intelligenceNode.description = "Core reasoning engine for multi-agent coordination and high-level industrial logic.";
  intelligenceNode.archetype = "ORCHESTRATOR";
  intelligenceNode.semantic_intent = "BRIDGE";
  
  nodesRegistry.intelligence = intelligenceNode;

  const nodes = Object.freeze({
    label: "System Node Registry",
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
  });
  
  // AXIOMA: Conciencia Ontológica (L7)
  // Permitir que el TokenManager descubra proveedores desde el registro de nodos consolidado
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
    indra,
    gatekeeper,
    schemaRegistry,
    flowCompiler: serverStack.flowCompiler,
    mcepService: mcepService
  });  

  if (gatekeeper && gatekeeper.setIntelligence) {
    gatekeeper.setIntelligence(intelligenceNode);
  }

  /**
   * Ejecuta el Teardown (Homeostasis) de todos los nodos que lo soporten.
   */
  function teardown() {
    // Definimos el monitor localmente si no está disponible en este scope
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
    gatekeeper: gatekeeper,
    schemaRegistry,
    jobQueueService,
    notionAdapter,
    coreOrchestrator,
    public: publicApi,
    nodes,
    indra,
    monitoringService: serverStack.monitoringService,
    adminTools,
    projectionKernel,
    spatialProjectionAdapter,
    // Alias para compatibilidad externa (Mapeados al API Público purificado)
    sensing: {
      ...sensingAdapter,
      scanArtifacts: (input) => publicApi.scanArtifacts(input),
      saveSnapshot: (payload) => publicApi.saveSnapshot(payload)
    },
    orchestrator: coreOrchestrator,
    monitor: serverStack.monitoringService,
    queue: jobQueueService,
    flows: flowRegistry,
    intelligence: nodes.intelligence,
    teardown, // Added teardown function
    systemInitializer: createSystemInitializer({ ...serverStack })
  };
}

/**
 * NIVEL 3: Pila de Ingesta Ligera (Para Webhooks y Boomerangs).
 * Axioma: Velocidad sobre Completitud. No carga inteligencia ni orquestación pesada.
 */
function _assembleInjestStack(overrides = {}) {
  const manifest = SYSTEM_MANIFEST;
  const errorHandler = overrides.errorHandler || createErrorHandler();
  const configurator = overrides.configurator || createConfigurator({ manifest, errorHandler });
  const sheetAdapter = overrides.sheetAdapter || createSheetAdapter({ errorHandler });
  const driveAdapter = overrides.driveAdapter || createDriveAdapter({ errorHandler });
  
  const cipherAdapter = overrides.cipherAdapter || createCipherAdapter({ errorHandler });
  const tokenManager = overrides.tokenManager || createTokenManager({ driveAdapter, configurator, errorHandler, cipherAdapter });
  
  const jobQueueService = overrides.jobQueueService || createJobQueueService({ 
    configurator, 
    errorHandler, 
    driveAdapter 
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