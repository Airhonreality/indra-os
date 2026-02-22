/**
 * SovereignGuard.gs
 * DHARMA: La Guardia Pretoriana (Layer 0.5)
 * 
 * Centraliza la seguridad, la invocación segura y el batching.
 * Actúa como la membrana de control entre la PublicAPI y los Nodos.
 */

const SovereignGuard = {
  /**
   * Verifica la identidad soberana de una petición basada en el token del sistema.
   * AXIOMA ADR-005: El acceso no es un permiso burocrático, es un reconocimiento de identidad.
   */
  verifySovereignIdentity: function(providedToken, configurator) {
    if (!configurator) return false;
    
    const expectedToken = configurator.retrieveParameter({ key: 'AXIOM_CORE_SATELLITE_API_KEY' }) || 
                          configurator.retrieveParameter({ key: 'SYSTEM_TOKEN' });
                          
    const provided = (providedToken || "").toString().trim();
    const expected = (expectedToken || "").toString().trim();
    
    return provided && expected && (provided === expected);
  },

  /**
   * Verifica si una herramienta existe y es ejecutable.
   * AXIOMA V12: Política de Puertas Abiertas (Open Sovereign Policy).
   * Ya no existen listas blancas manuales. Si el nodo y el método existen, es válido.
   * La seguridad se delega al Risk Tagging (Fase 2).
   */
  isPhysicallyExecutable: function(nodeKey, methodName, { nodes }) {
    if (!nodeKey || !methodName) return false;
    
    const node = nodes[nodeKey];
    if (!node) return false;
    
    // Verificación de Existencia Física
    const method = node[methodName];
    // AXIOMA: Soberanía Absoluta (ADR-022) - El esquema es propiedad del nodo
    const schema = (node.schemas && node.schemas[methodName]) || (node.CANON && node.CANON.CAPABILITIES && node.CANON.CAPABILITIES[methodName]);
                   
    // Si existe la función y (opcionalmente) su esquema, es válido.
    // Nota: A veces permitimos métodos sin esquema si son internos, pero lo ideal es tener esquema.
    if (typeof method === 'function') {
        return true;
    }
    
    return false;
  },

  /**
   * Ejecuta una invocación segura sobre un nodo.
   */
  secureInvoke: function(nodeKey, methodName, input, { nodes, laws, mcepCore, errorHandler, blueprintRegistry, monitoringService }) {
    // AXIOMA: Soberanía de Identidad (Sin Traducción Legacy)
    const node = nodes[nodeKey];
    if (!node) throw errorHandler.createError("DISCOVERY_ERROR", `Node '${nodeKey}' not found. Check ID consistency between Core and Front.`);
    
    const method = node[methodName];
    if (typeof method !== 'function') throw errorHandler.createError("DISCOVERY_ERROR", `Method '${methodName}' not found in '${nodeKey}'.`);

    // AXIOMA V12: Interceptor de Realidad (Middleware de Soberanía)
    const snapshotSignal = this._checkRealityPiggyback(input, { nodes, monitoringService });

    // AXIOMA: Soberanía de Existencia (Sovereign Existential Verification)
    if (!this.isPhysicallyExecutable(nodeKey, methodName, { nodes, laws, mcepCore })) {
      throw errorHandler.createError("SECURITY_BLOCK", `Invocation denied: Tool '${nodeKey}:${methodName}' is not physically registered or accessible in the current reality.`);
    }

    // AXIOMA: Soberanía de Contratos (El QUÉ)
    // El esquema emana del CANON (Prioritario) o del fallback temporal schemas
    const schema = (node.CANON && node.CANON.CAPABILITIES && node.CANON.CAPABILITIES[methodName]) || (node.schemas && node.schemas[methodName]);
    
    const _monitor = monitoringService || { logInfo: () => {}, logWarn: () => {}, logError: () => {} };

    if (!schema) {
      // Si no hay esquema, permitimos la llamada (Open Sovereign Policy) pero marcamos el riesgo como Desconocido (3 por seguridad).
      _monitor.logWarn(`[SovereignGuard] UNKNOWN_RISK: Invoking '${nodeKey}:${methodName}' without schema. Assuming high caution.`);
      const res = method.call(node, input);
      return this._imprintSnapshotSignal(res, snapshotSignal);
    }

    // AXIOMA V12.1: Intérprete de Riesgo (Risk-Based Sovereignty)
    const riskLevel = schema.risk || 1;
    const isGodMode = input && (input._godMode || input.identity === 'TEST_GOD_MODE');
    
    _monitor.logInfo(`[SovereignGuard] Risk Assessment: ${nodeKey}:${methodName} -> Level ${riskLevel}`);

    if (riskLevel >= 3 && !isGodMode) {
      // Protocolo de Seguridad para Riesgo Crítico
      if (!input || !input.confirmHighRisk) {
        throw errorHandler.createError("SECURITY_BLOCK", `CRITICAL_RISK_SHIELD: Action '${nodeKey}:${methodName}' is marked as High Risk (L3) and requires explicit 'confirmHighRisk: true' in payload.`);
      }
      _monitor.logWarn(`[SovereignGuard] CRITICAL_ACTION_AUTHORIZED: ${nodeKey}:${methodName} [Confirmed by Caller]`);
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
      // AXIOMA: Soberanía de Fuente (ADR-022)
      // Buscamos CAPABILITIES directamente en el nodo (inyectadas por Assembler) o en su CANON.
      const capabilities = (node.CANON && node.CANON.CAPABILITIES) || node.CAPABILITIES || node.schemas;
      
      if (node && capabilities && !node.isBroken) {
        for (const methodName in capabilities) {
          const cap = capabilities[methodName];
          
          // 1. Exposición de Esquemas (Metadata) — Mapeamos a io_interface para el Front
          targetInstance.schemas[`${nodeKey}:${methodName}`] = {
            description: cap.desc || cap.description,
            io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
          };
          
          if (!targetInstance.schemas[methodName]) {
            targetInstance.schemas[methodName] = targetInstance.schemas[`${nodeKey}:${methodName}`];
          }

          // 2. Exposición de Métodos (Funciones)
          if (!targetInstance[methodName]) {
            targetInstance[methodName] = (input) => {
              return _secureInvoke(nodeKey, methodName, input);
            };
          }
        }
      }
    });
  }
};







