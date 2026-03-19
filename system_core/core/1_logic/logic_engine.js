/**
 * INDRA LOGIC ENGINE v4.0
 * Responsibility: Execute transformation chains independently from providers.
 * Engine: Google Apps Script V8 + IndraParser (Isomorphic).
 */

var LogicEngine = {
  
  /**
   * Executes a Logic Bridge transformation.
   * @param {Object} uqo The Universal Query Object containing payload and bridge config.
   */
  executeLogicBridge: function(uqo) {
    const dataObj = uqo.data || uqo.query || {};
    const { payload, trigger_data, bridge } = dataObj;
    const config = bridge || {};
    const operators = config.operators || [];
    const targetMappings = config.targetMappings || {};
    
    // Axioma de Dualidad: Si no hay payload (Batch), buscamos trigger_data (AEE)
    const activeData = payload || (trigger_data ? [trigger_data] : null);
    
    if (!activeData || !Array.isArray(activeData)) {
      return { items: [], metadata: { status: "ERROR", error: "LogicEngine: No valid data pool found." } };
    }

    try {
      const results = activeData.map(item => {
        // Clonamos el estado inicial para calcular el diferencial (Delta)
        const before = JSON.parse(JSON.stringify(item));
        let context = JSON.parse(JSON.stringify(item)); 
        
        // AXIOMA DE NOMBRE ESPACIAL: El payload original reside en 'source' para el parser.
        context.source = JSON.parse(JSON.stringify(item));
        context.op = {}; // Asegurar inicialización de namespace de operadores
        
        // 1. Ejecución Secuencial de Operadores (Resonancia de Cálculo)
        operators.forEach(op => {
          this.executeOperator(op, context);
        });
        
        // 2. Aplicación de Mapeo Final (Mapeo a slots destino)
        // ADR-014: Los mappings vienen agrupados por targetId
        const mappings = config.mappings || config.targetMappings || {};
        const targetConfigs = config.targetConfigs || {};
        const sourceConfigs = config.sourceConfigs || {};

        Object.keys(mappings).forEach(targetId => {
          const fieldMappings = mappings[targetId];
          if (typeof fieldMappings !== 'object') return;

          // Buscar el alias del targetId para saber dónde escribir en el context
          const tConfig = targetConfigs[targetId] || {};
          const sConfig = sourceConfigs[targetId] || {};
          const alias = tConfig.alias || sConfig.alias || targetId;

          Object.keys(fieldMappings).forEach(fieldId => {
             if (fieldId.endsWith('_label')) return; // Saltar metadatos de UI
             
             const sourcePath = fieldMappings[fieldId];
             const val = this._get_(context, sourcePath);
             
             // Escribir en context.ALIAS.FIELD_ID (Ley de Aduana: Respetar estructura del trigger_data)
             this._set_(context, `${alias}.${fieldId}`, val);
          });
        });
        
        // 3. Calculadora de Deltas (Sinceridad de Resonancia)
        const delta = this._calculateDelta_(before, context);
        
        // AXIOMA DE TRANSPARENCIA: En simulaciones, adjuntamos resultados de operadores
        if (bridge) delta.__debug_op__ = JSON.parse(JSON.stringify(context.op || {}));
        
        return delta;
      });

      // Si es una ejecución unitaria (AEE / Cotizador), notificamos modo DELTA
      const isSingle = trigger_data || activeData.length === 1;
      
      return { 
        items: results, 
        metadata: { 
          status: "OK", 
          update_type: isSingle ? "DELTA" : "SNAPSHOT",
          result: isSingle ? results[0] : null,
          // AXIOMA DE TRANSPARENCIA: Si enviaron un bridge efímero, devolvemos los resultados de los operadores
          debug: bridge ? results.map((_, idx) => results[idx].__debug_op__) : null
        } 
      };

    } catch (e) {
      logError("[LogicEngine v4] Runtime Error:", e.message);
      return { items: [], metadata: { status: "ERROR", error: "LogicEngine V4 Error: " + e.message } };
    }
  },

  /**
   * Executes an operator, delegation logic to the isomorphic IndraParser or performing internal actions like RESOLVER.
   */
  /**
   * Executes an operator, delegation logic to the isomorphic IndraParser or performing internal actions like RESOLVER.
   */
  executeOperator: function(op, context) {
    const { config, alias, id, type } = op;
    const { input_a, input_b, operation, silo } = config; 
    
    // --- NODO RESOLVER (Data Extractor) ---
    if (type === 'RESOLVER') {
      const ptrInput = this._get_(context, input_a);
      
      const resolveSingle = (idStr) => {
         if (!idStr) return null;
         try {
            const providerId = silo.provider || 'system';
            const resp = route({
                provider: providerId, protocol: 'ATOM_READ', context_id: idStr
            });
            if (resp && resp.items && resp.items.length > 0) {
                // SINCERIDAD TOTAL: Simplemente retornamos el átomo tal cual.
                // El provider se encargó de poner los datos en la raíz.
                return resp.items[0];
            }
         } catch(e) {
            logWarn("[LogicEngine] RESOLVER Node error al hidratar " + idStr + ": " + e.message);
         }
         return null;
      };

      let extracted = null;
      // Compatibilidad Vectorial: Si es una lista de IDs (Repeater), retorna lista de propiedades
      if (Array.isArray(ptrInput)) {
          extracted = ptrInput.map(itemId => resolveSingle(itemId));
      } else {
          extracted = resolveSingle(ptrInput);
      }

      this._set_(context, "op." + id, extracted);
      if (alias) this._set_(context, "op." + alias, extracted);
      return;
    }

    // --- NODO HYDRATE_DOC (Document Generation Engine) ---
    // AXIOMA: Independence & Information. Inyecta DataRow en el AST sin persistir.
    if (type === 'HYDRATE_DOC') {
      const sourceData = this._get_(context, input_a) || context.source || {};
      const templateDoc = this._get_(context, input_b);
      
      if (!templateDoc || templateDoc.class !== 'DOCUMENT') {
         logError("[LogicEngine] HYDRATE_DOC requiere un átomo DOCUMENT en input_b.");
         return;
      }

      // Clonar AST para no mutar plantilla
      const hydratedAst = JSON.parse(JSON.stringify(templateDoc.payload?.blocks || []));
      
      const hydrateNode = (node) => {
         if (node.type === 'TEXT' && typeof node.content === 'string') {
             node.content = node.content.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, path) => {
                 const val = this._get_(sourceData, path);
                 return val !== undefined && val !== null ? String(val) : match;
             });
         }
         if (node.children && Array.isArray(node.children)) {
             node.children.forEach(hydrateNode);
         }
      };

      hydratedAst.forEach(hydrateNode);
      
      const resultDoc = JSON.parse(JSON.stringify(templateDoc));
      resultDoc.payload.blocks = hydratedAst;
      resultDoc._hydrated = true;

      this._set_(context, "op." + id, resultDoc);
      if (alias) this._set_(context, "op." + alias, resultDoc);
      return;
    }

    // --- OPERADORES MATH & TEXT ---
    const isStandard = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE"].includes(operation);
    
    if (isStandard) {
        const valA = this._get_(context, input_a);
        const valB = this._get_(context, input_b);
        const result = this._computeStandard_(operation, valA, valB);
        this._set_(context, "op." + id, result);
        if (alias) this._set_(context, "op." + alias, result);
    } else {
        // MODO AXIOMÁTICO: Evaluación de expresión (parser compartido FE/BE)
        const result = IndraParser.evaluate(operation, context);
        this._set_(context, "op." + id, result);
        if (alias) this._set_(context, "op." + alias, result);
    }
  },

  /**
   * Operaciones aritméticas vectoriales. 
   * Si las entradas son arrays (ej. cantidad y precios de un Repeater), realiza operaciones Par-a-Par.
   */
  _computeStandard_: function(operation, a, b) {
    const isArrA = Array.isArray(a);
    const isArrB = Array.isArray(b);

    const doMath = (vA, vB) => {
      const numA = Number(vA) || 0;
      const numB = Number(vB) || 0;
      switch (operation) {
        case "ADD":      return numA + numB;
        case "SUBTRACT": return numA - numB;
        case "MULTIPLY": return numA * numB;
        case "DIVIDE":   return numB !== 0 ? numA / numB : 0;
        default:         return numA;
      }
    };

    if (isArrA && isArrB) return a.map((val, idx) => doMath(val, b[idx]));
    if (isArrA && !isArrB) return a.map(val => doMath(val, b));
    if (!isArrA && isArrB) return b.map(val => doMath(a, val));
    return doMath(a, b);
  },

  /**
   * Calcula el diferencial puro entre dos estados.
   */
  _calculateDelta_: function(before, after) {
    const delta = { id: after.id }; 
    Object.keys(after).forEach(key => {
        if (key === 'source' || key === 'op' || key === 'id') return;
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
            delta[key] = after[key];
        }
    });
    return delta;
  },

  /**
   * Helper: Get value by dot path con soporte vectorial.
   * Si en la ruta hay un 'Array', recolecta el mapeo de sus hijos.
   */
  _get_: function(obj, path) {
    if (!path) return undefined;
    return path.split('.').reduce((prev, curr) => {
      if (prev === undefined || prev === null) return undefined;
      if (Array.isArray(prev)) {
          if (!isNaN(curr)) return prev[Number(curr)]; // Índice exacto
          return prev.map(item => item && item[curr]); // Array map
      }
      return prev[curr];
    }, obj);
  },

  /**
   * Helper: Set value by dot path con soporte vectorial mutativo.
   */
  _set_: function(obj, path, value) {
    if (!path) return;
    const parts = path.split('.');
    let last = parts.pop();

    let target = obj;
    for (let i = 0; i < parts.length; i++) {
        let curr = parts[i];
        if (target === undefined || target === null) return;
        
        if (Array.isArray(target)) {
            let subPath = [...parts.slice(i), last].join('.');
            target.forEach((item, index) => {
                this._set_(item, subPath, Array.isArray(value) ? value[index] : value);
            });
            return;
        } else {
            if (target[curr] === undefined) target[curr] = {};
            target = target[curr];
        }
    }

    if (Array.isArray(target)) {
        target.forEach((item, index) => {
            item[last] = Array.isArray(value) ? value[index] : value;
        });
    } else {
        target[last] = value;
    }
  }
};
