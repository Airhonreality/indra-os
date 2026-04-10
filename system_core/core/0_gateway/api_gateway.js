// =============================================================================
// ARTEFACTO: 0_gateway/api_gateway.gs
// CAPA: 0 — Gateway Layer (Membrana externa)
// RESPONSABILIDAD: El único doPost del sistema. Soberanía de la entrada.
// =============================================================================

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
  'RESOURCE_INGEST',
  'RESOURCE_RESOLVE',
  'SYSTEM_RESONANCE_CRYSTALLIZE',
  'SYSTEM_WORKSPACE_DEEP_PURGE'
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
    logInfo('[gateway] Request recibido.', { protocol: payload.protocol });

    if (!isBootstrapped()) return _handleBootstrap_(payload);

    // ADR-034: Llave de Soberanía para Sistemas Remotos (Tickets Maestros de Integración)
    const storedToken = PropertiesService.getScriptProperties().getProperty('SATELLITE_TOKEN') || 'indra_satellite_omega';
    const isSatelliteSystem = payload.satellite_token === storedToken;
    const isAuthenticated = verifyPassword(payload.password) || isSatelliteSystem;

    if (!isAuthenticated) {
      if (payload.share_ticket) {
        const ticket = _share_validateTicket(payload.share_ticket, payload.context_id || payload.data?.artifact_id);
        if (!ticket) return _buildResponse_(401, { metadata: { status: 'UNAUTHORIZED' } });
      } else {
        return _buildResponse_(401, { metadata: { status: 'UNAUTHORIZED' } });
      }
    }

    let result = (GATEWAY_SYSTEM_PROTOCOLS.includes(payload.protocol)) 
      ? _handleSystemProtocol_(payload) 
      : route(payload);

    result.metadata = result.metadata || {};
    result.metadata.logs = flushLogs();
    result.metadata.status = result.metadata.status || 'OK';

    return _buildResponse_(200, result, {
      'X-Indra-Trace': JSON.stringify(_sanitizeTrace_(payload))
    });

  } catch (fatalError) {
    return _buildResponse_(500, { metadata: { status: 'ERROR', error: fatalError.message } });
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
  
  return { metadata: { status: 'ERROR', error: 'Protocol not found' } };
}

function _buildResponse_(code, body, headers = {}) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function _sanitizeTrace_(uqo) {
  const t = { ...uqo };
  delete t.password;
  delete t.api_key;
  return t;
}

function _handleBootstrap_(payload) {
  if (payload.password && payload.protocol === 'SYSTEM_CONFIG_WRITE') {
    bootstrapPassword(payload.password);
    return _buildResponse_(200, { metadata: { status: 'OK', message: 'Nucleo Despierto' } });
  }
  return _buildResponse_(200, { metadata: { status: 'BOOTSTRAP' } });
}
