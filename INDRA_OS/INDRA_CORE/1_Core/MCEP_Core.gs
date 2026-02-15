/**
 * 🛰️ MCEP_Core.gs (Capa 1)
 * Version: 1.0.0
 * Dharma: Model Cognitive Execution Protocol - The Sovereign Translator.
 *         Translates technical system laws and node capabilities into 
 *         high-fidelity cognitive digests for AI reasoning.
 */
function createMCEP_Core({ laws, nodesRegistry, errorHandler, monitoringService }) {
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
      case 'distribution':
        result.axioms = laws.distribution || {};
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
        // AXIOMA: Visibilidad Universal (Reflexión Genética v8.0)
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
   * V2: Supports HIERARCHICAL discovery for cognitive economy.
   */
  function getModelTooling(systemContext = {}, options = {}) {
    const { capabilities } = resolveCapabilities(systemContext);
    const { mode = 'HIERARCHICAL' } = options; // Default to Smart Tree
    
    // Si el modo es plano (Legacy o Explicit), devolvemos todo
    if (mode === 'FLAT' || mode === 'FULL_SCHEMA') {
      return _generateFlatTooling(capabilities);
    }

    // Modo Discovery: Índice de nombres para economía de tokens
    if (mode === 'DISCOVERY') {
       const flatList = [];
       Object.keys(capabilities).forEach(nodeKey => {
         const node = capabilities[nodeKey];
         if (node.tools) {
           Object.keys(node.tools).forEach(m => {
              flatList.push(`${nodeKey}:${m} [${node.label || nodeKey}]`);
           });
         }
       });
       return { tools: flatList };
    }

    // Modo Jerárquico (V2): Árbol de Capacidades
    const tree = _categorizeTools(capabilities);
    
    // Tools Base: Siempre disponibles (Core + Navigation)
    const baseTools = [
      {
        node: "mcep",
        method: "expandCategory",
        description: "Expands a specific tool category to reveal its detailed functions.",
        role: "SYSTEM_NAVIGATION",
        parameters: { category: { type: "string", description: "The category to expand (e.g., 'DRIVE', 'COMMUNICATION')" } },
        returns: { tools: { type: "array" } }
      }
    ];

    // Añadir herramientas críticas (Tier 1) directamente para evitar latencia
    // Ej: Memory, Search, etc.
    const criticalTools = _generateFlatTooling(capabilities, ['mcep', 'public', 'sensing']); 

    return {
      mode,
      taxonomy: Object.keys(tree).map(domain => ({
        category: domain,
        description: `Access to ${domain} related capabilities. Contains ${tree[domain].length} tools.`,
        tools_count: tree[domain].length
      })),
      tools: [...baseTools, ...criticalTools]
    };
  }

  /**
   * Expands a category to reveal its full toolset.
   * Used by the AI to drill-down into specific domains.
   */
  function expandCategory(categoryName, systemContext = {}) {
    const { capabilities } = resolveCapabilities(systemContext);
    const tree = _categorizeTools(capabilities);
    const domain = categoryName.toUpperCase();
    
    if (!tree[domain]) {
        return { error: `Category '${domain}' not found. Available: ${Object.keys(tree).join(', ')}` };
    }

    return {
        category: domain,
        tools: _generateFlatHelper(tree[domain], capabilities)
    };
  }

  // --- INTERNAL HELPERS ---

  function _categorizeTools(capabilities) {
    const tree = {};
    for (const nodeKey in capabilities) {
        const node = capabilities[nodeKey];
        const domain = (node.semantic_intent || 'GENERAL').toUpperCase(); // SYSTEM, DRIVE, SOCIAL
        
        if (!tree[domain]) tree[domain] = [];
        // Guardamos solo la referencia, no el esquema completo aún
        tree[domain].push(nodeKey);
    }
    return tree;
  }

  function _generateFlatTooling(capabilities, filterNodes = null) {
      const toolList = [];
      for (const nodeKey in capabilities) {
          if (filterNodes && !filterNodes.includes(nodeKey)) continue;
          
          const node = capabilities[nodeKey];
          toolList.push(..._generateFlatHelper([nodeKey], capabilities));
      }
      return toolList;
  }

  function _generateFlatHelper(nodeKeys, capabilities) {
      const list = [];
      nodeKeys.forEach(nodeKey => {
          const node = capabilities[nodeKey];
          if (!node) return;

          for (const method in node.tools) {
            const schema = node.tools[method];
            if (!schema) continue; // GUARD: Resiliencia ante contratos inexistentes

            list.push({
                node: nodeKey,
                method: method,
                // AXIOMA V2: Risk Tagging Exposure
                risk: schema.risk || 'UNKNOWN', 
                description: schema.description,
                role: schema.semantic_intent || node.semantic_intent,
                parameters: schema.io_interface ? schema.io_interface.inputs : {},
                returns: schema.io_interface ? schema.io_interface.outputs : {}
            });
          }
      });
      return list;
  }

  /**
   * Extrae el esquema completo de una herramienta específica.
   */
  function getToolSchema(nodeKey, method) {
    const node = nodesRegistry[nodeKey];
    if (!node || !node.schemas || !node.schemas[method]) {
        throw errorHandler.createError('NOT_FOUND', `Tool ${nodeKey}.${method} not found in nodes registry.`);
    }

    const schema = node.schemas[method];
    return {
        node: nodeKey,
        method: method,
        schema: {
            description: schema.description,
            parameters: schema.io_interface ? schema.io_interface.inputs : {},
            returns: schema.io_interface ? schema.io_interface.outputs : {}
        }
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
    },
    getToolSchema: {
        description: "Retrieves the full JSON Schema for a specific system tool.",
        io_interface: {
            inputs: { 
                nodeKey: { type: "string" },
                method: { type: "string" }
            },
            outputs: {
                schema: { type: "object" }
            }
        }
    },
    expandCategory: {
        description: "Expands a high-level tool category (domain) to reveal its specific tools.",
        io_interface: {
            inputs: { categoryName: { type: "string" } },
            outputs: { tools: { type: "array" } }
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
    getModelTooling,
    getToolSchema,
    expandCategory // <--- NEW V2 TOOL
  });
}





