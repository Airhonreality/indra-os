/**
 * GenotypeDistiller.gs
 * DHARMA: El Laboratorio Genético (Layer 0.5)
 * 
 * Se encarga de construir el ADN del sistema (Genotipo L0).
 * Implementa el mapeo basado en Jerarquía Constitucional.
 */

const GenotypeDistiller = {
  /**
   * Destila el Genotipo Soberano cruzando la ley estática con la verdad viva.
   */
  distill: function({ laws, nodes, blueprintRegistry, manifest, monitoringService }) {
    const _monitor = monitoringService || { logDebug: () => {} };
    _monitor.logDebug(`[GenotypeDistiller] Distilling Sovereign Genotype Layer 0 (Axiomatic DI).`);

    const safeLaws = laws || {};
    const constitution = safeLaws.constitution || {};
    const logic = safeLaws.axioms || {};
    const visual = safeLaws.visual || {};
    const spatial = safeLaws.spatial || {};
    const topology = safeLaws.topology || {};
    const blueprints = safeLaws.blueprints || {};
    const uiLayout = safeLaws.uiLayout || {};
    const distribution = safeLaws.distribution || {};

    // AXIOMA: Coherencia Dinámica (Reality over Theory)
    // Reconstruimos el COMPONENT_REGISTRY desde la verdad viva de los nodos.
    const liveRegistry = {};
    Object.keys(nodes || {}).forEach(key => {
        // Ignorar propiedades internas del registro de nodos
        if (key === 'id' || key === 'label' || key === 'domain' || key === 'archetype' || key === 'description' || key === 'semantic_intent' || key === 'schemas') return;
        
        const n = nodes[key];
        if (!n || typeof n !== 'object') return;

        // AXIOMA: Mapeo de Jerarquía Constitucional
        // Si un nodo no tiene canon, se proyecta como UNKNOWN_MODULE
        const canon = n.canon || n.CANON;
        
        liveRegistry[key.toUpperCase()] = {
            id: key,
            OMD: key.toUpperCase(),
            SLOT: n.slot || canon?.SLOT || "CANVAS_MAIN",
            LABEL: n.label || canon?.LABEL || key,
            ARCHETYPE: n.archetype || canon?.ARCHETYPE || "ADAPTER",
            DOMAIN: n.domain || canon?.DOMAIN || "SYSTEM_INFRA",
            CAPABILITIES: n.schemas || canon?.CAPABILITIES || {},
            methods: Object.keys(n.schemas || canon?.CAPABILITIES || {}), // Crucial para el Projector
            semantic_intent: n.semantic_intent || canon?.SEMANTIC_INTENT || "STREAM",
            ui_layout_hint: n.ui_layout_hint || canon?.ui_layout_hint || "LAYOUT_SMART_FORM"
        };
    });

    // Devolvemos la constitución fusionada con la realidad viva
    return JSON.parse(JSON.stringify({ 
      ...constitution,
      COMPONENT_REGISTRY: { 
        ...(constitution.COMPONENT_REGISTRY || {}), 
        ...liveRegistry 
      },
      CORE_LOGIC: logic.CORE_LOGIC || logic,
      VISUAL_GRAMMAR: visual, 
      SPATIAL_ENGINE: spatial,
      TOPOLOGY: topology,
      BLUEPRINTS: blueprints,
      ARTIFACT_SCHEMAS: (blueprintRegistry && blueprintRegistry.ARTIFACT_SCHEMAS) || {},
      UI_LAYOUT: uiLayout,
      UI_DISTRIBUTION: distribution
    }));
  }
};
