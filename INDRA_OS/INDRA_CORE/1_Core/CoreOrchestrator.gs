/**
 * CoreOrchestrator.gs (H7 - DIRECTOR DE ORQUESTA)
 * 
 * DHARMA: Ser un Director de Orquesta con Asistentes Especializados.
 *         Orquesta el flujo de control, delega el renderizado global al
 *         RenderEngine, e inyecta dependencias en nodos especiales para
 *         que ellos manejen su propio renderizado local.
 * 
 * AXIOMAS H7 IMPLEMENTADOS:
 * - Axioma 1: Renderizado global centralizado
 * - Axioma 2: Dual path (genérico vs especial)
 * - Axioma 3: Inmutabilidad del contexto
 * - Axioma 4: Inyección de dependencias en especiales
 * - Axioma 5: Enriquecimiento de errores
 * - Axioma 6: Segregación de contratos
 * - Axioma 7: Determinismo de renderizado
 */

/**
 * Factory para crear una instancia del CoreOrchestrator (H7).
 * @param {object} config - Configuración del orquestador.
 * @param {object} config.manifest - SystemManifest.
 * @param {object} config.monitoringService - Servicio de monitoreo.
 * @param {object} config.errorHandler - Manejador de errores.
 * @param {object} config.nodes - Mapa de todos los nodos ejecutables.
 * @param {object} config.renderEngine - El motor de renderizado universal.
 * @returns {object} Instancia inmutable del CoreOrchestrator.
 */
