/**
 * =============================================================================
 * INDRA PROTOCOL ROUTER (The Sovereign Gateway v14.6 - CONSOLIDADO)
 * =============================================================================
 */

const PROTOCOL_ROUTING_TABLE = Object.freeze({
  // --- INFRAESTRUCTURA Y ESTADO ---
  'SYSTEM_MANIFEST':              SYSTEM_MANIFEST,
  'SYSTEM_INSTALL_HANDSHAKE':     SYSTEM_INSTALL_HANDSHAKE,
  'HEALTH_CHECK':                 HEALTH_CHECK,

  // --- PERSISTENCIA (ATOM CRUD) ---
  'ATOM_READ': (p) => {
    if (p.provider?.startsWith('sheets')) return handleSheets(p);
    if (p.provider?.startsWith('notion')) return handleNotion(p);
    return _system_handleRead(p);
  },
  'ATOM_CREATE': (p) => {
    if (p.provider?.startsWith('sheets')) return handleSheets(p);
    if (p.provider?.startsWith('notion')) return handleNotion(p);
    return _system_handleCreate(p);
  },
  'ATOM_UPDATE': (p) => {
    if (p.provider?.startsWith('sheets')) return handleSheets(p);
    if (p.provider?.startsWith('notion')) return handleNotion(p);
    return _system_handleUpdate(p);
  },
  'ATOM_PATCH': (p) => {
    if (p.provider?.startsWith('sheets')) return handleSheets(p);
    if (p.provider?.startsWith('notion')) return handleNotion(p);
    return _system_handlePatch(p);
  },
  'ATOM_DELETE': (p) => {
    if (p.provider?.startsWith('sheets')) return handleSheets(p);
    if (p.provider?.startsWith('notion')) return handleNotion(p);
    return _system_handleDelete(p);
  },
  'ATOM_EXISTS':                  (p) => _system_handleExists(p),
  'ATOM_ALIAS_RENAME':            (p) => _system_handleAliasRename(p),
  'ATOM_ROLLBACK':                (p) => _system_handleRollback(p),
  'RELATION_SYNC':                (p) => _system_handleRelationSync(p),
  'SCHEMA_FIELD_ALIAS_RENAME':    (p) => _system_handleSchemaFieldAliasRename(p),
  'ALIAS_COLLISION_SCAN':         (p) => _system_handleAliasCollisionScan(p),

  // --- JURISDICCIÓN Y WORKSPACES ---
  'SYSTEM_PIN':                   (p) => _system_handlePin(p),
  'SYSTEM_UNPIN':                 (p) => _system_handleUnpin(p),
  'SYSTEM_PINS_READ':             (p) => _system_handlePinsRead(p),
  'SYSTEM_WORKSPACE_REPAIR':      (p) => _system_handleWorkspaceRepair(p),
  'SYSTEM_WORKSPACE_DEEP_PURGE':  SYSTEM_WORKSPACE_DEEP_PURGE,
  'SYSTEM_SHARE_CREATE':          (p) => SYSTEM_SHARE_CREATE(p),

  // --- IDENTIDAD Y CONFIGURACIÓN ---
  'SYSTEM_KEYCHAIN_GENERATE':     SYSTEM_KEYCHAIN_GENERATE,
  'SYSTEM_KEYCHAIN_REVOKE':       SYSTEM_KEYCHAIN_REVOKE,
  'SYSTEM_KEYCHAIN_AUDIT':        SYSTEM_KEYCHAIN_AUDIT,
  'SYSTEM_KEYCHAIN_SCHEMA':       SYSTEM_KEYCHAIN_SCHEMA,
  'ACCOUNT_RESOLVE':              (p) => _system_handleAccountResolve(p),
  'SYSTEM_CONFIG_WRITE':          SYSTEM_CONFIG_WRITE,
  'SYSTEM_CONFIG_SCHEMA':         SYSTEM_CONFIG_SCHEMA,
  'SYSTEM_CONFIG_DELETE':         SYSTEM_CONFIG_DELETE,
  'SERVICE_PAIR':                 (p) => _system_handleServicePair(p),
  'SERVICE_UNPAIR':               (p) => _system_handleServiceUnpair(p),

  // --- NEXO E IDENTIDAD CRUZADA ---
  'SYSTEM_NEXUS_HANDSHAKE_INIT':  (p) => NexusService.initiateHandshake(p.data.remote_url, p.data.alias),
  'SYSTEM_NEXUS_HANDSHAKE_ACCEPT':(p) => NexusService.acceptHandshake(p),
  'SYSTEM_IDENTITY_CREATE':       (p) => IdentityProvider.createProfile(p),
  'SYSTEM_IDENTITY_READ':         (p) => IdentityProvider.getProfile(p.data.id || p.data.alias),
  'SYSTEM_IDENTITY_VERIFY':       (p) => IdentityProvider.verifyCorporateIdentity(p.data.email),

  // --- SOBERANÍA SATELITAL ---
  'SYSTEM_SATELLITE_INITIALIZE':  SYSTEM_SATELLITE_INITIALIZE,
  'SYSTEM_SATELLITE_DISCOVER':    (p) => _system_handleSatelliteDiscover(p),
  'SYSTEM_SATELLITE_UPGRADE':     (p) => { throw createError('NOT_IMPLEMENTED', 'Upgrade satelital en desarrollo.'); },
  'SYSTEM_CORE_DISCOVERY':        (p) => _system_handleCoreDiscovery(p),
  'SYSTEM_BLUEPRINT_SYNC':        (p) => system_blueprint_sync(p),
  'SYSTEM_SCHEMA_IGNITE':         (p) => _system_handleSchemaIgnite(p),
  
  // --- ANALÍTICA Y COMPUTACIÓN ---
  'REVISIONS_LIST':               (p) => _system_handleRevisionsList(p),
  'RESONANCE_ANALYZE':            (p) => handleCompute(p),
  'FORMULA_EVAL':                 (p) => handleCompute(p),
  'SYSTEM_AUDIT':                 (p) => _system_handleAudit(p),
  
  // --- PROTOCOLOS POLIMÓRFICOS (PROVIDER SWITCH) ---
  'TABULAR_STREAM': (p) => {
    if (p.provider?.startsWith('notion')) return _notion_handleTabularStream(p);
    return _system_handleTabularStream(p);
  },
  'HIERARCHY_TREE': (p) => {
    if (p.provider?.startsWith('drive')) return _drive_handleHierarchyTree(p);
    if (p.provider?.startsWith('notion')) return _notion_handleHierarchyTree(p);
    if (p.provider?.startsWith('calendar')) return _ucp_handleHierarchyTree(p);
    return handleNotion(p); // Fallback
  },
  'MEDIA_RESOLVE': (p) => {
    if (p.provider?.startsWith('drive')) return _drive_handleMediaResolve(p);
    return { items: [], metadata: { status: 'ERROR', error: 'Media Resolve solo soportado en Drive.' } };
  },

  // --- AUTOMATIZACIÓN INDUSTRIAL ---
  'INDUSTRIAL_SYNC':              (p) => _automation_handleIndustrialSync_(p),
  'INDUSTRIAL_IGNITE':            (p) => _automation_handleIndustrialIgnite(p),
  'INDUCTION_START':              (p) => _system_induction_start(p),
  'INDUCTION_STATUS':             (p) => _system_induction_status(p),
  'INDUCTION_CANCEL':             (p) => _system_induction_cancel(p),
  'INDUCTION_DRIFT_CHECK':        (p) => _system_induction_drift_check(p),
  
  // --- LÓGICA Y WORKFLOWS ---
  'WORKFLOW_EXECUTE':             (p) => handleWorkflowExecute(p),
  'LOGIC_EXECUTE':                (p) => SYSTEM_executeLogicBridge(p),
  'INTELLIGENCE_CHAT':            (p) => handleIntelligence(p),
  'INTELLIGENCE_DISCOVERY':       (p) => handleIntelligence(p),
  'SCHEMA_FIELD_OPTIONS':         (p) => _system_handleSchemaFieldOptions(p),
  'ATOM_LIST_QUERY':              (p) => { throw createError('NOT_IMPLEMENTED', 'Query de lista en desarrollo.'); },

  // --- PULSE & LEDGER ---
  'SYSTEM_QUEUE_READ':            (p) => SYSTEM_QUEUE_READ(p),
  'SYSTEM_REBUILD_LEDGER':        (p) => SYSTEM_REBUILD_LEDGER(p),
  'SYSTEM_RESONANCE_CRYSTALLIZE': (p) => SYSTEM_RESONANCE_CRYSTALLIZE(p),
  'SYSTEM_TRIGGER_HUB_GENERATE':  (p) => SYSTEM_TRIGGER_HUB_GENERATE(p),
  'PULSE_WAKEUP':                 (p) => PulseService.wakeup(p),

  // --- INGESTA PERISTÁLTICA ---
  'EMERGENCY_INGEST_INIT':        EMERGENCY_INGEST_INIT,
  'EMERGENCY_INGEST_CHUNK':       EMERGENCY_INGEST_CHUNK,
  'EMERGENCY_INGEST_FINALIZE':    EMERGENCY_INGEST_FINALIZE,

  // --- OTROS SERVICIOS ---
  'SYSTEM_BATCH_EXECUTE':         SYSTEM_BATCH_EXECUTE,
  'SEARCH_DEEP':                  (p) => handleNotion(p), 
});

