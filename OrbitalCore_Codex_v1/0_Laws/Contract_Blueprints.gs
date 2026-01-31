/**
 * 0_Laws/Contract_Blueprints.gs
 * Version: 1.1.0-STARK
 * Dharma: Pure data structure for industrial contract validation.
 * Formerly: Inside SchemaRegistry.gs
 */
var CONTRACT_BLUEPRINTS = Object.freeze({
    // ============================================================
    // SECTION 1: CORE ARTIFACTS
    // ============================================================

    // FLOW: The orchestration logic (Canvas drawing)
    "flow": {
      required: ["id", "label", "steps"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        description: { type: "string" },
        version: { type: "string", default: "1.0.0" },
        steps: { 
            type: "object", 
            description: "Dictionary of execution nodes by ID." 
        },
        connections: {
            type: "array",
            description: "List of edges between nodes { from, to, outPort, inPort }."
        }
      }
    },

    // VAULT: Structured data storage
    "vault": {
      required: ["id", "label", "data"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        archetype: { type: "string", default: "VAULT" },
        data: { 
            type: "array", 
            description: "Table-like structure or collection of objects." 
        },
        schema_ref: { type: "string", description: "Reference to a .schema.json file." }
      }
    },

    // SCHEMA: Data structure definition
    "schema": {
      required: ["id", "schema_type", "fields"],
      properties: {
        id: { type: "string" },
        schema_type: { type: "string", enum: ["ENTITY", "IO_PORT", "CONFIG"] },
        fields: { 
            type: "object",
            description: "Field definitions { name: { type, required, default } }"
        }
      }
    },

    // PROJECT: The Objective Container
    "project": {
      required: ["id", "label", "cosmos_id"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        description: { type: "string" },
        cosmos_id: { type: "string", description: "The parent Namespace ID." },
        artifacts: { 
            type: "array", 
            description: "List of relative paths to project artifacts." 
        },
        layout: { type: "object", description: "UI preferences for this project." }
      }
    },

    // ============================================================
    // SECTION 2: SYSTEM INTERNAL CONTRACTS
    // ============================================================

    "system_snapshot": {
      required: ["timestamp", "system_version"],
      properties: {
        timestamp: { type: "string" },
        system_version: { type: "string" },
        health_index: { type: "number" },
        active_adapters: { type: "array" }
      }
    }
});
