/**
 * =============================================================================
 * ARTEFACTO: 1_logic/system_orchestrator.gs
 * RESPONSABILIDAD: Orquestación de protocolos nativos del sistema.
 * AXIOMA PAD (Protocol Auto-Discovery): Indra ya no usa mapas estáticos. 
 *         El nombre del protocolo ES el nombre de la función global.
 *         El orquestador descubre y ejecuta por resonancia de nombres.
 * =============================================================================
 */

/**
 * LISTA BLANCA DE PROTOCOLOS AUTORIZADOS PARA BATCH (v20.0)
 */
const GATEWAY_SYSTEM_PROTOCOLS = [
  'SYSTEM_MANIFEST', 'SYSTEM_CONFIG_SCHEMA', 'SYSTEM_SATELLITE_DISCOVER', 'SYSTEM_PINS_READ',
  'SYSTEM_SATELLITE_INITIALIZE',
  'ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_PATCH', 'ATOM_DELETE',
  'SYSTEM_IDENTITY_CREATE', 'SYSTEM_IDENTITY_READ', 'SYSTEM_IDENTITY_VERIFY', 
  'SYSTEM_IDENTITY_REGISTER', 'SYSTEM_IDENTITY_SYNC',
  'TABULAR_STREAM', 'TABULAR_UPDATE', 'SYSTEM_WORKSPACE_DEEP_PURGE',
  'HEALTH_CHECK'
];

