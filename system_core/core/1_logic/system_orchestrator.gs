/**
 * =============================================================================
 * ARTEFACTO: 1_logic/system_orchestrator.gs
 * RESPONSABILIDAD: Orquestación de protocolos nativos del sistema.
 * AXIOMA: Centralización de servicios de núcleo.
 * =============================================================================
 */

const SystemOrchestrator = (function() {

  /**
   * Despacha protocolos con prefijo SYSTEM_* o EMERGENCY_*
   * @param {Object} payload - El UQO de entrada.
   * @returns {Object} Respuesta del sistema.
   */
  function dispatch(payload) {
    const protocol = payload.protocol;

    if (protocol === 'SYSTEM_MANIFEST') return buildManifest();
    if (protocol === 'SYSTEM_CONFIG_SCHEMA') return buildConfigSchema();
    if (protocol === 'SYSTEM_CONFIG_WRITE') return handleConfigWrite_(payload);
    if (protocol === 'SYSTEM_CONFIG_DELETE') return handleConfigDelete_(payload);
    if (protocol === 'SYSTEM_SHARE_CREATE') return _share_createTicket(payload);
    if (protocol === 'SYSTEM_REBUILD_LEDGER') return { items: [ledger_rebuild_from_drive()], metadata: { status: 'OK' } };
    if (protocol === 'SYSTEM_QUEUE_READ') return { items: pulse_ledger_getPending(), metadata: { status: 'OK' } };
    if (protocol === 'PULSE_WAKEUP') { pulse_service_process_next(); return { metadata: { status: 'OK' } }; }
    if (protocol === 'SYSTEM_KEYCHAIN_GENERATE') return _keychain_generate(payload);
    if (protocol === 'SYSTEM_KEYCHAIN_REVOKE') return _keychain_revoke(payload);
    if (protocol === 'SYSTEM_KEYCHAIN_AUDIT') return _keychain_audit(payload);
    if (protocol === 'SYSTEM_BATCH_EXECUTE') return _handleBatchExecute_(payload);
    
    // --- NEXUS & SOCIAL (v4.70) ---
    if (protocol === 'SYSTEM_NEXUS_HANDSHAKE_INIT') return NexusService.initiateHandshake(payload.data.remote_url, payload.data.alias);
    if (protocol === 'SYSTEM_NEXUS_HANDSHAKE_ACCEPT') return NexusService.acceptHandshake(uqo);
    if (protocol === 'SYSTEM_IDENTITY_CREATE') return IdentityProvider.createProfile(payload);
    if (protocol === 'SYSTEM_IDENTITY_READ') return IdentityProvider.getProfile(payload.data.id || payload.data.alias);
    if (protocol === 'SYSTEM_IDENTITY_VERIFY') return IdentityProvider.verifyCorporateIdentity(payload.data.email);

    if (protocol === 'SYSTEM_INSTALL_HANDSHAKE') return { metadata: { status: 'OK' } };
    if (protocol === 'SYSTEM_RESONANCE_CRYSTALLIZE') return resonance_service_crystallize(payload);
    
    // Handlers Peristálticos
    if (protocol.startsWith('EMERGENCY_INGEST')) return _handlePeristalticIngest_(payload);
    
    return { metadata: { status: 'ERROR', error: 'Protocolo de sistema no implementado o no encontrado.' } };
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
    console.log('[renaissance] Inicializando Master Ledger...');
    const ledgerId = ledger_initialize_new(); 
    
    console.log('[renaissance] Creando Espacio de Trabajo Raíz...');
    const genesisResponse = _system_createAtom('WORKSPACE', 'Materia Primordial (Root)', {
      provider: 'system',
      data: { description: 'Primer espacio de trabajo del nuevo Indra OS OMNI-K.' }
    });

    if (genesisResponse.metadata.status === 'ERROR') {
      throw new Error('Fallo en Genesis: ' + genesisResponse.metadata.error);
    }

    if (readConfig('SYS_IS_BOOTSTRAPPED') !== 'true') {
       storeConfig('SYS_IS_BOOTSTRAPPED', 'true');
    }
    logInfo('🚀 EL RENACIMIENTO HA COMPLETADO LA CRISTALIZACIÓN DEL NÚCLEO.');
  }

  return {
    dispatch: dispatch,
    triggerRenaissance: triggerRenaissance
  };

})();
