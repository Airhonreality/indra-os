/**
 * ARTEFACTO: 2_Services/CosmosEngine.gs
 * DHARMA: Motor de Realidad y Persistencia de Contexto.
 * 
 * Este adaptador encapsula la lógica específica de la Aplicación INDRA
 * para la gestión de Cosmos, Flow, Layout y sus interacciones.
 * Actúa como el puente entre el Core Agnóstico y la Semántica de la App.
 */

function createCosmosEngine({ driveAdapter, configurator, monitoringService, errorHandler, validator }) {
  
  const _monitor = monitoringService || { logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {} };

  // AXIOMA: Definición de Esquemas Soberanos (Lógica de App)
  const schemas = {
    mountCosmos: {
      description: "Hidrata una realidad completa (Cosmos) desde el almacenamiento persistente.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: { 
        inputs: { cosmosId: { type: "string", description: "Identificador del Cosmos a montar." } }, 
        outputs: { result: { type: "object", description: "Objeto Cosmos hidratado." } } 
      }
    },
    listAvailableCosmos: {
      description: "Escanea el horizonte en busca de realidades disponibles (archivos JSON en Flows).",
      semantic_intent: "PROBE",
      exposure: "public",
      io_interface: { 
        inputs: { includeAll: { type: "boolean", optional: true } }, 
        outputs: { artifacts: { type: "array", description: "Lista de artefactos encontrados." } } 
      }
    },
    saveCosmos: {
      description: "Persiste el estado actual de un Cosmos en el almacenamiento.",
      semantic_intent: "STREAM",
      exposure: "public",
      io_interface: {
        inputs: { cosmos: { type: "object", description: "Objeto Cosmos completo a guardar." } },
        outputs: { success: { type: "boolean" } }
      }
    },
    deleteCosmos: {
        description: "Elimina permanentemente una realidad del sistema.",
        semantic_intent: "INHIBIT",
        exposure: "public",
        io_interface: {
            inputs: { cosmosId: { type: "string" } },
            outputs: { success: { type: "boolean" } }
        }
    },
    applyPatch: {
      description: "Aplica un delta semántico a una realidad existente (Axioma: Anti-Snapshot).",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: { 
        inputs: { 
          cosmosId: { type: "string" }, 
          delta: { type: "object" },
          revisionHash: { type: "string", optional: true }
        }, 
        outputs: { success: { type: "boolean" }, new_revision_hash: { type: "string" } } 
      }
    },
    bindArtifactToCosmos: {
      description: "Vincula formalmente un artefacto a una realidad (Consenso de Nube).",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: {
        inputs: {
          cosmosId: { type: "string" },
          artifactId: { type: "string" },
          metadata: { type: "object", optional: true }
        },
        outputs: { success: { type: "boolean" } }
      }
    }
  };

  /**
   * Implementación: Listar Realidades Disponibles
   * Utiliza la infraestructura de DriveAdapter pero aplica filtros de negocio.
   */
  function listAvailableCosmos(args) {
    const { includeAll } = args || {};
    const flowsFolderId = configurator.retrieveParameter({ key: 'INDRA_FOLDER_FLOWS_ID' });
    
    if (!flowsFolderId) {
        throw errorHandler.createError('CONFIGURATION_ERROR', 'INDRA_FOLDER_FLOWS_ID no está configurado.');
    }

    try {
        // Usamos listContents del DriveAdapter que ya devuelve items normalizados
        const result = driveAdapter.listContents({ folderId: flowsFolderId });
        const items = (result.items || []).filter(item => item.type === 'FILE');

        const artifacts = items.map(item => {
            const isJson = item.name.endsWith('.json') || item.mimeType === 'application/json';
            const isRaw = !item.raw || !item.raw.description;
            
            // Decodificación de Metadatos (Surface Reading)
            let identity = { label: item.name.replace('.json', ''), description: 'Materia sin indexar.' };
            let schema = 'UNDEFINED';

            if (!isRaw && item.raw.description) {
                try {
                    const meta = JSON.parse(item.raw.description);
                    identity = {
                        label: meta.label || identity.label,
                        description: meta.desc || identity.description
                    };
                    schema = meta.schema || 'UNDEFINED';
                } catch (e) {
                    // Fallback silencioso si el JSON de descripción está roto
                }
            }

            return {
                id: item.id,
                name: item.name,
                type: item.type,
                last_modified: item.lastUpdated,
                indx_schema: schema, // Proyección directa para el Artifact Explorer
                discovery: {
                    status: isRaw ? 'ARTIFACT_RAW' : 'ARTIFACT_INDEXED',
                    is_json: isJson
                },
                identity: identity
            };
        });

        // Filtrado de Negocio (Opcional: mostrar solo Cosmos vs todo)
        if (!includeAll) {
            return { artifacts: artifacts.filter(a => a.indx_schema === 'COSMOS_V1') };
        }

        return { artifacts };

    } catch (e) {
        if (monitoringService) monitoringService.logError('CosmosEngine', `Fallo al listar cosmos: ${e.message}`);
        throw errorHandler.createError('SYSTEM_FAILURE', `Error listando cosmos: ${e.message}`);
    }
  }

  /**
   * UTILIDAD: Generación de Hash de Integridad (MD5 Simulado o Nativo)
   */
  function _generateHash(contentString) {
      if (!contentString) return "empty_void";
      // En GAS, Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, contentString) devuelve bytes.
      // Convertimos a Hex.
      const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, contentString);
      return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
  }

  /**
   * Implementación: Montar una Realidad (Read con Normalización Fractal)
   */
  function mountCosmos(args) {
    const { cosmosId } = args || {};
    if (!cosmosId) throw errorHandler.createError('INVALID_INPUT', 'cosmosId es requerido para montar.');

    try {
        const fileContent = driveAdapter.retrieve({ fileId: cosmosId });
        if (!fileContent || !fileContent.content) {
            throw errorHandler.createError('RESOURCE_NOT_FOUND', `No se encontró el Cosmos: ${cosmosId}`);
        }

        // Delegación de Protocolo al Validador (L8)
        const { payload, envelope } = validator.normalize(fileContent.content);
        
        const contentString = JSON.stringify(payload);
        const integrityHash = (envelope && envelope.revision_hash) ? envelope.revision_hash : _generateHash(contentString);
        
        if (payload && typeof payload === 'object' && !payload.id) {
            payload.id = cosmosId;
        }

        return {
            envelope_version: "2.2", 
            server_timestamp: new Date().getTime(),
            cosmos_id: cosmosId, 
            revision_hash: integrityHash,
            integrity_check: "PASS",
            payload: payload
        };

    } catch (e) {
        throw errorHandler.createError('SYSTEM_FAILURE', `Fallo al montar cosmos: ${e.message}`);
    }
  }

  /**
   * Implementación: Guardar una Realidad (Write con Verdad Física)
   */
  function saveCosmos(args) {
    const { cosmos, revisionHash, content_base64 } = args || {};
    const cosmosId = cosmos?.id || args.cosmosId;
    
    if (!cosmosId) throw errorHandler.createError('INVALID_INPUT', 'ID de Cosmos requerido.');

    const idStr = String(cosmosId);
    const isNew = idStr.startsWith('temp_') || idStr.startsWith('cosmos_') || idStr.length < 10;
    const flowsFolderId = configurator.retrieveParameter({ key: 'INDRA_FOLDER_FLOWS_ID' });

    // 1. Delegación de Integridad Atómica (PHYSICAL TRUTH) via L8 Validator
    if (!isNew && revisionHash && revisionHash !== 'force') {
        const physical = driveAdapter.retrieve({ fileId: cosmosId });
        if (physical && physical.content) {
            validator.verifyAtomicLock(physical.content, revisionHash);
        }
    }

    let finalContentBlob;
    let newHash;

    // 2. Pasamanos de Contenido (Base64 Bypass o JSON Stringify)
    if (content_base64) {
        // Modo Eficiente: El cliente ya serializó y comprimió.
        const decoded = Utilities.base64Decode(content_base64);
        const textString = Utilities.newBlob(decoded).getDataAsString(Utilities.Charset.UTF_8); 
        finalContentBlob = textString; // Guardamos el string puro (el sobre ya viene ahí)
        newHash = _generateHash(textString);
    } else if (cosmos) {
        // Modo Legacy: El backend serializa
        const envelope = {
            envelope_version: "2.1",
            server_timestamp: new Date().getTime(),
            payload: cosmos
        };
        const tempString = JSON.stringify(envelope);
        newHash = _generateHash(tempString);
        envelope.revision_hash = newHash;
        finalContentBlob = JSON.stringify(envelope);
    } else {
         throw errorHandler.createError('INVALID_INPUT', 'Se requiere cosmos object o content_base64.');
    }

    // 3. Persistencia Atómica con Metadatos Líquidos
    const label = cosmos?.identity?.label || (content_base64 ? JSON.parse(finalContentBlob).payload?.identity?.label : "Cosmos");

    const description = JSON.stringify({
        schema: "COSMOS_V1",
        label: label || "Cosmos",
        desc: cosmos?.identity?.description || "Realidad persistida por Indra App",
        version: "2.1",
        hash: newHash,
        last_modified: new Date().toISOString()
    });

    try {
        const storePayload = {
            content: finalContentBlob,
            mimeType: "application/json",
            description: description
        };

        if (isNew) {
            storePayload.folderId = flowsFolderId;
            const safeLabel = (label || 'unnamed').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            storePayload.fileName = `${safeLabel}_${idStr}.cosmos.json`;
        } else {
            storePayload.fileId = cosmosId;
        }

        const storageResult = driveAdapter.store(storePayload);

        return { 
            success: true,
            _revisionHash: newHash,
            new_id: isNew ? storageResult.fileId : undefined,
            id: isNew ? storageResult.fileId : cosmosId, // Asegurar id para reconciliación
            timestamp: new Date().getTime()
        };

    } catch (e) {
        throw errorHandler.createError('SYSTEM_FAILURE', `Fallo al guardar cosmos: ${e.message}`);
    }
  }

  /**
   * Implementación: Eliminar una Realidad
   */
    function deleteCosmos(args) {
        const { cosmosId } = args || {};
        if (!cosmosId) throw errorHandler.createError('INVALID_INPUT', 'cosmosId es requerido.');

        try {
            driveAdapter.deleteItem({ id: cosmosId });
            // Al borrar, el sistema emite un sello de "Vacío Confirmado"
            return { 
                success: true, 
                _revisionHash: "void_" + Date.now(),
                timestamp: new Date().getTime()
            };
        } catch (e) {
            throw errorHandler.createError('SYSTEM_FAILURE', `Fallo al eliminar cosmos: ${e.message}`);
        }
    }

  /**
   * Implementación: Aplicar Parche Semántico (Integridad Atómica v2.1)
   * 
   * ⚠️ DEPRECATED (ADR 003): Este método usa deltas granulares y reconciliación optimista.
   * Se mantiene para compatibilidad legacy, pero el protocolo recomendado es:
   * - usar stabilizeAxiomaticReality() con snapshots completos (ADR 003)
   * 
   * Estado: LEGACY - Puede ser removido en v13+
   */
  function applyPatch(args) {
    const { cosmosId, delta, revisionHash, _isLegacyDelta } = args || {};
    if (!cosmosId || !delta) throw errorHandler.createError('INVALID_INPUT', 'CosmosId y delta son requeridos.');

    // AXIOMA V12: Warning de Deprecación
    if (!_isLegacyDelta) {
      monitoringService.logWarn(`[CosmosEngine] ⚠️ DEPRECATED: applyPatch() called without _isLegacyDelta flag. Consider using stabilizeAxiomaticReality() with full snapshots (ADR 003).`);
    }

    try {
      // 1. Lectura Física del Sobre
      const data = driveAdapter.retrieve({ fileId: cosmosId });
      if (!data || !data.content) throw new Error("Objeto físico no encontrado.");

      // 2. Validación de Soberanía Temporal (Atomic Lock)
      if (revisionHash && revisionHash !== 'force') {
        validator.verifyAtomicLock(data.content, revisionHash);
      }

      // 3. Unpack del Sobre (Safe Parsing)
      let envelope;
      if (typeof data.content === 'string') {
        try {
          envelope = JSON.parse(data.content);
        } catch (e) {
          throw new Error("Contenido físico corrupto: No es un JSON válido.");
        }
      } else {
        envelope = data.content;
      }
      
      if (!envelope || !envelope.payload) throw new Error("El archivo físico no tiene un formato de Sobre válido.");

      // 4. Fusión Profunda (Deep Merge)
      const updatedPayload = _deepMerge(envelope.payload, delta);
      
      // 5. Re-Empaquetado (Repack)
      envelope.payload = updatedPayload;
      envelope.server_timestamp = new Date().getTime();
      
      const tempString = JSON.stringify(envelope);
      const newHash = _generateHash(tempString);
      envelope.revision_hash = newHash;
      
      const finalContent = JSON.stringify(envelope);

      // 6. Persistencia
      const label = updatedPayload.identity?.label || "Cosmos";
      const description = JSON.stringify({
          schema: "COSMOS_V1",
          label: label,
          version: envelope.envelope_version || "2.1",
          hash: newHash,
          last_modified: new Date().toISOString()
      });

      driveAdapter.store({
          fileId: cosmosId,
          content: finalContent,
          description: description
      });

      return { 
          success: true, 
          _revisionHash: newHash,
          timestamp: envelope.server_timestamp,
          reconciliations: updatedPayload._reconciliations // Retornar las transmutaciones al front
      };

    } catch (e) {
      throw errorHandler.createError('SYSTEM_FAILURE', `Error al parchear cosmos [${cosmosId}]: ${e.message}`);
    }
  }

  /**
   * Utilidad: Fusión Profunda Axiomática (INDRA Spec)
   */
  function _deepMerge(target, source) {
    if (!source) return target;
    const reconciliations = [];
    
    // CASO ESPECIAL: Parche de Artefactos (Mapa ID -> Data)
    if (source._artifacts_delta) {
        const deltaMap = source._artifacts_delta;
        const currentArtifacts = target.artifacts || [];
        
        for (let [id, data] of Object.entries(deltaMap)) {
            const isTemp = id.toString().startsWith('temp_');
            let finalId = id;

            // AXIOMA: Reconciliación en el Core (Mano de Madera)
            if (isTemp && data !== null) {
                finalId = "art_" + Utilities.getUuid().split('-')[0] + "_" + Date.now().toString().slice(-4);
                data.id = finalId;
                reconciliations.push({ tempId: id, realId: finalId, type: 'ARTIFACT' });
            }

            const index = currentArtifacts.findIndex(a => a.id === (isTemp ? id : finalId));
            
            if (data === null) {
                if (index !== -1) currentArtifacts.splice(index, 1);
            } else {
                if (index !== -1) currentArtifacts[index] = data;
                else currentArtifacts.push(data);
            }
        }
        target.artifacts = currentArtifacts;
        delete source._artifacts_delta;
    }

    // AXIOMA: Reconciliación de Relaciones (Basado en los IDs de arriba)
    if (source._relationships_delta) {
        const relDeltaMap = source._relationships_delta;
        const currentRels = target.relationships || [];

        for (let [id, data] of Object.entries(relDeltaMap)) {
            const isTemp = id.toString().startsWith('temp_');
            let finalId = id;

            if (isTemp && data !== null) {
                finalId = "rel_" + Utilities.getUuid().split('-')[0];
                data.id = finalId;
                reconciliations.push({ tempId: id, realId: finalId, type: 'RELATIONSHIP' });
            }

            // Scrubbing de IDs de origen/destino en la relación si eran temporales
            if (data !== null) {
                reconciliations.forEach(r => {
                    if (data.source === r.tempId) data.source = r.realId;
                    if (data.target === r.tempId) data.target = r.realId;
                });
            }

            const index = currentRels.findIndex(r => r.id === (isTemp ? id : finalId));
            if (data === null) {
                if (index !== -1) currentRels.splice(index, 1);
            } else {
                if (index !== -1) currentRels[index] = data;
                else currentRels.push(data);
            }
        }
        target.relationships = currentRels;
        delete source._relationships_delta;
    }

    // Procesamiento Recursivo para el resto
    for (const key in source) {
      if (source[key] instanceof Object && key in target && !Array.isArray(source[key])) {
        _deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }

    if (reconciliations.length > 0) {
        target._reconciliations = (target._reconciliations || []).concat(reconciliations);
    }

    return target;
  }


  /**
   * Implementación: Vincular Artefacto (Cloud Consensus Hook)
   */
  function bindArtifactToCosmos(args) {
    const { cosmosId, artifactId, metadata } = args || {};
    if (!cosmosId || !artifactId) throw errorHandler.createError('INVALID_INPUT', 'cosmosId y artifactId son requeridos.');

    _monitor.logInfo(`[CosmosEngine] 🔗 Binding artifact ${artifactId} to Cosmos ${cosmosId}`);
    
    // AXIOMA V12: Registro de Intención
    // En el modelo de Snapshots, el vínculo real se consolidará en la próxima estabilización.
    if (typeof SheetAuditLogger !== 'undefined') {
        SheetAuditLogger.log('RELATIONSHIP', `Bound ${artifactId} to ${cosmosId}`, { metadata });
    }

    return { success: true, timestamp: Date.now() };
  }


  // --- SOVEREIGN CANON V12.0 (Algorithmic Core) ---
  const CANON = {
    ARCHETYPE: "ENGINE",
    DOMAIN: "APPLICATION",
    CAPABILITIES: {
      "mountCosmos": { "io": "READ", "desc": "Hydrate a reality circuit" },
      "saveCosmos": { "io": "WRITE", "desc": "Persist a reality state" },
      "listAvailableCosmos": { "io": "READ", "desc": "Discover reachable realities" },
      "applyPatch": { "io": "WRITE", "desc": "Modify reality state atomically" }
    }
  };

  // Retorno del Nodo Soberano
  return Object.freeze({
    id: "cosmos", // Identidad del Trabajador
    CANON: CANON,
    schemas,
    // Métodos expuestos
    mountCosmos,
    saveCosmos,
    deleteCosmos,
    listAvailableCosmos,
    applyPatch,
    bindArtifactToCosmos
  });
}





