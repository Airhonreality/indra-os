// ======================================================================
// ARTEFACTO: 6_Tests/MockFactory.gs
// PROPÓSITO: Fábrica centralizada de Mocks e Inyectores de Simulación.
// ======================================================================

/**
 * Genera un mock profesional para el JobQueueService.
 * Soporta "Estado de Memoria" para que el API pueda reclamar lo que el test inyecta.
 */
function createMockJobQueue(predefinedJobs = []) {
  var jobsMap = {};
  predefinedJobs.forEach(function(j) { jobsMap[j.jobId] = j; });

  var mock = {
    enqueue: function(payload) {
      var id = 'mock-' + Math.random().toString(36).substr(2, 9);
      jobsMap[id] = { jobId: id, status: 'pending', initialPayload: payload };
      return { jobId: id };
    },
    claimSpecificJob: function(jobId) {
      console.log("[MOCK-FACTORY] claimSpecificJob requested: " + jobId);
      var job = jobsMap[jobId];
      if (job && job.status === 'pending') {
         job.status = 'processing';
         return job;
      }
      return null;
    },
    updateJobStatus: function(jobId, status, details) {
      console.log("[MOCK-FACTORY] updateJobStatus: " + jobId + " -> " + status);
      if (jobsMap[jobId]) {
        jobsMap[jobId].status = status;
        jobsMap[jobId].details = details;
        return true;
      }
      return false;
    },
    getJob: function(jobId) { return jobsMap[jobId]; },
    // AXIOMATIC IDENTITY
    label: "Mock Job Queue",
    description: "Stateful in-memory job queue for unit testing.",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    semantic_intent: "QUEUE",
    id: "MOCK_JOB_QUEUE",
    schemas: {
      enqueue: {
        description: "Enqueues a job",
        io: { inputs: { payload: { type: "object", label: "Payload" } } }
      }
    }
  };
  return mock;
}

/**
 * Genera un mock para DriveAdapter que simula archivos en memoria.
 */
function createMockDriveAdapter(initialFiles = []) {
  var filesMap = {};
  initialFiles.forEach(function(f) { 
    var file = typeof f === 'string' ? { name: f, id: 'mock-' + f, content: '' } : f;
    filesMap[file.id || file.name] = file; 
  });

  // HERENCIA AXIOMÁTICA: Extraemos la verdad del componente real si existe
  var realComponent = typeof DriveAdapter !== 'undefined' ? DriveAdapter() : null;
  var canon = (realComponent && realComponent.CANON) ? realComponent.CANON : {
    LABEL: "Storage Engine (SIM)",
    ARCHETYPE: "VAULT",
    DOMAIN: "SYSTEM_INFRA",
    SEMANTIC_INTENT: "BRIDGE"
  };

  var mock = {
    CANON: canon, // El mock ahora porta el contrato REAL del sistema
    id: "MOCK_DRIVE_ADAPTER",
    store: function(payload) {
      console.log("[MOCK-FACTORY] Drive store: " + payload.fileName);
      var id = payload.fileId || 'mock-id-' + payload.fileName;
      var file = { id: id, name: payload.fileName, content: payload.content, lastUpdated: new Date().toISOString() };
      filesMap[file.id] = file;
      filesMap[file.name] = file;
      return file;
    },
    retrieve: function(params) {
      var file = filesMap[params.fileName] || filesMap[params.id] || filesMap[params.fileId];
      if (file && params.type === 'json' && typeof file.content === 'string') {
          try { return { ...file, content: JSON.parse(file.content) }; } catch(e) {}
      }
      return file || null;
    },
    find: function(params) {
      console.log("[MOCK-FACTORY] Drive find: " + params.query);
      var results = [];
      for (var k in filesMap) { 
          if (params.query.indexOf("'"+filesMap[k].id+"' in parents") !== -1 || params.query.indexOf('ROOT') !== -1) {
              results.push(filesMap[k]); 
          }
      }
      return { foundItems: results, artifacts: results };
    },
    resolvePath: function(params) {
        console.log("[MOCK-FACTORY] resolvePath: " + params.path);
        return { folderId: 'mock-folder-id-' + params.path, name: params.path };
    },
    deleteItem: function() { return { success: true }; },
    // AXIOMATIC IDENTITY (Indra v8.0)
    label: canon.LABEL,
    archetype: canon.ARCHETYPE,
    domain: canon.DOMAIN,
    semantic_intent: canon.SEMANTIC_INTENT,
    schemas: canon.DATA_CONTRACT || {
      retrieve: {
        description: "Retrieves a file or folder metadata.",
        semantic_intent: "READ",
        io_interface: { inputs: { fileId: { type: "string", role: "resource", label: "File ID" } } }
      },
      store: {
        description: "Stores a file",
        semantic_intent: "WRITE",
        io_interface: { inputs: { fileName: { type: "string", label: "File Name" } } }
      }
    }
  };
  return mock;
}

