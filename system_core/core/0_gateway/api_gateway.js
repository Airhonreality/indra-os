// =============================================================================
// ARTEFACTO: 0_gateway/api_gateway.gs
// CAPA: 0 — Gateway Layer (Membrana externa)
// RESPONSABILIDAD: El único doPost del sistema. Soberanía de la entrada.
// =============================================================================

const CORE_VERSION = "0.4.0"; // Versión Micelar Actual

const GATEWAY_SYSTEM_PROTOCOLS = Object.freeze([
  'SYSTEM_MANIFEST',
  'SYSTEM_CONFIG_SCHEMA',
  'SYSTEM_CONFIG_WRITE',
  'SYSTEM_CONFIG_DELETE',
  'SYSTEM_INSTALL_HANDSHAKE',
  'SYSTEM_SHARE_CREATE',
  'SYSTEM_QUEUE_READ',
  'SYSTEM_TRIGGER_HUB_GENERATE',
  'PULSE_WAKEUP',
  'EMERGENCY_INGEST_INIT',
  'EMERGENCY_INGEST_CHUNK',
  'EMERGENCY_INGEST_FINALIZE',
  'SYSTEM_RESONANCE_CRYSTALLIZE',
  'SYSTEM_WORKSPACE_DEEP_PURGE',
  'SYSTEM_KEYCHAIN_GENERATE',
  'SYSTEM_KEYCHAIN_REVOKE',
  'SYSTEM_KEYCHAIN_AUDIT',
  'SYSTEM_BATCH_EXECUTE'
]);

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;
    if (action === 'getShareTicket' && e.parameter.id) {
       return _buildResponse_(200, _share_getTicket(e.parameter.id));
    }
    return _buildResponse_(200, { metadata: { status: isBootstrapped() ? 'OK' : 'BOOTSTRAP', timestamp: new Date().toISOString() } });
  } catch (err) {
    return _buildResponse_(500, { metadata: { status: 'ERROR', error: err.message } });
  }
}

function doPost(e) {
  try {
    const pulseResponse = pulse_router_intercept(e);
    if (pulseResponse) return pulseResponse;

    let payload = JSON.parse(e.postData.contents);
    console.log('[Indra Gateway] Request:', payload.protocol);

    if (!isBootstrapped()) return _handleBootstrap_(payload);

    // ADR-041: Validación dinámica vía Keychain Engine (Ledger) y Tickets (ADR-019)
    const satelliteContext = _keychain_validate(payload.satellite_token);
    const validTicket = payload.share_ticket ? _share_validateTicket(payload.share_ticket, payload.context_id || payload.data?.artifact_id) : null;
    const isAuthenticated = verifyPassword(payload.password) || !!satelliteContext || !!validTicket;

    if (!isAuthenticated) {
        console.warn(`[gateway] Acceso denegado: Protocolo ${payload.protocol} rechazado.`);
        return _buildResponse_(401, { metadata: { status: 'UNAUTHORIZED', error: 'Se requiere sesión, token de satélite o ticket válido.' } });
    }

    // AXIOMA DE JURISDICCIÓN: Inyectamos identidad efectiva (ADR-041)
    payload.environment = payload.environment || 'PRODUCTION'; 
    if (satelliteContext) {
        payload.effective_owner = satelliteContext.core_id || readCoreOwnerEmail();
        payload.is_master_access = (satelliteContext.class === 'MASTER');
    } else if (validTicket) {
        payload.effective_owner = validTicket.core_id;
        payload.is_public_access = true;
        // AXIOMA: Tickets públicos obligan al modo MIRROR (Solo Lectura)
        payload.resonance_mode = 'MIRROR';
    }

    // AXIOMA: Si falta el context_id en una llamada al sistema, inyectar el ROOT por defecto
    if (!payload.context_id && payload.provider === 'system') {
      try {
        payload.context_id = readRootFolderId();
        console.log('[gateway] Auto-inyectando Root ID:', payload.context_id);
      } catch (e) {
        console.error('[gateway] Fallo al leer Root ID:', e.message);
      }
    }

    let result = (GATEWAY_SYSTEM_PROTOCOLS.includes(payload.protocol)) 
      ? _handleSystemProtocol_(payload) 
      : route(payload);

    result.metadata = result.metadata || {};
    result.metadata.status = result.metadata.status || 'OK';
    result.metadata.core_version = CORE_VERSION;
    
    try {
      result.metadata.core_id = readCoreOwnerEmail(); 
    } catch (e) {
      result.metadata.core_id = 'unknown';
    }

    try {
      result.metadata.logs = (typeof flushLogs === 'function') ? flushLogs() : [];
    } catch (e) {
      result.metadata.logs = [];
    }

    return _buildResponse_(200, result, {
      'X-Indra-Trace': JSON.stringify(_sanitizeTrace_(payload))
    });

  } catch (fatalError) {
    const errorCode = fatalError.code || 'SYSTEM_FAILURE';
    const errorAtom = {
        id: `err_${Date.now()}`,
        handle: {
          ns: `com.indra.error.gateway`,
          alias: 'fatal_error',
          label: 'Fallo Catastrófico del Core'
        },
        class: 'ERROR_REPORT',
        protocols: ['ATOM_READ'],
        payload: {
          message: fatalError.message || 'Error desconocido',
          severity: 'CRITICAL',
          code: errorCode,
          stack: fatalError.stack || '',
          remediation: 'Revisa la sintaxis del UQO o los logs de ejecución de Apps Script.'
        }
    };
    return _buildResponse_(500, { 
      items: [errorAtom], 
      metadata: { status: 'ERROR', error: fatalError.message, axiom_violated: errorCode } 
    });
  }
}

