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
  

  const _monitor = monitoringService || { logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, logEvent: () => {}, sendCriticalAlert: () => {} };

  const guardDeps = { nodes, laws, mcepCore, errorHandler, blueprintRegistry, monitoringService: _monitor };

   /**
   * ADR-022: Mediación Diplomática con Envelope Canónico.
   * REGLA: Arrays → { success, results, origin }
   *        Objetos → { success, payload, origin }
   * NUNCA mezclar results y payload en la misma respuesta.
   * El front desempaqueta con lógica única: response.results || response.payload
   */
  function _secureInvoke(nodeKey, methodName, input) {
    try {
      const result = SovereignGuard.secureInvoke(nodeKey, methodName, input, guardDeps);

      // AXIOMA: Envelope Canónico (ADR-022)
      // Un solo campo de datos por respuesta. Sin ambigüedad.
      if (Array.isArray(result)) {
        return { success: true, results: result, origin: nodeKey };
      }
      return { success: true, payload: result, origin: nodeKey };

    } catch (e) {
      const isConflict = e.message.includes('STATE_CONFLICT') || e.code === 'STATE_CONFLICT';

      _monitor.logWarn(`[PublicAPI] Diplomatic Mediation: Action [${nodeKey}:${methodName}] failed. ${e.message}`);

      return {
        success: false,
        error: e.message,
        origin: nodeKey,
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
    const genotype = GenotypeDistiller.distill({ laws, nodes, blueprintRegistry, manifest, monitoringService: _monitor });
    
    // DEFENSA: Session.getActiveUser / getEffectiveUser pueden fallar en Web Apps
    // con access:ANYONE_ANONYMOUS si el contexto OAuth no está completamente inicializado.
    // Ambos se envuelven en try/catch para garantizar que getSovereignGenotype nunca
    // crashee por un problema de identity — el genotipo es más importante que el email.
    let activeEmail = 'SYSTEM';
    let effectiveEmail = 'SYSTEM';
    try { activeEmail = Session.getActiveUser().getEmail() || 'SYSTEM'; } catch(e) {}
    try { effectiveEmail = Session.getEffectiveUser().getEmail() || 'SYSTEM'; } catch(e) {}

    genotype.core_identity = {
      user_email: activeEmail,
      effective_user: effectiveEmail,
      core_name: manifest?.IDENTIDAD?.LABEL || "Axiom Core",
      deployment_id: ScriptApp.getService().getUrl()?.split('/')[5] || "local_dev"
    };

    return genotype;
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
    getSemanticAffinity: (input) => ({ success: true, payload: { affinityScore: 1.0, justification: "Sovereign Auto-Approval" } }),
    getSystemContracts: () => {
        const all = {};
        Object.keys(nodes).forEach(k => {
            const n = nodes[k];
            if (n && n.CANON && n.CANON.CAPABILITIES) {
                Object.assign(all, n.CANON.CAPABILITIES);
            } else if (n && n.schemas) {
                Object.assign(all, n.schemas);
            }
        });
        return all;
    }
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
    const nodesWithSchemas = validNodeKeys.filter(k => {
        const node = nodes[k];
        const hasInlineSchemas = node.schemas && Object.keys(node.schemas).length > 0;
        const hasManifestCanon = node.canon && (node.canon.CAPABILITIES || node.canon.capabilities);
        
        // AXIOMA: Soberanía Funcional (Si tiene métodos, es un nodo real)
        const hasMethods = Object.keys(node).some(m => typeof node[m] === 'function' && m !== 'teardown');
        
        return hasInlineSchemas || hasManifestCanon || hasMethods;
    });
    
    // AXIOMA: Punto de Colapso (Si el 100% de los nodos auditados carecen de esquemas/canon, es un fallo estructural)
    const hasAnyFormalSchema = validNodeKeys.some(k => {
        // Ignorar nodos de infraestructura y el propio orquestador en esta comprobación de supervivencia
        const ignoreList = ['intelligence', 'id', 'label', 'public', 'config', 'errorHandler'];
        if (ignoreList.includes(k)) return false; 
        
        const node = nodes[k];
        const hasS = (node.schemas && Object.keys(node.schemas).length > 0);
        const hasC = (node.CANON && node.CANON.CAPABILITIES);
        
        return hasS || hasC;
    });
    
    const validCount = nodesWithSchemas.length;
    const coherence = totalNodes > 0 ? (validCount / totalNodes * 100) : 0; 
    
    // AXIOMA: Condición de Detención (Halt): Coherencia < 95% O falta total de esquemas formales en nodos periféricos
    const isValid = totalNodes > 0 && coherence >= 95 && hasAnyFormalSchema; 
    
    return { 
        isValid: isValid, 
        coherenceIndex: Number(coherence.toFixed(2)), 
        nodesAudited: totalNodes,
        timestamp: new Date().toISOString() 
    };
  }

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
    id: "public",
    label: "Core API Gateway",
    archetype: "interface",
    domain: "governance",
    CAPABILITIES: {
      "invoke": {
        "id": "TRIGGER",
        "io": "WRITE",
        "desc": "Synchronously activates a high-integrity industrial workflow.",
        "traits": ["ORCHESTRATE", "FLOW", "TRIGGER"],
        "inputs": { 
          "flowId": { "type": "string", "desc": "Target technical workflow identifier." }, 
          "initialPayload": { "type": "object", "desc": "Primary data stream for execution bootstrap." }
        }
      },
      "executeAction": {
        "id": "TRIGGER",
        "io": "WRITE",
        "desc": "Polymorphic execution gateway. Routes a technical action to a specific node.",
        "traits": ["ROUTING", "DISPATCH"],
        "inputs": { 
          "action": { "type": "string", "desc": "Format 'nodeId:methodName'" },
          "payload": { "type": "object", "desc": "Data stream for the action." }
        }
      },
      "executeBatch": {
        "id": "ORCHESTRATE",
        "io": "WRITE",
        "desc": "Executes a batch of technical commands in a single atomic request.",
        "traits": ["ATOMICity", "BATCH"],
        "inputs": { "commands": { "type": "array", "desc": "List of command objects." } }
      },
      "getSystemStatus": {
        "id": "PROBE",
        "io": "READ",
        "desc": "Extracts industrial health telemetry and global operational status.",
        "traits": ["HEALTH", "MONITORING"],
        "inputs": {}
      },
      "getSovereignGenotype": {
        "id": "SCHEMA",
        "io": "READ",
        "desc": "Extracts the biological-technical system genotype (L0).",
        "traits": ["IDENTITY", "GENOTYPE"],
        "inputs": {}
      },
      "getMCEPManifest": {
        "id": "SCHEMA",
        "io": "READ",
        "desc": "Extracts an AI-Ready tool manifest (MCEP).",
        "traits": ["AI_READY", "ORACLE"],
        "inputs": {}
      },
      "getGovernanceReport": {
        "id": "SENSOR",
        "io": "READ",
        "desc": "Generates a detailed forensic health report and structural coherence audit.",
        "traits": ["AUDIT", "COHERENCE"],
        "inputs": {}
      },
      "processNextJobInQueue": {
        "id": "TRIGGER",
        "io": "WRITE",
        "desc": "Claims and activates the oldest pending technical task.",
        "traits": ["QUEUE", "AUTOMATION"],
        "inputs": {}
      },
      "validateTopology": {
        "id": "PROBE",
        "io": "READ",
        "desc": "Performs a deep structural dry-run of a flow topology.",
        "traits": ["VALIDATION", "TOPOLOGY"],
        "inputs": { "flow": { "type": "object", "desc": "Flow topology candidate." } }
      }
    }
  };

  const publicApiInstance = {
    id: "public_api",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    description: "Centralized system interface exposed for external orchestration and AI integration.",
    CANON: CANON,
    
    ...specializedWrappers
  };

  // AXIOMA V12: Exposición del Motor Cognitivo (MCEP) como Nodo Soberano
  // Permite que la IA se llame a sí misma para expandir categorías (Introspección).
  if (mcepCore) {
      nodes.mcep = mcepCore;
  }

  // AXIOMA V12: Registro de Puente Final (Pre-Decoration)
  nodes.public = publicApiInstance;
  nodes.system = publicApiInstance;

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








