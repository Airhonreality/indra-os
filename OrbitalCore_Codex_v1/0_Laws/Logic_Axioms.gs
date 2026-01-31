/**
 * 0_Laws/Logic_Axioms.gs
 * Version: 2.0.0-STARK
 * Dharma: Canonical White-lists and logic axioms for contract validation.
 * Formerly: MasterLaw.gs
 */

var LOGIC_AXIOMS = Object.freeze({
    // ============================================================
    // SECTION 1: THE DIVINE PARTICLE (Universal Identity Block)
    // ============================================================
    // Every entity in Indra OS must port this structure to be recognized.
    "UNIVERSAL_IDENTITY_BLOCK": {
        "required": ["id", "label", "archetype", "semantic_intent"],
        "metadata": ["category", "description", "version"]
    },

    "CORE_LOGIC": {
        "ARCHETYPES": {
            "VAULT": { "category": "Seguridad", "description": "Encrypted secure storage and secret management." },
            "GATE": { "category": "Lógica", "description": "Decision point, authentication, or conditional access." },
            "STREAM": { "category": "Datos", "description": "Continuous data flow or event pipeline." },
            "BRIDGE": { "category": "Conectores", "description": "External API integration or system connection." },
            "INHIBIT": { "category": "Sistema", "description": "Emergency stop or block mechanism." },
            "TRIGGER": { "category": "Eventos", "description": "Single event activator or webhook entry." },
            "SCHEMA": { "category": "Arquitectura", "description": "Data structure definition and contract specification." },
            "PROBE": { "category": "Monitoreo", "description": "Health sensor, status verifier, or state checker." },
            "TRANSFORM": { "category": "Transformación", "description": "Data format converter (A to B)." },
            "OBSERVER": { "category": "Monitoreo", "description": "Logs, telemetry, and monitoring visualization." },
            "ADAPTER": { "category": "Conectores", "description": "Industrial social or service connectors." },
            "SYSTEM_INFRA": { "category": "Sistema", "description": "Fundamental system infrastructure." },
            "LOGIC_CORE": { "category": "Sistema", "description": "Internal coordination and reasoning." },
            "SENSOR": { "category": "IA & Percepción", "description": "Cognitive sensing and multi-layered introspection." },
            "SERVICE": { "category": "Utilidades", "description": "Granular logic provider or specialized utility." },
            "SYSTEM_CORE": { "category": "Sistema", "description": "Fundamental error handling and boot logic." },
            "ORCHESTRATOR": { "category": "Lógica", "description": "High-level reasoning and coordination entity." }
        },
        "IO_BEHAVIORS": {
             "GATE": "Input validation or authentication barrier.",
             "STREAM": "Continuous data flow or direct piping.",
             "SCHEMA": "Structural contract or metadata definition.",
             "PROBE": "Status check or sampling data.",
             "TRANSFORM": "Formatting and mapping logic."
        }
    },

    
    // ============================================================
    // SECTION 2: PURITY RULES (Única Fuente de Verdad)
    // ============================================================
    "PURITY_RULES": {
        // Términos prohibidos en el contenido de módulos del Core
        "FORBIDDEN_TERMS": ['indra', 'mentem', 'orbital', 'stark'],
        
        // Claves de stack permitidas como identificadores técnicos (no se auditan)
        "INSTITUTIONAL_KEYS": ['indra', 'intelligence'],
        
        // Claves estructurales que no son módulos funcionales (no se auditan)
        "RESERVED_KEYS": ['schemas', 'label', 'description', 'semantic_intent', 'archetype', 'id', 'teardown', 'isBroken', 'error', 'getAllNodes'],
        
        // Arquetipos que pueden usar términos institucionales en sus metadatos
        "EXEMPT_ARCHETYPES": ['ADAPTER', 'BRIDGE', 'ORCHESTRATOR']
    },
    
    "SENSITIVE_TERMS": ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'CREDENTIAL', 'AUTH', 'SIGNATURE'],

    /**
     * COGNITIVE_FRONTIER: Ranking of models for auto-selection.
     * Tier 1: Multimodal Frontier
     * Tier 2: Performance/Speed
     */
    "COGNITIVE_FRONTIER": [
        'gemini-2.0-flash', 
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'llama-3.3-70b-versatile'
    ],
    
    "CRITICAL_SYSTEMS": [
        "public", "sensing", "metabolism", "tokenManager", "drive", "monitoring", "config"
    ]
});

/**
 * LEGACY ALIAS
 */
var MasterLaw = LOGIC_AXIOMS;
