/**
 * 🛰️ MCEP_Core.gs (Capa 1)
 * Version: 1.0.0
 * Dharma: Model Cognitive Execution Protocol - The Sovereign Translator.
 *         Translates technical system laws and node capabilities into 
 *         high-fidelity cognitive digests for AI reasoning.
 */
function createMCEPService({ laws, nodesRegistry, errorHandler, monitoringService }) {
  const _monitor = monitoringService || { logInfo: () => {}, logError: () => {} };
  
  /**
   * Generates a "Cognitive Digest" of system laws based on a specific scope.
   * This prevents token bloat by only sending what the AI needs to know.
   * @param {string} scope - The law area to digest (e.g., 'spatial', 'logic', 'constitution')
   */
  function digestLaws(scope = 'logic') {
    const result = {
      scope: scope,
      timestamp: new Date().toISOString(),
      axioms: {}
    };

    switch(scope) {
      case 'logic':
        result.axioms = laws.axioms || {};
        break;
      case 'constitution':
        result.axioms = laws.constitution || {};
        break;
      case 'visual':
        result.axioms = laws.visual || {};
        break;
      case 'spatial':
        result.axioms = laws.spatial || {};
        break;
      case 'blueprints':
        result.axioms = laws.blueprints || {};
        break;
      case 'all':
        result.axioms = laws;
        break;
      default:
        result.axioms = laws.axioms || {};
    }

    return result;
  }

  /**
   * Resolves available system capabilities filtered by the current transaction ADN (Context).
   * @param {object} systemContext - The transactional ADN (accountId, cosmosId).
   */
  function resolveCapabilities(systemContext = {}) {
    const { accountId, cosmosId } = systemContext;
    
    // AXIOMA: Soberanía de Herramientas (ADN-Aware)
    // Devolvemos solo lo que este contexto tiene permitido ver.
    const capabilities = {};
    
    Object.keys(nodesRegistry).forEach(key => {
      const node = nodesRegistry[key];
      if (node && node.schemas) {
        // TODO: Implementar lógica de filtrado por reglas de acceso en System_Constitution
        // Por ahora, devolvemos todo si el nodo está registrado.
        capabilities[key] = {
          label: node.label,
          description: node.description,
          archetype: node.archetype,
          semantic_intent: node.semantic_intent,
          tools: node.schemas
        };
      }
    });

    return {
      context: { accountId, cosmosId },
      capabilities
    };
  }

  /**
   * High-fidelity mapping of capabilities to AI-Ready Tool Format.
   */
  function getModelTooling(systemContext = {}) {
    const { capabilities } = resolveCapabilities(systemContext);
    const toolList = [];

    for (const nodeKey in capabilities) {
      const node = capabilities[nodeKey];
      for (const method in node.tools) {
        const schema = node.tools[method];
        toolList.push({
          node: nodeKey,
          method: method,
          description: schema.description,
          role: schema.semantic_intent || node.semantic_intent,
          parameters: schema.io_interface ? schema.io_interface.inputs : {},
          returns: schema.io_interface ? schema.io_interface.outputs : {}
        });
      }
    }

    return {
      tools: toolList.slice(0, 50) // Hard limit for LLM context safety
    };
  }

  const schemas = {
    digestLaws: {
      description: "Generates a granular digest of system laws for AI consumption.",
      io_interface: {
        inputs: { scope: { type: "string", description: "The law scope (logic, constitution, visual, spatial, etc.)" } },
        outputs: { axioms: { type: "object" } }
      }
    },
    resolveCapabilities: {
      description: "Resolves system capabilities filtered by the transactional ADN.",
      io_interface: {
        inputs: { systemContext: { type: "object" } },
        outputs: { capabilities: { type: "object" } }
      }
    }
  };

  return Object.freeze({
    label: "MCEP Sovereign Engine",
    description: "Cognitive translation layer for law-integrated AI orchestration.",
    semantic_intent: "LOGIC_CORE",
    archetype: "SYSTEM_INFRA",
    schemas,
    digestLaws,
    resolveCapabilities,
    getModelTooling
  });
}
