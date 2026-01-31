/**
 * 0_Laws/Visual_Grammar.gs
 * Version: 5.5.0-STARK
 * Dharma: Visual phenotype - Maps functional feeling into Visual Tokens.
 * Formerly: UIMasterLaw.gs
 */
var VISUAL_GRAMMAR = Object.freeze({
    "ARCHETYPES": {
        "VAULT": { "header_icon": "Lock", "border_color": "#00d2ff", "motion": "still" },
        "GATE": { "header_icon": "DoorOpen", "border_color": "#9d50bb", "motion": "breathing" },
        "STREAM": { "header_icon": "Zap", "border_color": "#00ffaa", "motion": "wave" },
        "BRIDGE": { "header_icon": "Globe", "border_color": "#00d2ff", "motion": "vibration" },
        "ADAPTER": { "header_icon": "Zap", "border_color": "#00ffaa", "motion": "static" },
        "TRANSFORM": { "header_icon": "RefreshCw", "border_color": "#ffcc00", "motion": "morph" },
        "PROBE": { "header_icon": "Activity", "border_color": "#ff3366", "motion": "vibration" },
        "TRIGGER": { "header_icon": "Zap", "border_color": "#00ffaa", "motion": "pulse" },
        "SENSOR": { "header_icon": "Eye", "border_color": "#00ffaa", "motion": "breathing" },
        "SYSTEM_INFRA": { "header_icon": "Cpu", "border_color": "#555", "motion": "still" },
        "SERVICE": { "header_icon": "Layers", "border_color": "#00ffaa", "motion": "static" },
        "SYSTEM_CORE": { "header_icon": "Shield", "border_color": "#666666", "motion": "still" },
        "ORCHESTRATOR": { "header_icon": "Activity", "border_color": "#9d50bb", "motion": "breathing" },
        "INHIBIT": { "header_icon": "XCircle", "border_color": "#ff3366", "motion": "pulse" },
        "SCHEMA": { "header_icon": "FileText", "border_color": "#ffcc00", "motion": "static" },
        "OBSERVER": { "header_icon": "Activity", "border_color": "#00ffaa", "motion": "vibration" },
        "LOGIC_CORE": { "header_icon": "Cpu", "border_color": "#ffcc00", "motion": "breathing" }
    },
    "INTENTS": {
        "READ": { "token": "var(--accent-primary)", "icon": "Eye", "signifier": "intent-read" },
        "WRITE": { "token": "var(--accent-success)", "icon": "Save", "signifier": "intent-write" },
        "EXECUTE": { "token": "var(--accent-secondary)", "icon": "Play", "signifier": "intent-exec" }
    },
    "LAYOUT_DYNAMICS": {
        "SIDEBAR_LEFT_WIDTH": 320,
        "SIDEBAR_RIGHT_WIDTH": 420,
        "FOOTER_HEIGHT": 32
    },
    "PRIORITY_LAWS": {
        "motion_dominance": "SEMANTIC_INTENT",
        "narrative": "El Estado de Acción (método) domina sobre el Estado de Identidad (arquetipo). Si hay conflicto, la animación de la intención prevalece."
    }
});

/**
 * LEGACY ALIAS
 */
var UIMasterLaw = {
    "VISUAL_GRAMMAR": VISUAL_GRAMMAR
};