function createCoreOrchestrator({ 
  manifest,
  laws = {}, 
  monitoringService, 
  errorHandler, 
  nodes,
  renderEngine,
  flowCompiler // Added dependency
}) {
  const constitution = laws.constitution || manifest;
  
  
  if (!constitution || !constitution.LIMITS) {
    throw new Error('CoreOrchestrator: constitution con LIMITS es requerido.');
  }
  
  // AXIOMA: Resiliencia de Infraestructura (H7-RESILIENCE)
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, 
    logEvent: () => {}, sendCriticalAlert: () => {} 
  };
  if (!errorHandler) {
    throw new Error('CoreOrchestrator: errorHandler es requerido.');
  }
  if (!nodes) {
    throw new Error('CoreOrchestrator: mapa de nodos ejecutable es requerido.');
  }
  if (nodes) console.log("[CORE-ORCHESTRATOR] Initialized with nodes: " + Object.keys(nodes).join(', '));
  if (!renderEngine || typeof renderEngine.render !== 'function') {
    throw new Error('CoreOrchestrator: renderEngine con método render() es requerido (H7).');
  }
  
  const { MAX_RETRIES = 3 } = constitution.LIMITS;
  const initialBackoffMs = 100; // Keep internal or move to limits if needed


  /**
   * Determina si un step corresponde a un nodo especial basándose en el manifest.
   * @private
   */
  function _isSpecialNode(step) {
    if (!constitution || !constitution.ORCHESTRATOR_METADATA || !constitution.ORCHESTRATOR_METADATA.specialNodes) {
      return false;
    }
    const specialNodes = constitution.ORCHESTRATOR_METADATA.specialNodes;
    const methods = specialNodes[step.adapter.toUpperCase()];
    return methods ? methods.includes(step.method) : false;
  }

  /**
   * Renderizado parcial para nodos especiales.
   * AXIOMA 4: Nodos especiales (mapObject, buildText) reciben templates crudos.
   * 
   * Estrategia:
   * - Campos de datos (object, collection, data, etc.): SE renderizan (para resolver {{dbNivel1.properties}})
   * - Campos de template (template, mapping): NO se renderizan (para preservar {{key}}, {{value}})
   * 
   * @param {object} inputMapping - El inputMapping original del step
   * @param {object} flowContext - El contexto global del flow
   * @returns {object} Payload parcialmente renderizado
   * @private
   */
  function _renderInputMappingPartial(inputMapping, flowContext) {
    if (!inputMapping || typeof inputMapping !== 'object') {
      return {};
    }
    
    // Campos que contienen templates con variables locales (NO renderizar)
    const RAW_FIELDS = ['template', 'mapping'];
    
    const resolvedPayload = {};
    
    for (const key in inputMapping) {
      if (RAW_FIELDS.includes(key)) {
        // PRESERVAR campo crudo (sin renderizar)
        // Ejemplo: template: "{{key}}: {{value.type}}" → se pasa tal cual
        resolvedPayload[key] = inputMapping[key];
      } else {
        // RENDERIZAR campo (para resolver placeholders globales)
        // Ejemplo: object: "{{dbNivel1.properties}}" → se resuelve desde flowContext
        const fieldValue = inputMapping[key];
        
        if (typeof fieldValue === 'string' && fieldValue.includes('{{')) {
          // Es un placeholder string, renderizar
          const wrapped = { _temp: fieldValue };
          const rendered = renderEngine.render(wrapped, flowContext);
          resolvedPayload[key] = rendered._temp;
        } else if (typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue)) {
          // Es un objeto, renderizar recursivamente
          resolvedPayload[key] = renderEngine.render(fieldValue, flowContext);
        } else {
          // Valor literal (número, booleano, array, null), pasar directamente
          resolvedPayload[key] = fieldValue;
        }
      }
    }
    
    return resolvedPayload;
  }


  /**
   * Ejecuta un único nodo, aplicando la lógica de "dos caminos" de H7.
   * AXIOMA 1: Renderizado global centralizado (con renderizado parcial para nodos especiales)
   * AXIOMA 2: Dual path (genérico vs especial)
   * AXIOMA 4: Inyección de dependencias en especiales
   * AXIOMA 5: Enriquecimiento de errores
   * @private
   */
  function executeNode(step, flowContext) {
    let attempt = 0;
    let resolvedPayload = null;
    
    // GRAPH-AWARE: Resolver entradas desde la topología (cables) antes de renderizar
    const connections = arguments[2] || [];
    const wiredInputMapping = _applyGraphTopology(step, flowContext, connections);
    
    while (true) {
      try {
        // AXIOMA 4: DUAL RENDERING PATH - Nodos especiales reciben templates crudos
        // para permitir el manejo de placeholders locales dentro de su propia lógica.
        const isSpecial = _isSpecialNode(step);
        
        // ═══════════════════════════════════════════════════════════════════
        // DIAGNÓSTICO ESTRATEGIA DE RENDERIZADO
        // ═══════════════════════════════════════════════════════════════════
        _monitor.logDebug(`[executeNode] 🎨 Estrategia de renderizado: ${isSpecial ? '⚡ PARCIAL (nodo especial)' : '🔄 COMPLETO (nodo genérico)'}`);
        
        if (isSpecial) {
          // RENDERIZADO PARCIAL: Usar el wiredInputMapping
          resolvedPayload = _renderInputMappingPartial(wiredInputMapping, flowContext);
          _monitor.logDebug('[executeNode] ✅ Renderizado PARCIAL completado');
        } else {
          // RENDERIZADO COMPLETO: Usar el wiredInputMapping
          resolvedPayload = renderEngine.render(wiredInputMapping, flowContext);
          _monitor.logDebug('[executeNode] ✅ Renderizado COMPLETO completado');
        }
        
        _monitor.logDebug('[executeNode] 📦 Payload DESPUÉS de renderizar:', resolvedPayload);

        // Obtener referencia al nodo
        const node = nodes[step.adapter];
        if (!node) {
          throw errorHandler.createError(
            'CONFIGURATION_ERROR',
            `Nodo ejecutor "${step.adapter}" no encontrado.`
          );
        }

        const method = node[step.method];
        if (typeof method !== 'function') {
          throw errorHandler.createError(
            'CONFIGURATION_ERROR',
            `Método "${step.method}" no encontrado en el nodo "${step.adapter}".`
          );
        }
        
        // AXIOMA: Burst Mode Detection (NetworkDispatcher Integration)
        // If the adapter declares BURST_CONFIG and enableBurst is not explicitly disabled,
        // delegate to NetworkDispatcher for efficient multi-page operations.
        const isBurstCapable = node.BURST_CONFIG && typeof node.BURST_CONFIG === 'object';
        const burstEnabled = resolvedPayload.enableBurst !== false; // Default to true if not specified
        
        if (isBurstCapable && burstEnabled && nodes.networkDispatcher) {
          _monitor.logInfo(`[CoreOrchestrator] 🌐 Burst Mode activated for ${step.adapter}.${step.method}`);
          
          return nodes.networkDispatcher.executeBurst({
            adapter: node,
            method: step.method,
            payload: resolvedPayload,
            burstConfig: node.BURST_CONFIG,
            maxTime: constitution.LIMITS?.MAX_BURST_TIME || 50000,
            maxRecords: resolvedPayload.maxRecords || null
          });
        }
        
        // AXIOMA 2 & 4: Lógica de "Dos Caminos" con dependency injection
        if (_isSpecialNode(step)) {
          // CAMINO B: Nodos Especiales reciben payload + dependencias
          return method.call(node, resolvedPayload, { 
            renderEngine: renderEngine,
            flowContext: flowContext 
          });
        } else {
          // CAMINO A: Nodos Genéricos reciben SOLO el payload
          return method.call(node, resolvedPayload);
        }
        
      } catch (error) {
        attempt++;
        const isRecoverable = errorHandler.isRecoverable ? errorHandler.isRecoverable(error) : false;
        
        if (isRecoverable && attempt <= MAX_RETRIES) {
          // Retry con backoff exponencial
          Utilities.sleep(initialBackoffMs * Math.pow(2, attempt - 1));
          continue;
        } else {
          // AXIOMA 5: Enriquecer error con contexto del step
          const enrichedError = errorHandler.createError(
            error.code || 'NODE_EXECUTION_FAILED',
            `Nodo '${step.adapter}.${step.method}' falló: ${error.message}`,
            { 
              step: step, 
              resolvedPayload: resolvedPayload, 
              originalError: error,
              attempt: attempt
            }
          );
          throw enrichedError;
        }
      }
    }
  }

  /**
   * GRAPH-AWARE: Resuelve el cableado entre nodos.
   * Si existen conexiones, inyecta los resultados de los nodos origen
   * en los campos del nodo destino especificados por toHandle.
   * @private
   */
  function _applyGraphTopology(step, flowContext, connections) {
    if (!connections || !Array.isArray(connections) || connections.length === 0) {
      return step.inputMapping || {};
    }

    const stepId = step.id;
    if (!stepId) return step.inputMapping || {};

    const resolvedInput = { ...(step.inputMapping || {}) };
    const incoming = connections.filter(c => c.target === stepId || c.to === stepId);

    incoming.forEach(conn => {
      const sourceId = conn.source || conn.from;
      const targetHandle = conn.targetHandle || conn.toHandle || conn.toPort;
      const sourceHandle = conn.sourceHandle || conn.fromHandle || conn.fromPort;
      
      // Acceder al resultado almacenado en el mapa de nodos
      let sourceNodeResult = flowContext.nodes ? flowContext.nodes[sourceId] : undefined;
      
      // AXIOMA: Extracción Granular (Si hay handle de origen, extraer la propiedad específica)
      if (sourceNodeResult !== undefined && sourceHandle && typeof sourceNodeResult === 'object' && sourceNodeResult !== null) {
        sourceNodeResult = sourceNodeResult[sourceHandle];
      }
      
      if (sourceNodeResult !== undefined) {
        if (targetHandle) {
          // Inyectar en el campo específico
          resolvedInput[targetHandle] = sourceNodeResult;
          _monitor.logDebug(`[GraphAware] 🔌 Cable conectado: ${sourceId}.${sourceHandle || 'FULL'} -> ${stepId}.${targetHandle}`);
        } else {
          // Si no hay handle, se asume que el nodo sabe qué hacer con _wiredData
          resolvedInput._wiredData = resolvedInput._wiredData || {};
          resolvedInput._wiredData[sourceId] = sourceNodeResult;
        }
      }
    });

    return resolvedInput;
  }

  /**
   * Monitorea el tamaño del contexto para prevenir crasheos por memoria.
   * @private
   */
  function _checkContextSize(context, stepIndex) {
    try {
      const sizeBytes = JSON.stringify(context).length;
      const sizeKB = Math.round(sizeBytes / 1024);
      
      if (sizeKB > 50) { // Umbral de advertencia: 50KB (GAS es sensible al heap)
        _monitor.logWarn(`[Metabolism] ⚠️ Contexto pesado DETECTADO: ${sizeKB}KB en step ${stepIndex}. Considera limpiar pasos intermedios.`);
      }
      
      _monitor.logDebug(`[Metabolism] Tamaño de contexto: ${sizeKB}KB`);
      return sizeKB;
    } catch (e) {
      _monitor.logWarn(`[Metabolism] Error al calcular tamaño de contexto: ${e.message}`);
      return 0;
    }
  }


  /**
   * Procesa una secuencia de pasos, acumulando el contexto.
   * AXIOMA 3: Contexto nunca mutado (usa spread operator)
   * @private
   */
  function processSteps(steps, context, connections = []) {
    let currentContext = context;
    
    // AXIOMA: State Snapshotting (Industrial Traceability)
    if (!currentContext._history) currentContext._history = [];
    const _snapshotLimit = 5; // Más restrictivo para proteger el heap
    
    if (!Array.isArray(steps)) {
      throw errorHandler.createError(
        'INVALID_FLOW',
        'La propiedad "steps" del flujo debe ser un array.'
      );
    }
    
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const step = steps[stepIndex];
      
      // AXIOMA v12.0: Identidad Obligatoria o Determinista (Debug Trace)
      let stepId = step.id;
      if (!stepId) {
        stepId = _generateDeterministicStepId(step, stepIndex);
        _monitor.logWarn(`[CoreOrchestrator] ⚠️ PASO ANÓNIMO DETECTADO (Step ${stepIndex + 1}). ID Determinista generado: ${stepId}. Por favor, asigne un ID explícito en el flujo.`);
      }
      
      // ═══════════════════════════════════════════════════════════════════
      // DIAGNÓSTICO STEP
      // ═══════════════════════════════════════════════════════════════════
      _monitor.logInfo(`⚙️ EJECUTANDO STEP ${stepIndex + 1}/${steps.length}: ${step.adapter}.${step.method}`);
      
      _monitor.logDebug(`[Step ${stepIndex + 1}] Metadata:`, {
        id: stepId,
        contextKeys: Object.keys(currentContext),
        inputMappingRaw: step.inputMapping
      });
      
      if (step.try && Array.isArray(step.try)) {
        try {
          currentContext = processSteps(step.try, currentContext);
        } catch (error) {
          if (step.catch && Array.isArray(step.catch)) {
            // AXIOMA 3: Crear nuevo contexto sin mutar el anterior
            const errorContext = {
              ...currentContext,
              error: {
                code: error.code,
                message: error.message,
                details: error.details || {},
                nodeContext: error.nodeContext || {}
              }
            };
            currentContext = processSteps(step.catch, errorContext);
          } else {
            throw error;
          }
        }
      } else {
        // Ejecutar step normal (pasando las conexiones)
        const nodeResult = executeNode(step, currentContext, connections);
        
        // ═══════════════════════════════════════════════════════════════════
        // DIAGNÓSTICO RESULTADO
        // ═══════════════════════════════════════════════════════════════════
        _monitor.logInfo(`🎯 STEP ${stepIndex + 1} COMPLETADO EXITOSAMENTE`);
        _monitor.logDebug(`[Step ${stepIndex + 1}] Resultado:`, nodeResult);
        
        // AXIOMA 3: Inmutabilidad - crear nuevo contexto con spread operator
        // Almacenamiento AUTOMÁTICO por ID (Persistencia de la Realidad)
        
        // AXIOMA 3 (REALISTA): Mutación Controlada para Eficiencia de Memoria
        if (!currentContext.nodes) currentContext.nodes = {};
        currentContext.nodes[stepId] = nodeResult;

        // AXIOMA: Registrar snapshot del estado actual
        try {
          const snapshot = {
            stepId: stepId,
            timestamp: new Date().toISOString(),
            // Guardamos solo los valores de los nodos para no duplicar el historial dentro del historial
            nodesState: JSON.parse(JSON.stringify(currentContext.nodes)) 
          };
          currentContext._history.push(snapshot);
          if (currentContext._history.length > _snapshotLimit) {
            currentContext._history.shift();
          }
        } catch (e) {
          _monitor.logWarn(`[Metabolism] No se pudo capturar snapshot: ${e.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // MONITOREO DE METABOLISMO
        // ═══════════════════════════════════════════════════════════════════
        _checkContextSize(currentContext, stepIndex + 1);
      }
    }
    
    return currentContext;
  }

  /**
   * Ejecuta un flujo completo.
   * @public
   */
  function executeFlow(flow, initialContext) {
    // --- PAYLOAD-AWARE ADAPTATION ---
    if (arguments.length === 1 && typeof flow === 'object' && flow.flow) {
      initialContext = flow.initialContext;
      flow = flow.flow;
    }

    // ═══════════════════════════════════════════════════════════════════
    // DIAGNÓSTICO ENTRADA FLOW
    // ═══════════════════════════════════════════════════════════════════
    _monitor.logInfo(`▶️ INICIANDO FLOW: ${flow.name || 'Sin Nombre'}`);
    _monitor.logDebug(`[CoreOrchestrator] Detalle del Flow:`, {
      name: flow.name,
      description: flow.description,
      totalSteps: flow.steps ? flow.steps.length : 0,
      contextKeys: Object.keys(initialContext || {})
    });
    
    // AXIOMA: Compilación Topológica Automática (Compiled Mode)
    if ((!flow.steps || !Array.isArray(flow.steps) || flow.steps.length === 0) && flowCompiler) {
      _monitor.logInfo(`[CoreOrchestrator] Flow '${flow.name || 'temp'}' detectado sin pasos. Compilando topología...`);
      flow.steps = flowCompiler.compile(flow, nodes);
    }
    
    if (!flow || !Array.isArray(flow.steps) || flow.steps.length === 0) {
      throw errorHandler.createError(
        'INVALID_FLOW',
        'El objeto de flujo es inválido o no contiene "steps" ni una topología válida para compilar.'
      );
    }
    
    // Inicializar mapa de nodos y extraer conexiones
    const flowContext = { 
      nodes: {}, 
      ... (initialContext || {}) 
    };
    const connections = flow.connections || [];
    
    try {
      return processSteps(flow.steps, flowContext, connections);
    } catch (error) {
      const standardizedError = error.code 
        ? error 
        : errorHandler.createError(
            'FLOW_EXECUTION_FAILED',
            error.message,
            { originalError: error.toString() }
          );
      
      try {
        if (_monitor && _monitor.sendCriticalAlert) {
          _monitor.sendCriticalAlert(standardizedError, {
            flowId: flow.name || 'unknown',
            flowContextSnapshot: flowContext
          });
        }
      } catch (alertError) {
        // Log pero no falles por alert
        if (console && console.error) {
          console.error('CoreOrchestrator: Fallo al enviar alerta crítica.', alertError);
        }
      }
      
      throw standardizedError;
    }
  }

  /**
   * Genera un ID determinista para pasos sin ID.
   * @private
   */
  function _generateDeterministicStepId(step, index) {
    const seed = `${step.adapter}_${step.method}_${index}_${JSON.stringify(step.inputMapping || {})}`;
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed)
      .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 8);
    return `auto_${step.adapter}_${hash}`;
  }

  // ============================================================
  // CONTRATO PÚBLICO
  // ============================================================

  const schemas = {
    executeFlow: {
      description: "Executes a high-integrity technical workflow, coordinating node activation, dual-path rendering, and state persistence.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          flow: { type: "object", io_behavior: "SCHEMA", description: "Canonical workflow definition (steps, topology)." },
          initialContext: { type: "object", io_behavior: "STREAM", description: "Bootstrap data stream for execution." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        }, 
        outputs: {
          finalContext: { type: "object", io_behavior: "STREAM", description: "Resulting global state after workflow completion." }
        } 
      }
    }
  };

  return Object.freeze({
    id: "core_orchestrator",
    label: "Global Orchestrator",
    description: "Industrial core engine for workflow activation, dependency orchestration, and high-integrity execution.",
    archetype: "ORCHESTRATOR",
    domain: "CORE_LOGIC",
    semantic_intent: "TRIGGER",
    schemas: schemas,
    executeFlow: executeFlow
  });
}