function _handleSystemProtocol_(payload) {
  const protocol = payload.protocol;
  if (protocol === 'SYSTEM_MANIFEST') return buildManifest();
  if (protocol === 'SYSTEM_CONFIG_SCHEMA') return buildConfigSchema();
  if (protocol === 'SYSTEM_CONFIG_WRITE') return handleConfigWrite_(payload);
  if (protocol === 'SYSTEM_CONFIG_DELETE') return handleConfigDelete_(payload);
  if (protocol === 'SYSTEM_SHARE_CREATE') return _share_createTicket(payload);
  if (protocol === 'SYSTEM_QUEUE_READ') return { items: pulse_ledger_getPending(), metadata: { status: 'OK' } };
  if (protocol === 'PULSE_WAKEUP') { pulse_service_process_next(); return { metadata: { status: 'OK' } }; }
  if (protocol === 'SYSTEM_KEYCHAIN_GENERATE') return _keychain_generate(payload);
  if (protocol === 'SYSTEM_KEYCHAIN_REVOKE') return _keychain_revoke(payload);
  if (protocol === 'SYSTEM_KEYCHAIN_AUDIT') return _keychain_audit(payload);
  if (protocol === 'SYSTEM_BATCH_EXECUTE') return _handleBatchExecute_(payload);
  if (protocol === 'SYSTEM_INSTALL_HANDSHAKE') return { metadata: { status: 'OK' } };
  if (protocol === 'SYSTEM_RESONANCE_CRYSTALLIZE') return resonance_service_crystallize(payload);
  
  // ADR-036: Handlers Peristálticos (Puente al PeristalticService)
  if (protocol.startsWith('EMERGENCY_INGEST')) return _handlePeristalticIngest_(payload);
  
  return { metadata: { status: 'ERROR', error: 'Protocol not found' } };
}

/**
 * ORQUESTACIÓN PERISTÁLTICA (Backend ADR-036)
 * Delega al servicio de ingesta por fragmentos.
 */
function _handlePeristalticIngest_(payload) {
  // Nota: Requiere peristaltic_service.gs (Capa 3)
  const protocol = payload.protocol;
  if (protocol === 'EMERGENCY_INGEST_INIT') return peristaltic_service_init(payload);
  if (protocol === 'EMERGENCY_INGEST_CHUNK') return peristaltic_service_chunk(payload);
  if (protocol === 'EMERGENCY_INGEST_FINALIZE') return peristaltic_service_finalize(payload);
  return { metadata: { status: 'ERROR', error: 'Sub-protocol not found' } };
}

/**
 * PROCESADOR DE LOTES (ADR-036 / Optimización)
 * Ejecuta múltiples UQOs en secuencia manteniendo la jurisdicción.
 */
function _handleBatchExecute_(payload) {
  const operations = payload.data.operations || [];
  const results = [];
  
  for (let uqo of operations) {
    // AXIOMA: Heredar jurisdicción de la aduana a cada hijo del lote
    uqo.effective_owner = payload.effective_owner;
    uqo.is_master_access = payload.is_master_access;
    uqo.is_public_access = payload.is_public_access;
    uqo.resonance_mode = payload.resonance_mode;

    try {
      let res = (GATEWAY_SYSTEM_PROTOCOLS.includes(uqo.protocol)) 
        ? _handleSystemProtocol_(uqo) 
        : route(uqo);
      results.push(res);
    } catch (e) {
      results.push({ metadata: { status: 'ERROR', error: e.message } });
    }
  }

  return { items: results, metadata: { status: 'OK', batch_size: results.length } };
}

function _buildResponse_(code, body, headers = {}) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function _sanitizeTrace_(uqo) {
  const t = { ...uqo };
  delete t.password;
  delete t.api_key;
  delete t.satellite_token; // ADR-041: Privacidad de llave maestra
  return t;
}

function _handleBootstrap_(payload) {
  if (payload.password && payload.protocol === 'SYSTEM_CONFIG_WRITE') {
    bootstrapPassword(payload.password);
    return _buildResponse_(200, { metadata: { status: 'OK', message: 'Nucleo Despierto' } });
  }
  return _buildResponse_(200, { metadata: { status: 'BOOTSTRAP' } });
}
