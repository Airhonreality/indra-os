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
    archetype: "SYSTEM_INFRA",
    schemas: {}
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

  var mock = {
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
      return { foundItems: results };
    },
    resolvePath: function(params) {
        console.log("[MOCK-FACTORY] resolvePath: " + params.path);
        return { folderId: 'mock-folder-id-' + params.path, name: params.path };
    },
    deleteItem: function() { return { success: true }; },
    // AXIOMATIC IDENTITY
    label: "Mock Drive Adapter",
    description: "Stateful virtual file system for node isolation.",
    semantic_intent: "BRIDGE",
    archetype: "ADAPTER",
    schemas: {
      retrieve: {
        description: "Retrieves a file or folder metadata.",
        io: { inputs: { fileId: { type: "string", role: "resource" } } }
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
    archetype: "SYSTEM_INFRA",
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
        // Soporte genérico y específico para Notion
        if (params && params.provider === 'notion') return { apiKey: 'mock-notion-key' };
        return { apiKey: 'mock-token' }; 
    },
    listAccounts: function() { return []; },
    label: "Mock Token Manager",
    description: "Isolated token provider.",
    archetype: "SYSTEM_INFRA",
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

  console.log("[MOCK-FACTORY] finalOverrides keys: " + Object.keys(finalOverrides).join(', '));
  return _assembleExecutionStack(finalOverrides);
}