function route(uqo) {
  _validateInputContract_(uqo);
  const protocol = (uqo.protocol || '').toUpperCase();
  logInfo(`[protocol_router] Despachando cristalización: ${protocol}`);

  const handlerFn = PROTOCOL_ROUTING_TABLE[protocol];
  if (!handlerFn || typeof handlerFn !== 'function') {
    logError(`[protocol_router] PROTOCOLO NO CRISTALIZADO: ${protocol}`);
    throw createError('PROTOCOL_NOT_CRYSTALIZED', `El protocolo "${protocol}" no ha sido cristalizado.`);
  }

  try {
    const result = handlerFn(uqo);
    _validateReturnLaw_(result, 'core_router', protocol);
    return result;
  } catch (err) {
    const errorAtom = (err.code && err.severity) ? createErrorAtom(err.code, err.message, err.details) : createErrorAtom('SYSTEM_FAILURE', err.message, { stack: err.stack });
    return { items: [errorAtom], metadata: { status: 'ERROR', protocol: protocol } };
  }
}

function _validateInputContract_(uqo) {
  if (!uqo || typeof uqo !== 'object' || !uqo.protocol) throw createError('INVALID_INPUT', 'UQO inválido.');
}

function _validateReturnLaw_(result, providerId, protocol) {
  if (!result || !result.items || !result.metadata) throw createError('CONTRACT_VIOLATION', `Violación de contrato en ${protocol}.`);
}
