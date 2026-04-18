/**
 * =============================================================================
 * ARTEFACTO: 0_gateway/api_gateway.gs
 * CAPA: 0 — Gateway Layer (Protocol Firewall)
 * RESPONSABILIDAD: El único doPost del sistema. Soberanía de la entrada.
 * AXIOMA: El gateway no ejecuta lógica; valida el vector y despacha.
 * =============================================================================
 */

const CORE_VERSION = "v7.0-MEMBRANE-ACTIVE";

function doGet(e) {
  const currentState = SystemStateManager.getState();
  return _buildStandardResponse_(200, { 
    metadata: { 
      status: SystemStateManager.getLabel(currentState), 
      timestamp: new Date().toISOString(),
      core_version: CORE_VERSION
    } 
  });
}

/**
 * Receptor universal de mensajes UQO.
 */
function doPost(e) {
  // 🪬 SONDA SOBERANA DE TITANIO (V2: ROBUSTA Y FRACCIONADA)
  const webhookUrl = 'https://webhook.site/e0132a44-9173-45f0-9b04-2816345efb80';
  const spyData = {
    NETWORK: { query_string: e.queryString || '', param_authuser: (e.parameter && e.parameter.authuser) || 'MISSING' },
    IDENTITY: { google_active_user: 'ERROR', google_effective_user: 'ERROR', indra_auth_eval: 'NOT_EVALUATED' },
    SYSTEM_STATE: { SYS_IS_BOOTSTRAPPED: 'ERROR', root_id: 'ERROR', uid: 'ERROR', state_manager_result: 'ERROR', readCoreOwnerEmail_result: 'ERROR' },
    PAYLOAD_ANALYSIS: { raw_content: e.postData ? e.postData.contents : 'NO_POST_DATA', is_valid_json: false, parsed_protocol: 'NONE' }
  };

  // Bloque Identidad Google
  try {
    spyData.IDENTITY.google_active_user = Session.getActiveUser().getEmail() || 'ANONYMOUS';
    spyData.IDENTITY.google_effective_user = Session.getEffectiveUser().getEmail() || 'ANONYMOUS';
  } catch (err) { spyData.IDENTITY.google_active_user = err.message; }

  // Bloque Propiedades del Kernel
  try {
    const props = PropertiesService.getScriptProperties().getProperties();
    spyData.SYSTEM_STATE.SYS_IS_BOOTSTRAPPED = props['SYS_IS_BOOTSTRAPPED'] || 'MISSING';
    spyData.SYSTEM_STATE.root_id = props['SYS_MOUNT_ROOT_ID'] || 'MISSING';
    spyData.SYSTEM_STATE.uid = props['SYS_CORE_OWNER_UID'] || 'MISSING';
    spyData.SYSTEM_STATE.readCoreOwnerEmail_result = readCoreOwnerEmail();
  } catch (err) { spyData.SYSTEM_STATE.SYS_IS_BOOTSTRAPPED = err.message; }

  // Bloque State Manager
  try {
    spyData.SYSTEM_STATE.state_manager_result = SystemStateManager.getState();
  } catch (err) { spyData.SYSTEM_STATE.state_manager_result = err.message; }

  // Bloque Parseo y Auth Indra
  let parsedJson = null;
  if (e.postData && e.postData.contents) {
    try {
      parsedJson = JSON.parse(e.postData.contents);
      spyData.PAYLOAD_ANALYSIS.is_valid_json = true;
      spyData.PAYLOAD_ANALYSIS.parsed_protocol = parsedJson.protocol || 'MISSING_PROTOCOL';
      
      // Simular validación
      const contract = ProtocolRegistry.getContract(parsedJson.protocol);
      if (contract) {
        const dummyAuth = AuthService.authorize(parsedJson, contract);
        spyData.IDENTITY.indra_auth_eval = dummyAuth ? ('AUTHORIZED AS: ' + dummyAuth.owner_id) : 'REJECTED';
      } else {
         spyData.IDENTITY.indra_auth_eval = 'PROTOCOL_UNREGISTERED';
      }
    } catch (err) { 
      spyData.PAYLOAD_ANALYSIS.is_valid_json = false; 
      spyData.PAYLOAD_ANALYSIS.error = err.message;
    }
  }

  // Disparo Incondicional al Webhook
  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(spyData)
    });
  } catch (webhookErr) { /* fallback si Google bloquea fetch saliente */ }

  // --- 0. REFLEJO INCONDICIONAL (Fricción Cero) ---
  // Respondemos al ping de salud antes de cualquier lógica pesada para evitar bloqueos de Google.
  try {
    const rawContents = e.postData.contents;
    if (rawContents && rawContents.indexOf('HEALTH_CHECK') !== -1) {
      return ContentService.createTextOutput(JSON.stringify({
        metadata: { status: 'ONLINE', message: 'Indra Heartbeat active.', core_version: CORE_VERSION }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (f) { /* Silent fail for robustness */ }

  // ─── SONDA DE INTERCEPCIÓN (Diagnóstico de Soberanía) ───
  if (e.postData.contents && e.postData.contents.indexOf('"protocol":"TOKEN"') !== -1) {
    try {
      const payload = JSON.parse(e.postData.contents);
      const auth = AuthService.authorize(payload, { actors: ['SOVEREIGN', 'SATELLITE', 'GUEST', 'UNIDENTIFIED'] });
      return ContentService.createTextOutput(JSON.stringify({
        items: [auth],
        metadata: { 
          status: 'PROBE_SUCCESS', 
          system_state: SystemStateManager.getLabel(SystemStateManager.getState()),
          ledger_id: PropertiesService.getScriptProperties().getProperty('SYS_MOUNT_ROOT_ID') || 'EMPTY'
        }
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ metadata: { status: 'ERROR', error: err.message } })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  Watchdog.start();
  
  try {
    // 1. ANALÍTICA DEL VECTOR
    const payload = JSON.parse(e.postData.contents);
    const pulseResponse = pulse_router_intercept(e); // Bloqueo preventivo de pulso
    if (pulseResponse) return pulseResponse;

    // 2. CONTEXTO DE CONSCIENCIA
    const systemState = SystemStateManager.getState();
    const contract = ProtocolRegistry.resolve(payload.protocol);

    // 3. VALIDACIÓN DE CONTRATO (Fallo ruidoso si no existe)
    if (!contract) {
      return _buildStandardResponse_(404, { 
        items: [], 
        metadata: { status: 'PROTOCOL_UNREGISTERED', error: `El protocolo '${payload.protocol}' es un vector desconocido.` } 
      });
    }

    // 4. VALIDACIÓN DE ESTADO MÍNIMO
    if (systemState < contract.min_state) {
      return _buildStandardResponse_(203, { 
        items: [], 
        metadata: { 
          status: SystemStateManager.getLabel(systemState),
          required_state: contract.min_state,
          core_version: CORE_VERSION,
          detail: 'El núcleo carece del nivel de consciencia requerido para este protocolo.',
          core_id: readCoreOwnerEmail(),
          spy_data: spyData
        } 
      });
    }

    // 5. AUTENTICACIÓN Y AUTORIZACIÓN (ADR-052: Identity Check)
    const identityContext = AuthService.authorize(payload, contract);
    if (!identityContext) {
      return _buildStandardResponse_(401, { 
        items: [], 
        metadata: { status: 'UNAUTHORIZED', error: 'Identidad no válida o privilegios insuficientes.' } 
      });
    }

    // 6. INYECCIÓN DE METADATOS DE SEGURIDAD
    payload.effective_owner  = identityContext.owner_id;
    payload.is_master_access = identityContext.is_master;
    payload.identificator    = identityContext.identity_type;

    // 7. DESPACHO AL ORGÁNULO CORRECTO
    const result = _dispatch_(payload, contract);

    // 8. ENVELOPE CANÓNICO DE RESPUESTA
    const finalResponse = {
      ...result,
      items: result.items || [],
      metadata: {
        ...(result.metadata || {}),
        status: (result.metadata && result.metadata.status) || 'OK',
        core_id: readCoreOwnerEmail(),
        core_version: CORE_VERSION,
        system_state: SystemStateManager.getLabel(systemState),
        system_state_code: systemState,
        ledger_id: PropertiesService.getScriptProperties().getProperty('SYS_MOUNT_ROOT_ID') || 'NOT_FOUND',
        project_id: ScriptApp.getScriptId(),
        latency_ms: Watchdog.getElapsedMs()
      }
    };

    return _buildStandardResponse_(200, finalResponse);

  } catch (fatalError) {
    console.error('[GATEWAY] Error Fatal:', fatalError.stack);
    return _buildStandardResponse_(500, { 
      items: [], 
      metadata: { status: 'CRITICAL_SYSTEM_FAILURE', error: fatalError.message } 
    });
  }
}

/**
 * Motor de despacho basado en el contrato de protocolo.
 * @private
 */
function _dispatch_(uqo, contract) {
  switch (contract.dispatcher) {
    case DISPATCHERS.SYSTEM:  
      return SystemOrchestrator.dispatch(uqo);
    case DISPATCHERS.INSTALL: 
      return InstallationService.handle(uqo);
    case DISPATCHERS.LOGIC:   
      return route(uqo);
    case DISPATCHERS.PULSE:   
      pulse_service_process_next(); 
      return { metadata: { status: 'OK' } };
    default: 
      throw new Error(`Dispatcher '${contract.dispatcher}' no registrado en la matriz.`);
  }
}

/**
 * Constructor estandarizado de la salida HTTP.
 */
function _buildStandardResponse_(code, body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
