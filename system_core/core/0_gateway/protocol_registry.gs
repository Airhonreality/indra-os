/**
 * =============================================================================
 * ARTEFACTO: 0_gateway/protocol_registry.gs
 * CAPA: 0 — Gateway Layer (Protocol Firewall)
 * RESPONSABILIDAD: El registro maestro de intenciones del sistema.
 * AXIOMA DE RESONANCIA: Todo protocolo registrado DEBE tener una función global 
 *         con el mismo nombre exacto (PAD: Protocol Auto-Discovery).
 *         Si el nombre no coincide, el sistema será "Sordo" a esa intención. 
 * =============================================================================
 */

// Clasificación de actores permitidos por protocolo
const ACTOR_TYPES = Object.freeze({
  ALL:              ['SOVEREIGN', 'SATELLITE', 'GUEST', 'UNIDENTIFIED'],
  AUTHENTICATED:    ['SOVEREIGN', 'SATELLITE'],
  SOVEREIGN_ONLY:   ['SOVEREIGN'],
  PUBLIC:           ['SOVEREIGN', 'SATELLITE', 'GUEST'],
  INTERNAL:         ['SYSTEM_INTERNAL'] // Uso exclusivo del servidor
});

// Enrutadores destino
const DISPATCHERS = Object.freeze({
  SYSTEM:  'SYSTEM',  // SystemOrchestrator
  INSTALL: 'INSTALL', // InstallationService
  LOGIC:   'LOGIC',   // LogicEngine / route()
  PULSE:   'PULSE'    // PulseService
});

/**
 * Tabla Maestra de Contratos.
 * Cada fila define las condiciones sine qua non para que un mensaje atraviese la membrana.
 */
