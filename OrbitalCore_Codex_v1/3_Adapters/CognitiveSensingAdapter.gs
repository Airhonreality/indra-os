// ======================================================================
// ARTEFACTO: 3_Adapters/CognitiveSensingAdapter.gs
// DHARMA: Lente Cognitivo y Guardián de Persistencia Robusta.
//         Implementa Sensing, Validación y Shadow Versioning de forma agnóstica.
// ======================================================================

function createCognitiveSensingAdapter({ driveAdapter, configurator, errorHandler, schemaRegistry, monitoringService, gatekeeper }) {
  
  if (!driveAdapter) throw new Error('CognitiveSensingAdapter: driveAdapter dependency is required');
  if (!schemaRegistry) throw new Error('CognitiveSensingAdapter: schemaRegistry dependency is required');
  if (!errorHandler) throw new Error('CognitiveSensingAdapter: errorHandler dependency is required');
  if (!configurator) throw new Error('CognitiveSensingAdapter: configurator dependency is required');

  // AXIOMA: Resiliencia de Infraestructura (H7-RESILIENCE)
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, 
    logEvent: () => {}, sendCriticalAlert: () => {} 
  };

  function find(payload) {
    return driveAdapter.find(payload);
  }

  function discoverSeed(input) {
    const { rootName = 'ORBITAL_ROOT' } = input || {};
    try {
      const results = driveAdapter.find({ query: `name = '${rootName}' and mimeType = 'application/vnd.google-apps.folder'` });
      if (results.foundItems && results.foundItems.length > 0) {
        return { folderId: results.foundItems[0].id, name: rootName, discovered: true };
      }
      return { folderId: null, discovered: false };
    } catch (e) {
      throw errorHandler.createError('ADAPTER_ERROR', `Seed discovery failed: ${e.message}`);
    }
  }

  function initializeSeed(input) {
    const { rootName = 'ORBITAL_ROOT' } = input || {};
    try {
      const result = driveAdapter.resolvePath({ 
        rootFolderId: 'root', 
        path: rootName, 
        createIfNotExists: true 
      });
      return { folderId: result.folderId, name: rootName, status: 'initialized' };
    } catch (e) {
      throw errorHandler.createError('ADAPTER_ERROR', `Seed initialization failed: ${e.message}`);
    }
  }

  function scanArtifacts(input) {
    const payload = (typeof input === 'object' && input !== null) ? input : { folderId: input };
    const { folderId, deepSearch = false } = payload;
  
    if (!folderId || typeof folderId !== 'string' || folderId.trim() === '') {
      throw errorHandler.createError('VALIDATION_ERROR', 'folderId is required and must be non-empty');
    }

    try {
      const findResult = driveAdapter.find({ query: `'${folderId}' in parents and trashed = false` });
      const items = findResult.foundItems || [];

      return items.map(item => {
        let category = 'asset';
        let type = 'unknown';

        if (item.mimeType === 'application/vnd.google-apps.folder') {
          category = 'workspace';
          type = 'container';
        } else {
          const ext = item.name.split('.').pop().toLowerCase();
          const taxonomy = _getTaxonomyByExt(ext, item.name);
          category = taxonomy.category;
          type = taxonomy.type;

          if (deepSearch && category === 'asset' && ext === 'json') {
            const sense = _deepSense(item.id, driveAdapter);
            category = sense.category;
            type = sense.type;
          }
        }

        return {
          id: item.id,
          name: item.name,
          canonicalCategory: category,
          canonicalType: type,
          lastUpdated: item.lastUpdated
        };
      });
    } catch (e) {
      throw errorHandler.createError('ADAPTER_ERROR', `Sensing scan failed: ${e.message}`, { folderId });
    }
  }

  function reconcileSpatialState(payload) {
    const { folderId, nodes } = payload || {};
    if (!folderId || !nodes) throw errorHandler.createError('VALIDATION_ERROR', 'folderId and nodes required');

    try {
      const fileName = '.spatial_shadow.json';
      const content = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
      };

      return driveAdapter.store({
          folderId: folderId,
          fileName: fileName,
          content: JSON.stringify(content, null, 2),
          mimeType: 'application/json'
      });
    } catch (e) {
      throw errorHandler.createError('PERSISTENCE_ERROR', `Spatial reconciliation failed: ${e.message}`);
    }
  }

  function getSpatialState(payload) {
    const { folderId } = payload || {};
    if (!folderId) throw errorHandler.createError('VALIDATION_ERROR', 'folderId is required');

    try {
      const fileName = '.spatial_shadow.json';
      const result = driveAdapter.retrieve({ folderId: folderId, fileName: fileName, type: 'json' });
      return result.content || { nodes: [] };
    } catch (e) {
      return { nodes: [] };
    }
  }

  function saveSnapshot(input) {
    const payload = (input && input.payload) ? input.payload : input;
    const { fileId, folderId, fileName, content, type } = payload;

    if (!type) {
      throw errorHandler.createError('VALIDATION_ERROR', 'artifact type is required for saving');
    }

    const validation = schemaRegistry.validate(content, type);
    if (!validation.isValid) {
      throw errorHandler.createError('INTEGRITY_ERROR', `Artifact validation failed for type ${type}`, { errors: validation.errors });
    }

    try {
      if (fileId) {
        _createShadowSnapshot(fileId, driveAdapter);
      }

      return driveAdapter.store({
        fileId: fileId,
        folderId: folderId,
        fileName: fileName,
        content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
        mimeType: 'application/json'
      });
    } catch (e) {
      throw errorHandler.createError('PERSISTENCE_ERROR', `Robust save failed: ${e.message}`);
    }
  }

  function compareSnapshots(input) {
    const { id1, id2 } = (typeof input === 'object' && input !== null) ? input : {};

    if (!id1 || !id2) {
      throw errorHandler.createError('VALIDATION_ERROR', 'id1 and id2 (Snapshot IDs) are required for comparison');
    }

    try {
      const snap1 = driveAdapter.retrieve({ fileId: id1, type: 'json' });
      const snap2 = driveAdapter.retrieve({ fileId: id2, type: 'json' });

      const data1 = snap1.content;
      const data2 = snap2.content;

      const configDiff = _deepDiff(data1.configuration || {}, data2.configuration || {});
      
      return {
        id1,
        id2,
        timestamp1: snap1.lastUpdated,
        timestamp2: snap2.lastUpdated,
        diff: configDiff,
        snapshotData: data1,
        isIdentical: Object.keys(configDiff.added).length === 0 && 
                     Object.keys(configDiff.removed).length === 0 && 
                     Object.keys(configDiff.changed).length === 0
      };
    } catch (e) {
      throw errorHandler.createError('ADAPTER_ERROR', `Snapshot comparison failed: ${e.message}`, { id1, id2 });
    }
  }

  function getSnapshot(payload) {
    const { fileId } = payload || {};
    if (!fileId) throw errorHandler.createError('VALIDATION_ERROR', 'fileId is required');

    try {
      const result = driveAdapter.retrieve({ fileId: fileId, type: 'json' });
      return { content: result.content || {} };
    } catch (e) {
      throw errorHandler.createError('ADAPTER_ERROR', `Failed to retrieve snapshot ${fileId}: ${e.message}`);
    }
  }

  function deleteArtifact(payload) {
    const { fileId } = payload || {};
    if (!fileId) throw errorHandler.createError('VALIDATION_ERROR', 'fileId is required');
    return driveAdapter.deleteItem({ id: fileId });
  }

  function quickDiagnostic(input) {
    const { targetAdapter } = (typeof input === 'object' && input !== null) ? input : {};
    
    _monitor.logInfo(`[CognitiveSensing] Iniciando auditoría axiomática para: ${targetAdapter || 'TODO EL SISTEMA'}`);
    
    try {
      const auditResult = gatekeeper ? gatekeeper.validateAllContracts() : { isValid: true };
      
      let diagnosticStatus = 'CONFORMANCE_VIOLATION';
      let recommendation = "Se detectaron violaciones de contrato CRÍTICAS. El sistema está detenido.";
      
      if (auditResult.isValid) {
          if (auditResult.hasWarnings) {
              diagnosticStatus = 'OPERATIONAL_WITH_WARNINGS';
              recommendation = "El sistema es funcional, pero existen violaciones en módulos periféricos (Gracia Degradada).";
          } else {
              diagnosticStatus = 'OPTIMAL_REIFICATION';
              recommendation = "El sistema cumple con el Canon Axiomático.";
          }
      }

      return {
        success: auditResult.isValid,
        diagnostic: diagnosticStatus,
        adapter: targetAdapter,
        timestamp: new Date().toISOString(),
        details: auditResult.errors,
        criticalErrors: auditResult.criticalErrors || [],
        warnings: auditResult.warnings || [],
        recommendation: recommendation
      };
    } catch (e) {
      return {
        success: false,
        error: `Diagnostic Failure: ${e.message}`,
        recommendation: "Verificar integridad de las Leyes Soberanas."
      };
    }
  }

  // --- Helpers Privados ---

  function _getTaxonomyByExt(ext, fileName = '') {
    const name = fileName.toLowerCase();
    if (name.endsWith('.project.json')) return { category: 'project', type: 'state' };
    if (name.endsWith('.flow.json')) return { category: 'flow', type: 'logic' };
    if (name.endsWith('.form.json')) return { category: 'form', type: 'interactive' };
    if (name.endsWith('.sys.json')) return { category: 'system', type: 'config' };

    const map = {
      'project': { category: 'project', type: 'state' },
      'layout': { category: 'project', type: 'state' },
      'flow': { category: 'flow', type: 'logic' },
      'logic': { category: 'flow', type: 'logic' },
      'form': { category: 'form', type: 'interactive' },
      'sys': { category: 'system', type: 'config' }
    };
    return map[ext] || { category: 'asset', type: 'unknown' };
  }

  function _deepSense(fileId, drive) {
    try {
      const file = drive.retrieve({ fileId: fileId, type: 'json' });
      const data = file.content;
      if (data.nodes) return { category: 'project', type: 'state' };
      if (data.steps) return { category: 'flow', type: 'logic' };
      if (data.fields) return { category: 'form', type: 'interactive' };
      return { category: 'asset', type: 'data' };
    } catch (e) {
      return { category: 'asset', type: 'corrupted' };
    }
  }

  function _createShadowSnapshot(fileId, drive) {
    try {
      const original = drive.retrieve({ fileId });
      if (!original.fileId) return;

      const fileName = original.name;
      const snapshotName = `${fileName}.${new Date().getTime()}.bak`;
      
      let snapshotFolderId = configurator.retrieveParameter({ key: 'sys:snapshot_folder_id' });
      
      if (!snapshotFolderId) {
        try {
          const parents = DriveApp.getFileById(fileId).getParents();
          const parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
          const historyFolders = parentFolder.getFoldersByName('.history');
          if (historyFolders.hasNext()) {
            snapshotFolderId = historyFolders.next().getId();
          } else {
            snapshotFolderId = parentFolder.createFolder('.history').getId();
          }
        } catch (e) {
          snapshotFolderId = DriveApp.getRootFolder().getId();
        }
      }

      drive.store({
        folderId: snapshotFolderId,
        fileName: snapshotName,
        content: JSON.stringify(original.content),
        mimeType: 'application/json'
      });
    } catch (e) {
      _monitor.logWarn('[CognitiveSensing] Shadow snapshot failed:', e.message);
    }
  }

  function _deepDiff(oldObj, newObj) {
    const added = {};
    const removed = {};
    const changed = {};

    for (const key in oldObj) {
      if (!(key in newObj)) {
        removed[key] = oldObj[key];
      } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        changed[key] = {
          oldValue: oldObj[key],
          newValue: newObj[key]
        };
      }
    }

    for (const key in newObj) {
      if (!(key in oldObj)) {
        added[key] = newObj[key];
      }
    }

    return { added, removed, changed };
  }

  const schemas = {
    scanArtifacts: {
      description: "Performs technical introspection of a target industrial container to identify assets via canonical industrial taxonomy.",
      semantic_intent: "SENSOR",
      io_interface: { 
        inputs: {
          folderId: { type: "string", io_behavior: "GATE", description: "Target container industrial identifier for sensing." },
          deepSearch: { type: "boolean", io_behavior: "GATE", description: "Enables recursive industrial content analysis." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier registry routing." }
        }, 
        outputs: {
          artifacts: { type: "array", io_behavior: "STREAM", description: "List of identified industrial assets with their canonical roles." }
        } 
      }
    },
    saveSnapshot: {
      description: "Executes robust institutional content persistence with technical shadow versioning and structural validation.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          content: { type: "object", io_behavior: "STREAM", description: "Industrial asset payload to be persisted." },
          fileName: { type: "string", io_behavior: "STREAM", description: "Technical filename including canonical extension." },
          type: { type: "string", io_behavior: "SCHEMA", description: "Canonical taxonomy type for industrial validation." },
          folderId: { type: "string", io_behavior: "GATE", description: "Destination container industrial identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        }, 
        outputs: {
          fileId: { type: "string", io_behavior: "PROBE", description: "Technical identifier of the generated industrial snapshot." }
        } 
      }
    },
    quickDiagnostic: {
      description: "Triggers an active axiomatic audit to verify system-wide industrial contract compliance.",
      semantic_intent: "ANALYZE",
      io_interface: {
        inputs: {
          targetAdapter: { type: "string", io_behavior: "GATE", description: "Optional specific circuit focus for the industrial audit." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Global industrial compliance status." },
          diagnostic: { type: "string", io_behavior: "PROBE", description: "High-level industrial summary of findings." }
        }
      }
    },
    discoverSeed: {
      description: "Benchmarks existing industrial storage to locate the system's root sovereignty folder circuit.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          rootName: { type: "string", io_behavior: "STREAM", description: "Expected industrial root folder identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for discovery routing." }
        }, 
        outputs: {
          folderId: { type: "string", io_behavior: "PROBE", description: "Discovered industrial root identifier confirmation." }
        } 
      }
    },
    initializeSeed: {
      description: "Establishes the industrial root sovereignty folder if not present.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: {
          rootName: { type: "string", io_behavior: "STREAM", description: "Root folder name to initialize." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          folderId: { type: "string", io_behavior: "PROBE", description: "Initialized root folder identifier." },
          status: { type: "string", io_behavior: "PROBE", description: "Initialization status." }
        }
      }
    },
    find: {
      description: "Executes a technical query against the industrial storage layer.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          query: { type: "string", io_behavior: "STREAM", description: "Drive API query string." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          foundItems: { type: "array", io_behavior: "STREAM", description: "List of matching industrial assets." }
        }
      }
    },
    compareSnapshots: {
      description: "Performs differential analysis between two industrial snapshots.",
      semantic_intent: "ANALYZE",
      io_interface: {
        inputs: {
          oldSnapshot: { type: "object", io_behavior: "STREAM", description: "Previous state snapshot." },
          newSnapshot: { type: "object", io_behavior: "STREAM", description: "Current state snapshot." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          diff: { type: "object", io_behavior: "STREAM", description: "Differential analysis result with added, removed, and changed fields." }
        }
      }
    },
    reconcileSpatialState: {
      description: "Synchronizes spatial positioning data to persistent storage.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: {
          positions: { type: "object", io_behavior: "STREAM", description: "Node position map to persist." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Synchronization status." }
        }
      }
    },
    getSpatialState: {
      description: "Retrieves persisted spatial positioning data.",
      semantic_intent: "STREAM",
      io_interface: {
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          positions: { type: "object", io_behavior: "STREAM", description: "Node position map." }
        }
      }
    },
    getSnapshot: {
      description: "Retrieves a specific industrial snapshot by identifier.",
      semantic_intent: "STREAM",
      io_interface: {
        inputs: {
          fileId: { type: "string", io_behavior: "GATE", description: "Snapshot file identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          content: { type: "object", io_behavior: "STREAM", description: "Snapshot content payload." }
        }
      }
    },
    deleteArtifact: {
      description: "Permanently removes an industrial artifact from storage.",
      semantic_intent: "INHIBIT",
      io_interface: {
        inputs: {
          fileId: { type: "string", io_behavior: "GATE", description: "Artifact identifier to remove." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Deletion confirmation." }
        }
      }
    }
  };

  return Object.freeze({
    label: "Sensing Orchestrator",
    description: "Industrial engine for system-wide introspection, multi-layered sensing, and deterministic diagnostic circuits.",
    semantic_intent: "SENSOR",
    schemas: schemas,
    scanArtifacts,
    saveSnapshot,
    find,
    compareSnapshots,
    quickDiagnostic,
    discoverSeed,
    initializeSeed,
    reconcileSpatialState,
    getSpatialState,
    getSnapshot,
    deleteArtifact,
    validateArtifact: (artifact, type) => schemaRegistry.validate(artifact, type)
  });
}

