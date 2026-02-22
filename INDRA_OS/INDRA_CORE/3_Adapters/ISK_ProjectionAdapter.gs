/**
 * DHARMA: Gestor de Realidad y Proyección Multidimensional (ISK Alignment).
 *         Traduce relaciones lógicas en estados físicos y topológicos.
 *         Agnosticismo Total: No conoce marcas ni skins.
 */

function createSpatialProjectionAdapter({ errorHandler, renderEngine, sensingAdapter, validator }) {

  if (!errorHandler) throw new Error("SpatialProjectionAdapter: errorHandler is required");
  if (!renderEngine) throw new Error("SpatialProjectionAdapter: renderEngine is required");
  if (!sensingAdapter) throw new Error("SpatialProjectionAdapter: sensingAdapter (CognitiveSensing) is required");
  if (!validator) throw new Error("SpatialProjectionAdapter: validator (RealityValidator) is required");

  const { GEOMETRY } = SPATIAL_PHYSICS;

  /**
   * Genera el grafo de escena proyectado para un contexto.
   */
  function getProjectedScene(input) {
    const { context_id, dimension_mode = "2D" } = input || {};
    
    if (!context_id) {
      throw errorHandler.createError("VALIDATION_ERROR", "context_id is required for projection");
    }

    try {
      // 1. Escaneo de la realidad vía sensingAdapter
      const searchResult = sensingAdapter.find({ query: `'${context_id}' in parents and trashed = false` });
      const artifacts = (searchResult.foundItems || []).map(item => ({
        id: item.id,
        name: item.name,
        canonicalCategory: item.mimeType === 'application/vnd.google-apps.folder' ? 'project' : 'asset',
        canonicalType: item.mimeType
      }));
      
      // 2. Recuperar estado espacial guardado
      let savedPositions = {};
      const layoutFileId = _getLayoutFileId(context_id);
      
      if (layoutFileId) {
          try {
              const fileData = sensingAdapter.retrieve({ fileId: layoutFileId });
              const content = typeof fileData.content === 'string' ? JSON.parse(fileData.content) : fileData.content;
              if (content && content.nodes) savedPositions = content.nodes;
          } catch(e) {}
      }
      
      // 3. Mapeo a Nodos Visuales con GEOMETRÍA CONSCIENTE
      const nodes = artifacts.map((art, index) => {
        if (art.name === 'system_layout.json') return null;

        const basePos = savedPositions[art.id] || _calculateBasicLayout(index, artifacts.length, dimension_mode);
        
        return {
          id: art.id,
          label: art.name,
          canonicalCategory: art.canonicalCategory,
          canonicalType: art.canonicalType,
          position: basePos,
          isPersisted: !!savedPositions[art.id],
          // SOBERANÍA GEOMÉTRICA: El Core dicta los puntos de anclaje
          anchors: {
            input_x: basePos.x + GEOMETRY.PORT_MAPPING.INPUT.x_offset,
            output_x: basePos.x + GEOMETRY.PORT_MAPPING.OUTPUT.x_offset,
            y_base: basePos.y + GEOMETRY.HEADER_HEIGHT
          },
          visual_modeling: {
            dimension: dimension_mode,
            semantic_gravity: 0.5,
            influence_radius: 100,
            render_priority: art.canonicalCategory === "project" ? "high" : "low"
          }
        };
      }).filter(n => n !== null);

      return {
        dimension: dimension_mode,
        nodes: nodes,
        edges: _calculateEdges(artifacts),
        physics: SPATIAL_PHYSICS.PHYSICS, // Inyectamos las leyes físicas para el ISK
        timestamp: new Date().toISOString(),
        spatialStateLoaded: Object.keys(savedPositions).length > 0
      };

    } catch (e) {
      throw errorHandler.createError("ADAPTER_ERROR", `Failed to project scene: ${e.message}`);
    }
  }

  function reconcileSpatialState(input) {
    const { context_id, move_events } = input || {};
    if (!context_id || !Array.isArray(move_events)) {
      throw errorHandler.createError("VALIDATION_ERROR", "context_id and move_events required");
    }

    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(10000)) throw new Error("LOCK_TIMEOUT");

      let currentLayout = {};
      const layoutFileId = _getLayoutFileId(context_id);
      let physicalContent = null;
      
      if (layoutFileId) {
         try {
             const fileData = sensingAdapter.retrieve({ fileId: layoutFileId });
             physicalContent = fileData.content;
             const content = typeof physicalContent === 'string' ? JSON.parse(physicalContent) : physicalContent;
             currentLayout = (content && content.nodes) ? content.nodes : {};
         } catch(e) {}
      }

      // AXIOMA: Verificación de Bloqueo Atómico (L8 Security)
      if (physicalContent && input.revisionHash) {
          validator.verifyAtomicLock(physicalContent, input.revisionHash);
      }

      move_events.forEach(move => {
          if (move.id) {
            currentLayout[move.id] = { ...(currentLayout[move.id] || {}), x: move.x, y: move.y };
          }
      });

      const payload = {
          fileName: 'system_layout.json',
          folderId: context_id,
          content: JSON.stringify({ nodes: currentLayout }, null, 2),
          mimeType: 'application/json'
      };
      
      if (layoutFileId) payload.fileId = layoutFileId;
      sensingAdapter.store(payload);

      // El Sello Cronológico se genera del estado guardado
      const newHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, payload.content)
                        .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');

      return { 
          success: true, 
          _revisionHash: "spat_" + newHash,
          applied_at: new Date().toISOString() 
      };
    } catch (e) {
      throw errorHandler.createError("ADAPTER_ERROR", `Failed spatial sync: ${e.message}`);
    } finally {
      lock.releaseLock();
    }
  }

  function commitSpatialChanges(input) {
    const { context_id, changes } = input || {};
    if (!context_id || !Array.isArray(changes)) {
      throw errorHandler.createError("VALIDATION_ERROR", "context_id and changes required");
    }

    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(10000)) throw new Error("LOCK_TIMEOUT");

      let content = { nodes: {} };
      const layoutFileId = _getLayoutFileId(context_id);
      let physicalContent = null;
      
      if (layoutFileId) {
          const fileData = sensingAdapter.retrieve({ fileId: layoutFileId });
          physicalContent = fileData.content;
          const rawContent = typeof physicalContent === 'string' ? JSON.parse(physicalContent) : physicalContent;
          if (rawContent && rawContent.nodes) content.nodes = rawContent.nodes;
      }

      // AXIOMA: Verificación de Bloqueo Atómico (L8 Security)
      if (physicalContent && input.revisionHash) {
          validator.verifyAtomicLock(physicalContent, input.revisionHash);
      }

      // ATOMIC MERGE: ISK-USSP Protocol
      changes.forEach(change => {
          const node = content.nodes[change.target_id] || {};
          
          if (change.property === 'u_pos' && Array.isArray(change.value)) {
              node.x = change.value[0];
              node.y = change.value[1];
          } else if (change.property === 'u_radius') {
              node.radius = change.value;
          } else {
              node[change.property.replace('u_', '')] = change.value;
          }
          
          content.nodes[change.target_id] = node;
      });

      const jsonContent = JSON.stringify(content, null, 2);
      sensingAdapter.store({
          fileId: layoutFileId,
          fileName: 'system_layout.json',
          folderId: context_id,
          content: jsonContent,
          mimeType: 'application/json'
      });

      const newHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, jsonContent)
                        .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');

      return { 
          status: 'success', 
          _revisionHash: "spat_" + newHash,
          summary: `${changes.length} properties synchronized` 
      };
    } catch (e) {
      throw errorHandler.createError("ADAPTER_ERROR", `Failed atomic spatial commit: ${e.message}`);
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Crea un snapshot (copia oculta) del estado espacial actual.
   * Permite experimentación con capacidad de rollback.
   */
  function createSnapshot(input) {
    const { context_id, snapshot_label } = input || {};
    if (!context_id) {
      throw errorHandler.createError("VALIDATION_ERROR", "context_id is required for snapshot");
    }

    try {
      const layoutFileId = _getLayoutFileId(context_id);
      if (!layoutFileId) {
        throw new Error("No layout file found to snapshot");
      }

      const fileData = sensingAdapter.retrieve({ fileId: layoutFileId });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const snapshotName = `.snapshot_${timestamp}_${snapshot_label || 'manual'}.json`;

      // Crear copia oculta en el mismo contexto
      sensingAdapter.store({
        fileName: snapshotName,
        folderId: context_id,
        content: fileData.content,
        mimeType: 'application/json'
      });

      return {
        snapshot_id: timestamp,
        snapshot_name: snapshotName,
        created_at: new Date().toISOString()
      };
    } catch (e) {
      throw errorHandler.createError("ADAPTER_ERROR", `Failed to create snapshot: ${e.message}`);
    }
  }

  /**
   * Restaura un snapshot previo sobrescribiendo el layout actual.
   */
  function restoreSnapshot(input) {
    const { context_id, snapshot_id } = input || {};
    if (!context_id || !snapshot_id) {
      throw errorHandler.createError("VALIDATION_ERROR", "context_id and snapshot_id required");
    }

    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(10000)) throw new Error("LOCK_TIMEOUT");

      // Buscar el snapshot
      const snapshotQuery = `'${context_id}' in parents and title contains '${snapshot_id}' and trashed = false`;
      const snapshotResult = sensingAdapter.find({ query: snapshotQuery });
      
      if (!snapshotResult.foundItems || snapshotResult.foundItems.length === 0) {
        throw new Error(`Snapshot ${snapshot_id} not found`);
      }

      const snapshotFile = sensingAdapter.retrieve({ fileId: snapshotResult.foundItems[0].id });
      const layoutFileId = _getLayoutFileId(context_id);

      // Sobrescribir el layout actual con el snapshot
      sensingAdapter.store({
        fileId: layoutFileId,
        fileName: 'system_layout.json',
        folderId: context_id,
        content: snapshotFile.content,
        mimeType: 'application/json'
      });

      return {
        status: 'success',
        restored_from: snapshot_id,
        restored_at: new Date().toISOString()
      };
    } catch (e) {
      throw errorHandler.createError("ADAPTER_ERROR", `Failed to restore snapshot: ${e.message}`);
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Lista todos los snapshots disponibles para un contexto.
   */
  function listSnapshots(input) {
    const { context_id } = input || {};
    if (!context_id) {
      throw errorHandler.createError("VALIDATION_ERROR", "context_id is required");
    }

    try {
      const query = `'${context_id}' in parents and title contains '.snapshot_' and trashed = false`;
      const result = sensingAdapter.find({ query });
      
      const snapshots = (result.foundItems || []).map(item => ({
        id: item.id,
        name: item.name,
        created_at: item.createdTime || null,
        size_bytes: item.size || 0
      }));

      return { snapshots, total: snapshots.length };
    } catch (e) {
      throw errorHandler.createError("ADAPTER_ERROR", `Failed to list snapshots: ${e.message}`);
    }
  }

  // --- HELPERS PRIVADOS ---

  function _getLayoutFileId(folderId) {
    if (!folderId) return null;
    const result = sensingAdapter.find({ query: `'${folderId}' in parents and title = 'system_layout.json' and trashed = false` });
    return (result.foundItems || []).length > 0 ? result.foundItems[0].id : null;
  }

  function _calculateBasicLayout(index, total, mode) {
    const angle = (index / total) * 2 * Math.PI;
    const r = 200;
    const pos = { x: Math.round(Math.cos(angle) * r), y: Math.round(Math.sin(angle) * r) };
    if (mode === "3D") {
        pos.z = Math.round(Math.sin(angle * 2) * 50); // Simple onda sinusoidal para Z
    }
    return pos;
  }

  function _calculateEdges(artifacts) {
    const edges = [];
    artifacts.forEach(art => {
      if (art.metadata?.links) {
        art.metadata.links.forEach(tId => edges.push({ source: art.id, target: tId, type: "logical" }));
      }
    });
    return edges;
  }

  function verifyConnection() {
    return { status: "ACTIVE", info: "Spatial Kernel Projections Online" };
  }

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
    id: "spatial_projection_manager",
    label: "ISK Real-Time Pilot",
    archetype: "infra",
    domain: "system",
    REIFICATION_HINTS: {
        id: "id",
        label: "name || label || id",
        items: "snapshots || items"
    },
    CAPABILITIES: {
      "getProjectedScene": {
        "id": "PROJECT_SCENE",
        "io": "READ",
        "desc": "Generates an institutional 3D spatial projection of the current technical state.",
        "traits": ["VISUALIZATION", "GEOMETRY", "PHYSICS"],
        "inputs": { 
          "context_id": { "type": "string", "desc": "Target context identifier for spatial discovery." },
          "dimension_mode": { "type": "string", "desc": "Technical projection dimensionality (2D/3D)." }
        }
      },
      "reconcileSpatialState": {
        "id": "STABILIZE_REALITY",
        "io": "WRITE",
        "desc": "Persists technical spatial coordinates and topological adjustments.",
        "traits": ["PERSISTENCE", "STABILIZATION", "GEOMETRY"],
        "inputs": { 
          "context_id": { "type": "string", "desc": "Target context identifier." },
          "move_events": { "type": "array", "desc": "Collection of technical spatial adjustment events." }
        }
      },
      "commitSpatialChanges": {
        "id": "TRANSFORM",
        "io": "WRITE",
        "desc": "Performs atomic multi-property merge based on USSP protocol packets.",
        "traits": ["TRANSFORM", "COMMIT"],
        "inputs": {
          "context_id": { "type": "string", "desc": "Target context identifier." },
          "changes": { "type": "array", "desc": "Technical change stream." }
        }
      },
      "createSnapshot": {
        "id": "TRANSFORM",
        "io": "WRITE",
        "desc": "Creates a versioned snapshot of the current spatial layout.",
        "traits": ["VERSIONING", "SNAPSHOT"],
        "inputs": {
          "context_id": { "type": "string", "desc": "Target context identifier." },
          "snapshot_label": { "type": "string", "desc": "Optional label." }
        }
      }
    }
  };

  return {
    id: "spatial_projection_manager",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    description: "Industrial engine for multidimensional reality management, logical-to-topological translation, and spatial state orchestration.",
    CANON: CANON,
    resource_weight: "medium",
    
    // Protocol Mapping (VISUAL_V1)
    render: getProjectedScene,
    project: commitSpatialChanges,
    verifyConnection,
    
    // Original methods
    getProjectedScene,
    commitSpatialChanges,
    reconcileSpatialState,
    createSnapshot,
    restoreSnapshot,
    listSnapshots
  };
}








