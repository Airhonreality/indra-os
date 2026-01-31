/**
 * 0_Laws/VisualLaws.js
 * DHARMA: Agnosticismo Estético y Mapeo de Distribución Hiper-Estructurada.
 * Versión: 2.1.0-STARK (Alineada con la Arquitectura de 3 Niveles)
 */

export const VISUAL_LAWS = {
    // ============================================================
    // SECCIÓN 1: ARQUETIPOS CANÓNICOS (Sincronía con Visual_Grammar.gs)
    // ============================================================
    ARCHETYPES: {
        VAULT: { class: 'stark-vault', header_icon: 'Lock', border_color: '#00d2ff', motion: 'still', label: 'Seguridad' },
        GATE: { class: 'stark-gate', header_icon: 'DoorOpen', border_color: '#9d50bb', motion: 'breathing', label: 'Filtro' },
        STREAM: { class: 'stark-stream', header_icon: 'Zap', border_color: '#00ffaa', motion: 'wave', label: 'Datos' },
        BRIDGE: { class: 'stark-bridge', header_icon: 'Globe', border_color: '#00d2ff', motion: 'vibration', label: 'Conector' },
        INHIBIT: { class: 'stark-inhibit', header_icon: 'XCircle', border_color: '#ff3366', motion: 'pulse', label: 'Bloqueo' },
        TRIGGER: { class: 'stark-trigger', header_icon: 'Zap', border_color: '#00ffaa', motion: 'pulse', label: 'Disparador' },
        SCHEMA: { class: 'stark-schema', header_icon: 'FileText', border_color: '#ffcc00', motion: 'static', label: 'Arquitectura' },
        PROBE: { class: 'stark-probe', header_icon: 'Activity', border_color: '#ff3366', motion: 'vibration', label: 'Sonda' },
        TRANSFORM: { class: 'stark-transform', header_icon: 'RefreshCw', border_color: '#ffcc00', motion: 'morph', label: 'Mapeador' },
        OBSERVER: { class: 'stark-observer', header_icon: 'Activity', border_color: '#00ffaa', motion: 'vibration', label: 'Monitor' },
        ADAPTER: { class: 'stark-adapter', header_icon: 'Zap', border_color: '#00ffaa', motion: 'static', label: 'Adaptador' },
        SYSTEM_INFRA: { class: 'stark-infra', header_icon: 'Cpu', border_color: '#555555', motion: 'still', label: 'Sistema' },
        LOGIC_CORE: { class: 'stark-logic', header_icon: 'Cpu', border_color: '#ffcc00', motion: 'breathing', label: 'Razonamiento' },
        SENSOR: { class: 'stark-sensor', header_icon: 'Eye', border_color: '#00ffaa', motion: 'breathing', label: 'Percepción' },
        SERVICE: { class: 'stark-service', header_icon: 'Layers', border_color: '#00ffaa', motion: 'static', label: 'Servicio' },
        SYSTEM_CORE: { class: 'stark-core', header_icon: 'Shield', border_color: '#666666', motion: 'still', label: 'Núcleo' },
        ORCHESTRATOR: { class: 'stark-orchestrator', header_icon: 'Activity', border_color: '#9d50bb', motion: 'breathing', label: 'Orquestador' }
    },

    // ============================================================
    // SECCIÓN 2: INTENCIONES SEMÁNTICAS (Sincronía con Visual_Grammar.gs)
    // ============================================================
    INTENTS: {
        READ: { token: 'var(--accent-primary)', icon: 'Eye', signifier: 'intent-read' },
        WRITE: { token: 'var(--accent-success)', icon: 'Save', signifier: 'intent-write' },
        EXECUTE: { token: 'var(--accent-secondary)', icon: 'Play', signifier: 'intent-exec' }
    },

    // ============================================================
    // SECCIÓN 3: PRIORIDADES DE NARRATIVA
    // ============================================================
    PRIORITY_LAWS: {
        motion_dominance: "SEMANTIC_INTENT",
        narrative: "El Estado de Acción (método) domina sobre el Estado de Identidad (arquetipo)."
    },

    // ============================================================
    // SECCIÓN 4: DEFINICIÓN DE NIVELES (System Layers)
    // ============================================================
    SYSTEM_LAYERS: {
        NIVEL_1: { id: 1, label: 'Módulos de Vista', description: 'Escenarios principales de interacción global.' },
        NIVEL_2: { id: 2, label: 'Servicios Operacionales', description: 'Herramientas transversales de configuración y soporte.' },
        NIVEL_3: { id: 3, label: 'Servicios de Soberanía', description: 'Backbone de seguridad, identidad y supervisión (Capa Crítica).' }
    },

    // ============================================================
    // SECCIÓN 5: MAPA DE DISTRIBUCIÓN OMD (The Box Map)
    // ============================================================
    DISTRIBUTION_MAP: {
        // ... (Contenido de OMD Distribution Map se mantiene sincronizado con blueprints)
        // --- NIVEL 3: SOBERANÍA (BACKBONE) ---
        "OMD-01": {
            technical_id: "view_portal",
            functional_name: "Portal de Acceso",
            layer: "NIVEL_3",
            slot: "overlay-full",
            component: "AccessPortal",
            config: { backdrop: "blur-heavy", archetype: "GATE" }
        },
        "OMD-02": {
            technical_id: "view_identity_vault",
            functional_name: "Gestor de Identidad",
            layer: "NIVEL_3",
            slot: "drawer-right",
            component: "IdentityVault",
            config: { header: "Sovereign Identity", archetype: "VAULT" }
        },
        "OMD-04": {
            technical_id: "view_neural_copilot",
            functional_name: "Asistente IA",
            layer: "NIVEL_3",
            slot: "overlay-corner-br",
            component: "NeuralCopilot",
            config: { archetype: "LOGIC_CORE" }
        },
        "OMD-06": {
            technical_id: "view_execution_monitor",
            functional_name: "Monitor de Trazabilidad",
            layer: "NIVEL_3",
            slot: "bar-bottom",
            component: "ExecutionMonitor",
            config: { archetype: "OBSERVER" }
        },

        // --- NIVEL 2: SERVICIOS OPERACIONALES ---
        "OMD-05": {
            technical_id: "view_context_inspector",
            functional_name: "Inspector de Contexto Unificado",
            layer: "NIVEL_2",
            slot: "sidebar-right",
            component: "ContextInspector",
            config: { archetype: "TRANSFORM" }
        },
        "OMD-08": {
            technical_id: "view_adapter_catalog",
            functional_name: "Biblioteca de Capacidades",
            layer: "NIVEL_2",
            slot: "sidebar-left-float",
            component: "AdapterCatalog",
            config: { archetype: "SCHEMA" }
        },
        "OMD-10": {
            technical_id: "view_context_explorer",
            functional_name: "Explorador de Contexto",
            layer: "NIVEL_2",
            slot: "modal-center",
            component: "ContextExplorer",
            config: { archetype: "STREAM" }
        },

        // --- NIVEL 1: MÓDULOS DE VISTA ---
        "OMD-03": {
            technical_id: "view_flow_orchestrator",
            functional_name: "Lienzo de Automatización",
            layer: "NIVEL_1",
            slot: "center-stage",
            component: "FlowOrchestrator",
            config: { archetype: "ORCHESTRATOR" }
        },
        "OMD-07": {
            technical_id: "view_project_explorer",
            functional_name: "Explorador de Proyectos",
            layer: "NIVEL_1",
            slot: "sidebar-left",
            component: "ProjectExplorer",
            config: { archetype: "SCHEMA" }
        },
        "OMD-09": {
            technical_id: "view_isk_designer",
            functional_name: "Spatial Designer",
            layer: "NIVEL_1",
            slot: "center-stage-alt",
            component: "ISKDesigner",
            config: { archetype: "SYSTEM_INFRA" }
        }
    }
};
