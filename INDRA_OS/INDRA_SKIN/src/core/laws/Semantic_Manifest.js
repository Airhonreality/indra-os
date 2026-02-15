/**
 * src/core/laws/Semantic_Manifest.js
 * 🧬 MASTER DNA MANIFEST
 * DHARMA: Centralizar la identidad estática con identificadores semánticos agnósticos.
 * AXIOMA: "Tabula Rasa por diseño. La soberanía reside en el autodescubrimiento del Backend."
 */

export const SEMANTIC_MANIFEST = {
    // AXIOMA: Solo mantenemos los PORTALES y NODOS VIRTUALES estructurales.
    // Los adaptadores (DRIVE, NOTION, SHEET, etc.) ahora son autodescubiertos por el Core.

    "CORE_PORTAL": {
        "technical_id": "view_auth_gate",
        "functional_name": "Portal de Acceso",
        "LABEL": "Portal de Acceso",
        "layer": "NIVEL_3",
        "config": { "archetype": "GATE", "icon": "ShieldCheck" }
    },

    "WORKSPACE_CANVAS": {
        "technical_id": "view_flow_orchestrator",
        "functional_name": "Lienzo de Automatización",
        "LABEL": "Lienzo de Automatización",
        "layer": "NIVEL_1",
        "config": { "archetype": "ORCHESTRATOR", "intent": "ORCHESTRATION" }
    },

    "SLOT_NODE": {
        "technical_id": "slot_node",
        "label": "Cotizador Inteligente (Slot Node)",
        "functional_name": "Calculadora de Realidad",
        "description": "Nodo compuesto para proyecciones multifacéticas y formularios inteligentes.",
        "ARCHETYPE": "UTILITY",
        "ARCHETYPES": ["UTILITY", "SLOT", "NODE"],
        "DOMAIN": "UI_PROJECTION",
        "visibility": "PUBLIC",
        "isVirtual": true,
        "config": { "archetype": "SLOT", "icon": "Layout" }
    },

    "COSMOS": {
        "technical_id": "cosmos",
        "LABEL": "Motor de Realidad (Cosmos)",
        "icon": "Cpu",
        "color": "#3B82F6",
        "config": { "archetype": "ENGINE", "intent": "SYSTEM" }
    }
};



