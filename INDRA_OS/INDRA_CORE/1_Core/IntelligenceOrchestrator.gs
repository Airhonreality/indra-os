/**
 * 🧠 INTELLIGENCE ORCHESTRATOR (1_Core/IntelligenceOrchestrator.gs)
 * Dharma: Central nervous system for AI-driven automation and reasoning.
 * Version: 6.0.0 (COMPILED & Self-Correcting)
 */
function createIntelligenceOrchestrator({ errorHandler, configurator, driveAdapter, monitoringService, flowCompiler, mcepCore, laws = {} }) {
  if (!errorHandler) throw new Error("IntelligenceOrchestrator: errorHandler is required");
  
  const _monitor = monitoringService || { logInfo: () => {}, logError: () => {} };


  /**
   * Persists the conversation state to the physical Intelligence Folder.
   */
  function _saveCognitiveSession(prompt, response, history, model) {
    try {
      const folderId = configurator.retrieveParameter({ key: 'ORBITAL_FOLDER_MEMORY_ID' });
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
   * Optimized for token efficiency via Dynamic Tooling.
   */
  function askArchitect({ prompt, history, model, accountId, currentFlow, nodes }) {
    if (!prompt) throw errorHandler.createError("INVALID_INPUT", "Prompt is required.");
    if (!nodes || !nodes.llm) throw errorHandler.createError("SYSTEM_FAILURE", "LLM Adapter not found.");

    const targetModel = model || 'llama-3.3-70b-versatile';
    const targetAccount = accountId || 'default';
    
    // AXIOMA: Soberanía Cognitiva Dinámica (MCEP Engine)
    const systemContext = arguments[0].systemContext || { accountId: targetAccount };
    
    // [MCP-EVOLUTION]: Cargamos solo el índice de herramientas (Modo Discovery)
    const { tools: toolIndex = [] } = mcepCore.getModelTooling(systemContext, { mode: 'DISCOVERY' });
    const leanFlow = _stripProjection(currentFlow);
    
    // Obtenemos el prompt soberano de las Leyes
    const architectLaw = (typeof COGNITIVE_PROMPTS !== 'undefined') 
                        ? COGNITIVE_PROMPTS.SYSTEM_ROLES.ORBITAL_ARCHITECT 
                        : null;

    if (!architectLaw) throw errorHandler.createError('SYSTEM_FAILURE', '[Intelligence] COGNITIVE_PROMPTS Law not found.');

    let currentSystemInstruction = `
      ${architectLaw.instruction}
      
      --- CATÁLOGO DE CAPACIDADES (DISCOVERY MODE) ---
      El sistema cuenta con las siguientes herramientas. Si necesitas usar una, solicita su esquema completo primero:
      ${toolIndex.join('\n')}

      --- ESTADO ACTUAL DEL CANVAS ---
      ${leanFlow && Object.keys(leanFlow.nodes || {}).length > 0 ? JSON.stringify(leanFlow, null, 2) : "VACÍO"}
    `;

    let retryCount = 0;
    const MAX_RETRIES = 2;
    let lastError = null;

    while (retryCount <= MAX_RETRIES) {
      try {
        const finalPrompt = lastError ? `${prompt}\n\n⚠️ REPARACIÓN REQUERIDA:\n${lastError}` : prompt;

        const aiResponse = nodes.llm.chat({
          prompt: finalPrompt,
          messages: history || [],
          model: targetModel,
          accountId: targetAccount,
          systemInstruction: currentSystemInstruction,
          temperature: 0.1
        });

        // MCP LOOP: ¿La IA está pidiendo el esquema de una herramienta?
        if (aiResponse.response.includes('mcep.getToolSchema')) {
            _monitor.logInfo(`[Architect] MCP Handshake: Resolviendo esquema de herramienta solicitado...`);
            // Aquí se dispararía la lógica de re-inyección de esquema, pero por ahora devolvemos la respuesta 
            // permitiendo que el Front-End o un middleware maneje la segunda vuelta.
        }

        // Simulación Interna (DryRun)
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const flowCandidate = JSON.parse(jsonMatch[0].trim());
            if (flowCompiler && flowCandidate.nodes) {
              _monitor.logInfo(`[Architect] Ejecutando DryRun Simulación (Topología)...`);
              flowCompiler.compile(flowCandidate); 
            }
          } catch (e) {
             _monitor.logWarn(`[Architect] Simulación ignorada (JSON no era un flow): ${e.message}`);
          }
        }

        _saveCognitiveSession(prompt, aiResponse.response, history || [], targetModel);

        return {
          response: aiResponse.response,
          metadata: {
            ...aiResponse.metadata,
            architectVersion: architectLaw.version,
            retries: retryCount,
            timestamp: new Date().toISOString()
          }
        };

      } catch (e) {
        _monitor.logError(`[Architect] Intento ${retryCount + 1} fallido: ${e.message}`);
        lastError = e.message;
        retryCount++;
      }
    }
  }

  // --- SOVEREIGN CANON V8.0 ---
  const CANON = {
      LABEL: "Orbital Architect",
      ARCHETYPE: "ORCHESTRATOR",
      DOMAIN: "INTELLIGENCE",
      SEMANTIC_INTENT: "BRAIN",
      CAPABILITIES: {
          "askArchitect": {
              "io": "READ",
              "desc": "Execute cognitive reasoning session",
              "inputs": {
                  "prompt": { "type": "string" },
                  "history": { "type": "array", "optional": true },
                  "model": { "type": "string", "optional": true },
                  "currentFlow": { "type": "object", "optional": true }
              }
          }
      },
      VITAL_SIGNS: {
          "COGNITION": { "criticality": "NOMINAL", "value": "HIGH", "trend": "stable" }
      },
      UI_LAYOUT: {
          "SIDE_PANEL": "ENABLED",
          "TERMINAL_STREAM": "ENABLED"
      }
  };

  return {
    CANON,
    id: "orbital_architect",
    label: "Orbital Architect",
    description: "Industrial reasoning engine for workspace orchestration and AI-driven topological design.",
    archetype: "ORCHESTRATOR",
    domain: "INTELLIGENCE",
    semantic_intent: "BRAIN",
    
    // Legacy Bridge
    get schemas() {
        const s = {};
        for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
            s[key] = {
                description: cap.desc,
                io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
            };
        }
        return s;
    },

    askArchitect
  };
}

