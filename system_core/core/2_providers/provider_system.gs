/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system.gs
 * RESPONSABILIDAD: Capa de Infraestructura Base y Jurisdicción (Storage/ID).
 * DHARMA: 
 *   - Persistencia: Gestión física de Átomos y Archivos en Drive.
 *   - Jurisdicción: Control de Workspaces y Vínculos Relacionales.
 *   - Compatibilidad: Actúa como Proxy para protocolos legados.
 * =============================================================================
 */

/**
 * Manifiesto del Silo System (Infraestructura).
 * Solo retiene capacidades de nivel de almacenamiento e identidad.
 */
function CONF_SYSTEM() {
  return Object.freeze({
    id: 'system',
    exposure: 'internal', 
    handle: { ns: 'com.indra.system.core', alias: 'system', label: 'Indra Infrastructure', icon: 'STORAGE' },
    class: 'CORE_INFRASTRUCTURE',
    version: '2.0.0 (Granular)',
    capabilities: {
      // --- CAPAS DE PERSISTENCIA (ATOM CRUD) ---
      ATOM_READ: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      ATOM_CREATE: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      ATOM_UPDATE: { sync: 'BLOCKING', purge: 'ID', handler: 'handleSystem' },
      ATOM_DELETE: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      ATOM_EXISTS: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      
      // --- CAPAS DE IDENTIDAD Y ALIAS ---
      ATOM_ALIAS_RENAME: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SCHEMA_FIELD_ALIAS_RENAME: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      ALIAS_COLLISION_SCAN: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      
      // --- CAPAS DE JURISDICCIÓN (WORKSPACES) ---
      SYSTEM_PIN: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SYSTEM_UNPIN: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SYSTEM_PINS_READ: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SYSTEM_WORKSPACE_REPAIR: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      
      // --- CAPAS DE IDENTIDAD Y CUENTAS ---
      ACCOUNT_RESOLVE: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SERVICE_PAIR: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SERVICE_UNPAIR: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SYSTEM_CORE_DISCOVERY: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      
      // --- CAPAS DE AUDITORÍA Y TRAZABILIDAD ---
      SYSTEM_AUDIT: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      REVISIONS_LIST: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      ATOM_ROLLBACK: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      
      // --- CAPAS RELACIONALES ---
      RELATION_SYNC: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },

      // --- CAPAS DE DELEGACIÓN (PROXY LEGACY) ---
      // Estos protocolos permiten que satélites antiguos sigan comunicándose con 'system'.
      // El router permitirá el paso y handleSystem hará la redirección interna.
      INDUCTION_START: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      INDUCTION_INDUCE_FULL_STACK: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      INDUCTION_STATUS: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      INDUCTION_CANCEL: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      INDUCTION_DRIFT_CHECK: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SYSTEM_BLUEPRINT_SYNC: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SYSTEM_SCHEMA_IGNITE: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      NATIVE_DOCUMENT_RENDER: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SCHEMA_SUBMIT: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      FORMULA_EVAL: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      TABULAR_STREAM: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      INTELLIGENCE_CHAT: { sync: 'BLOCKING', exposure: 'public', handler: 'handleSystem' },
      GETMCEPMANIFEST: { sync: 'BLOCKING', exposure: 'public', handler: 'handleSystem' },
      SCHEMA_FIELD_OPTIONS: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' }
    }
  });
}

/**
 * PROXY DE DESPACHO SISTÉMICO (Laminar v6.0)
 * Responsable de la fragmentación de dominios y compatibilidad hacia atrás.
 */