const PROTOCOL_CONTRACTS = Object.freeze({
  // ── INFRAESTRUCTURA BASE (Pasan en cualquier estado) ──
  'SYSTEM_MANIFEST':              { min_state: 0, actors: ACTOR_TYPES.ALL,            dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_INSTALL_HANDSHAKE':     { min_state: 0, actors: ACTOR_TYPES.ALL,            dispatcher: DISPATCHERS.INSTALL },
  'HEALTH_CHECK':                 { min_state: 0, actors: ACTOR_TYPES.ALL,            dispatcher: DISPATCHERS.SYSTEM  },

  // ── ESCALADO DE SOBERANÍA (Requieren dueño anclado) ──
  'SYSTEM_CONFIG_WRITE':          { min_state: 1, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.INSTALL },

  // ── OPERATIVA DEL NÚCLEO (Solo cuando Indra está Despierta) ──
  'ATOM_READ':                    { min_state: 2, actors: ACTOR_TYPES.PUBLIC,         dispatcher: DISPATCHERS.LOGIC   },
  'ATOM_CREATE':                  { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'ATOM_UPDATE':                  { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'ATOM_DELETE':                  { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SEARCH_DEEP':                  { min_state: 2, actors: ACTOR_TYPES.PUBLIC,         dispatcher: DISPATCHERS.LOGIC   },
  
  'ATOM_ROLLBACK':                { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.LOGIC   },
  'ATOM_EXISTS':                  { min_state: 2, actors: ACTOR_TYPES.PUBLIC,         dispatcher: DISPATCHERS.LOGIC   },
  'ATOM_ALIAS_RENAME':            { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.LOGIC   },
  'SCHEMA_FIELD_ALIAS_RENAME':    { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.LOGIC   },
  'ALIAS_COLLISION_SCAN':         { min_state: 2, actors: ACTOR_TYPES.PUBLIC,         dispatcher: DISPATCHERS.LOGIC   },
  'RELATION_SYNC':                { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  
  // ── JURISDICCIÓN DE WORKSPACES ──
  'SYSTEM_PIN':                   { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'SYSTEM_UNPIN':                 { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'SYSTEM_PINS_READ':             { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'SYSTEM_WORKSPACE_REPAIR':      { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.LOGIC   },

  // ── GESTIÓN DE SISTEMA ──
  'SYSTEM_CONFIG_SCHEMA':         { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_CONFIG_DELETE':         { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_SHARE_CREATE':          { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_QUEUE_READ':            { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_REBUILD_LEDGER':        { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_KEYCHAIN_GENERATE':     { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_KEYCHAIN_REVOKE':       { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_KEYCHAIN_AUDIT':        { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_KEYCHAIN_SCHEMA':       { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'SERVICE_PAIR':                 { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'SERVICE_UNPAIR':               { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'ACCOUNT_RESOLVE':              { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'REVISIONS_LIST':               { min_state: 2, actors: ACTOR_TYPES.PUBLIC, dispatcher: DISPATCHERS.LOGIC   },

  // ── OPERATIVA AVANZADA ──
  'SYSTEM_BATCH_EXECUTE':         { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_WORKSPACE_DEEP_PURGE':  { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_RESONANCE_CRYSTALLIZE': { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_TRIGGER_HUB_GENERATE':  { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },

  // ── NEXO & IDENTIDAD (v6.1-MICELAR) ──
  'SYSTEM_NEXUS_HANDSHAKE_INIT':  { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_NEXUS_HANDSHAKE_ACCEPT':{ min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_IDENTITY_CREATE':       { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_IDENTITY_READ':         { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_IDENTITY_VERIFY':       { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },

  // ── LATIDOS Y EMERGENCIAS ──
  'PULSE_WAKEUP':                 { min_state: 2, actors: ACTOR_TYPES.INTERNAL,      dispatcher: DISPATCHERS.PULSE   },
  'EMERGENCY_INGEST_INIT':        { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'EMERGENCY_INGEST_CHUNK':       { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'EMERGENCY_INGEST_FINALIZE':    { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },

  // ── SOBERANÍA SATELITAL (v13.0) ──
  'SYSTEM_SATELLITE_INITIALIZE':  { min_state: 1, actors: ACTOR_TYPES.ALL,            dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_SATELLITE_DISCOVER':    { min_state: 1, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.SYSTEM  },
  'SYSTEM_SATELLITE_UPGRADE':     { min_state: 2, actors: ACTOR_TYPES.SOVEREIGN_ONLY, dispatcher: DISPATCHERS.SYSTEM  },

  // ── RESONANCIA E INDUCCIÓN INDUSTRIAL (v10.0) ──
  'RESONANCE_ANALYZE':            { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'INDUSTRIAL_SYNC':              { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'INDUSTRIAL_IGNITE':            { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'INDUCTION_START':              { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'INDUCTION_STATUS':             { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'INDUCTION_CANCEL':             { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   },
  'INDUCTION_DRIFT_CHECK':        { min_state: 2, actors: ACTOR_TYPES.AUTHENTICATED,  dispatcher: DISPATCHERS.LOGIC   }
});

const ProtocolRegistry = (function() {

  /**
   * Resuelve el contrato para un protocolo dado. Lanza fallo ruidoso si no existe.
   * @param {string} protocol
   * @returns {Object} El contrato del protocolo.
   */
  function resolve(protocol) {
    if (!protocol) throw new Error('VIOLACIÓN_AXIÓMICA: Petición sin protocolo.');
    
    // Resolución especial para protocolos peristálticos dinámicos
    if (protocol.startsWith('EMERGENCY_INGEST')) {
      const p = protocol.split('_').pop();
      return PROTOCOL_CONTRACTS[`EMERGENCY_INGEST_${p}`] || null;
    }

    const contract = PROTOCOL_CONTRACTS[protocol];
    if (!contract) {
      console.error(`[protocol_registry] ERROR: El protocolo '${protocol}' no está en la ley de aduanas.`);
      return null;
    }
    return contract;
  }

  /**
   * Valida si el tipo de identidad puede operar el protocolo solicitado.
   */
  function isActorAuthorized(contract, actorType) {
    if (!contract || !actorType) return false;
    return contract.actors.includes(actorType) || contract.actors.includes('ALL');
  }

  return { 
    resolve, 
    isActorAuthorized,
    getRegistry: () => PROTOCOL_CONTRACTS
  };

})();
