/**
 * src/core/2_Semantic_Transformation/Semantic_Manifest.js
 * 🧬 MASTER DNA MANIFEST — COMPONENTES PURAMENTE VIRTUALES
 *
 * ADR-022: Este manifest SOLO contiene items isVirtual:true.
 * Se unifica el dialecto a UPPER_CASE para evitar transmutaciones ruidosas.
 */

export const SEMANTIC_MANIFEST = {

    "CORE_PORTAL": {
        "id": "view_auth_gate",
        "LABEL": "Portal de Acceso",
        "ARCHETYPE": "GATE",
        "DOMAIN": "AUTH",
        "LEVEL": "NIVEL_3",
        "isVirtual": true,
        "traits": ["SECURITY", "GATEWAY"]
    },

    "WORKSPACE_CANVAS": {
        "id": "view_flow_orchestrator",
        "LABEL": "Lienzo de Automatización",
        "ARCHETYPE": "ORCHESTRATOR",
        "DOMAIN": "ORCHESTRATION",
        "LEVEL": "NIVEL_1",
        "isVirtual": true,
        "traits": ["CANVAS", "GRAPH"]
    },

    "SLOT_NODE": {
        "id": "slot_node",
        "LABEL": "Proyección Atómica",
        "ARCHETYPE": "COMPOSITOR",
        "DOMAIN": "UI_PROJECTION",
        "LEVEL": "NIVEL_2",
        "isVirtual": true,
        "CAPABILITIES": {
            "RECEIVE": {
                "id": "RECEIVE",
                "io": "INPUT",
                "type": "ANY",
                "LABEL": "RECEIVE 📺",
                "traits": ["SLOT", "SINK"]
            }
        }
    },

    "COSMOS": {
        "id": "cosmos",
        "LABEL": "Motor de Realidad (Cosmos)",
        "ARCHETYPE": "ENGINE",
        "DOMAIN": "SYSTEM",
        "LEVEL": "NIVEL_0",
        "isVirtual": true,
        "traits": ["CORE", "REALITY"]
    }
};
