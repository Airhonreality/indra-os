/**
 * 0_Laws/Topology_Laws.gs
 * Version: 1.0.0-STARK
 * Dharma: Hierarchy of universes and shared namespaces (Cosmos Topology).
 */
var TOPOLOGY_LAWS = Object.freeze({
    /**
     * HIERARCHY LEVELS
     * Defines the nested containers of reality.
     */
    "HIERARCHY": {
        "COSMOS": { 
            "level": 1, 
            "label": "Namespace", 
            "description": "Shared universe (e.g., Company X or Private Space).",
            "anchor_key": "NAMESPACE_ID"
        },
        "PROJECT": { 
            "level": 2, 
            "label": "Objective", 
            "description": "Specific goal container (e.g., Lead Automation).",
            "anchor_key": "PROJECT_FOLDER_ID"
        },
        "ARTIFACT": { 
            "level": 3, 
            "label": "Component", 
            "description": "The atomic pieces of the project.",
            "anchor_key": "FILE_ID"
        }
    },

    /**
     * ARTIFACT TAXONOMY
     * Maps extensions to semantic roles.
     */
    "ARTIFACT_TAXONOMY": {
        "FLOW": { "extension": ".flow.json", "archetype": "ORCHESTRATOR", "category": "Logic" },
        "VAULT": { "extension": ".vault.json", "archetype": "VAULT", "category": "Data" },
        "SCHEMA": { "extension": ".schema.json", "archetype": "SCHEMA", "category": "Architecture" },
        "LAYOUT": { "extension": ".layout.json", "archetype": "TRANSFORM", "category": "Projection" },
        "PROJECT": { "extension": ".project.json", "archetype": "SYSTEM_INFRA", "category": "State" }
    }
});
