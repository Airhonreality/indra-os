/**
 * =============================================================================
 * INDRA LAMINAR ARCHITECTURE (Layers Registry)
 * =============================================================================
 * @dharma "La profundidad define la soberanía."
 * Clasificación de los módulos del sistema según su capacidad de invocación
 * y visibilidad global.
 */

export const SYSTEM_LAYERS = {
    // CAPA 0: NÚCLEO (Privada, Protegida, Crítica)
    // No debería ser invocable por satélites sin permisos de ADMIN.
    CORE: [
        'SYSTEM_NEXUS',
        'WORKSPACE_SETTINGS',
        'DIAGNOSTIC_HUB',
        'KEYCHAIN_SERVICE',
        'AUTORIZE_MANUALLY'
    ],

    // CAPA 1: HERRAMIENTAS GLOBALES (Libres, Invocables, Agnósticas)
    // Ciudadanos universales de Indra para uso libre o por satélites.
    GLOBAL_TOOLS: [
        'DATA_SCHEMA',      // Schema Designer
        'MEDIA_EXPLORER',   // File/Asset Manager
        'MEDIA_TRANSCODER', // A/V Processing
        'VIDEO_DESIGNER',   // Video Edition
        'WORKFLOW_ENGINE',  // Logic Designer
        'RELATION_GRAPH'    // Graph Visualization
    ]
};

/**
 * Determina si una clase de artefacto pertenece a la capa de herramientas libres.
 */
export const isGlobalTool = (artifactClass) => {
    return SYSTEM_LAYERS.GLOBAL_TOOLS.includes(artifactClass);
};
