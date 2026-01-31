/**
 * 0_Laws/UI_Distribution.gs
 * Version: 4.0.0-STARK
 * Dharma: UI Anatomy - Defines where the organs (modules) manifest in the body (UI).
 * Formerly: system.distribution.gs
 */
var UI_DISTRIBUTION = Object.freeze({
    /**
     * Physical Slots in the UI
     */
    "SLOTS": {
        "SIDEBAR_PRIMARY": { "archetype": "NAVIGATION", "capacity": "medium", "behavior": "accordion" }, // Cosmos Navigation
        "SIDEBAR_SECONDARY": { "archetype": "PROPERTY_PANEL", "capacity": "small", "behavior": "docked" }, // Tools
        "CANVAS_MAIN": { "archetype": "STAGE_2D", "capacity": "infinite", "behavior": "spatial" },
        "TERMINAL_STATUS": { "archetype": "LOG_VIEWER", "capacity": "large", "behavior": "collapsible" },
        "AUTH_OVERLAY": { "archetype": "MODAL_GATE", "capacity": "focused", "behavior": "blocking" }
    },

    /**
     * Perspectives (Senses)
     * Desacouples Cosmos to avoid collisions.
     */
    "PERSPECTIVES": {
        "UNIVERSE_EXPLORER": {
            "label": "Explorador de Cosmos",
            "icon": "Globe",
            "canvas": ["STAGE_2D"],
            "sidebars": {
                "PRIMARY": ["DRIVE_EXPLORER", "NOTION_BRIDGE"],
                "SECONDARY": ["NODE_INSPECTOR", "CHAT_ASSISTANT"]
            }
        },
        "CORE_DIAGNOSTIC": {
            "label": "Diagnóstico de Sistema",
            "icon": "Activity",
            "canvas": ["STATE_MONITOR"],
            "sidebars": {
                "PRIMARY": ["FILE_EXPLORER"],
                "SECONDARY": ["EXECUTION_TRACE", "CHAT_ASSISTANT"]
            }
        },
        "FLOW_ORCHESTRATOR": {
            "label": "Orquestador de Flujos",
            "icon": "Zap",
            "canvas": ["FLOW_EDITOR"],
            "sidebars": {
                "PRIMARY": ["BLUEPRINT_LIBRARY"],
                "SECONDARY": ["PARAMETER_INSPECTOR"]
            }
        }
    },

    /**
     * Manifestations: Binding Adapters to Canonical Slots.
     */
    "MANIFESTATIONS": {
        "tokenManager": { "slot": "AUTH_OVERLAY", "archetype": "SYSTEM_CORE" },
        "drive": { "slot": "SIDEBAR_PRIMARY", "id": "DRIVE_EXPLORER", "archetype": "ADAPTER" },
        "notion": { "slot": "SIDEBAR_PRIMARY", "id": "NOTION_BRIDGE", "archetype": "BRIDGE" },
        "intelligence": { "slot": "SIDEBAR_SECONDARY", "id": "CHAT_ASSISTANT", "archetype": "LOGIC_CORE" },
        "monitor": { "slot": "TERMINAL_STATUS", "id": "EXECUTION_TRACE", "archetype": "OBSERVER" }
    }
});

/**
 * LEGACY ALIAS
 */
var SystemDistribution = {
    slots: UI_DISTRIBUTION.SLOTS,
    perspectives: UI_DISTRIBUTION.PERSPECTIVES,
    manifestations: UI_DISTRIBUTION.MANIFESTATIONS
};
