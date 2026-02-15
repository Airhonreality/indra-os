// ======================================================================
// ARTEFACTO: 3_Adapters/CognitiveSensingAdapter.gs
// DHARMA: Lente Cognitivo y Guardián de Persistencia Robusta.
//         Implementa Sensing, Validación y Shadow Versioning de forma agnóstica.
// ======================================================================

function createCognitiveSensingAdapter({ driveAdapter, configurator, errorHandler, blueprintRegistry, monitoringService, gatekeeper, auditLogger }) {
  
  if (!driveAdapter) throw new Error('CognitiveSensingAdapter: driveAdapter dependency is required');
  if (!blueprintRegistry) throw new Error('CognitiveSensingAdapter: blueprintRegistry dependency is required');
  if (!errorHandler) throw new Error('CognitiveSensingAdapter: errorHandler dependency is required');
  if (!configurator) throw new Error('CognitiveSensingAdapter: configurator dependency is required');

  // AXIOMA: Resiliencia de Infraestructura (H7-RESILIENCE)
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, 
    logEvent: () => {}, sendCriticalAlert: () => {} 
  };

  // AXIOMA V12: Audit Logger (ADR 003) - Opcional para no romper compatibilidad
  const _auditLogger = auditLogger || null;

  function find(payload) {
    return driveAdapter.find(payload);
  }

  function discoverSeed(input) {
    const { rootName = 'INDRA_ROOT' } = input || {};
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
    const { rootName = 'INDRA_ROOT' } = input || {};
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
            
            // AXIOMA: Soberanía de Origen Profunda (Detectar Notion/Sheets en metadata)
            if (sense.origin) {
              item.ORIGIN_SOURCE = sense.origin;
            }
          }
        }
        
        // AXIOMA: Determinismo de Identidad (ADR-009)
        // Eliminada la heurística basada en nombres (".includes('notion')").
        // El origen ahora es puramente declarativo (vía deepSense o metadatos explícitos).
        const finalOrigin = item.ORIGIN_SOURCE || null;

        return {
          id: item.id,
          name: item.name,
          canonicalCategory: category,
          canonicalType: type,
          lastUpdated: item.lastUpdated,
          ORIGIN_SOURCE: finalOrigin // Inyectamos el origen detectado
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

    const validation = blueprintRegistry.validatePayload(content, blueprintRegistry.ARTIFACT_SCHEMAS[type]);
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

      if (!snap1 || !snap2) {
        throw new Error(`One or both snapshots not found: ${id1}, ${id2}`);
      }

      const data1 = snap1.content || {};
      const data2 = snap2.content || {};

      // AXIOMA: Resiliencia de Configuración (Lute 4)
      const config1 = data1.configuration || data1; // Fallback if configuration key is missing
      const config2 = data2.configuration || data2;

      const configDiff = _deepDiff(config1, config2);
      
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

  /**
   * [MCP-EXCLUSIVE]: List resources based on a path or category.
   * Translates drive structure into indra:// protocol URIs.
   */
  function listResources(payload = {}) {
    const { path = '/', category = 'all' } = payload;
    _monitor.logDebug(`[CognitiveSensing] Listing resources for path: ${path}`);

    try {
        // Por ahora, listamos el contenido de la carpeta raíz si el path es '/'
        // o mapeamos categorías específicas.
        let targetFolderId;
        if (path === '/') {
            targetFolderId = configurator.retrieveParameter({ key: 'INDRA_CORE_ROOT_ID' });
        } else {
            // Lógica de resolución de path (ej: indra://proyectos -> ID de carpetaproyectos)
            const resolved = driveAdapter.resolvePath({ path: path.replace('indra://', '') });
            targetFolderId = resolved.folderId;
        }

        const items = scanArtifacts({ folderId: targetFolderId });
        return {
            path,
            resources: items.map(item => ({
                uri: `indra://${path.replace(/^\/+/, '')}/${item.name}`,
                name: item.name,
                type: item.canonicalType,
                lastUpdated: item.lastUpdated,
                id: item.id
            }))
        };
    } catch (e) {
        throw errorHandler.createError('ADAPTER_ERROR', `Resource listing failed: ${e.message}`);
    }
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

  /**
   * AXIOMA V12: Estabilización de Realidad Axiomática (ADR 003)
   * Recibe un snapshot completo de la realidad del Front y lo persiste en Drive.
   */
  function stabilizeAxiomaticReality(input) {
    const { snapshot } = input || {};
    
    if (!snapshot || !snapshot.cosmosId) {
      throw errorHandler.createError('VALIDATION_ERROR', 'snapshot with cosmosId is required');
    }

    const { cosmosId, artifacts, relationships, _revisionHash, _timestamp } = snapshot;
    const syncStartTime = Date.now();
    
    _monitor.logInfo(`[CognitiveSensing] 🎒 Stabilizing reality snapshot for ${cosmosId} (${artifacts?.length || 0} nodes, ${relationships?.length || 0} edges)`);
    
    try {
      // 1. Construir el cosmos completo con el snapshot
      const cosmosData = {
        id: cosmosId,
        artifacts: artifacts || [],
        relationships: relationships || [],
        activeLayout: snapshot.activeLayout,
        activeFlow: snapshot.activeFlow,
        _revisionHash: _revisionHash,
        _syncedAt: new Date().toISOString(),
        _clientTimestamp: _timestamp
      };

      // 2. Persistencia Atómica con Anclaje Físico (REPARADO V12.1)
      const flowsFolderId = configurator.retrieveParameter({ key: 'INDRA_FOLDER_FLOWS_ID' });
      const isNew = cosmosId.toString().startsWith('temp_');

      const storePayload = {
        content: JSON.stringify(cosmosData, null, 2),
        mimeType: 'application/json'
      };

      if (!isNew) {
        storePayload.fileId = cosmosId; // Actualización directa por ID
      } else {
        storePayload.folderId = flowsFolderId;
        storePayload.fileName = `${cosmosId}.cosmos.json`;
      }

      const result = driveAdapter.store(storePayload);

      const syncDuration = Date.now() - syncStartTime;
      _monitor.logInfo(`[CognitiveSensing] ✅ Reality stabilized: ${result.fileId} (took ${syncDuration}ms)`);

      // 3. Registrar en Audit Log (Sheet)
      if (_auditLogger && typeof _auditLogger.logSyncEvent === 'function') {
        _auditLogger.logSyncEvent({
          cosmosId,
          revisionHash: _revisionHash,
          nodeCount: artifacts?.length || 0,
          relationshipCount: relationships?.length || 0,
          source: input._carriedReality ? 'PIGGYBACKING' : 'MANUAL_SYNC',
          triggerAction: input._triggerAction || 'unknown',
          syncDuration
        });
      }

      return {
        success: true,
        fileId: result.fileId,
        cosmosId: cosmosId,
        _revisionHash: _revisionHash,
        syncedAt: cosmosData._syncedAt,
        nodeCount: artifacts?.length || 0,
        relationshipCount: relationships?.length || 0
      };
    } catch (e) {
      throw errorHandler.createError('PERSISTENCE_ERROR', `Reality stabilization failed: ${e.message}`);
    }
  }

  // --- Helpers Privados ---

  function _getTaxonomyByExt(ext, fileName = '') {
    const name = fileName.toLowerCase();
    
    // AXIOMA: Semantic Suffix Priority
    if (name.endsWith('.project.json') || name.endsWith('.cosmos.json')) return { category: 'project', type: 'cosmos' };
    if (name.endsWith('.layout.json')) return { category: 'project', type: 'layout' };
    if (name.endsWith('.flow.json') || name.endsWith('.logic.json') || name.endsWith('.rule.json')) {
      return { category: 'flow', type: 'logic' };
    }
    if (name.endsWith('.sys.json') || name.endsWith('.config.json') || name.endsWith('.manifest.json')) {
      return { category: 'system', type: 'config' };
    }
    if (name.endsWith('.form.json')) return { category: 'form', type: 'interactive' };

    const map = {
      'project': { category: 'project', type: 'cosmos' },
      'layout': { category: 'project', type: 'layout' },
      'flow': { category: 'flow', type: 'logic' },
      'logic': { category: 'flow', type: 'logic' },
      'rule': { category: 'flow', type: 'logic' },
      'form': { category: 'form', type: 'interactive' },
      'sys': { category: 'system', type: 'config' }
    };
    return map[ext] || { category: 'asset', type: 'unknown' };
  }

  function _deepSense(fileId, drive) {
    try {
      const file = drive.retrieve({ fileId: fileId, type: 'json' });
      const data = file.content;
      
      const res = { category: 'asset', type: 'data', origin: data.ORIGIN_SOURCE || data.nodeId || null };
      
      if (data.nodes || data.artifacts) {
        res.category = 'project';
        res.type = 'cosmos';
      } else if (data.steps) {
        res.category = 'flow';
        res.type = 'logic';
      } else if (data.fields) {
        res.category = 'form';
        res.type = 'interactive';
      }
      
      return res;
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
    scanArtifacts: ContractRegistry.get('scanArtifacts'),
    saveSnapshot: ContractRegistry.get('saveSnapshot'),
    quickDiagnostic: ContractRegistry.get('quickDiagnostic'),
    discoverSeed: ContractRegistry.get('discoverSeed'),
    initializeSeed: ContractRegistry.get('initializeSeed'),
    find: ContractRegistry.get('find'),
    compareSnapshots: ContractRegistry.get('compareSnapshots'),
    reconcileSpatialState: ContractRegistry.get('reconcileSpatialState'),
    getSpatialState: ContractRegistry.get('getSpatialState'),
    getSnapshot: ContractRegistry.get('getSnapshot'),
    deleteArtifact: ContractRegistry.get('deleteArtifact'),
    listResources: ContractRegistry.get('listResources'),
    stabilizeAxiomaticReality: ContractRegistry.get('stabilizeAxiomaticReality')
  };

  function verifyConnection() {
    try {
      driveAdapter.verifyConnection();
      return { status: "ACTIVE" };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

  // --- SOVEREIGN CANON V12.0 (Algorithmic Core) ---
  const CANON = {
      ARCHETYPE: "ADAPTER",
      DOMAIN: "SENSING",
      CAPABILITIES: schemas
  };

  return {
    CANON: CANON,
    description: "Industrial engine for system-wide introspection, multi-layered sensing, and deterministic diagnostic circuits.",
    schemas: schemas,
    // Protocol mapping (ORACLE_V1)
    search: find,
    extract: scanArtifacts,
    deepResearch: quickDiagnostic,
    verifyConnection,
    // Original methods
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
    listResources,
    stabilizeAxiomaticReality,
    validateArtifact: (artifact, type) => blueprintRegistry.validatePayload(artifact, blueprintRegistry.ARTIFACT_SCHEMAS[type])
  };
}