function handleSystem(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();
  logInfo(`[system:proxy] Evaluando protocolo: ${protocol}`);

  // --- 0. DELEGACIÓN DINÁMICA (FRAGMENTACIÓN DE DOMINIOS) ---
  // Si el protocolo pertenece a otro dominio, delegamos al nuevo handler especializado.
  // Esto mantiene la compatibilidad con satélites que aún apuntan a 'system'.
  
  if (isAutomationProtocol_(protocol)) {
    logInfo(`[system:proxy] Delegando a AUTOMATION: ${protocol}`);
    return handleAutomation(uqo);
  }

  if (isComputeProtocol_(protocol)) {
    logInfo(`[system:proxy] Delegando a COMPUTE: ${protocol}`);
    return handleCompute(uqo);
  }

  // --- 1. DOMINIO DE INFRAESTRUCTURA (CORE INTERNAL) ---
  
  // Handlers de Persistencia (provider_system_infrastructure.gs)
  if (protocol === 'ATOM_READ') return _system_handleRead(uqo);
  if (protocol === 'ATOM_CREATE') return _system_handleCreate(uqo);
  if (protocol === 'ATOM_DELETE') return _system_handleDelete(uqo);
  if (protocol === 'ATOM_UPDATE') return _system_handleUpdate(uqo);
  if (protocol === 'ATOM_EXISTS') return _system_handleExists(uqo);
  if (protocol === 'ATOM_ALIAS_RENAME') return _system_handleAliasRename(uqo);
  if (protocol === 'SCHEMA_FIELD_ALIAS_RENAME') return _system_handleSchemaFieldAliasRename(uqo);
  if (protocol === 'ALIAS_COLLISION_SCAN') return _system_handleAliasCollisionScan(uqo);
  if (protocol === 'SERVICE_PAIR') return _system_handleServicePair(uqo);
  if (protocol === 'SERVICE_UNPAIR') return _system_handleServiceUnpair(uqo);
  if (protocol === 'RELATION_SYNC') return _system_handleRelationSync(uqo);
  if (protocol === 'SYSTEM_CORE_DISCOVERY') return _system_handleCoreDiscovery(uqo);

  // Handlers de Jurisdicción (provider_system_workspace.gs)
  if (protocol === 'SYSTEM_PIN') return _system_handlePin(uqo);
  if (protocol === 'SYSTEM_UNPIN') return _system_handleUnpin(uqo);
  if (protocol === 'SYSTEM_PINS_READ') return _system_handlePinsRead(uqo);

  // Handlers de Auditoría (provider_system_diagnostics.gs)
  if (protocol === 'SYSTEM_WORKSPACE_REPAIR') return _system_handleWorkspaceRepair(uqo);
  if (protocol === 'ACCOUNT_RESOLVE') return _system_handleAccountResolve(uqo);
  if (protocol === 'SYSTEM_AUDIT') return _system_handleAudit(uqo);
  if (protocol === 'REVISIONS_LIST') return _system_handleRevisionsList(uqo);
  if (protocol === 'ATOM_ROLLBACK') return _system_handleRollback(uqo);

  const err = createError('PROTOCOL_NOT_FOUND', `Infrastructure (System) no soporta: ${protocol}`);
  return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
}

/**
 * Identificadores de protocolos pertenecientes al dominio de AUTOMATION.
 * @private
 */
function isAutomationProtocol_(protocol) {
  const list = [
    'INDUCTION_START', 'INDUCTION_INDUCE_FULL_STACK', 'INDUCTION_STATUS', 
    'INDUCTION_CANCEL', 'INDUCTION_DRIFT_CHECK', 'SYSTEM_BLUEPRINT_SYNC', 
    'SYSTEM_SCHEMA_IGNITE', 'NATIVE_DOCUMENT_RENDER', 'SCHEMA_SUBMIT'
  ];
  return list.includes(protocol);
}

/**
 * Identificadores de protocolos pertenecientes al dominio de COMPUTE.
 * @private
 */
function isComputeProtocol_(protocol) {
  const list = [
    'FORMULA_EVAL', 'TABULAR_STREAM', 'INTELLIGENCE_CHAT', 
    'GETMCEPMANIFEST', 'SCHEMA_FIELD_OPTIONS'
  ];
  return list.includes(protocol);
}

/**
 * ACCOUNT_RESOLVE: Identidad del Core (Indra Cloud).
 */
function _system_handleAccountResolve(uqo) {
  const user = Session.getActiveUser().getEmail();
  return {
    items: [{
      id: 'internal',
      handle: { ns: 'com.indra.system.core', alias: 'indra_cloud', label: `Indra Cloud (${user.split('@')[0]})` },
      class: 'ACCOUNT_IDENTITY',
      protocols: ['ATOM_READ']
    }],
    metadata: { status: 'OK' }
  };
}

