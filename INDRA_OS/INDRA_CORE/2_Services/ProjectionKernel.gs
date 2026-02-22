/**
 * 🛰️ PROJECTION KERNEL (2_Services/ProjectionKernel.gs)
 * Version: 14.5.0 (Axiom Level 2048)
 * Dharma: Destilar la realidad del Core en un Esquema de Proyección seguro para el Satélite.
 */

function createProjectionKernel({ configurator, errorHandler, laws = {}, driveAdapter }) {
  
  if (!configurator) throw new Error('ProjectionKernel: configurator dependency is required');
  if (!errorHandler) throw new Error('ProjectionKernel: errorHandler dependency is required');

  // AXIOMA: Leyes inyectadas
  const axioms = laws.axioms || (typeof LOGIC_AXIOMS !== 'undefined' ? LOGIC_AXIOMS : {});
  const constitution = laws.constitution || (typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {});
  const hierarchy = laws.hierarchy || (typeof System_Hierarchy !== 'undefined' ? System_Hierarchy : null);
  
  const SENSITIVE_STRINGS = axioms.SENSITIVE_TERMS || ['KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
  const MASK = '********';

  const uiLayoutHint = 'SMART_FORM';

  /**
   * RF-1: Proyecta todas las capacidades del sistema.
   * Filtra el stack para exponer solo lo que tiene contrato explícito.
   */
  function getProjection(executionStack) {
    const contracts = {};
    const seenObjects = new Set();
    
    // Ordenamos las llaves para procesar primero los alias si existen
    const keys = Object.keys(executionStack).sort((a, b) => a.length - b.length);

    keys.forEach(key => {
      const component = executionStack[key];
      
      // GUARD: Solo procesamos objetos con esquemas definidos
      if (typeof component === 'object' && component !== null && component.schemas) {
        // Evitamos duplicados si el mismo objeto está en varias llaves
        if (seenObjects.has(component)) return;

        const methods = Object.keys(component.schemas).filter(methodName => {
          return typeof component[methodName] === 'function' && !methodName.startsWith('_');
        });

        if (methods.length > 0) {
          // AXIOMA v8.0: Soberanía de Proyección
          // Prioridad 1: Hint explícito del componente.
          // Prioridad 2: Hint basado en Arquetipo.
          // Prioridad 3: Fallback a SMART_FORM.
          
          // AXIOMA V12: Estética Soberana (ADR-016)
          // El Kernel ya no impone disfraces. El componente decide cómo quiere ser proyectado.
          // Si no tiene hint, el Frontend usará el motor por defecto (Smart Form).
          // (uiLayoutHint ya está inicializado arriba)
          
          const effectiveHint = component.ui_layout_hint || component.uiLayoutHint || uiLayoutHint;

          const domainInfo = (hierarchy && typeof hierarchy.getDomainInfo === 'function') 
                             ? hierarchy.getDomainInfo(component.domain) 
                             : { label: component.domain || 'SYSTEM_CORE' };

          contracts[key] = {
            id: component.id,
            label: component.label || key,
            description: component.description || '',
            domain: component.domain,
            domain_label: domainInfo.label || 'N/A',
            archetype: component.archetype || 'ADAPTER',
            semantic_intent: component.semantic_intent || 'STREAM',
            ui_layout_hint: effectiveHint,
            resource_weight: component.resource_weight || 'low',
            methods: methods,
            schemas: _distillSchemas(component.schemas)
          };
          seenObjects.add(component);
        }
      }
    });

    return {
      contracts: contracts,
      timestamp: new Date().toISOString(),
      version: constitution.version || '14.5.0-SOVEREIGN'
    };
  }

  /**
   * RF-2: Proyecta el contexto de configuración filtrado.
   */
  function getFilteredContext() {
    try {
      const allParams = configurator.getAllParameters();
      const filteredParams = {};

      Object.keys(allParams).forEach(key => {
        const isSensitive = SENSITIVE_STRINGS.some(s => key.toUpperCase().includes(s));
        
        // Axioma #2: Masking
        if (isSensitive) {
          filteredParams[key] = MASK;
        } else {
          filteredParams[key] = allParams[key];
        }
      });

      return {
        configuration: filteredParams,
        meta: {
          environment: 'production',
          timestamp: new Date().toISOString(),
          version: constitution.version || 'SovereignCore (Axiom Ready)'
        }
      };
    } catch (e) {
      throw errorHandler.createError('PROJECTION_ERROR', `Context distillation failed: ${e.message}`);
    }
  }

  /**
   * RF-5: Resolución Canónica de Componentes (Single Source of Truth)
   * Localiza un componente en el stack ya sea en la raíz o en el registro de nodos.
   */
  function resolveComponent(executionStack, key) {
    if (!executionStack) return null;
    // Prioridad 1: Raíz (Servicios Core)
    if (executionStack[key]) return executionStack[key];
    // Prioridad 2: Registro de Nodos (Adaptadores Periféricos)
    if (executionStack.nodes && executionStack.nodes[key]) return executionStack.nodes[key];
    return null;
  }

  /**
   * RF-3: Valida si un método de un ejecutor está expuesto al Satélite.
   * Centraliza la política de seguridad de exposición.
   */
  function isMethodExposed(executionStack, executorKey, methodName) {
    // AXIOMA: Normalización de Alias de Sistema
    if (executorKey === 'system') executorKey = 'public';
    
    // AXIOMA (v12): Soberanía de Exposición (Open Policy)
    const component = resolveComponent(executionStack, executorKey);
    
    // GUARD: Debe ser un objeto válido
    if (!component || typeof component !== 'object') {
       console.warn(`[ProjectionKernel] BLOCKED: Executor '${executorKey}' not found in stack.`);
       return false;
    }
    
    const schema = (component.CANON && component.CANON.CAPABILITIES && component.CANON.CAPABILITIES[methodName]) || 
                   (component.schemas && component.schemas[methodName]);
    
    // Si tiene esquema y es explícitamente interno, bloqueamos.
    if (schema && schema.exposure === 'internal') {
      console.warn(`[ProjectionKernel] BLOCKED: '${executorKey}:${methodName}' is marked as 'internal'.`);
      return false;
    }

    // GUARD: El método debe existir físicamente y no ser privado (_)
    const method = component[methodName];
    if (typeof method !== 'function' || methodName.startsWith('_')) {
       console.warn(`[ProjectionKernel] BLOCKED: Method '${methodName}' in '${executorKey}' is not a function or is private.`);
       return false;
    }

    // AXIOMA V12: Si existe y no es interno, está expuesto (Total Polymorphism).
    return true;
  }


  /**
   * RF-6: Valida si un método tiene exposición PÚBLICA (accesible sin token).
   */
  function isMethodPublic(executionStack, executorKey, methodName) {
    // AXIOMA: Normalización de Alias de Sistema
    if (executorKey === 'system') executorKey = 'public';
    
    const component = resolveComponent(executionStack, executorKey);
    if (!component || typeof component !== 'object') return false;

    const schema = (component.CANON && component.CANON.CAPABILITIES && component.CANON.CAPABILITIES[methodName]) || 
                   (component.schemas && component.schemas[methodName]);
    
    return schema && schema.exposure === 'public';
  }

  /**
   * RF-4: Genera la Proyección de la Jerarquía del Sistema (Árbol JSON)
   * Utiliza DriveAdapter para escanear y System_Hierarchy para clasificar.
   */
  function getSystemHierarchyProjection(rootId) {
    if (!driveAdapter) throw new Error('ProjectionKernel: driveAdapter es requerido para la generación de la Proyección');
    if (!hierarchy) throw new Error('ProjectionKernel: La ley System_Hierarchy es requerida para la generación de la Proyección');

    const rootFolderId = rootId; 

    // 2. Estructura Base
    const projection = {
      rootId: rootId,
      syncedAt: new Date().toISOString(),
      structure: {
        id: rootFolderId,
        type: hierarchy.TYPES.ROOT,
        name: 'FileSystem Root', 
        children: []
      }
    };

    // 3. Escaneo Recursivo (Límite de Profundidad)
    function recursiveScan(folderId, depth) {
      if (depth > 4) return []; // Límite estricto

      const folderContent = driveAdapter.listContents({ folderId: folderId }); 
      
      const children = [];

      // Procesar Carpetas y Archivos
      folderContent.forEach(item => {
          if (item.type === 'folder') {
              const type = hierarchy.classifyEntity(item.mimeType, depth + 1);
              const parentType = hierarchy.classifyEntity(MimeType.FOLDER, depth); 
              
              if (hierarchy.validateLink(parentType, type)) {
                 children.push({
                   id: item.id,
                   name: item.name,
                   type: type,
                   children: recursiveScan(item.id, depth + 1)
                 });
              }
          } else {
             // Procesar Archivos
             const type = hierarchy.classifyEntity(item.mimeType || 'application/octet-stream', depth + 1);
             const parentType = hierarchy.classifyEntity(MimeType.FOLDER, depth);

             if (hierarchy.validateLink(parentType, type)) {
               children.push({
                 id: item.id,
                 name: item.name,
                 type: type,
                 mimeType: item.mimeType
               });
             }
          }
      });

      return children;
    }

    try {
        projection.structure.children = recursiveScan(rootFolderId, 0);
        return projection;
    } catch (e) {
        throw errorHandler.createError('PROJECTION_ERROR', `Fallo al generar la Proyección de la Jerarquía: ${e.message}`);
    }
  }

  // --- Helpers Privados ---

  /**
   * Limpia y proyecta los esquemas de los métodos.
   * @private
   */
  function _distillSchemas(schemas) {
    const distilled = {};
    Object.keys(schemas).forEach(methodName => {
      const schema = schemas[methodName];
      
      // AXIOMA #5: Filtrado por Exposición Explícita
      if (schema.exposure === 'internal') return;

      // Clonado profundo simple (Axioma #4: Inmutabilidad)
      distilled[methodName] = JSON.parse(JSON.stringify(schema));
      
      const target = distilled[methodName];

      // Enmascarar ejemplos de inputs si son sensibles
      if (target.io && target.io.inputs) {
        Object.keys(target.io.inputs).forEach(inputKey => {
          const input = target.io.inputs[inputKey];
          // Axioma #2: Masking Semántico
          if (input.role === 'security' || SENSITIVE_STRINGS.some(s => inputKey.toUpperCase().includes(s))) {
            input.example = MASK;
            if (input.default) input.default = MASK;
            delete input.validation; 
          }
        });
      }

      // Sanitización de Outputs
      if (target.io && target.io.outputs) {
        Object.keys(target.io.outputs).forEach(outputKey => {
          const output = target.io.outputs[outputKey];
          if (output.role === 'security') {
            output.structure = MASK;
          }
        });
      }
    });
    return distilled;
  }

  // Interfaz Pública Congelada
  return Object.freeze({
    id: "service_projection_core",
    label: "Projection Master",
    description: "Industrial engine for semantic distillation and interface projection.",
    semantic_intent: "LOGIC",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    getProjection,
    getFilteredContext,
    isMethodExposed,
    isMethodPublic,
    resolveComponent, // <--- EXPOSED TRUTH
    getSystemHierarchyProjection, 
    resource_weight: 'medium'
  });
}








