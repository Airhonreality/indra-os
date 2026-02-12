/**
 * ContractRegistry.gs
 * DHARMA: El Cuerpo Canónico (Layer 0.5)
 * 
 * Almacena los esquemas técnicos (contratos IO) de las herramientas públicas.
 * Separa la definición de la interfaz de la lógica de ejecución.
 */

const ContractRegistry = {
  schemas: {
    invoke: {
      description: "Synchronously activates a high-integrity industrial workflow, coordinating technical node triggers and state orchestration.",
      semantic_intent: "TRIGGER",
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
    // --- L8 GATEWAY SCHEMAS ---
    validateSession: {
      description: "Validates an existing session anchor via the Session Commander.",
      semantic_intent: "PROBE",
      exposure: "public",
      io_interface: { 
        inputs: { cosmosId: { type: "string" } }, 
        outputs: { success: { type: "boolean" }, _SIGNAL: { type: "string", optional: true } } 
      }
    },
    applyPatch: {
      description: "Applies a technical state patch to an active reality circuit.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: {
        inputs: { cosmosId: { type: "string" }, patch: { type: "object" } },
        outputs: { success: { type: "boolean" } }
      }
    },
    executeBatch: {
      description: "Aggregates multiple technical commands into a single atomic request window.",
      semantic_intent: "GATE",
      exposure: "public",
      io_interface: {
        inputs: {
          commands: { type: "array", description: "Array of {service, method, payload} objects." }
        },
        outputs: { responses: { type: "array" } }
      }
    },
    // --- BLUEPRINT REGISTRY SCHEMAS ---
    validatePayload: {
      description: "Benchmarks an input data stream against a technical IO interface definition.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          payload: { type: "object", io_behavior: "STREAM", description: "The data stream to be validated." },
          inputsSchema: { type: "object", io_behavior: "SCHEMA", description: "The technical IO interface schema." }
        }, 
        outputs: {
          isValid: { type: "boolean", io_behavior: "PROBE", description: "Structural validation status." },
          errors: { type: "array", io_behavior: "STREAM", description: "Collection of structural failure messages." }
        } 
      }
    },
    canonize: {
      description: "Canonizes an industrial artifact (Cosmos, Layout, Flow) based on its structural blueprint.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          artifact: { type: "object", description: "The artifact content to canonize." }
        },
        outputs: {
          isValid: { type: "boolean" },
          type: { type: "string" },
          schemaVersion: { type: "string" },
          errors: { type: "array" }
        }
      }
    },
    // --- SENSING ADAPTER SCHEMAS ---
    scanArtifacts: {
      description: "Performs technical introspection of a target industrial container to identify assets via canonical industrial taxonomy.",
      semantic_intent: "SENSOR",
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
    find: {
      description: "Executes a technical query against the industrial storage layer.",
      semantic_intent: "PROBE",
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
    listResources: {
        description: "Discovers available industrial resources via indra:// URI paths.",
        semantic_intent: "SENSOR",
        io_interface: {
            inputs: {
                path: { type: "string", description: "The indra:// path or root / to explore." },
                category: { type: "string", description: "Optional filter category." }
            },
            outputs: {
                resources: { type: "array", description: "List of discovered URIs and metadata." }
            }
        }
    },
    stabilizeAxiomaticReality: {
      description: "Receives a complete reality snapshot from the Front and persists it to Drive as a single atomic operation (ADR 003).",
      semantic_intent: "STREAM",
      exposure: "public",
      io_interface: {
        inputs: {
          snapshot: { 
            type: "object", 
            io_behavior: "STREAM", 
            description: "Complete cosmos snapshot including artifacts, relationships, and metadata.",
            required: true
          },
          _carriedReality: { type: "boolean", description: "Flag indicating piggybacking transport." },
          _triggerAction: { type: "string", description: "The action that triggered this snapshot sync." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Stabilization status." },
          fileId: { type: "string", io_behavior: "PROBE", description: "Drive file identifier of persisted snapshot." },
          cosmosId: { type: "string", description: "Cosmos identifier confirmed." },
          _revisionHash: { type: "string", description: "Client revision hash preserved." },
          nodeCount: { type: "number", description: "Number of nodes persisted." },
          relationshipCount: { type: "number", description: "Number of relationships persisted." }
        }
      }
    },
    runSystemAudit: {
      description: "Triggers a full industrial-grade diagnostic audit of the system assembly and hydration layers.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for audit scope." }
        },
        outputs: {
          report: { type: "object", io_behavior: "PROBE", description: "Comprehensive audit results and coherence metrics." }
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
   * AXIOMA: Retorna una sombra (clon), nunca la referencia directa.
   */
  getAll: function() {
    return JSON.parse(JSON.stringify(this.schemas));
  }
};