const SystemOrchestrator = (function() {

  /**
   * Registro de Mandos Críticos (Surgical Orchestration v20.0 - UNIFICADO)
   * Protocolos que requieren resonancia axiomática obligatoria.
   * @private
   */
  const _COMMAND_REGISTRY_ = Object.freeze({
    // --- PERSISTENCIA ATÓMICA ---
    'ATOM_READ':                  (p) => _system_handleRead(p),
    'ATOM_CREATE':                (p) => _system_handleCreate(p),
    'ATOM_UPDATE':                (p) => _system_handleUpdate(p),
    'ATOM_PATCH':                 (p) => _system_handlePatch(p),
    'ATOM_DELETE':                (p) => _system_handleDelete(p),

    // --- IDENTIDAD SOBERANA ---
    'SYSTEM_IDENTITY_CREATE':     (p) => IdentityProvider.createProfile(p),
    'SYSTEM_IDENTITY_READ':       (p) => IdentityProvider.getProfile(p.data.id || p.data.alias),
    'SYSTEM_IDENTITY_VERIFY':     (p) => IdentityProvider.verifyCorporateIdentity(p.data.email),
    'SYSTEM_IDENTITY_REGISTER':   (p) => AuthService.register(p),
    'SYSTEM_IDENTITY_SYNC':       (p) => AuthService.syncIdentity(p),

    // --- INFRAESTRUCTURA Y JURISDICCIÓN ---
    'SYSTEM_SATELLITE_INITIALIZE':(p) => SYSTEM_SATELLITE_INITIALIZE(p),
    'TABULAR_UPDATE':             (p) => _system_handleTabularUpdate(p),
    'SYSTEM_WORKSPACE_DEEP_PURGE':(p) => SYSTEM_WORKSPACE_DEEP_PURGE(p)
  });

  /**
   * Despacha protocolos con prefijo SYSTEM_* o EMERGENCY_*
   * @param {Object} payload - El UQO de entrada.
   * @returns {Object} Respuesta del sistema.
   */
  function dispatch(payload) {
    const trx = payload.trace_id || 'LOCAL';
    const protocol = (payload.protocol || '').trim().toUpperCase();
    let result;

    logInfo(`[orchestrator] [${trx}] 🧠 Despachando protocolo cristalizado: ${protocol}`);

    try {
      const provider = (payload.provider || 'system').toLowerCase();

      // --- AXIOMA: DELEGACIÓN SOBERANA POR RESONANCIA (v21.5) ---
      // Si el proveedor no es el sistema, buscamos su handler soberano automáticamente.
      if (provider !== 'system') {
          const handlerName = `handle${provider.charAt(0).toUpperCase() + provider.slice(1)}`;
          
          // En GAS, las funciones globales están en el scope global. 
          // Intentamos una resolución segura.
          let handler = null;
          try {
            handler = eval(handlerName);
          } catch(e) { /* No existe */ }

          if (typeof handler === 'function') {
              logInfo(`[orchestrator] [${trx}] 📡 Delegando mando al proveedor soberano: ${provider}`);
              return handler(payload);
          }
          throw createError('PROVIDER_NOT_CRYSTALIZED', `El proveedor "${provider}" no ha sido cristalizado (Falta ${handlerName}).`);
      }

      // 1. MODO: INGESTA PERISTÁLTICA (Sincronización por fragments)
      if (protocol.startsWith('EMERGENCY_INGEST')) {
        logInfo(`[orchestrator] [${trx}] Ruta detectada: INGESTA_EMERGENTE`);
        result = _handlePeristalticIngest_(payload);
      } 
      
      // 2. MODO: MANDO DIRECTO (Orquestación Quirúrgica)
      else if (_COMMAND_REGISTRY_[protocol]) {
        logInfo(`[orchestrator] [${trx}] Ejecutando Mando Crítico: ${protocol}`);
        result = _COMMAND_REGISTRY_[protocol](payload);
      }

      // 3. MODO: RUTA EXTERNA (Fallback al Router para el resto de protocolos)
      else {
        result = route(payload);
      }

      // --- SINCERIDAD DE LEY DE RETORNO (Validación de Contrato) ---
      _validateReturnLaw_(result, protocol);
      _validateAtomContract_(result.items);

      // --- RESONANCIA AXIOMÁTICA (Sincronización L2->L3) ---
      logInfo(`[orchestrator] [${trx}] Iniciando resonancia para: ${protocol}`);
      _triggerAxiomaticResonance_(protocol, result, payload);

      return result;

    } catch (e) {
      logError(`[orchestrator] [${trx}] FALLO CRÍTICO EN DESPACHO: ${e.message}`);
      throw e;
    }
  }

  // --- ELIMINADA RESOLUCIÓN DINÁMICA (PAD BURN) ---


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
          : (() => {
              // AXIOMA: CERO FALLBACKS. Si no hay handler PAD, el protocolo no existe en la Capa Soberana.
              throw createError('PROTOCOL_NOT_CRYSTALIZED', `El protocolo "${uqo.protocol}" no ha sido cristalizado en la capa soberana PAD.`);
            })();
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

  /**
   * Dispara la resonancia basada en el resultado de la infraestructura (v14.0).
   * Actúa como el puente entre la mutación física (L2) y la consciencia lógica (L3).
   * @private
   */
  function _triggerAxiomaticResonance_(protocol, result, payload) {
    const trx = payload.trace_id || 'LOCAL';
    if (!result || result.metadata?.status !== 'OK') {
      logWarn(`[orchestrator] [${trx}] Resonancia abortada: Resultado no exitoso o nulo.`);
      return;
    }

    logInfo(`[orchestrator] [${trx}] Analizando impacto de resonancia para ${protocol}...`);

    const items = result.items || [];
    if (items.length === 0 && protocol !== 'ATOM_DELETE') return;

    try {
      // --- ESCENARIO DE ACTUALIZACIÓN ---
      const IS_MUTATION = ['ATOM_UPDATE', 'ATOM_PATCH', 'SYSTEM_IDENTITY_SYNC'].includes(protocol);
      if (IS_MUTATION && items[0]) {
          const atom = items[0];
          
          // 1. Sincronización del Ledger (Para cambios de identidad)
          ledger_sync_atom(atom, atom.id, payload);

          // 2. Resonancia Lógica (Hooks)
          resonance_service_resonate(atom, 'UPDATE', result.original);
          
          // 3. Sincronizar disparadores si es un WORKFLOW
          if (atom.class === 'WORKFLOW') trigger_service_sync(atom);
      }

      // --- ESCENARIO DE GÉNESIS ---
      const IS_GENESIS = ['ATOM_CREATE', 'SYSTEM_IDENTITY_CREATE', 'SYSTEM_IDENTITY_REGISTER', 'SYSTEM_SATELLITE_INITIALIZE'].includes(protocol);
      if (IS_GENESIS && items[0]) {
          const atom = items[0]; // <--- USAMOS LA REALIDAD YA MATERIALIZADA
          
          // 1. Sincronización del Ledger Maestro
          ledger_sync_atom(atom, atom.id, payload);
          
          // 2. AXIOMA DE SOBERANÍA (v7.9): Neural Auto-Pinning
          const wsId = payload.workspace_id || payload.context_id;
          if (wsId && wsId !== 'system' && wsId !== 'workspaces') {
             logInfo(`[orchestrator] [${trx}] Neural-Link: Auto-Pinning atómico para ${wsId}`);
             try {
                _system_handlePin({
                   workspace_id: wsId,
                   data: { atom: atom } // <--- EL ÁTOMO YA TIENE ID Y HANDLE
                });
             } catch(e) { logWarn(`[orchestrator] Falló el Auto-Pinning neural: ${e.message}`); }
          }

          // 3. Sincronización de Infraestructura Celular (Micelar)
          if (atom.class === 'WORKSPACE' && atom.payload?.cell_ledger_id) {
            logInfo(`[orchestrator] Registrando núcleo celular para: ${atom.handle?.label}`);
            ledger_infra_sync(`cell_ledger_${atom.id}`, atom.payload.cell_ledger_id, `Núcleo de ${atom.handle?.label}`);
          }

          // 4. Sincronizar disparadores si es un WORKFLOW
          if (atom.class === 'WORKFLOW') trigger_service_sync(atom);

          // 5. Procesar relaciones iniciales
          if (typeof _system_process_initial_relations_ === 'function') {
            _system_process_initial_relations_(atom, payload);
          }
      }


      // --- ESCENARIO DE PURGA ---
      if (protocol === 'ATOM_DELETE') {
          const deletedId = result.metadata.deleted_id || payload.context_id;
          
          // Debug de Payload para depuración de resonancia (Corregido: payload instead of uqo)
          logInfo(`[orchestrator:debug] Analizando purga. Context: ${payload.context_id} | Class: ${payload.data?.class} | WS: ${payload.workspace_id}`);

          const isWorkspace = result.metadata.atom_class === 'WORKSPACE' || 
                              payload.data?.class === 'WORKSPACE' ||
                              (payload.context_id === payload.workspace_id && payload.context_id !== 'system');
          
          if (isWorkspace) {
            logInfo(`[orchestrator] [${trx}] Purgando contenedor soberano del Master Ledger: ${deletedId}`);
            ledger_remove_atom(deletedId, {}); // Sin contexto = Master Ledger
          } else {
            logInfo(`[orchestrator] [${trx}] Purgando artefacto de su núcleo celular.`);
            ledger_remove_atom(deletedId, payload);
          }
      }
    } catch (e) {
      console.error(`[orchestrator] Error en resonancia axiomática para ${protocol}:`, e.message);
    }
  }

  return {
    dispatch: dispatch,
    triggerRenaissance: triggerRenaissance,
    _handleBatchExecute_: _handleBatchExecute_,
    _handlePeristalticIngest_: _handlePeristalticIngest_,
    _validateReturnLaw_: _validateReturnLaw_,
    _validateAtomContract_: _validateAtomContract_
  };

})();

