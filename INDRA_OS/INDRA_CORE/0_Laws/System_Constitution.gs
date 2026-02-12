/**
 * 0_Laws/System_Constitution.gs
 * Version: 5.5.0-STARK
 * Dharma: Registro de topografía física, anclajes de Drive, conexiones core 
 *         e Identidad Ontológica de Componentes.
 */

var SYSTEM_CONSTITUTION = Object.freeze({
    "VERSION": "5.6.0-STARK",
    "ANCHOR_PROPERTY": "ORBITAL_CORE_ROOT_ID",
    "STATE": "DEVELOPMENT",

    // ============================================================
    // SECTION 0: ESTADOS OPERACIONALES (Service Levels)
    // Axioma: El Core define el "Momento", la Skin define el "Lugar".
    // ============================================================
    "OPERATIONAL_STATES": {
        "LOCKED": { "level": 0, "label": "Protocolo de Seguridad" },
        "ORCHESTRATION": { "level": 1, "label": "Modo de Operación Estándar" },
        "DEEP_AUDIT": { "level": 2, "label": "Modo de Inspección Profunda" }
    },
  
    // ============================================================
    // SECTION 1: TOPOGRAFÍA DE DRIVE (Anclaje Físico)
    // ============================================================
    "DRIVE_SCHEMA": {
        "ROOT": { "NAME": "OrbitalCore", "PATH": "root" },
        "FLOWS": { "NAME": "Flows", "PATH": "Flows" },
        "VAULTS": { "NAME": "Vaults", "PATH": "Vaults" },
        "SCHEMAS": { "NAME": "Schemas", "PATH": "Schemas" },
        "SYSTEM": { "NAME": "System_Core", "PATH": "System/Core" },
        "MEMORY": { "NAME": "System_Memory", "PATH": "System/Memory" },
        "TEMPLATES": { "NAME": "Templates", "PATH": "Templates" },
        "ASSETS": { "NAME": "Assets", "PATH": "Assets" },
        "OUTPUT": { "NAME": "Output", "PATH": "Output" }
    },

    // ============================================================
    // SECTION 2: TOPOGRAFÍA DE SHEETS (Registros Industriales)
    // ============================================================
    "SHEETS_SCHEMA": {
        "JOB_QUEUE": {
            "PROPERTY": "ORBITAL_JOB_QUEUE_ID",
            "NAME": "Orbital_JobQueue",
            "HEADER": ["jobId", "status", "flowId", "initialPayload", "triggerSource", "createdAt", "updatedAt", "scheduledAt", "result", "error"]
        },
        "AUDIT_LOG": {
            "PROPERTY": "ORBITAL_AUDIT_LOG_ID",
            "NAME": "Orbital_AuditLog",
            "HEADER": ["timestamp", "eventType", "severity", "message", "context"]
        }
    },
  
    // ============================================================
    // SECTION 3: REGISTRO DE IDENTIDAD (Ontología de Componentes)
    // Axioma v8.0: Los componentes son SOBERANOS. Este registro es solo para 
    // OVERRIDES de sistema o componentes sin código (Abstractos).
    // ============================================================
    "COMPONENT_REGISTRY": {
        // Los componentes reales (Adapters/Services) se auto-identifican vía CANON.
        // Solo definimos aquí componentes abstractos o nodos de UI puros.
        "CORE_PORTAL": { "LABEL": "Portal de Acceso", "ARCHETYPE": "BRIDGE", "DOMAIN": "UI_PROJECTION" },
        "WORKSPACE_CANVAS": { "LABEL": "Canvas Flow", "ARCHETYPE": "ORCHESTRATOR", "DOMAIN": "UI_PROJECTION" }
    },

    "ORCHESTRATOR_METADATA": {
        "specialNodes": {
            "TEXT": ["buildText"],
            "COLLECTION": ["mapObject"]
        }
    },

    // ============================================================
    // SECTION 4: CONEXIONES REQUERIDAS (Secretos y APIs)
    // ============================================================
    "CONNECTIONS": {
        "NOTION_API_KEY": { "TYPE": "SECRET", "VALIDATION": "NON_EMPTY", "legacyKey": "NOTION_API_KEY" },
        "TOKENS_FILE_ID": { "TYPE": "SYSTEM", "VALIDATION": "NON_EMPTY" },
        "MASTER_ENCRYPTION_KEY": { "TYPE": "SECRET", "VALIDATION": "NON_EMPTY" },
        "ORBITAL_CORE_SATELLITE_API_KEY": { "TYPE": "SYSTEM_GENERATED", "VALIDATION": "NON_EMPTY" }
    },
  
    // ============================================================
    // SECTION 5: LÍMITES OPERACIONALES
    // ============================================================
    "LIMITS": {
        "MAX_RETRIES": 3,
        "TIMEOUT_MS": 30000,
        "LOCK_TIMEOUT_MS": 300000
    }
});


