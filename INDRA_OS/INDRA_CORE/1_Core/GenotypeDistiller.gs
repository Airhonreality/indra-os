/**
 * GenotypeDistiller.gs
 * DHARMA: El Laboratorio Genético (Layer 0.5)
 * 
 * ADR-022: Contrato Canónico Directo.
 * El CANON de cada adapter ES el contrato. No se transforma, se transmite.
 * Pipeline Core→Front reducido de 7 a 3 transformaciones.
 */

const GenotypeDistiller = {
  /**
   * Destila el Genotipo Soberano cruzando la ley estática con la verdad viva.
   */
  distill: function({ laws, nodes, blueprintRegistry, manifest, monitoringService }) {
    const _monitor = monitoringService || { logDebug: () => {} };
    _monitor.logDebug(`[GenotypeDistiller] Distilling Sovereign Genotype Layer 0 (ADR-022: Canonical Contract).`);

    const safeLaws = laws || {};
    const constitution = safeLaws.constitution || {};
    const logic = safeLaws.axioms || {};
    const visual = safeLaws.visual || {};
    const spatial = safeLaws.spatial || {};
    const topology = safeLaws.topology || {};
    const blueprints = safeLaws.blueprints || {};
    const uiLayout = safeLaws.uiLayout || {};

    // AXIOMA: Coherencia Dinámica (Reality over Theory)
    // Reconstruimos el COMPONENT_REGISTRY desde la verdad viva de los nodos.
    const liveRegistry = {};

    Object.keys(nodes || {}).forEach(key => {
        // Ignorar propiedades internas del registro de nodos
        if (['id','label','domain','archetype','description','semantic_intent','schemas'].includes(key)) return;
        
        const n = nodes[key];
        if (!n || typeof n !== 'object') return;

        // AXIOMA: Contrato Canónico Directo (ADR-022 PURE)
        // El CANON del adapter ES el contrato soberano. Sin fusiones, sin sombras.
        const canon = n.CANON || n.canon;
        
        // Si no hay CANON, el nodo es una utilidad de infraestructura sin interfaz de orquestación.
        if (!canon) return;

        const rawCaps = canon.CAPABILITIES || canon.capabilities || {};

        // AXIOMA: Cálculo de Puertos Semánticos (Cero Inferencia)
        const ports = _computePorts(rawCaps);

        // AXIOMA: Casing Canónico Unificado (ADR-022)
        // Un solo dialecto entre Core y Front: lowercase para el contrato nuevo.
        // Los alias UPPER_CASE se mantienen temporalmente para retrocompatibilidad
        // con el Law_Compiler actual (se eliminan en el Paso 4 del ADR-022).
        const label = String(canon.LABEL || n.label || key);
        // AXIOMA: Soberanía del Casing (ADR-022)
        // Dejamos de forzar el UPPER_CASE. El sistema ahora es agnóstico al dialecto visual.
        const archetype = String(canon.ARCHETYPE || n.archetype || 'adapter').toLowerCase();
        const domain = String(canon.DOMAIN || n.domain || 'system_infra').toLowerCase();
        const semanticIntent = String(canon.SEMANTIC_INTENT || n.semantic_intent || 'stream').toLowerCase();
        const reificationHints = canon.REIFICATION_HINTS || canon.reification_hints || {};
        const uiHint = String(canon.ui_layout_hint || 'smart_form');

        liveRegistry[key] = {
            // --- CONTRATO CANÓNICO (lowercase) ---
            id: key,
            label: label,
            archetype: archetype,
            archetypes: canon.archetypes || [archetype],
            domain: domain,
            capabilities: rawCaps,
            ports: ports,
            reification_hints: reificationHints,
            ui_layout_hint: uiHint,
            semantic_intent: semanticIntent,
            
            // Retrocompatibilidad mínima para motores de renderizado (Solo metadatos de acceso)
            methods: Object.keys(rawCaps),
            OMD: key.toUpperCase(),
            SLOT: canon.SLOT || null
        };
    });

    // Devolvemos la constitución fusionada con la realidad viva
    return JSON.parse(JSON.stringify({ 
      ...constitution,
      COMPONENT_REGISTRY: liveRegistry,
      CORE_LOGIC: logic.CORE_LOGIC || logic,
      VISUAL_GRAMMAR: visual, 
      SPATIAL_ENGINE: spatial,
      TOPOLOGY: topology,
      BLUEPRINTS: blueprints,
      ARTIFACT_SCHEMAS: (blueprintRegistry && blueprintRegistry.ARTIFACT_SCHEMAS) || {},
      UI_LAYOUT: uiLayout
    }));
  }
};

/**
 * AXIOMA: Cálculo de Puertos Semánticos (ADR-022)
 * Deriva puertos de entrada y salida desde capabilities.io.
 * Compatible con CoreOrchestrator._applyGraphTopology connections schema.
 *
 * io:READ / io:STREAM   → el nodo PRODUCE datos  (puerto de salida)
 * io:WRITE / io:TRIGGER → el nodo CONSUME datos  (puerto de entrada)
 * io:ADMIN / io:REFRESH → bidireccional           (ambos)
 * io:ausente            → adapter incompleto, se omite (no asumimos)
 *
 * @param {Object} capabilities - Mapa de capabilities del CANON del adapter
 * @returns {{ inputs: string[], outputs: string[] }}
 */
function _computePorts(capabilities) {
  const inputs = [];
  const outputs = [];

  if (!capabilities || typeof capabilities !== 'object') {
    return { inputs, outputs };
  }

  Object.entries(capabilities).forEach(function(entry) {
    const capKey = entry[0];
    const capDef = entry[1];

    // DEFENSA: capDef puede ser null, un primitivo, o tener capDef.io como objeto.
    // String() garantiza que siempre operamos con un string antes de toUpperCase.
    if (!capDef || typeof capDef !== 'object') return;

    const rawIo = capDef.io !== undefined ? capDef.io : '';
    const io = String(rawIo).toUpperCase();

    switch (io) {
      case 'READ':
      case 'STREAM':
        outputs.push(capKey);
        break;
      case 'WRITE':
      case 'TRIGGER':
        inputs.push(capKey);
        break;
      case 'ADMIN':
      case 'REFRESH':
        inputs.push(capKey);
        outputs.push(capKey);
        break;
      default:
        // io ausente o no reconocido: adapter incompleto. No inferir.
        break;
    }
  });

  return { inputs, outputs };
}