/**
 * Valida el retorno de los handlers (The Return Law).
 * @private
 */
function _validateReturnLaw_(result, protocol) {
  if (!result || !result.items || !result.metadata) {
    throw createError(
      'CONTRACT_VIOLATION',
      `El motor violó la Ley de Retorno (The Return Law) en protocolo "${protocol}".`
    );
  }
}

/**
 * Valida que los ítems devueltos cumplan con el contrato de átomo v10.0.
 * @private
 */
function _validateAtomContract_(items) {
  if (!Array.isArray(items)) return;
  items.forEach(item => {
    if (!item || !item.id || !item.class) {
       console.warn(`[orchestrator] Item detectado con contrato de átomo débil. Falta ID o CLASS.`);
    }
  });
}

/**
 * PROTOCOLO: HEALTH_CHECK
 */
function HEALTH_CHECK() {
  return { metadata: { status: 'ONLINE', message: 'Indra is resonant.' } };
}

/**
 * PROTOCOLO: SYSTEM_BATCH_EXECUTE
 */
function SYSTEM_BATCH_EXECUTE(uqo) {
  return SystemOrchestrator._handleBatchExecute_(uqo);
}

/**
 * PROTOCOLO: SYSTEM_INSTALL_HANDSHAKE
 */
function SYSTEM_INSTALL_HANDSHAKE(uqo) {
  return InstallationService.SYSTEM_INSTALL_HANDSHAKE(uqo);
}

/**
 * PROTOCOLOS: EMERGENCY_INGEST_*
 */
function EMERGENCY_INGEST_INIT(uqo) { return SystemOrchestrator._handlePeristalticIngest_(uqo); }
function EMERGENCY_INGEST_CHUNK(uqo) { return SystemOrchestrator._handlePeristalticIngest_(uqo); }
function EMERGENCY_INGEST_FINALIZE(uqo) { return SystemOrchestrator._handlePeristalticIngest_(uqo); }
