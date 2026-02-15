/**
 * ContractRegistry.gs
 * DHARMA: El Cuerpo Canónico (Layer 0.5)
 * 
 * Almacena los esquemas técnicos (contratos IO) de las herramientas públicas.
 * Separa la definición de la interfaz de la lógica de ejecución.
 * Version: 14.5_STABILIZED
 */

const ContractRegistry = {
  schemas: {
    invoke: {
      description: "Synchronously activates a high-integrity industrial workflow, coordinating technical node triggers and state orchestration.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: { 
        inputs: { 
          flowId: { type: "string", io_behavior: "SCHEMA", description: "Target technical workflow identifier (blueprint key)." }, 
          initialPayload: { type: "object", io_behavior: "STREAM", description: "Primary data stream for execution bootstrap." },
          systemContext: { type: "object", io_behavior: "GATE", description: "Operational circuit parameters." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        },
        outputs: {
          result: { type: "object", io_behavior: "STREAM", description: "Resulting state stream from the workflow circuit product." }
        }
      }
    },
    getSystemStatus: {
      description: "Extracts industrial health telemetry and global operational status of the Core circuit.",
      semantic_intent: "PROBE",
      exposure: "public",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for status discovery." }
        },
        outputs: { 
          status: { type: "string", io_behavior: "PROBE", description: "Global circuit health status." }, 
          coherenceIndex: { type: "string", io_behavior: "PROBE", description: "Semantic integrity and structural health metric." } 
        } 
      }
    },
    getSovereignGenotype: {
      description: "Extracts the complete system genotype (L0) including COMPONENT_REGISTRY and DRIVE_SCHEMA.",
      semantic_intent: "SCHEMA",
      exposure: "public",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for genotype extraction." }
        },
        outputs: { genotype: { type: "object", io_behavior: "SCHEMA", description: "Flattened system genotype object." } } 
      }
    },
    getSystemContracts: {
      description: "Exports a comprehensive technical directory of audited system capabilities and their interfaces.",
      semantic_intent: "SCHEMA",
      exposure: "public",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for contract discovery." }
        },
        outputs: { contracts: { type: "object", io_behavior: "SCHEMA", description: "Audited capability dictionary stream." } } 
      }
    },
    processNextJobInQueue: {
      description: "Claims and activates the oldest pending technical task from the industrial queue circuit.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for queue processing." }
        },
        outputs: { result: { type: "object", io_behavior: "PROBE", description: "Execution status of the processed task." } } 
      }
    },
    processSpecificJob: {
      description: "Directly activates a targeted technical task by its unique industrial identifier.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: { 
        inputs: { 
          jobId: { type: "string", io_behavior: "GATE", description: "Target task industrial identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: { result: { type: "object", io_behavior: "PROBE", description: "Execution result stream." } } 
      }
    },
    getGovernanceReport: {
      description: "Generates a detailed forensic health report and structural coherence audit.",
      semantic_intent: "SENSOR",
      exposure: "public",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for report generation." }
        },
        outputs: { report: { type: "object", io_behavior: "PROBE", description: "Diagnostic structural health data stream." } } 
      }
    },
    getSemanticAffinity: {
      description: "Benchmarks external linguistic streams against institutional semantic laws to identify affinity metrics.",
      semantic_intent: "PROBE",
      exposure: "public",
      io_interface: { 
        inputs: { 
          phrase: { type: "string", io_behavior: "STREAM", description: "Linguistic input stream to evaluate." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: { affinity: { type: "object", io_behavior: "PROBE", description: "Resulting affinity metric stream." } } 
      }
    },
    getSystemDiscovery: {
      description: "Extracts the industrial node graph for technical navigation and topology discovery.",
      semantic_intent: "PROBE",
      exposure: "public",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for discovery." }
        },
        outputs: { discovery: { type: "object", io_behavior: "SCHEMA", description: "Topology discovery graph product." } } 
      }
    },
    getNodeContract: {
      description: "Extracts the full technical interface (industrial IO contract) for a specific node on demand.",
      semantic_intent: "SCHEMA",
      exposure: "public",
      io_interface: { 
        inputs: { 
          nodeId: { type: "string", io_behavior: "GATE", description: "Target node industrial identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: { contract: { type: "object", io_behavior: "SCHEMA", description: "Full IO technical interface specification." } } 
      }
    },
    getMCEPManifest: {
      description: "Extracts an AI-Ready tool manifest (MCEP) filtered by semantic integrity debt (<10%).",
      semantic_intent: "SCHEMA",
      exposure: "public",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for manifest isolation." }
        }, 
        outputs: { manifest: { type: "object", io_behavior: "SCHEMA", description: "Validated IA-READY tool directory." } } 
      }
    },
    getSimulationSeeds: {
      description: "Extracts truth seeds from the Core Mock Factory for frontend laboratory synchronization.",
      semantic_intent: "SCHEMA",
      exposure: "public",
      io_interface: {
        inputs: {},
        outputs: { genotype: { type: "object", description: "Mocked system genotype." } }
      }
    },
    getDistributionSite: {
      description: "Extracts the UI distribution and perspective architecture for Shell manifestation.",
      semantic_intent: "SCHEMA",
      exposure: "public",
      io_interface: {
        inputs: {},
        outputs: { site: { type: "object", io_behavior: "SCHEMA", description: "UI manifestation site object." } }
      }
    },
    validateTopology: {
      description: "Performs a deep structural dry-run of a flow topology, verifying morphisms (L5+) and topological sanity.",
      semantic_intent: "PROBE",
      exposure: "public",
      io_interface: {
        inputs: {
          flow: { type: "object", io_behavior: "SCHEMA", description: "Flow topology candidate (nodes/connections)." }
        },
        outputs: {
          isValid: { type: "boolean", io_behavior: "PROBE", description: "True if topology is structurally sound." },
          steps: { type: "array", io_behavior: "SCHEMA", description: "The resulting execution sequence if valid." },
          error: { type: "string", io_behavior: "PROBE", description: "Error message if validation fails." }
        }
      }
    },
    validateSovereignty: {
      description: "Performs a deep architectural audit of the system sovereignty, ensuring all artifacts comply with L0 laws.",
      semantic_intent: "PROBE",
      exposure: "public",
      io_interface: {
        inputs: {
          target: { type: "string", io_behavior: "GATE", description: "Audit target identifier." }
        },
        outputs: {
          isValid: { type: "boolean", io_behavior: "PROBE", description: "True if system is sovereign." },
          criticalErrors: { type: "array", io_behavior: "PROBE", description: "List of sovereignty violations." }
        }
      }
    },
    getArtifactSchemas: {
      description: "Extracts the canonical artifact schemas (COSMOS, LAYOUT, FLOW) for dynamic UI projection.",
      semantic_intent: "SCHEMA",
      exposure: "public",
      io_interface: {
        inputs: {},
        outputs: { schemas: { type: "object", io_behavior: "SCHEMA", description: "Canonical artifact schemas dictionary." } }
      }
    },
    verifySovereignEnclosure: {
      description: "Performs a deep cryptographic and institutional handshake to verify sovereign connectivity.",
      semantic_intent: "PROBE",
      exposure: "public",
      io_interface: {
        inputs: { accountId: { type: "string" } },
        outputs: { success: { type: "boolean" }, status: { type: "string" } }
      }
    },
    executeAction: {
      description: "Polymorphic execution gateway. Routes a technical action to a specific node using semantic addressing.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: {
        inputs: { 
          action: { type: "string", description: "Format 'nodeId:methodName'" },
          payload: { type: "object", description: "Data stream for the action." }
        },
        outputs: { result: { type: "any" } }
      }
    },

    // --- SENSING ADAPTER SCHEMAS ---
    scanArtifacts: {
      description: "Performs technical introspection of a target industrial container to identify assets via canonical industrial taxonomy.",
      semantic_intent: "SENSOR",
      exposure: "public",
      risk: 1,
      io_interface: { 
        inputs: {
          folderId: { type: "string", io_behavior: "GATE", description: "Target container industrial identifier for sensing." },
          deepSearch: { type: "boolean", io_behavior: "GATE", description: "Enables recursive industrial content analysis." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier registry routing." }
        }, 
        outputs: {
          artifacts: { type: "array", io_behavior: "STREAM", description: "List of identified industrial assets with their canonical roles." }
        } 
      }
    },
    saveSnapshot: {
      description: "Executes robust institutional content persistence with technical shadow versioning and structural validation.",
      semantic_intent: "STREAM",
      exposure: "public",
      risk: 2,
      io_interface: { 
        inputs: {
          content: { type: "object", io_behavior: "STREAM", description: "Industrial asset payload to be persisted." },
          fileName: { type: "string", io_behavior: "STREAM", description: "Technical filename including canonical extension." },
          type: { type: "string", io_behavior: "SCHEMA", description: "Canonical taxonomy type for industrial validation." },
          folderId: { type: "string", io_behavior: "GATE", description: "Destination container industrial identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        }, 
        outputs: {
          fileId: { type: "string", io_behavior: "PROBE", description: "Technical identifier of the generated industrial snapshot." }
        } 
      }
    },
    quickDiagnostic: {
      description: "Triggers an active axiomatic audit to verify system-wide industrial contract compliance.",
      semantic_intent: "ANALYZE",
      exposure: "public",
      risk: 1,
      io_interface: {
        inputs: {
          targetAdapter: { type: "string", io_behavior: "GATE", description: "Optional specific circuit focus for the industrial audit." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Global industrial compliance status." },
          diagnostic: { type: "string", io_behavior: "PROBE", description: "High-level industrial summary of findings." }
        }
      }
    },
    discoverSeed: {
      description: "Benchmarks existing industrial storage to locate the system's root sovereignty folder circuit.",
      semantic_intent: "PROBE",
      exposure: "public",
      risk: 1,
      io_interface: { 
        inputs: {
          rootName: { type: "string", io_behavior: "STREAM", description: "Expected industrial root folder identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for discovery routing." }
        }, 
        outputs: {
          folderId: { type: "string", io_behavior: "PROBE", description: "Discovered industrial root identifier confirmation." }
        } 
      }
    },
    initializeSeed: {
      description: "Establishes the industrial root sovereignty folder if not present.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      risk: 2,
      io_interface: {
        inputs: {
          rootName: { type: "string", io_behavior: "STREAM", description: "Root folder name to initialize." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          folderId: { type: "string", io_behavior: "PROBE", description: "Initialized root folder identifier." },
          status: { type: "string", io_behavior: "PROBE", description: "Initialization status." }
        }
      }
    },

    // --- DRIVE ADAPTER SCHEMAS ---
    find: {
      description: "Executes a technical query against the industrial storage layer.",
      semantic_intent: "PROBE",
      exposure: "public",
      risk: 1,
      io_interface: {
        inputs: {
          query: { type: "string", io_behavior: "STREAM", description: "Drive API query string." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          foundItems: { type: "array", io_behavior: "STREAM", description: "List of matching industrial assets." }
        }
      }
    },
    compareSnapshots: {
      description: "Performs differential analysis between two industrial snapshots.",
      semantic_intent: "ANALYZE",
      exposure: "public",
      risk: 1,
      io_interface: {
        inputs: {
          id1: { type: "string", role: "resource", description: "Identifier of the baseline snapshot." },
          id2: { type: "string", role: "resource", description: "Identifier of the target snapshot to compare." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          diff: { type: "object", io_behavior: "STREAM", description: "Differential analysis result with added, removed, and changed fields." }
        }
      }
    },
    reconcileSpatialState: {
      description: "Synchronizes spatial positioning data to persistent storage.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      risk: 2,
      io_interface: {
        inputs: {
          positions: { type: "object", io_behavior: "STREAM", description: "Node position map to persist." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Synchronization status." }
        }
      }
    },
    getSpatialState: {
      description: "Retrieves persisted spatial positioning data.",
      semantic_intent: "STREAM",
      exposure: "public",
      risk: 1,
      io_interface: {
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          positions: { type: "object", io_behavior: "STREAM", description: "Node position map." }
        }
      }
    },
    getSnapshot: {
      description: "Retrieves a specific industrial snapshot by identifier.",
      semantic_intent: "STREAM",
      exposure: "public",
      risk: 1,
      io_interface: {
        inputs: {
          fileId: { type: "string", io_behavior: "GATE", description: "Snapshot file identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          content: { type: "object", io_behavior: "STREAM", description: "Snapshot content payload." }
        }
      }
    },
    deleteArtifact: {
      description: "Permanently removes an industrial artifact from storage.",
      semantic_intent: "INHIBIT",
      exposure: "public",
      risk: 3,
      io_interface: {
        inputs: {
          fileId: { type: "string", io_behavior: "GATE", description: "Artifact identifier to remove." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Deletion confirmation." }
        }
      }
    },
    deleteItem: {
      description: "Permanently removes an item from a technical provider (Notion, Drive, etc.).",
      semantic_intent: "INHIBIT",
      exposure: "public",
      risk: 3,
      io_interface: {
        inputs: {
          id: { type: "string", io_behavior: "GATE", description: "Item identifier to remove." },
          confirmHighRisk: { type: "boolean", description: "Explicit confirmation for high risk action." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE" }
        }
      }
    },
    listResources: {
      description: "Lists all industrial resources in a target container.",
      semantic_intent: "PROBE",
      exposure: "public",
      risk: 1,
      io_interface: {
        inputs: {
          folderId: { type: "string", io_behavior: "GATE" },
          accountId: { type: "string", io_behavior: "GATE" }
        },
        outputs: {
          resources: { type: "array" }
        }
      }
    },

    // --- NOTION ADAPTER SCHEMAS ---
    retrieveDatabase: {
      description: "Retrieve data from a database.",
      archetype: "ADAPTER",
      semantic_intent: "QUERY",
      exposure: "public",
      risk: 1,
      io_interface: { 
        inputs: {
          databaseId: { type: "string", description: "Target database identifier." }
        },
        outputs: { 
          results: { type: "array", description: "Flattened record collection." } 
        } 
      }
    },

    // --- ORCHESTRATOR SCHEMAS ---
    executeFlow: {
      description: "Executes a technical workflow snapshot.",
      archetype: "ORCHESTRATOR",
      semantic_intent: "TRIGGER",
      exposure: "public",
      risk: 2,
      io_interface: {
        inputs: {
          flow: { type: "object", io_behavior: "SCHEMA", description: "Canonical workflow definition (steps, topology)." },
          initialContext: { type: "object", io_behavior: "STREAM", description: "Bootstrap data stream for execution." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        },
        outputs: {
          success: { type: "boolean" }
        }
      }
    },
    stabilizeAxiomaticReality: {
      description: "Receives a complete reality snapshot from the Front and persists it to Drive.",
      semantic_intent: "STREAM",
      exposure: "public",
      risk: 2,
      io_interface: {
        inputs: {
          snapshot: { type: "object", required: true },
          _carriedReality: { type: "boolean" },
          _triggerAction: { type: "string" }
        },
        outputs: {
          success: { type: "boolean" },
          fileId: { type: "string" },
          cosmosId: { type: "string" }
        }
      }
    }
  },

  /**
   * Obtiene un esquema por su ID.
   */
  get: function(schemaId) {
    return this.schemas[schemaId] || null;
  },

  /**
   * Obtiene todos los esquemas.
   */
  getAll: function() {
    return JSON.parse(JSON.stringify(this.schemas));
  }
};





