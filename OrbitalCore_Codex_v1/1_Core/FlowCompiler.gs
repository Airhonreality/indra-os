/**
 * 1_Core/FlowCompiler.gs
 * 
 * DHARMA: El Gran Alquimista de Grafos.
 *         Convierte topologías visuales (nodos + conexiones) en una 
 *         secuencia lineal de ejecución (steps) determinista.
 *         Resuelve el "Topological Sort" y detecta ciclos infinitos.
 */

function createFlowCompiler({ errorHandler, schemaRegistry }) {
  if (!errorHandler) throw new Error("FlowCompiler: errorHandler is required");

  /**
   * Compila un flujo basado en su topología.
   * AXIOMA v6.5: L5 Structural Verification (Morphism Alignment).
   * 
   * @param {Object} flow - { nodes, connections, steps? }
   * @param {Object} nodeRegistry - Opcional: Registro de nodos para validación de esquemas (L5).
   * @returns {Array} steps - La secuencia lineal de ejecución refinada.
   */
  function compile(flow, nodeRegistry = {}) {
    const { nodes = {}, connections = [] } = flow;
    
    // 1. Construir el grafo de adyacencia
    const adjacency = {};
    const inDegree = {};
    const outDegree = {}; // Métrica para Dead Node Detection
    
    Object.keys(nodes).forEach(nodeId => {
      adjacency[nodeId] = [];
      inDegree[nodeId] = 0;
      outDegree[nodeId] = 0;
    });

    // 2. Validación de Morfismos (L5) y Construcción de Grafo
    connections.forEach(conn => {
      const fromId = conn.from || conn.source;
      const toId = conn.to || conn.target;
      const fromPort = conn.fromPort || conn.sourceHandle;
      const toPort = conn.toPort || conn.targetHandle;
      
      if (!nodes[fromId] || !nodes[toId]) {
        throw errorHandler.createError("TOPOLOGICAL_ERROR", `Conexión huérfana detectada entre '${fromId}' y '${toId}'.`);
      }

      // L5: Verificación de Contrato Estructural (Si hay registro disponible)
      if (schemaRegistry && nodeRegistry && fromPort && toPort) {
        _validateMorphism(fromId, fromPort, toId, toPort, nodes, nodeRegistry);
      }

      if (adjacency[fromId]) {
        adjacency[fromId].push(toId);
        inDegree[toId]++;
        outDegree[fromId]++;
      }
    });

    // 3. Algoritmo de Kahn para Topological Sort
    const queue = [];
    Object.keys(inDegree).forEach(id => {
      if (inDegree[id] === 0) queue.push(id);
    });

    const sortedIds = [];
    while (queue.length > 0) {
      const u = queue.shift();
      sortedIds.push(u);

      if (adjacency[u]) {
        adjacency[u].forEach(v => {
          inDegree[v]--;
          if (inDegree[v] === 0) queue.push(v);
        });
      }
    }

    // 4. Detección de Ciclos (Paradox Validation)
    if (sortedIds.length !== Object.keys(nodes).length) {
      throw errorHandler.createError("COMPILATION_ERROR", "Circuital Paradox Detected: El grafo no es un DAG (Directed Acyclic Graph).");
    }

    // 5. Dead Node Detection (Advertencia Industrial)
    const deadNodes = Object.keys(nodes).filter(id => inDegree[id] === 0 && outDegree[id] === 0 && Object.keys(nodes).length > 1);
    if (deadNodes.length > 0) {
      console.warn(`[FlowCompiler] DEAD_NODES_DETECTED: Los siguientes nodos no tienen conexiones y serán ignorados en la causalidad: ${deadNodes.join(", ")}`);
    }

    // 6. Mapeo a Estructura de Step Industrial
    return sortedIds.map(nodeId => {
      const nodeObj = nodes[nodeId];
      return {
        id: nodeId,
        adapter: nodeObj.instanceOf || nodeObj.adapter,
        method: nodeObj.method,
        inputMapping: nodeObj.inputMapping || {}
      };
    });
  }

  /**
   * L5 Morphism Validation: Verifica que el tipo de salida de un puerto sea compatible
   * con el tipo de entrada del receptor. (Alineación Yoneda).
   * @private
   */
  function _validateMorphism(fromId, fromPort, toId, toPort, nodes, nodeRegistry) {
    const fromNode = nodes[fromId];
    const toNode = nodes[toId];
    
    const fromAdapter = nodeRegistry[fromNode.instanceOf || fromNode.adapter];
    const toAdapter = nodeRegistry[toNode.instanceOf || toNode.adapter];
    
    if (!fromAdapter || !toAdapter) return; 

    const outSchema = fromAdapter.schemas?.[fromNode.method]?.io_interface?.outputs?.[fromPort];
    const inSchema = toAdapter.schemas?.[toNode.method]?.io_interface?.inputs?.[toPort];

    if (outSchema && inSchema) {
      if (!_deepCompareSchemas(outSchema, inSchema)) {
        throw errorHandler.createError("MORPHISM_ERROR", 
          `Incompatibilidad Estructural (L5+): Eschema de '${fromId}.${fromPort}' no es compatible con los requerimientos de '${toId}.${toPort}'.`
        );
      }
    }
  }

  /**
   * Verifica recursivamente si un esquema es un subtipo válido de otro.
   * @private
   */
  function _deepCompareSchemas(outSchema, inSchema) {
    if (!inSchema || inSchema.type === "any") return true;
    if (!outSchema) return false;

    // Validación de tipo base
    if (outSchema.type !== inSchema.type) return false;

    // Validación profunda de objetos
    if (inSchema.type === "object" && inSchema.structure) {
      const outStruct = outSchema.structure || {};
      for (const key in inSchema.structure) {
        const subIn = inSchema.structure[key];
        const subOut = outStruct[key];
        
        // Si el receptor lo requiere, el emisor DEBE proveerlo
        if (subIn.validation?.required && !subOut) return false;
        
        // Si ambos tienen sub-esquemas, comparar recursivamente
        if (subOut && !_deepCompareSchemas(subOut, subIn)) return false;
      }
    }

    // Validación profunda de arrays
    if (inSchema.type === "array" && inSchema.structure?.items) {
      const outItems = outSchema.structure?.items;
      if (!outItems) return false;
      return _deepCompareSchemas(outItems, inSchema.structure.items);
    }

    return true;
  }

  return Object.freeze({
    label: "Flow Compiler v6.5",
    description: "Industrial L5 Compiler with Structural Morphism Validation.",
    archetype: "LOGIC_CORE",
    compile
  });
}

