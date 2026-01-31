/**
 * 0_Laws/System_Constitution.gs
 * Version: 1.1.0-STARK
 * Dharma: Immutable technical registry for system topography, physical drive benchmarks, and operational boundary orchestration.
 * Formerly: SystemManifest.gs
 */
var SYSTEM_CONSTITUTION = Object.freeze({
  label: "System Constitution",
  description: "Immutable technical registry for system topography.",
  
  // ============================================================
  // SECTION 1: SYSTEM METADATA
  // ============================================================
  version: "1.1.0-MCEP",
  anchorPropertyKey: "ORBITAL_CORE_ROOT_ID", // The Divine Particle (Physical Anchor)
  
  // ============================================================
  // SECTION 2: PHYSICAL DRIVE TOPOGRAPHY
  // ============================================================
  driveSchema: {
    rootFolderName: "OrbitalCore",
    jsonFlowsFolder: { path: "Flows" },
    templatesFolder: { path: "Templates" },
    assetsFolder: { path: "Assets" },
    outputFolder: { path: "Output" },
    systemFolder: { path: "System" },
    memoryFolder: { path: "System/Memory" },
    intelligenceMemoryFolder: { path: "System/Memory/Intelligence" },
    adapterMemoryFolder: { path: "System/Memory/Adapters" }
  },
  
  // ============================================================
  // SECTION 3: PERSISTENT STORAGE BLUEPRINTS (SHEETS)
  // ============================================================
  sheetsSchema: {
    jobQueue: {
      propertyKey: "ORBITAL_CORE_JOB_QUEUE_SHEET_ID",
      sheetName: "JobQueue",
      header: [
        "jobId", "status", "flowId", "initialPayload", "triggerSource", 
        "result", "error", "createdAt", "updatedAt", "scheduledAt"
      ]
    },
    auditLog: {
      propertyKey: "ORBITAL_CORE_AUDIT_LOG_SHEET_ID",
      sheetName: "AuditLog",
      header: [ "timestamp", "eventType", "status", "details", "metrics" ]
    }
  },
  
  // ============================================================
  // SECTION 4: REQUIRED CORE CONNECTIONS
  // ============================================================
  requiredConnections: {
    "NOTION_API_KEY": { type: "user_provided", validation: "secret_non_empty", prompt: "Enter your Notion API Integration Token" },
    "TOKENS_FILE_ID": { type: "system_generated", validation: "string_non_empty" },
    "MASTER_ENCRYPTION_KEY": { type: "system_generated", validation: "secret_non_empty" },
    "DEPLOYMENT_URL": { type: "user_provided", validation: "url" },
    "WORKER_URL": { type: "user_provided", validation: "url" },
    "PDF_GENERATOR_FUNCTION_URL": { type: "user_provided", validation: "url" },
    "ADMIN_EMAIL": { type: "user_provided", validation: "email" },
    "ORBITAL_CORE_SATELLITE_API_KEY": { type: "system_generated", generator: { type: "uuid" } }
  },
  
  // ============================================================
  // SECTION 5: OPERATIONAL BOUNDARIES
  // ============================================================
  systemLimits: {
    maxRetries: 3,
    initialBackoffMs: 1000,
    jobProcessingLockTimeoutMs: 300000
  },
  
  // ============================================================
  // SECTION 7: COSMOS REGISTRY (Shared Spaces)
  // ============================================================
  cosmosRegistry: {
    // Schema definition for multi-account workspaces
    properties: {
      accountId: { type: "string", required: true },
      cosmosId: { type: "string", required: true },
      tokensFileId: { type: "string", required: true },
      encryptionKey: { type: "string", required: false } // Fallback to global if null
    }
  }
});

/**
 * LEGACY ALIAS (For backward compatibility during migration)
 */
var SYSTEM_MANIFEST = SYSTEM_CONSTITUTION;
