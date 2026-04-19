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
 * PROXY DE DESPACHO SISTÉMICO (Laminar v14.0 - SINCERADO)
 * Se ha eliminado el baipás interno para centralizar toda la lógica en el Orquestador.
 * Cualquier petición a 'system' ahora resuena a través de la consciencia central.
 */
function handleSystem(uqo) {
  return SystemOrchestrator.dispatch(uqo);
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

