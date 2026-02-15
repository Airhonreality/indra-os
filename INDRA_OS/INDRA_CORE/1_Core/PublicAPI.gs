// ======================================================================
// ARTEFACTO: 1_Core/PublicAPI.gs (REFACTORIZADO PARA AGNOSTICISMO)
// DHARMA: Fachada de Ejecución, Supervisión y Agregador de Leyes Capas.
// ======================================================================

/**
 * Factory para crear una instancia del PublicAPI.
 */
function createPublicAPI({ 
  coreOrchestrator, 
  flowRegistry, 
  jobQueueService, 
  monitoringService, 
  errorHandler,
  manifest,
  laws = {},
  driveAdapter,
  configurator,
  nodes = {},
  blueprintRegistry,    
  semanticBridge,     
  tokenManager,     
  indra,
  flowCompiler,
  mcepCore
}) {
  
  // AXIOMA: Recuperación de Esquemas desde el Cuerpo Canónico
  const schemas = ContractRegistry.getAll();

  const _monitor = monitoringService || { logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, logEvent: () => {}, sendCriticalAlert: () => {} };

  const guardDeps = { nodes, laws, mcepCore, errorHandler, blueprintRegistry, monitoringService: _monitor };

  /**
   * Mediación Diplomática Interna: Captura y normaliza excepciones de los nodos.
   */
  function _secureInvoke(nodeKey, methodName, input) {
    try {
      const result = SovereignGuard.secureInvoke(nodeKey, methodName, input, guardDeps);
      
      // AXIOMA: Firma de Linaje Universal (ADR-009)
      // Todo resultado que pase por el API queda firmado con su origen determinista.
      const stamp = { ORIGIN_SOURCE: nodeKey };
      
      if (Array.isArray(result)) return { success: true, results: result, ...stamp };
      
      // AXIOMA: Enmascaramiento Transparente (Transparent Envelope)
      // Todo objeto se devuelve en 'payload' para consistencia del Satélite.
      return { success: true, payload: result, ...stamp };
    } catch (e) {
      const isConflict = e.message.includes('STATE_CONFLICT') || e.code === 'STATE_CONFLICT';
      
      _monitor.logWarn(`[PublicAPI] Diplomatic Mediation: Action [${nodeKey}:${methodName}] failed. ${e.message}`);
      
      return { 
        success: false, 
        error: e.message,
        ORIGIN_SOURCE: nodeKey, // AXIOMA DE RETORNO: Mantener identidad en el fallo
        _SIGNAL: isConflict ? 'REALITY_CONFLICT' : undefined,
        error_code: isConflict ? 'STATE_CONFLICT' : (e.code || 'EXECUTION_ERROR'),
        status: isConflict ? 409 : 500
      };
    }
  }

  function invoke(input) {
    const { flowId, initialPayload, accountId, cosmosId } = input;
    const systemContext = input.systemContext || _buildSystemContext({ constitution: manifest, configurator, accountId, cosmosId });
    return _internalInvoke({ flowId, initialPayload, systemContext });
  }

  function _internalInvoke({ flowId, initialPayload, systemContext }) {
    const flow = flowRegistry.getFlow(flowId);
    const payload = initialPayload || {};
    const merged = Object.assign({}, payload, { input: payload.input || payload, system: systemContext });
    try {
      return coreOrchestrator.executeFlow(flow, merged);
    } finally {
      teardown(); 
    }
  }

  function teardown() {
    // Orquestar el cierre de todos los nodos con estado
    // Orquestar el cierre de todos los nodos con estado
    Object.keys(nodes).forEach(key => {
      if (key === 'public') return; // Prevent infinite recursion (self-teardown)
      const node = nodes[key];
      if (node && typeof node.teardown === 'function') {
        node.teardown();
      }
    });
    
    // Especial: Limpiar caché de TokenManager
    if (nodes.tokenManager && nodes.tokenManager.clearCache) {
        nodes.tokenManager.clearCache();
    }
  }

  function saveSnapshot(input) {
    return _secureInvoke('sensing', 'saveSnapshot', input);
  }

  /**
   * INTERFAZ V8.2: Despacho Polimórfico con Mediación Diplomática.
   * Enruta señales y captura excepciones de integridad para devolver respuestas estructuradas.
   */
  function executeAction(args) {
    if (!args.action) throw errorHandler.createError("INVALID_INPUT", "Action string is required (format: 'node:method')");
    const parts = args.action.split(':');
    if (parts.length !== 2) throw errorHandler.createError("INVALID_INPUT", "Invalid action format. Use 'node:method'");
    
    let nodeKey = parts[0];
    if (nodeKey === 'system') nodeKey = 'public'; // Robustez: System = Public Gateway
    
    _monitor.logInfo(`[PublicAPI] Polimorphic Execution: ${nodeKey}:${parts[1]}`);
    return _secureInvoke(nodeKey, parts[1], args.payload);
  }

  function executeBatch(args) {
    return SovereignGuard.executeBatch(args, guardDeps);
  }

  function getSovereignGenotype() {
    return GenotypeDistiller.distill({ laws, nodes, blueprintRegistry, manifest, monitoringService: _monitor });
  }

  function getMCEPManifest({ accountId }) {
    const cache = CacheService.getScriptCache();
    const cacheKey = `MCEP_MANIFEST_V11_${accountId || 'global'}`;
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const manifest = mcepCore.getModelTooling({ accountId });
    manifest.mcep_version = "8.0.0_FRACTAL";
    manifest.timestamp = new Date().toISOString();

    cache.put(cacheKey, JSON.stringify(manifest), 3600);
    return manifest;
  }

  function getSimulationSeeds() {
    return {
      genotype: { 
        IS_SIMULATION: true,
        TAGS: ["SIMULATION", "TESTRUN"]
      },
      systemToken: configurator.retrieveParameter({ key: 'SYSTEM_TOKEN' }),
      timestamp: new Date().toISOString()
    };
  }

  function processNextJobInQueue() {
    const job = jobQueueService.claimNextJob();
    if (!job) return { processed: false, message: "No pending jobs in queue." };
    return processSpecificJob(job);
  }

  function processSpecificJob(jobData) {
    const jobId = jobData.jobId;
    _monitor.logInfo(`[PublicAPI] Processing Job: ${jobId}`);
    
    try {
      const job = jobQueueService.claimSpecificJob(jobId);
      if (!job) throw errorHandler.createError("JOB_NOT_FOUND", `Job ${jobId} not found or already claimed.`);
      
      const flow = flowRegistry.getFlow(job.flowId);
      const res = coreOrchestrator.executeFlow(flow, job.initialPayload);
      
      jobQueueService.updateJobStatus(jobId, 'completed', res);
      return { status: 'completed', result: res };
    } catch (e) {
      _monitor.logError(`[PublicAPI] Job ${jobId} failed: ${e.message}`);
      jobQueueService.updateJobStatus(jobId, 'failed', { error: e.message });
      return { status: 'failed', error: e.message };
    }
  }

  // ===================================
  // CORE INTERFACE (Slim V2)
  // ===================================
  const specializedWrappers = {
    // Execution Primitives
    invoke,
    teardown,
    executeAction: (args) => executeAction(args),
    executeBatch: (args) => executeBatch(args),
    
    // Core System Ops (Restored as essential)
    processNextJobInQueue,
    processSpecificJob: (args) => processSpecificJob(args),
    getSimulationSeeds,
    
    // Cognitive Discovery
    getMCEPManifest: (args) => getMCEPManifest(args),
    
    // System Status (Mandatory for Front)
    getSystemStatus: () => ({ 
        status: 'healthy', 
        coherenceIndex: getGovernanceReport().coherenceIndex, 
        version: manifest.version || '1.2.0_SOVEREIGN', 
        timestamp: new Date().toISOString()
    }),

    // Diagnostics Bypass (Temporal)
    runSystemAudit: () => (typeof test_AtomicAssemblyAudit !== 'undefined' ? test_AtomicAssemblyAudit() : { success: false, message: "Audit module NOT_FOUND." }),

    // Expose for internal diagnostics & tests
    getGovernanceReport: () => getGovernanceReport(),
    getSovereignGenotype: (args) => getSovereignGenotype(args),
    getSemanticAffinity: (input) => ({ success: true, payload: { affinity: { score: 1.0, justification: "Sovereign Auto-Approval" } } }),
    getSystemContracts: () => ContractRegistry.getAll()
  };
  
  function validateTopology(args) {
    // AXIOMA: Validación de Topología Real (L3-L5)
    _monitor.logInfo("[PublicAPI] Validating System Topology...");
    const report = getGovernanceReport();
    return { 
      isValid: report.isValid, 
      errors: report.isValid ? [] : ["TOPOLOGY_INCOHERENCE"],
      coherence: report.coherenceIndex 
    };
  }

  function validateSovereignty(args) {
    const report = getGovernanceReport();
    return { 
      isValid: report.isValid, 
      criticalErrors: report.isValid ? [] : ["Sovereignty Failure"], 
      coherenceIndex: report.coherenceIndex 
    };
  }

  function _buildSystemContext({ constitution, configurator, accountId, cosmosId }) {
    return {
      system: {
        version: constitution.version || 'UNKNOWN',
        timestamp: new Date().toISOString(),
        environment: configurator.isInSafeMode() ? 'SAFE_MODE' : 'PRODUCTION'
      },
      user: {
        accountId: accountId || 'GUEST',
        role: 'SYSTEM_USER'
      },
      cosmosId: cosmosId
    };
  }

  function getGovernanceReport() {
    const validNodeKeys = Object.keys(nodes).filter(k => 
        typeof nodes[k] === 'object' && nodes[k] !== null && k !== 'schemas' && k !== 'canon'
    );
    const totalNodes = validNodeKeys.length;
    const nodesWithSchemas = validNodeKeys.filter(k => 
        (nodes[k].schemas && Object.keys(nodes[k].schemas).length > 0) || 
        (nodes[k].canon && (nodes[k].canon.CAPABILITIES || nodes[k].canon.capabilities))
    );
    
    const validCount = nodesWithSchemas.length;
    const coherence = totalNodes > 0 ? (validCount / totalNodes * 100) : 0; // Si no hay nodos, la coherencia es 0
    const isValid = totalNodes > 0 && coherence >= 70; 
    
    return { 
        isValid: isValid, 
        coherenceIndex: Number(coherence.toFixed(2)), 
        nodesAudited: totalNodes,
        timestamp: new Date().toISOString() 
    };
  }

  const publicApiInstance = {
    id: "public_api",
    label: "Core API Gateway",
    description: "Centralized system interface exposed for external orchestration and AI integration.",
    archetype: "INTERFACE",
    domain: "GOVERNANCE",
    semantic_intent: "GATE",
    schemas: schemas,
    ...specializedWrappers
  };

  // AXIOMA V12: Exposición del Motor Cognitivo (MCEP) como Nodo Soberano
  // Permite que la IA se llame a sí misma para expandir categorías (Introspección).
  if (mcepCore) {
      nodes.mcep = mcepCore;
  }

  // AXIOMA V12: Registro de Puente Final (Pre-Decoration)
  nodes.public = publicApiInstance;

  // AXIOMA v8.5: Despacho de Capacidades Delegado (Operación Soldadura)
  // Delegamos la exposición dinámica a la Guardia, manteniendo la Fachada limpia.
  SovereignGuard.exposeNodeCapabilities(publicApiInstance, { nodes, manifest, configurator, _secureInvoke });
  
  const bootstrapAudit = getGovernanceReport();
  if (!bootstrapAudit.isValid) {
      _monitor.logWarn(`[PublicAPI] ⚠️ DEGRADED_Sovereignty: Coherence at ${bootstrapAudit.coherenceIndex}%.`);
  } else {
      _monitor.logInfo(`[PublicAPI] Sovereignty Audit: System Ready (Coherence: ${bootstrapAudit.coherenceIndex}%).`);
  }
  return publicApiInstance;
}