/**
 * Helper para ensamblar un stack de test completo usando el inyector del Assembler.
 */
function assembleGenericTestStack(overrides = {}) {
  // Aseguramos mocks mínimos si no vienen en overrides
  var defaultMonitoring = { 
    logDebug: function(m){ console.log("[TEST-DEBUG] " + m); },
    logInfo: function(m){ console.log("[TEST-INFO] " + m); },
    logWarn: function(m){ console.log("[TEST-WARN] " + m); },
    logError: function(m, e){ console.error("[TEST-ERROR] " + m + (e ? ": " + e : "")); },
    logEvent: function(){},
    sendCriticalAlert: function(){},
    label: "Mock Monitor",
    description: "Silent monitoring service for tests.",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    semantic_intent: "MONITOR",
    id: "MOCK_MONITORING_SERVICE",
    schemas: {
        healthCheck: {
             description: "Sonda dummy para linter",
             semantic_intent: "PROBE",
             io_interface: { inputs:{}, outputs:{} }
        }
    }
  };

  var defaultTokenManager = {
    getToken: function(params) { 
        // AXIOMA: Sincronización de Contrato con Real
        const accountId = params.accountId;
        const isDefault = !accountId || (typeof accountId === 'string' && accountId.toUpperCase() === 'DEFAULT');
        
        // Soporte genérico y específico para Notion
        if (params && params.provider === 'notion') {
          return { apiKey: 'mock-notion-key', accountId: isDefault ? 'PRIMARY' : accountId, isDefault: isDefault };
        }
        return { apiKey: 'mock-token', accountId: isDefault ? 'PRIMARY' : accountId, isDefault: isDefault }; 
    },
    listAccounts: function() { return []; },
    label: "Mock Token Manager",
    description: "Isolated token provider.",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    semantic_intent: "AUTH",
    id: "MOCK_TOKEN_MANAGER",
    schemas: {
        validateToken: {
             description: "Operacion dummy para validacion de contratos",
             semantic_intent: "GATE",
             io_interface: { inputs:{}, outputs:{} }
        }
    }
  };
  
  var finalOverrides = {};
  finalOverrides.monitoringService = overrides.monitoringService || defaultMonitoring;
  finalOverrides.tokenManager = overrides.tokenManager || defaultTokenManager;
  
  // Mix in other overrides
  for (var k in overrides) {
    if (k !== 'monitoringService' && k !== 'tokenManager') {
      finalOverrides[k] = overrides[k];
    }
  }

  // AXIOMATIC MOCK CONSTITUTION (Sovereign Mock)
  // Fixes: CoreOrchestrator LIMITS, FlowRegistry ANCHOR, JobQueue SCHEMA
  if (!finalOverrides.laws) {
    finalOverrides.laws = {
      manifest: {
        id: "MOCK_MANIFEST",
        label: "System Manifest",
        archetype: "SERVICE",
        domain: "SYSTEM_INFRA",
        semantic_intent: "CONFIG",
        verifyConnection: function() { return { status: "ACTIVE" }; }
      },
      constitution: {
        LIMITS: { MAX_EXECUTION_TIME: 300, MAX_FLOW_DEPTH: 10 },
        ANCHOR_PROPERTY: 'INDRA_CORE_ROOT',
        SHEETS_SCHEMA: {
          JOB_QUEUE: { headers: ['jobId', 'status'], PROPERTY: 'INDRA_JOB_QUEUE_ID', HEADER: ['jobId', 'status'] },
          AUDIT_LOG: { headers: ['timestamp', 'level'], PROPERTY: 'INDRA_AUDIT_LOG_ID', HEADER: ['timestamp', 'level', 'event'] }
        },
        DRIVE_SCHEMA: {
          ROOT: { name: 'INDRA_CORE_ROOT', id: 'mock-root-id' },
          FLOWS: { PATH: 'mock-flows-path', NAME: 'FLOWS' },
          JSON_FLOWS_FOLDER: { PATH: 'mock-flows-path', NAME: 'FLOWS' } // Alias for compatibility
        },
        COMPONENT_REGISTRY: {
            FRAMEWORK: { LABEL: "Indra Framework", ROLE: "FRAMEWORK", DOMAIN: "CORE" },
            DRIVE: { LABEL: "Storage Engine (SIM)", ROLE: "VAULT", DOMAIN: "SYSTEM_INFRA" },
            SHEET: { LABEL: "Data Ledger (SIM)", ROLE: "ADAPTER", DOMAIN: "SYSTEM_INFRA" },
            CONFIG: { LABEL: "System Parameters (SIM)", ROLE: "SERVICE", DOMAIN: "SYSTEM_INFRA" },
            MONITORING: { LABEL: "Monitoring Service", ROLE: "SERVICE", DOMAIN: "SYSTEM_INFRA" },
            MATH: { LABEL: "Math Service", ROLE: "SERVICE", DOMAIN: "SYSTEM_INFRA" },
            TEXT: { LABEL: "Text Service", ROLE: "SERVICE", DOMAIN: "SYSTEM_INFRA" },
            DATE: { LABEL: "Date Service", ROLE: "SERVICE", DOMAIN: "SYSTEM_INFRA" },
            COLLECTION: { LABEL: "Collection Service", ROLE: "SERVICE", DOMAIN: "SYSTEM_INFRA" },
            FLOW: { LABEL: "Flow Control", ROLE: "SERVICE", DOMAIN: "LOGIC" },
            INTELLIGENCE: { LABEL: "Intelligence Orchestrator", ROLE: "ORCHESTRATOR", DOMAIN: "INTELLIGENCE" },
            PUBLIC: { LABEL: "Public API", ROLE: "INTERFACE", DOMAIN: "GOVERNANCE" },
            CORE_ORCHESTRATOR: { LABEL: "Core Orchestrator", ROLE: "ORCHESTRATOR", DOMAIN: "CORE_LOGIC" },
            JOB_QUEUE: { LABEL: "Job Queue", ROLE: "SERVICE", DOMAIN: "SYSTEM_INFRA" },
            MANIFEST: { LABEL: "System Manifest", ROLE: "SERVICE", DOMAIN: "SYSTEM_INFRA", semantic_intent: "CONFIG" }
        }
      },
      axioms: { CORE_LOGIC: {} }, 
      visual: {},
      spatial: {},
      topology: {
          COSMOS: {
              LAYERS: ['L0','L1','L2','L3','L4','L5']
          }
      },
      blueprints: {}
    };
    
    // Inject Identity into laws container itself
    finalOverrides.laws.id = "MOCK_LAWS";
    finalOverrides.laws.label = "Sovereign Laws";
    finalOverrides.laws.archetype = "CONSTITUTION";
    finalOverrides.laws.domain = "LEGAL";
    finalOverrides.laws.semantic_intent = "GOVERNANCE";
    finalOverrides.laws.verifyConnection = function() { return { status: "ACTIVE" }; };
  }

  // Inject Identity into Internal Components usually created by Assembler
  if (!finalOverrides.flowCompiler) {
      finalOverrides.flowCompiler = {
          compile: function(g) { return []; },
          id: "MOCK_FLOW_COMPILER", label: "Flow Compiler", archetype: "COMPILER", domain: "LOGIC", semantic_intent: "TRANSFORM", schemas: {}
      };
  }
  if (!finalOverrides.blueprintRegistry) {
      finalOverrides.blueprintRegistry = {
          register: function(){}, get: function(){}, getAll: function(){ return {}; },
          validatePayload: function() { return { isValid: true, errors: [] }; },
          validate: function() { return { isValid: true, errors: [] }; },
          canonize: function() { return { isValid: true, type: 'COSMOS' }; },
          id: "MOCK_BLUEPRINT_REGISTRY", label: "Blueprint Registry", archetype: "REGISTRY", domain: "SYSTEM_INFRA", semantic_intent: "STORE", schemas: {},
          ARTIFACT_SCHEMAS: {}
      };
  }

  
  /**
   * REFLEXIÓN GENÉTICA: Cosecha la identidad real de un artefacto en tiempo de ejecución.
   * Esto garantiza que los mocks NUNCA se desincronicen del contrato real.
   */
  function _harvestRealIdentity(fnName, fallback) {
    try {
      if (typeof this[fnName] === 'function') {
        const componentInstance = this[fnName]();
        // Solo aceptamos el canon si es un objeto con la estructura mínima de Indra
        if (componentInstance && componentInstance.CANON && componentInstance.CANON.ARCHETYPE) {
           return componentInstance.CANON;
        }
      }
    } catch(e) {
      // En entorno de test, este console.log ayuda a debuggear desincronías
      console.warn(`[MOCK-FACTORY] Using fallback for ${fnName}: Component not ready for reflection.`);
    }
    return fallback;
  }

  // --- AUTOMATED MOCK POPULATION (Genetic Mirror) ---
  const MOCK_MAP = {
      googleDriveRestAdapter: { label: "Drive REST API", archetype: "VAULT", intent: "BRIDGE" },
      googleDocsAdapter: { label: "Docs Editor", archetype: "ADAPTER", intent: "EDITOR" },
      googleSlidesAdapter: { label: "Slides Presenter", archetype: "ADAPTER", intent: "EDITOR" },
      googleFormsAdapter: { label: "Forms Generator", archetype: "ADAPTER", intent: "EDITOR" },
      calendarAdapter: { label: "Temporal Nexus", archetype: "ADAPTER", intent: "SCHEDULING" },
      notionAdapter: { label: "Notion Vault", archetype: "VAULT", intent: "BRIDGE" },
      llm: { label: "Cognitive Oracle", archetype: "ADAPTER", intent: "ORACLE" }
  };

  const STANDARD_MOCKS = {};
  Object.keys(MOCK_MAP).forEach(key => {
      const def = MOCK_MAP[key];
      const realCanon = _harvestRealIdentity(key, {
          LABEL: def.label + " (SIM)",
          ARCHETYPE: def.archetype,
          DOMAIN: "SYSTEM_INFRA",
          SEMANTIC_INTENT: def.intent
      });

      STANDARD_MOCKS[key] = {
          id: "MOCK_" + key.toUpperCase(),
          ...realCanon, // Propiedades directas (Legacy)
          CANON: realCanon, // Propiedad canonica (V8.0 SystemAssembler Compliance)
          verifyConnection: function() { return { status: "ACTIVE" }; },
          schemas: realCanon.DATA_CONTRACT || {
              dummy: { description: "Simulation probe", io_interface: { inputs: {}, outputs: {} } }
          }
      };
  });

  Object.keys(STANDARD_MOCKS).forEach(key => {
      if (!finalOverrides[key]) finalOverrides[key] = STANDARD_MOCKS[key];
  });

  console.log("[MOCK-FACTORY] finalOverrides keys: " + Object.keys(finalOverrides).join(', '));
  return _assembleExecutionStack(finalOverrides);
}





