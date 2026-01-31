// ======================================================================
// ARTEFACTO: 1_Core/PublicAPI.gs (REFACTORIZADO PARA AGNOSTICISMO V7.0)
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
  gatekeeper,        
  schemaRegistry,    
  semanticBridge,     
  tokenManager,     
  indra,
  flowCompiler,
  mcepService
}) {
  
  const schemas = {
    invoke: {
      description: "Synchronously activates a high-integrity industrial workflow, coordinating technical node triggers and state orchestration.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: { 
          flowId: { type: "string", io_behavior: "SCHEMA", description: "Target technical workflow identifier (blueprint key)." }, 
          initialPayload: { type: "object", io_behavior: "STREAM", description: "Primary data stream for execution bootstrap." },
          systemContext: { type: "object", io_behavior: "GATE", description: "Operational circuit parameters." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        },
        outputs: {
          result: { type: "object", io_behavior: "STREAM", description: "Resulting state stream from the workflow circuit product." }
        }
      }
    },
    getSystemStatus: {
      description: "Extracts industrial health telemetry and global operational status of the Core circuit.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for status discovery." }
        },
        outputs: { 
          status: { type: "string", io_behavior: "PROBE", description: "Global circuit health status." }, 
          coherenceIndex: { type: "string", io_behavior: "PROBE", description: "Semantic integrity and structural health metric." } 
        } 
      }
    },
    getSovereignLaws: {
      description: "Extracts the fragmented institutional law dictionary (CORE_LOGIC/VISUAL_GRAMMAR/SPATIAL_ENGINE) for structural reasoning.",
      semantic_intent: "SCHEMA",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for law extraction." }
        },
        outputs: { laws: { type: "object", io_behavior: "SCHEMA", description: "Canonical law dictionary object." } } 
      }
    },
    getSystemContracts: {
      description: "Exports a comprehensive technical directory of audited system capabilities and their interfaces.",
      semantic_intent: "SCHEMA",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for contract discovery." }
        },
        outputs: { contracts: { type: "object", io_behavior: "SCHEMA", description: "Audited capability dictionary stream." } } 
      }
    },
    processNextJobInQueue: {
      description: "Claims and activates the oldest pending technical task from the industrial queue circuit.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for queue processing." }
        },
        outputs: { result: { type: "object", io_behavior: "PROBE", description: "Execution status of the processed task." } } 
      }
    },
    processSpecificJob: {
      description: "Directly activates a targeted technical task by its unique industrial identifier.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: { 
          jobId: { type: "string", io_behavior: "GATE", description: "Target task industrial identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: { result: { type: "object", io_behavior: "PROBE", description: "Execution result stream." } } 
      }
    },
    getGovernanceReport: {
      description: "Generates a detailed forensic health report and structural coherence audit.",
      semantic_intent: "SENSOR",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for report generation." }
        },
        outputs: { report: { type: "object", io_behavior: "PROBE", description: "Diagnostic structural health data stream." } } 
      }
    },
    getSemanticAffinity: {
      description: "Benchmarks external linguistic streams against institutional semantic laws to identify affinity metrics.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: { 
          phrase: { type: "string", io_behavior: "STREAM", description: "Linguistic input stream to evaluate." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: { affinity: { type: "object", io_behavior: "PROBE", description: "Resulting affinity metric stream." } } 
      }
    },
    getSystemDiscovery: {
      description: "Extracts the industrial node graph for technical navigation and topology discovery.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for discovery." }
        },
        outputs: { discovery: { type: "object", io_behavior: "SCHEMA", description: "Topology discovery graph product." } } 
      }
    },
    getNodeContract: {
      description: "Extracts the full technical interface (industrial IO contract) for a specific node on demand.",
      semantic_intent: "SCHEMA",
      io_interface: { 
        inputs: { 
          nodeId: { type: "string", io_behavior: "GATE", description: "Target node industrial identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: { contract: { type: "object", io_behavior: "SCHEMA", description: "Full IO technical interface specification." } } 
      }
    },
    getMCEPManifest: {
      description: "Extracts an AI-Ready tool manifest (MCEP) filtered by semantic integrity debt (<10%).",
      semantic_intent: "SCHEMA",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for manifest isolation." }
        }, 
        outputs: { manifest: { type: "object", io_behavior: "SCHEMA", description: "Validated IA-READY tool directory." } } 
      }
    },
    getDistributionSite: {
      description: "Extracts the UI distribution and perspective architecture for Shell manifestation.",
      semantic_intent: "SCHEMA",
      io_interface: {
        inputs: {},
        outputs: { site: { type: "object", io_behavior: "SCHEMA", description: "UI manifestation site object." } }
      }
    },
    validateTopology: {
      description: "Performs a deep structural dry-run of a flow topology, verifying morphisms (L5+) and topological sanity.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          flow: { type: "object", io_behavior: "SCHEMA", description: "Flow topology candidate (nodes/connections)." }
        },
        outputs: {
          isValid: { type: "boolean", io_behavior: "PROBE", description: "True if topology is structurally sound." },
          steps: { type: "array", io_behavior: "SCHEMA", description: "The resulting execution sequence if valid." },
          error: { type: "string", io_behavior: "PROBE", description: "Error message if validation fails." }
        }
      }
    }
  };

  nodes.public = {
    label: "Core API Gateway",
    description: "Technical entry point for orchestration, system discovery, and structural governance.",
    semantic_intent: "GATE",
    schemas: schemas,
    invoke,
    getDistributionSite: () => specializedWrappers.getDistributionSite(),
    getSystemStatus: () => specializedWrappers.getSystemStatus(),
    getSovereignLaws: () => specializedWrappers.getSovereignLaws(),
    getSystemContracts: () => specializedWrappers.getSystemContracts(),
    getSystemDiscovery: () => specializedWrappers.getSystemDiscovery(),
    getNodeContract: (args) => specializedWrappers.getNodeContract(args),
    getGovernanceReport: () => specializedWrappers.getGovernanceReport(),
    getSemanticAffinity: (args) => specializedWrappers.getSemanticAffinity(args),
    processNextJobInQueue: () => specializedWrappers.processNextJobInQueue(),
    processSpecificJob: (args) => specializedWrappers.processSpecificJob(args),
    getMCEPManifest: (args) => specializedWrappers.getMCEPManifest(args),
    getMCEPManifest: (args) => specializedWrappers.getMCEPManifest(args),
    validateTopology: (args) => specializedWrappers.validateTopology(args),
    saveSnapshot: (payload) => specializedWrappers.saveSnapshot(payload) // Added for tests
  };

  const _monitor = monitoringService || { logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, logEvent: () => {}, sendCriticalAlert: () => {} };

  function _isWhitelisted(nodeKey, methodName) {
    if (!nodeKey || !methodName) return false;
    const manifest = getMCEPManifest({ accountId: 'system' });
    const toolId = `${nodeKey}_${methodName}`;
    const logic = laws.axioms || {};
    // Explicit whitelist for system-critical streams
    if (toolId === 'sensing_saveSnapshot' || toolId === 'sensing_scanArtifacts') return true; 
    
    const isAuthorized = Array.isArray(manifest.tools)
      ? manifest.tools.some(t => t.node === nodeKey && t.method === methodName)
      : (manifest.tools && manifest.tools[toolId]);

    return !!isAuthorized || (logic.CRITICAL_SYSTEMS && logic.CRITICAL_SYSTEMS.includes(nodeKey));
  }

  function _secureInvoke(nodeKey, methodName, input) {
    const node = nodes[nodeKey];
    if (!node) throw errorHandler.createError("DISCOVERY_ERROR", `Node '${nodeKey}' not found.`);
    const method = node[methodName];
    if (typeof method !== 'function') throw errorHandler.createError("DISCOVERY_ERROR", `Method '${methodName}' not found in '${nodeKey}'.`);

    // AXIOMA v6.0: Whitelist Gate (L4 Security)
    if (!_isWhitelisted(nodeKey, methodName)) {
      throw errorHandler.createError("SECURITY_BLOCK", `Invocation denied: Tool '${nodeKey}_${methodName}' is not in the authorized MCEP whitelist.`);
    }

    const schema = (node.schemas && node.schemas[methodName]) ? node.schemas[methodName] : null;
    const logic = laws.axioms || {};
    const isTier1 = logic.CRITICAL_SYSTEMS && logic.CRITICAL_SYSTEMS.includes(nodeKey);
    
    if (!schema) {
      if (isTier1) throw errorHandler.createError("ARCHITECTURAL_BLOCK", `Method '${methodName}' in Tier 1 '${nodeKey}' has no schema.`);
      return method.call(node, input);
    }

    const ioDef = schema.io_interface || schema.io; // Compatibilidad de transición
    if (ioDef && ioDef.inputs) {
      const v = schemaRegistry.validatePayload(input, ioDef.inputs);
      if (!v.isValid) throw errorHandler.createError("STRUCTURAL_BLOCK", `Inputs fail: ${v.errors.join(', ')}`);
    }

    return method.call(node, input);
  }

  function invoke(input) {
    const { flowId, initialPayload, accountId, cosmosId } = input;
    const systemContext = input.systemContext || _buildSystemContext({ configurator, accountId, cosmosId });
    return _internalInvoke({ flowId, initialPayload, systemContext });
  }

  function _internalInvoke({ flowId, initialPayload, systemContext }) {
    const flow = flowRegistry.getFlow(flowId);
    const payload = initialPayload || {};
    const merged = Object.assign({}, payload, { input: payload.input || payload, system: systemContext });
    try {
      return coreOrchestrator.executeFlow(flow, merged);
    } finally {
      teardown(); // AXIOMA: Homeostasis Obligatoria (TGS)
    }
  }

  function teardown() {
    // Orquestar el cierre de todos los nodos con estado
    Object.keys(nodes).forEach(key => {
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

  function scanArtifacts(input) {
    const folderId = input.folderId === 'ROOT' ? configurator.retrieveParameter({ key: 'ORBITAL_CORE_ROOT_ID' }) : input.folderId;
    return _secureInvoke('sensing', 'scanArtifacts', { folderId });
  }

  function saveSnapshot(input) {
    return _secureInvoke('sensing', 'saveSnapshot', input);
  }

  function getSovereignLaws() {
    // AXIOMA: Soberanía de Datos (DI).
    const constitution = laws.constitution || {};
    const logic = laws.axioms || {};
    const visual = laws.visual || {};
    const spatial = laws.spatial || {};
    const topology = laws.topology || {};
    const blueprints = laws.blueprints || {};
    
    _monitor.logDebug(`[PublicAPI] Distilling Sovereign Laws Layer 0 (Axiomatic DI).`);
    
    return JSON.parse(JSON.stringify({ 
      laws: { 
        CONSTITUTION: constitution,
        CORE_LOGIC: logic.CORE_LOGIC || logic,
        VISUAL_GRAMMAR: visual, 
        SPATIAL_ENGINE: spatial,
        TOPOLOGY: topology,
        BLUEPRINTS: blueprints
      } 
    }));
  }

  function getDistributionSite() {
    const distribution = laws.distribution || { SLOTS: {}, PERSPECTIVES: {}, MANIFESTATIONS: {} };
    return { 
      site: {
        slots: distribution.SLOTS || distribution.slots || {},
        perspectives: distribution.PERSPECTIVES || distribution.perspectives || {},
        manifestations: distribution.MANIFESTATIONS || distribution.manifestations || {}
      } 
    };
  }

  function getSystemStatus() {
    return { 
        status: 'healthy', 
        coherenceIndex: getGovernanceReport().coherenceIndex, 
        version: manifest.version || '1.1.0_PURITY', 
        timestamp: new Date().toISOString(),
        rootFolderId: configurator.retrieveParameter({ key: 'ORBITAL_CORE_ROOT_ID' }),
        deploymentUrl: configurator.retrieveParameter({ key: 'DEPLOYMENT_URL' }) || configurator.retrieveParameter({ key: 'ORBITAL_DEPLOYMENT_URL' }),
        capabilities: { flowExecution: true, sensing: true, spatialPersistence: true, diagnostics: true }
    };
  }
  function getSystemContracts() {
    const dictionary = {};
    const distribution = {};

    Object.keys(nodes).forEach(key => {
        const n = nodes[key];
        if (!n || typeof n !== 'object' || Array.isArray(n)) return;

        // Axioma: Deducción de Arquetipos L7
        const intent = n.semantic_intent || 'STREAM';
        const arch = n.archetype || intent || 'ADAPTER';
        
        distribution[arch] = (distribution[arch] || 0) + 1;

        const methods = Object.keys(n).filter(m => typeof n[m] === 'function' && !m.startsWith('_'));
        dictionary[key] = {
            label: n.label || key,
            description: n.description || '',
            semantic_intent: intent,
            archetype: arch,
            methods: methods,
            schemas: n.schemas || {}
        };
    });

    _monitor.logInfo(`[PublicAPI] Contract distribution: ${JSON.stringify(distribution)}`);
    return JSON.parse(JSON.stringify(dictionary));
  }

  function getSystemDiscovery() {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("SYSTEM_DISCOVERY_V5.5");
    if (cached) return JSON.parse(cached);

    const discovery = {
        system_id: manifest.id || "ORBITAL_CORE_V5.5",
        timestamp: new Date().toISOString(),
        nodes: []
    };

    Object.keys(nodes).forEach(key => {
        const n = nodes[key];
        discovery.nodes.push({
            id: key,
            label: n.label,
            io_behavior: n.semantic_intent || "STREAM"
        });
    });

    cache.put("SYSTEM_DISCOVERY_V5.5", JSON.stringify(discovery), 21600); 
    return discovery;
  }

  function getNodeContract({ nodeId }) {
    const n = nodes[nodeId];
    if (!n) throw new Error(`Node ${nodeId} not found`);
    return {
        id: nodeId,
        label: n.label,
        description: n.description,
        semantic_intent: n.semantic_intent || "STREAM",
        io_interface: n.schemas || {}
    };
  }

  function getMCEPManifest({ accountId }) {
    const cache = CacheService.getScriptCache();
    const cacheKey = `MCEP_MANIFEST_${accountId || 'global'}_v7.0`;
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // AXIOMA: Delegación de Inteligencia (Capa 1)
    const manifest = mcepService.getModelTooling({ accountId });
    
    // Enriquecer con metadatos de versión
    manifest.mcep_version = "7.0.0_SOVEREIGN";
    manifest.timestamp = new Date().toISOString();

    cache.put(cacheKey, JSON.stringify(manifest), 3600);
    return manifest;
  }

  function getSemanticAffinity(args) {
    if (!args.source || !args.target) {
        return { error: "Semantics v12.0 requires structural probe (source/target schemas)." };
    }
    return gatekeeper.getAffinity(args);
  }

  const specializedWrappers = {
    scanArtifacts,
    saveSnapshot,
    getSovereignLaws,
    getDistributionSite,
    getSystemStatus,
    getSystemContracts,
    getSystemDiscovery,
    getNodeContract,
    getMCEPManifest,
    getGovernanceReport,
    getSemanticAffinity,
    validateTopology: ({ flow }) => {
      try {
        if (!flow) throw new Error("Missing flow object.");
        
        const { nodes: flowNodes = {}, connections = [] } = flow;

        // AXIOMA v12.0: Validación de Identidad Estricta en Nodos
        Object.keys(flowNodes).forEach(nodeId => {
          if (!flowNodes[nodeId].id) flowNodes[nodeId].id = nodeId; // Auto-repair for robustness
        });

        const steps = flowCompiler.compile(flow, nodes);
        
        // Verificación final de steps generados
        steps.forEach((step, index) => {
          if (!step.id) {
            throw new Error(`[Structural Integrity] Generated Step ${index + 1} (${step.adapter}.${step.method}) missing mandatory 'id'.`);
          }
        });

        return { isValid: true, steps: steps };
      } catch (e) {
        return { isValid: false, error: e.message };
      }
    },
    processNextJobInQueue: () => {
        const job = jobQueueService.claimNextJob();
        if (job) {
            return processSpecificJob(job);
        }
        return { processed: false, reason: "No pending jobs" };
    },
    processSpecificJob: ({ jobId }) => {
        const job = jobQueueService.claimSpecificJob(jobId);
        if (job) {
            return processSpecificJob(job);
        }
        return { processed: false, error: "Job not found or not pending" };
    }
  };
  
  function processSpecificJob(job) {
    // Lógica core de procesamiento de jobs
    try {
        _monitor.logInfo(`[PublicAPI] Procesando Job ${job.jobId} (${job.flowId})`); // job.id -> job.jobId segun adapter
        
        let result;
        if (job.flowId) { // Payload ya deserializado en jobQueueService
             const ctx = job.initialPayload?.systemContext || {};
             ctx.jobId = job.jobId;
             
             try {
                 // Ejecución via CoreOrchestrator
                 const flow = flowRegistry.getFlow(job.flowId);
                 if (!flow) throw new Error(`Flow ${job.flowId} not found`);
                 
                 const executionResult = coreOrchestrator.executeFlow(flow, job.initialPayload || {}, ctx);
                 result = executionResult;
                 
                 // Actualizar status a completed
                 jobQueueService.updateJobStatus(job.jobId, 'completed', { result });
                 
             } catch (execError) {
                 // Fallo en ejecución
                 jobQueueService.updateJobStatus(job.jobId, 'failed', { error: execError.message });
                 throw execError; // Relanzar para que PublicAPI reporte
             }
        } else {
            throw new Error(`Job ${job.jobId} no tiene flowId válido.`);
        }
        
        return { processed: true, jobId: job.jobId, status: 'completed', output: result };
        
    } catch (e) {
        _monitor.logError(`[PublicAPI] Fallo al procesar Job ${job.jobId}: ${e.message}`);
        return { processed: false, jobId: job.jobId, status: 'failed', error: e.message };
    }
  }

  function getGovernanceReport() {
    // Cálculo directo de coherencia desde nodes (sin dependencia de _gatekeeper)
    const totalNodes = Object.keys(nodes).length;
    const nodesWithSchemas = Object.keys(nodes).filter(key => {
      const node = nodes[key];
      return node && node.schemas && typeof node.schemas === 'object' && Object.keys(node.schemas).length > 0;
    });
    
    const validNodesCount = nodesWithSchemas.length;
    const coherence = totalNodes > 0 ? (validNodesCount / totalNodes * 100) : 0;
    const isValid = coherence >= 90; // Umbral: 90% de nodos con schemas válidos
    
    return { 
        isValid: isValid, 
        coherenceIndex: coherence.toFixed(2), 
        nodesAudited: totalNodes,
        timestamp: new Date().toISOString() 
    };
  }

  const publicApiInstance = {
    label: "Core Public System",
    description: "Centralized system interface exposed for external orchestration and AI integration.",
    archetype: "SYSTEM_INFRA",
    schemas: schemas,
    invoke,
    teardown,
    ...specializedWrappers
  };

  const adaptadoresAExponer = ['sensing', 'tokenManager', 'config', 'spatial', 'intelligence', 'llm'];
  adaptadoresAExponer.forEach(nodeKey => {
    const node = nodes[nodeKey];
    if (node && node.schemas) {
      Object.assign(schemas, node.schemas);
      for (const m in node.schemas) if (!publicApiInstance[m]) publicApiInstance[m] = (input) => {
        const { accountId, cosmosId } = input || {};
        const ctx = (input && input.systemContext) || _buildSystemContext({ configurator, accountId, cosmosId });
        return _secureInvoke(nodeKey, m, { ...input, systemContext: ctx });
      };
    }
  });

  const auditReport = gatekeeper.validateAllContracts({ ...nodes, public: publicApiInstance }, configurator);
  if (!auditReport.isValid) {
    const allViolations = [...(auditReport.criticalErrors || []), ...(auditReport.errors || [])];
    const formattedErrors = allViolations.map((err, idx) => `${idx + 1}. ${err}`).join('\n');
    _monitor.logError(`🛑 [ARCHITECTURAL_HALT] Total Violations: ${allViolations.length}\n${formattedErrors}`);
    throw new Error(`🛑 [ARCHITECTURAL_HALT] Purity Assertion Failed.\n\nDETALLE DE VIOLACIONES:\n${formattedErrors}`);
  }

  return Object.freeze(publicApiInstance);
}

