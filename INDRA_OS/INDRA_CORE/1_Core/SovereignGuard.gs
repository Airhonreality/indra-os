/**
 * SovereignGuard.gs
 * DHARMA: La Guardia Pretoriana (Layer 0.5)
 * 
 * Centraliza la seguridad, la invocación segura y el batching.
 * Actúa como la membrana de control entre la PublicAPI y los Nodos.
 */

const SovereignGuard = {
  /**
   * Autoriza una petición basada en el token del sistema.
   * Llamado directamente por HttpEntrypoint.gs.
   */
  authorize: function(providedToken, configurator) {
    if (!configurator) return false;
    
    const expectedToken = configurator.retrieveParameter({ key: 'ORBITAL_CORE_SATELLITE_API_KEY' }) || 
                          configurator.retrieveParameter({ key: 'SYSTEM_TOKEN' });
                          
    const provided = (providedToken || "").toString().trim();
    const expected = (expectedToken || "").toString().trim();
    
    return provided && expected && (provided === expected);
  },

  /**
   * Verifica si una herramienta está autorizada para ejecutarse.
   * AXIOMA DE CONFIANZA ORGÁNICA (Yoneda Synthesis):
   * - Si el nodo está registrado Y tiene un contrato válido, la invocación es legítima.
   * - La whitelist manual es solo un fallback para casos legacy.
   */
  isWhitelisted: function(nodeKey, methodName, { nodes, laws, mcepCore }) {
    if (!nodeKey || !methodName) return false;
    
    const node = nodes[nodeKey];
    const toolId = `${nodeKey}_${methodName}`;

    // ═══════════════════════════════════════════════════════════════════════
    // TIER 1: VALIDACIÓN POR IDENTIDAD SOBERANA (Nuevo Paradigma)
    // ═══════════════════════════════════════════════════════════════════════
    
    // 1.1 AXIOMA: Nodos Registrados son Confiables por Definición
    // Si el nodo está en el registro, su existencia es su credencial
    if (node && typeof node === 'object') {
      
      // 1.2 AXIOMA: Contrato Válido = Autorización Implícita
      // Verificamos si existe un contrato (en ContractRegistry o en el nodo)
      const hasGlobalContract = typeof ContractRegistry !== 'undefined' && ContractRegistry.get(methodName);
      const hasLocalSchema = node.schemas && node.schemas[methodName];
      
      if (hasGlobalContract || hasLocalSchema) {
        const schema = hasGlobalContract || hasLocalSchema;
        
        // 1.3 AXIOMA: Exposición Pública Explícita
        if (schema.exposure === 'public' || schema.access_level === 'public') {
          return true;
        }
        
        // 1.4 AXIOMA: Confianza Interna (Nodos Core)
        // Los nodos core pueden invocar métodos internos entre sí
        const logic = laws.axioms || {};
        const coreNodes = logic.CRITICAL_SYSTEMS || ['public', 'sensing', 'commander', 'sonda', 'metabolism'];
        if (coreNodes.includes(nodeKey)) {
          return true;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIER 2: VALIDACIÓN POR MCEP (AI-Governance)
    // ═══════════════════════════════════════════════════════════════════════
    
    // 2.1 AXIOMA: MCEP como Oráculo de Capacidades
    if (mcepCore && typeof mcepCore.getModelTooling === 'function') {
      const manifest = mcepCore.getModelTooling({ accountId: 'system' });
      const isAuthorizedByMCEP = Array.isArray(manifest.tools)
        ? manifest.tools.some(t => t.node === nodeKey && t.method === methodName)
        : (manifest.tools && manifest.tools[toolId]);
      if (isAuthorizedByMCEP) return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIER 3: FALLBACK LEGACY (Whitelist Manual)
    // ═══════════════════════════════════════════════════════════════════════
    
    // 3.1 AXIOMA: Compatibilidad con Sistemas Antiguos
    const logic = laws.axioms || {};
    const securityWhitelist = logic.SECURITY_WHITELIST || [
      'public_verifySovereignEnclosure',
      'public_getArtifactSchemas',
      'public_executeAction',
      'sensing_scanArtifacts',
      'adminTools_setSystemToken'
    ];
    if (securityWhitelist.includes(toolId)) return true;

    // ═══════════════════════════════════════════════════════════════════════
    // VEREDICTO FINAL: DENEGACIÓN POR DEFECTO
    // ═══════════════════════════════════════════════════════════════════════
    return false;
  },

  /**
   * Ejecuta una invocación segura sobre un nodo.
   */
  secureInvoke: function(nodeKey, methodName, input, { nodes, laws, mcepCore, errorHandler, blueprintRegistry, monitoringService }) {
    const node = nodes[nodeKey];
    if (!node) throw errorHandler.createError("DISCOVERY_ERROR", `Node '${nodeKey}' not found.`);
    const method = node[methodName];
    if (typeof method !== 'function') throw errorHandler.createError("DISCOVERY_ERROR", `Method '${methodName}' not found in '${nodeKey}'.`);

    // AXIOMA V12: Interceptor de Realidad (Middleware de Soberanía)
    const snapshotSignal = this._checkRealityPiggyback(input, { nodes, monitoringService });

    // AXIOMA: Whitelist Gate (L4 Security)
    if (!this.isWhitelisted(nodeKey, methodName, { nodes, laws, mcepCore })) {
      throw errorHandler.createError("SECURITY_BLOCK", `Invocation denied: Tool '${nodeKey}_${methodName}' is not in the authorized MCEP whitelist.`);
    }

    // AXIOMA: Soberanía de Contratos (El QUÉ)
    const schema = ContractRegistry.get(methodName) || (node.schemas && node.schemas[methodName]);
    
    const logic = laws.axioms || {};
    const isTier1 = logic.CRITICAL_SYSTEMS && logic.CRITICAL_SYSTEMS.includes(nodeKey);
    
    if (!schema) {
      if (isTier1) throw errorHandler.createError("ARCHITECTURAL_BLOCK", `Method '${methodName}' in Tier 1 '${nodeKey}' has no schema.`);
      const res = method.call(node, input);
      return this._imprintSnapshotSignal(res, snapshotSignal);
    }

    const ioDef = schema.io_interface || schema.io;
    if (ioDef && ioDef.inputs) {
      // AXIOMA: Validación por Blueprint (El CÓMO)
      const v = blueprintRegistry.validatePayload(input, ioDef.inputs);
      if (!v.isValid) throw errorHandler.createError("STRUCTURAL_BLOCK", `Inputs fail: ${(v.errors || []).join(', ')}`);
    }

    const result = method.call(node, input);
    return this._imprintSnapshotSignal(result, snapshotSignal);
  },

  /**
   * Ejecuta un batch de comandos de forma atómica.
   */
  executeBatch: function({ commands }, deps) {
    const { errorHandler, monitoringService } = deps;
    if (!Array.isArray(commands)) throw errorHandler.createError("INVALID_INPUT", "Commands must be an array.");
    
    const _monitor = monitoringService || { logInfo: () => {}, logError: () => {} };
    _monitor.logInfo(`[SovereignGuard] Executing Batch of ${commands.length} commands.`);

    // AXIOMA V12: Piggybacking Colectivo (Una sola estabilización por lote)
    const piggy = commands.find(c => c.payload && c.payload._carriedReality);
    const snapshotSignal = piggy ? this._checkRealityPiggyback(piggy.payload, deps) : null;

    if (snapshotSignal) {
      // Limpiamos redundancias para que secureInvoke no re-procese
      commands.forEach(c => {
        if (c.payload) {
          delete c.payload._carriedReality;
          delete c.payload.snapshot;
        }
      });
    }
    
    const results = commands.map(cmd => {
      try {
        return this.secureInvoke(cmd.service, cmd.method, cmd.payload, deps);
      } catch (e) {
        _monitor.logError(`[Batch] Critical error in ${cmd.service}:${cmd.method}: ${e.message}`);
        return { error: e.message, code: e.code || "BATCH_ITEM_ERROR", success: false };
      }
    });

    // Inyectar señal en el primer resultado si existe
    if (snapshotSignal && results.length > 0) {
      this._imprintSnapshotSignal(results[0], snapshotSignal);
    }

    return results;
  },

  /**
   * AXIOMA V12: Verificación de la "Mochila de Realidad" (ADR 003)
   * Intercepta y estabiliza la realidad antes de la ejecución.
   */
  _checkRealityPiggyback: function(input, { nodes, monitoringService }) {
    if (input && input._carriedReality && input.snapshot) {
      const signal = { success: false };
      try {
        const sensing = nodes.sensing;
        if (sensing && typeof sensing.stabilizeAxiomaticReality === 'function') {
          if (monitoringService) monitoringService.logInfo(`[SovereignGuard:Piggyback] 🎒 Stabilizing reality...`);
          const res = sensing.stabilizeAxiomaticReality({
            snapshot: input.snapshot,
            _carriedReality: true
          });
          signal.success = res.success;
          signal.revisionHash = res._revisionHash;
        }
      } catch (e) {
        if (monitoringService) monitoringService.logWarn(`[SovereignGuard:Piggyback] ⚠️ Fail: ${e.message}`);
        signal.error = e.message;
      } finally {
        delete input._carriedReality;
        delete input.snapshot;
      }
      return signal;
    }
    return null;
  },

  /**
   * Imprime la señal del snapshot en el resultado de la operación.
   */
  _imprintSnapshotSignal: function(result, signal) {
    if (!signal) return result;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      result._snapshot = signal;
    }
    return result;
  },

  /**
   * Expone las capacidades de los nodos sobre una instancia objetivo (PublicAPI).
   * AXIOMA: Soberanía Dinámica y Despacho Seguro.
   */
  exposeNodeCapabilities: function(targetInstance, { nodes, manifest, configurator, _secureInvoke }) {
    if (!targetInstance.schemas) targetInstance.schemas = {};
    const targetId = targetInstance.id === "public_api" ? "public" : targetInstance.id;

    Object.keys(nodes).forEach(nodeKey => {
      // AXIOMA: Evitar Bucle de Retroalimentación (Self-Proxy Loop)
      if (nodeKey === targetId) return;

      const node = nodes[nodeKey];
      if (node && node.schemas && !node.isBroken) {
        
        for (const methodName in node.schemas) {
          const schema = node.schemas[methodName];
          
          // 1. Exposición de Esquemas (Metadata)
          targetInstance.schemas[`${nodeKey}:${methodName}`] = schema;
          if (!targetInstance.schemas[methodName]) {
            targetInstance.schemas[methodName] = schema;
          }

          // 2. Exposición de Métodos (Funciones)
          if (!targetInstance[methodName]) {
            targetInstance[methodName] = (input) => {
              const { accountId, cosmosId } = input || {};
              const ctx = (input && input.systemContext) || 
                          (typeof _buildSystemContext === 'function' ? _buildSystemContext({ constitution: manifest, configurator, accountId, cosmosId }) : {});
              
              return _secureInvoke(nodeKey, methodName, { ...input, systemContext: ctx });
            };
          }
        }
      }
    });
  }
};
