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
  'ATOM_READ':                    (p) => _system_handleRead(p),
  'ATOM_CREATE':                  (p) => _system_handleCreate(p),
  'ATOM_UPDATE':                  (p) => _system_handleUpdate(p),
  'ATOM_PATCH':                   (p) => _system_handlePatch(p),
  'ATOM_DELETE':                  (p) => _system_handleDelete(p),
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
  'TABULAR_STREAM':               (p) => _system_handleTabularStream(p),
  'HIERARCHY_TREE':               (p) => _drive_handleHierarchyTree(p), 
  'MEDIA_RESOLVE':                (p) => _drive_handleMediaResolve(p),

  // --- AUTOMATIZACIÓN INDUSTRIAL ---
  'INDUSTRIAL_SYNC':              (p) => _automation_handleIndustrialSync_(p),
  'INDUSTRIAL_IGNITE':            (p) => _automation_handleIndustrialIgnite(p),
  'INDUCTION_START':              (p) => _system_induction_start(p),
  'INDUCTION_PULSE':              (p) => _peristaltic_handlePulse(p),
  'MEDIA_INGEST_START':           (p) => peristaltic_service_init(p),
  'MEDIA_INGEST_PULSE':           (p) => peristaltic_service_chunk(p),
  'MEDIA_INGEST_FINALIZE':        (p) => peristaltic_service_finalize(p),
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

  // --- INGESTA PERISTÁLTICA DE MEDIA (BINARIA) ---
  'MEDIA_INGEST_START':           (p) => peristaltic_service_init(p),
  'MEDIA_INGEST_PULSE':           (p) => peristaltic_service_chunk(p),
  'MEDIA_INGEST_FINALIZE':        (p) => peristaltic_service_finalize(p),
  
  // --- LEGACY COMPATIBILITY ---
  'EMERGENCY_INGEST_INIT':        (p) => peristaltic_service_init(p),
  'EMERGENCY_INGEST_CHUNK':       (p) => peristaltic_service_chunk(p),
  'EMERGENCY_INGEST_FINALIZE':    (p) => peristaltic_service_finalize(p),

  // --- OTROS SERVICIOS ---
  'SYSTEM_BATCH_EXECUTE':         SYSTEM_BATCH_EXECUTE,
  'SEARCH_DEEP':                  (p) => handleNotion(p), 
});

function route(uqo) {
  _validateInputContract_(uqo);

  // --- AXIOMA DE DIRECCIONALIDAD VIRTUAL (VIRTUAL TABLE ROUTING) ---
  // Si el satélite envía un schema_id, el Core baja al hiperespacio, busca el ADN magnético del Schema,
  // extrae su identidad física (Silo ID y Provider) y muta el pulso de forma transparente.
  if (uqo.schema_id && uqo.context_id && uqo.context_id !== 'system') {
     const schemaAlias = String(uqo.schema_id).trim().toLowerCase();
     try {
       // AXIOMA DE CONFIANZA: Usamos el Ledger (Fuente de Verdad) en lugar de búsqueda de Drive
       const schemasRes = _system_listAtomsByClass(DATA_SCHEMA_CLASS_, 'system', { context_id: uqo.context_id });
       const match = (schemasRes.items || []).find(s => (s.handle?.alias || '').toLowerCase() === schemaAlias);
       
       if (match) {
           const payload = match.payload || {};
           if (payload.target_silo_id) {
               logSuccess(`[v-router] Mutación Exitosa: Virtual[${schemaAlias}] -> Physical[${payload.target_silo_id}]`);
               uqo.provider = payload.target_provider || 'sheets';
               uqo.context_id = payload.target_silo_id;
               delete uqo.schema_id; // Consumido para evitar loops
           } else {
               logWarn(`[v-router] El esquema "${schemaAlias}" no ha sido ignitado (falta target_silo_id).`);
           }
       } else {
           logWarn(`[v-router] ADN No Encontrado: El esquema "${schemaAlias}" no existe en el Ledger del context: ${uqo.context_id}`);
       }
     } catch (e) {
       logError(`[v-router] Error en resolución cuántica: ${e.message}`);
     }
  }
  
  const protocol = (uqo.protocol || '').toUpperCase();
  logInfo(`[protocol_router] Despachando cristalización: ${protocol}`);

  // 1. RESOLUCIÓN DE PROVEEDOR Y DESPACHO DINÁMICO
  if (uqo.provider && uqo.provider !== 'system') {
    // Si viene concatenado motor:cuenta, lo normalizamos aquí (Gateway Logic)
    if (uqo.provider.includes(':')) {
      const [baseId, accountId] = uqo.provider.split(':');
      uqo.provider = baseId;
      uqo.account_id = uqo.account_id || accountId;
    }

    const conf = getProviderConf(uqo.provider);
    if (conf && conf.implements && conf.implements[protocol]) {
      const handlerName = conf.implements[protocol];
      const handler = globalThis[handlerName] || this[handlerName];
      
      if (typeof handler === 'function') {
        try {
          const result = handler(uqo);
          _validateReturnLaw_(result, uqo.provider, protocol);
          return result;
        } catch (err) {
          logError(`[protocol_router] Fallo en handler "${handlerName}" para ${protocol}: ${err.message}`);
          throw err;
        }
      }
    }
  }

  // 2. FALLBACK A TABLA DE RUTEO UNIVERSAL (SYSTEM CORE)
  const handlerFn = PROTOCOL_ROUTING_TABLE[protocol];
  if (!handlerFn || typeof handlerFn !== 'function') {
    logError(`[protocol_router] PROTOCOLO NO CRISTALIZADO: ${protocol}`);
    throw createError('PROTOCOL_NOT_CRYSTALIZED', `El protocolo "${protocol}" no ha sido cristalizado para el proveedor "${uqo.provider}".`);
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

/**
 * Normaliza el context_id del UQO basándose en el contrato del proveedor.
 * Si el context_id es nulo, vacío o coincide con el ID del proveedor, 
 * se resuelve al entry_point declarado por el Silo.
 * 
 * @private
 */
function _normalizeUqoContext_(uqo) {
  if (!uqo.provider || uqo.protocol === 'SYSTEM_MANIFEST') return;

  const baseProviderId = uqo.provider.split(':')[0];
  const isSelfReference = uqo.context_id === baseProviderId;
  const isEmpty = !uqo.context_id || uqo.context_id === 'ROOT'; // Normalización básica

  if (isEmpty || isSelfReference) {
    const conf = getProviderConf(baseProviderId);
    if (conf && conf.handle?.entry_point) {
      const oldId = uqo.context_id;
      uqo.context_id = conf.handle.entry_point;
      logInfo(`[SUH_NORMALIZER] Contexto "${oldId}" normalizado a entrada canónica: "${uqo.context_id}"`);
    }
  }
}
