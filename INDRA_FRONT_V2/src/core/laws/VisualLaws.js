/**
 * 0_Laws/VisualLaws.js
 * DHARMA: Agnosticismo Estético y Mapeo de Distribución Hiper-Estructurada.
 * Versión: 2.1.0-STARK (Alineada con la Arquitectura de 3 Niveles)
 */

export const VISUAL_LAWS = {
    // ============================================================
    // SECCIÓN 1: ARQUETIPOS CANÓNICOS (Sincronía con Core Layer 0)
    // ============================================================
    ARCHETYPES: {
        VAULT: { class: 'stark-vault', icon: 'lock', color: '#FFD700', label: 'Seguridad' },
        GATE: { class: 'stark-gate', icon: 'shield', color: '#FF4500', label: 'Filtro' },
        STREAM: { class: 'stark-stream', icon: 'activity', color: '#32CD32', label: 'Datos' },
        BRIDGE: { class: 'stark-bridge', icon: 'zap', color: '#1E90FF', label: 'Conector' },
        INHIBIT: { class: 'stark-inhibit', icon: 'slash', color: '#FF0000', label: 'Bloqueo' },
        TRIGGER: { class: 'stark-trigger', icon: 'play-circle', color: '#FF8C00', label: 'Disparador' },
        SCHEMA: { class: 'stark-schema', icon: 'box', color: '#8A2BE2', label: 'Arquitectura' },
        PROBE: { class: 'stark-probe', icon: 'search', color: '#00CED1', label: 'Sonda' },
        TRANSFORM: { class: 'stark-transform', icon: 'repeat', color: '#FF1493', label: 'Mapeador' },
        OBSERVER: { class: 'stark-observer', icon: 'eye', color: '#ADFF2F', label: 'Monitor' },
        ADAPTER: { class: 'stark-adapter', icon: 'plug', color: '#7B68EE', label: 'Adaptador' },
        SYSTEM_INFRA: { class: 'stark-infra', icon: 'command', color: '#B0C4DE', label: 'Sistema' },
        LOGIC_CORE: { class: 'stark-logic', icon: 'cpu', color: '#F0E68C', label: 'Razonamiento' },
        SENSOR: { class: 'stark-sensor', icon: 'radar', color: '#00FF7F', label: 'Percepción' },
        SERVICE: { class: 'stark-service', icon: 'tool', color: '#F4A460', label: 'Servicio' },
        SYSTEM_CORE: { class: 'stark-core', icon: 'database', color: '#708090', label: 'Núcleo' },
        ORCHESTRATOR: { class: 'stark-orchestrator', icon: 'layers', color: '#DA70D6', label: 'Orquestador' }
    },

    // ============================================================
    // SECCIÓN 2: DEFINICIÓN DE NIVELES (System Layers)
    // ============================================================
    SYSTEM_LAYERS: {
        NIVEL_1: { id: 1, label: 'Módulos de Vista', description: 'Escenarios principales de interacción global.' },
        NIVEL_2: { id: 2, label: 'Servicios Operacionales', description: 'Herramientas transversales de configuración y soporte.' },
        NIVEL_3: { id: 3, label: 'Servicios de Soberanía', description: 'Backbone de seguridad, identidad y supervisión (Capa Crítica).' }
    },

    // ============================================================
    // SECCIÓN 3: MAPA DE DISTRIBUCIÓN OMD (The Box Map)
    // Alineado fielmente con la nomenclatura de Blueprints OMD-XX.
    // ============================================================
    DISTRIBUTION_MAP: {
        // --- NIVEL 3: SOBERANÍA (BACKBONE) ---
        "OMD-01": {
            technical_id: "view_portal",
            functional_name: "Portal de Acceso",
            layer: "NIVEL_3",
            slot: "overlay-full",
            component: "AccessPortal",
            config: { backdrop: "blur-heavy", security: "High" }
        },
        "OMD-02": {
            technical_id: "view_identity_vault",
            functional_name: "Gestor de Identidad",
            layer: "NIVEL_3",
            slot: "drawer-right",
            component: "IdentityVault",
            config: { header: "Sovereign Identity", selection_mode: "dropdown" }
        },
        "OMD-04": {
            technical_id: "view_neural_copilot",
            functional_name: "Asistente IA",
            layer: "NIVEL_3",
            slot: "overlay-corner-br",
            component: "NeuralCopilot",
            config: { role: "Architect", context_aware: true }
        },
        "OMD-06": {
            technical_id: "view_execution_monitor",
            functional_name: "Monitor de Trazabilidad",
            layer: "NIVEL_3",
            slot: "bar-bottom",
            component: "ExecutionMonitor",
            config: { live_stream: true, forensic_mode: true }
        },

        // --- NIVEL 2: SERVICIOS OPERACIONALES ---
        "OMD-05": {
            technical_id: "view_context_inspector",
            functional_name: "Inspector de Contexto Unificado",
            layer: "NIVEL_2",
            slot: "sidebar-right",
            component: "ContextInspector",
            config: { polymorphic: true, submodules: ["OMD-05.1", "OMD-05.2"] }
        },
        "OMD-08": {
            technical_id: "view_adapter_catalog",
            functional_name: "Biblioteca de Capacidades",
            layer: "NIVEL_2",
            slot: "sidebar-left-float",
            component: "AdapterCatalog",
            config: { search: "intent-based", view: "grid" }
        },
        "OMD-10": {
            technical_id: "view_context_explorer",
            functional_name: "Explorador de Contexto",
            layer: "NIVEL_2",
            slot: "modal-center",
            component: "ContextExplorer",
            config: { detail: "high", visual: "matrix" }
        },

        // --- NIVEL 1: MÓDULOS DE VISTA ---
        "OMD-03": {
            technical_id: "view_flow_orchestrator",
            functional_name: "Lienzo de Automatización",
            layer: "NIVEL_1",
            slot: "center-stage",
            component: "FlowOrchestrator",
            config: { engine: "Hybrid WebGL/React", snap: 20 }
        },
        "OMD-07": {
            technical_id: "view_project_explorer",
            functional_name: "Explorador de Proyectos",
            layer: "NIVEL_1",
            slot: "sidebar-left",
            component: "ProjectExplorer",
            config: { hierarchy: "Cosmos > Project > Artifact" }
        },
        "OMD-09": {
            technical_id: "view_isk_designer",
            functional_name: "Spatial Designer",
            layer: "NIVEL_1",
            slot: "center-stage-alt",
            component: "ISKDesigner",
            config: { engine: "WebGL-Turbo", immersive: true }
        }
    }
};
