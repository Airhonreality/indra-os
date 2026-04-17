/**
 * =============================================================================
 * ARTEFACTO: 1_logic/system_orchestrator.gs
 * RESPONSABILIDAD: Orquestación de protocolos nativos del sistema.
 * AXIOMA: Centralización de servicios de núcleo.
 * =============================================================================
 */

const SystemOrchestrator = (function() {

  /**
   * Tabla de despacho de lógica de sistema.
   * @private
   */
  const _SYSTEM_HANDLERS_ = Object.freeze({
    'SYSTEM_MANIFEST':              () => buildManifest(),
    'SYSTEM_CONFIG_SCHEMA':         () => buildConfigSchema(),
    'SYSTEM_CONFIG_WRITE':          (p) => handleConfigWrite_(p),
    'SYSTEM_CONFIG_DELETE':         (p) => handleConfigDelete_(p),
    'SYSTEM_SHARE_CREATE':          (p) => _share_createTicket(p),
    'SYSTEM_REBUILD_LEDGER':        () => ({ items: [ledger_rebuild_from_drive()], metadata: { status: 'OK' } }),
    'SYSTEM_QUEUE_READ':            () => ({ items: pulse_ledger_getPending(), metadata: { status: 'OK' } }),
    'SYSTEM_KEYCHAIN_GENERATE':     (p) => _keychain_generate(p),
    'SYSTEM_KEYCHAIN_REVOKE':       (p) => _keychain_revoke(p),
    'SYSTEM_KEYCHAIN_AUDIT':        (p) => _keychain_audit(p),
    'SYSTEM_BATCH_EXECUTE':         (p) => _handleBatchExecute_(p),
    'SYSTEM_NEXUS_HANDSHAKE_INIT':  (p) => NexusService.initiateHandshake(p.data.remote_url, p.data.alias),
    'SYSTEM_NEXUS_HANDSHAKE_ACCEPT':(p) => NexusService.acceptHandshake(p),
    'SYSTEM_IDENTITY_CREATE':       (p) => IdentityProvider.createProfile(p),
    'SYSTEM_IDENTITY_READ':         (p) => IdentityProvider.getProfile(p.data.id || p.data.alias),
    'SYSTEM_IDENTITY_VERIFY':       (p) => IdentityProvider.verifyCorporateIdentity(p.data.email),
    'SYSTEM_INSTALL_HANDSHAKE':     () => ({ metadata: { status: 'OK' } }),
    'SYSTEM_RESONANCE_CRYSTALLIZE': (p) => resonance_service_crystallize(p),
    'SYSTEM_TRIGGER_HUB_GENERATE':  (p) => trigger_hub_generate_all(p)
  });

  /**
   * Despacha protocolos con prefijo SYSTEM_* o EMERGENCY_*
   * @param {Object} payload - El UQO de entrada.
   * @returns {Object} Respuesta del sistema.
   */
  function dispatch(payload) {
    const protocol = payload.protocol;

    // 1. Manejo de Ingesta Emergente (Especial)
    if (protocol.startsWith('EMERGENCY_INGEST')) {
      return _handlePeristalticIngest_(payload);
    }

    // 2. Despacho por tabla
    const handler = _SYSTEM_HANDLERS_[protocol];
    if (handler) {
      console.log(`[orchestrator] Ejecutando handler para: ${protocol}`);
      return handler(payload);
    }
    
    throw new Error(`[orchestrator] El protocolo '${protocol}' no tiene un handler registrado en el sistema de lógica.`);
  }

  /**
   * Orquestación de ingesta por fragmentos.
   * @private
   */
  function _handlePeristalticIngest_(payload) {
    const protocol = payload.protocol;
    if (protocol === 'EMERGENCY_INGEST_INIT') return peristaltic_service_init(payload);
    if (protocol === 'EMERGENCY_INGEST_CHUNK') return peristaltic_service_chunk(payload);
    if (protocol === 'EMERGENCY_INGEST_FINALIZE') return peristaltic_service_finalize(payload);
    return { metadata: { status: 'ERROR', error: 'Sub-protocolo peristáltico no encontrado.' } };
  }

  /**
   * PROCESADOR DE LOTES (ADR-036 / Optimización)
   */
  function _handleBatchExecute_(payload) {
    const operations = payload.data.operations || [];
    const results = [];
    
    for (let uqo of operations) {
      uqo.effective_owner = payload.effective_owner;
      uqo.is_master_access = payload.is_master_access;
      uqo.is_public_access = payload.is_public_access;
      uqo.resonance_mode = payload.resonance_mode;

      try {
        let res = (GATEWAY_SYSTEM_PROTOCOLS.includes(uqo.protocol)) 
          ? dispatch(uqo) 
          : route(uqo);
        results.push(res);
      } catch (e) {
        results.push({ metadata: { status: 'ERROR', error: e.message } });
      }
    }
    return { items: results, metadata: { status: 'OK', batch_size: results.length } };
  }

  /**
   * PROTOCOLO DE RENACIMIENTO (ADR-043 Fase 5)
   */
  function triggerRenaissance() {
    logInfo('🧬 [renaissance] INICIANDO SECUENCIA DE GÉNESIS...');
    logInfo('[renaissance] Forjando Master Ledger...');
    const ledgerId = ledger_initialize_new(); 
    if (!ledgerId) throw new Error('Fallo Crítico: El Ledger no pudo ser cristalizado.');
    logInfo(`[renaissance] Registro en MountManager: ROOT -> ${ledgerId}`);
    
    logInfo('[renaissance] Creando Espacio de Trabajo Raiz...');
    const genesisResponse = _system_createAtom('WORKSPACE', 'Materia Primordial (Root)', {
      provider: 'system',
      data: { description: 'Primer espacio de trabajo del nuevo Indra OS OMNI-K.' }
    });
    
    logInfo(`[renaissance] Estado del Genesis: ${genesisResponse.metadata.status}`);

    if (genesisResponse.metadata.status === 'ERROR') {
      logError('[renaissance] FALLO FATAL EN GENESIS:', genesisResponse.metadata.error);
      throw new Error('Fallo en Genesis: ' + genesisResponse.metadata.error);
    }

    if (readConfig('SYS_IS_BOOTSTRAPPED') !== 'true') {
       storeConfig('SYS_IS_BOOTSTRAPPED', 'true');
    }
    logInfo('🚀 [renaissance] EL RENACIMIENTO HA COMPLETADO LA CRISTALIZACIÓN DEL NÚCLEO.');
  }

  return {
    dispatch: dispatch,
    triggerRenaissance: triggerRenaissance
  };

})();
