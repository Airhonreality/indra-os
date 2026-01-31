/**
 * 🧠 INTELLIGENCE ORCHESTRATOR (1_Core/IntelligenceOrchestrator.gs)
 * Dharma: Central nervous system for AI-driven automation and reasoning.
 * Version: 6.0.0 (COMPILED & Self-Correcting)
 */
function createIntelligenceOrchestrator({ errorHandler, configurator, driveAdapter, monitoringService, flowCompiler, gatekeeper, mcepService, laws = {} }) {
  if (!errorHandler) throw new Error("IntelligenceOrchestrator: errorHandler is required");
  
  const _monitor = monitoringService || { logInfo: () => {}, logError: () => {} };


  /**
   * Persists the conversation state to the physical Intelligence Folder.
   */
  function _saveCognitiveSession(prompt, response, history, model) {
    try {
      const folderId = configurator.retrieveParameter({ key: 'system_folder_intelligenceMemoryFolder_id' });
      if (!folderId) return;

      const fullHistory = [...history, { io_behavior: 'user', content: prompt }, { io_behavior: 'assistant', content: response }];
      const sessionData = {
        lastUpdate: new Date().toISOString(),
        model: model,
        messageCount: fullHistory.length,
        messages: fullHistory
      };

      driveAdapter.store({
         folderId: folderId,
         fileName: `cognitive_session_active.json`, 
         content: JSON.stringify(sessionData, null, 2),
         mimeType: "application/json",
         overwrite: true
      });
    } catch (e) {
      _monitor.logError(`INTELLIGENCE >> Archive Failure: ${e.message}`);
    }
  }

  /**
   * Strips a full projection to its bare essentials for token efficiency.
   */
  function _stripProjection(flow) {
    if (!flow || !flow.nodes) return flow;
    const strippedNodes = {};
    for (const [id, node] of Object.entries(flow.nodes)) {
       strippedNodes[id] = {
         id: node.uuid || id,
         instanceOf: node.instanceOf,
         label: node.label
       };
    }
    return {
      nodes: strippedNodes,
      connections: flow.connections || []
    };
  }

  /**
   * Main interaction point for the ORBITAL ARCHITECT.
   * AXIOMA v6.0: Iterative DryRun Simulation.
   */
  function askArchitect({ prompt, history, model, accountId, currentFlow, nodes }) {
    if (!prompt) throw errorHandler.createError("INVALID_INPUT", "Prompt is required.");
    if (!nodes || !nodes.llm) throw errorHandler.createError("SYSTEM_FAILURE", "LLM Adapter not found.");

    const targetModel = model || 'llama-3.3-70b-versatile';
    const targetAccount = accountId || 'default';
    
    // AXIOMA: Soberanía Cognitiva Dinámica (MCEP Engine)
    // El Architect ahora consulta sus herramientas directamente al motor MCEP en Capa 1.
    const systemContext = arguments[0].systemContext || { accountId: targetAccount };
    const { tools: toolInterface } = mcepService.getModelTooling(systemContext);
    const leanFlow = _stripProjection(currentFlow);
    
    let currentSystemInstruction = `
      Eres el ORBITAL ARCHITECT (V6.5 YONEDA-ALIGNED). Tu misión es diseñar flujos de alta integridad y coherencia formal.
      
      --- REGLA DE ORO (MODO COMPILED) ---
      NUNCA generes una propiedad "steps". El Core compila automáticamente la secuencia desde los "connections".
      Tu respuesta debe centrarse en definir la TOPOLOGÍA (Nodos + Connections).
      
      --- ANATOMÍA DEL FLOW ---
      1. NODOS: { "id": "unique_id", "instanceOf": "adapter", "method": "method", "label": "label" }
      2. CABLES (Connections): { "from": "nodeA", "to": "nodeB", "fromPort": "output_key", "toPort": "input_key" }
      
      --- LEYES AXIOMÁTICAS (PROTOCOLOS DE INTEGRIDAD) ---
      ${JSON.stringify(laws.axioms || {}, null, 2)}

      --- CATÁLOGO CINÉTICO (HERRAMIENTAS DISPONIBLES) ---
      ${JSON.stringify(toolInterface, null, 2)}

      --- ESTADO ACTUAL DEL CANVAS ---
      ${leanFlow && Object.keys(leanFlow.nodes || {}).length > 0 ? JSON.stringify(leanFlow, null, 2) : "VACÍO"}

      --- LEMA DE YONEDA (CERO ESPECULACIÓN) ---
      Un nodo solo existe si sus conexiones son válidas. No inventes puertos ni métodos.
      Respuesta: Bloque JSON puro del flow + razonamiento breve de por qué este diseño es el óptimo.
    `;

    let retryCount = 0;
    const MAX_RETRIES = 2;
    let lastError = null;

    while (retryCount <= MAX_RETRIES) {
      try {
        const finalPrompt = lastError ? `${prompt}\n\n⚠️ CORRECCIÓN TÉCNICA REQUERIDA:\nEl diseño anterior falló en la simulación con el siguiente error:\n"${lastError}"\nPor favor, corrige el cableado o las herramientas en el JSON.` : prompt;

        const aiResponse = nodes.llm.chat({
          prompt: finalPrompt,
          messages: history || [],
          model: targetModel,
          accountId: targetAccount,
          systemInstruction: currentSystemInstruction,
          temperature: 0.1
        });

        // Simulación Interna (DryRun)
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const flowCandidate = JSON.parse(jsonMatch[0]);
          
          if (flowCompiler) {
            _monitor.logInfo(`[Architect] Ejecutando DryRun Simulación (Topología)...`);
            flowCompiler.compile(flowCandidate); // Si falla, lanza excepción y va al catch
          }
        }

        _saveCognitiveSession(prompt, aiResponse.response, history || [], targetModel);

        return {
          response: aiResponse.response,
          metadata: {
            ...aiResponse.metadata,
            architectVersion: "6.0.0_COMPILED",
            retries: retryCount,
            timestamp: new Date().toISOString()
          }
        };

      } catch (e) {
        _monitor.logError(`[Architect] Intento ${retryCount + 1} fallido: ${e.message}`);
        lastError = e.message;
        retryCount++;
        if (retryCount > MAX_RETRIES) {
           throw errorHandler.createError("LLM_SIMULATION_FAILURE", `El Arquitecto no pudo converger en un diseño válido tras ${MAX_RETRIES} reintentos. Error final: ${e.message}`);
        }
      }
    }
  }

  const schemas = {
    askArchitect: {
      description: "Executes a cognitive reasoning session via external LLM providers, injecting industrial contract digests and workspace state.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          prompt: { type: "string", io_behavior: "STREAM", description: "Natural language query for the architect." },
          history: { type: "array", io_behavior: "STREAM", description: "Chronological conversation history stream." },
          model: { type: "string", io_behavior: "SCHEMA", description: "LLM model identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for LLM provider isolation." },
          currentFlow: { type: "object", io_behavior: "SCHEMA", description: "Technical topology under design." },
          systemContext: { type: "object", io_behavior: "SCHEMA", description: "Transactional ADN for capability resolution." },
          nodes: { type: "object", io_behavior: "BRIDGE", description: "Registry of available technical contracts." }
        },
        outputs: {
          response: { type: "string", io_behavior: "STREAM", description: "LLM-generated reasoning or technical command." },
          metadata: { type: "object", io_behavior: "PROBE", description: "Execution metadata and token telemetry." }
        }
      }
    }
  };

  return Object.freeze({
    label: "Orbital Architect",
    description: "Industrial reasoning engine for workspace orchestration and AI-driven topological design.",
    semantic_intent: "BRIDGE",
    archetype: "ORCHESTRATOR",
    schemas: schemas,
    askArchitect
  });
}

