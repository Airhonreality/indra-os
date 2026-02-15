/**
 * 0_Laws/Logic_Axioms.gs
 * Version: 8.0.0-SOVEREIGN
 * Dharma: Leyes fundamentales de Identidad Universal y Soberanía Axiomática.
 */

var LOGIC_AXIOMS = Object.freeze({
    "UNIVERSAL_IDENTITY_BLOCK": {
        "required": ["id", "label", "archetype", "domain", "semantic_intent"],
        "metadata": ["category", "description", "version"]
    },

    "DOMAINS": {
        "SYSTEM_INFRA": { "label": "System Infrastructure" },
        "COMMUNICATION": { "label": "Communication Bridge" },
        "EXTERNAL_VAULT": { "label": "External Vault" },
        "INTELLIGENCE": { "label": "Cognitive Intelligence" },
        "GEOLOCATION": { "label": "Geospatial Logistics" },
        "SENSING": { "label": "Knowledge Sense" },
        "UI_LAYOUT": { "label": "UI Layout Matrix" },
        "CORE_LOGIC": { "label": "Core Reasoning" },
        "SCHEDULING": { "label": "Temporal Logistics" },
        "MAINTENANCE": { "label": "System Maintenance" },
        "GOVERNANCE": { "label": "System Governance" },
        "PURE_LOGIC": { "label": "Computational Logic" },
        "DOCUMENT_ENGINE": { "label": "Document Systems" },
        "UI_PROJECTION": { "label": "UI Projection Matrix" }
    },

    "CORE_LOGIC": {
        "ARCHETYPES": {
            "VAULT": { "category": "Data", "description": "Persistent storage." },
            "GATE": { "category": "Logic", "description": "Access control." },
            "STREAM": { "category": "Data", "description": "Event pipeline." },
            "ADAPTER": { "category": "Connectors", "description": "Industrial domain integration." },
            "ORCHESTRATOR": { "category": "Logic", "description": "High-level coordination." },
            "SERVICE": { "category": "System", "description": "Operational utility provider." },
            "BRIDGE": { "category": "Connectors", "description": "L1-L2 Data Transmutation." },
            "SCHEMA": { "category": "Contract", "description": "Formal interface definition." },
            "TRANSFORM": { "category": "Layout", "description": "Spatial projection rule." }
        },
        "IO_BEHAVIORS": {
             "GATE": "Input validation.",
             "STREAM": "Data piping.",
             "SCHEMA": "Contract definition."
        }
    },

    // ============================================================
    // SECTION 2: REGLAS DE PUREZA (Agnosticismo)
    // ============================================================
    "PURITY_RULES": {
        "FORBIDDEN_TERMS": ['indra', 'mentem', 'Indra', 'Axiom'],
        "INSTITUTIONAL_KEYS": ['indra', 'intelligence'],
        "RESERVED_KEYS": ['schemas', 'label', 'description', 'semantic_intent', 'archetype', 'id', 'teardown', 'isBroken', 'error', 'getAllNodes'],
        "EXEMPT_ARCHETYPES": ['ADAPTER', 'BRIDGE', 'ORCHESTRATOR', 'SERVICE']
    },
    
    "SENSITIVE_TERMS": ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'CREDENTIAL', 'AUTH', 'SIGNATURE'],

    /**
     * COGNITIVE_FRONTIER: Definición de Autonomía Cognitiva.
     * AXIOMA: Las fronteras son sugerencias; la soberanía reside en el Proveedor de Inteligencia.
     */
    "COGNITIVE_FRONTIER": {
        "preferred_model": "llama-3.3-70b-versatile",
        "fallback_model": "gpt-4o",
        "semantic_mode": "DETERMINISTIC"
    }
});





