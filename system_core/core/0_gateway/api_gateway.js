// =============================================================================
// ARTEFACTO: 0_gateway/api_gateway.gs
// CAPA: 0 — Gateway Layer (Membrana externa)
// RESPONSABILIDAD: El único doPost del sistema. Soberanía de la entrada.
// =============================================================================

const CORE_VERSION = "4.75.0-NEXUS-OMNI-K"; // FASE: Interconectividad Multinodal y Nexo Social.

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
    return _buildResponse_(200, { 
    metadata: { 
      status: isBootstrapped() ? 'OK' : 'BOOTSTRAP', 
      core_id: readCoreOwnerEmail(),
      timestamp: new Date().toISOString() 
    } 
  });
  } catch (err) {
    return _buildResponse_(500, { metadata: { status: 'ERROR', error: err.message } });
  }
}

function doPost(e) {
  Watchdog.start();
  try {
    const pulseResponse = pulse_router_intercept(e);
    if (pulseResponse) return pulseResponse;

    let payload = JSON.parse(e.postData.contents);
    console.log('[Indra Gateway] Request:', payload.protocol);

    if (!isBootstrapped()) return _handleBootstrap_(payload);

    // ADR-050: Delegación de Autoridad al AuthService (Micro-Kernel)
    const context = AuthService.authorize(payload);

    if (!context) {
        console.warn(`[gateway] Acceso denegado: Protocolo ${payload.protocol} rechazado.`);
        return _buildResponse_(401, { metadata: { status: 'UNAUTHORIZED', error: 'Se requiere sesión, token de satélite o ticket válido.' } });
    }

    // AXIOMA DE RESTRICCIÓN RÍGIDA: Validar scopes para identidades no-MASTER
    if (!context.is_master) {
        const requestedId = payload.context_id || (payload.data && payload.data.context_id);
        const hasScope = context.scopes && context.scopes.includes(requestedId);
        
        // Excepción: Los protocolos de sistema no-contextuales (como audit o manifest) se permiten
        const isSystemDiscovery = ['SYSTEM_MANIFEST', 'SYSTEM_CONFIG_SCHEMA'].includes(payload.protocol);

        if (!hasScope && !isSystemDiscovery) {
            console.warn(`[gateway] VIOLACIÓN DE ÁMBITO: Identidad ${context.label} intentó acceder a ${requestedId}`);
            return _buildResponse_(403, { 
                metadata: { 
                    status: 'FORBIDDEN', 
                    error: `ACCESO_DENEGADO: Esta identidad solo tiene acceso a: ${context.scopes.join(',')}` 
                } 
            });
        }
    }

    // AXIOMA DE JURISDICCIÓN: Inyectamos identidad efectiva
    payload.environment = payload.environment || 'PRODUCTION'; 
    payload.effective_owner = context.owner_id;
    payload.is_master_access = context.is_master;
    payload.is_public_access = !!context.is_public;
    if (context.mode === 'MIRROR') payload.resonance_mode = 'MIRROR';

    let result;
    try {
      result = (GATEWAY_SYSTEM_PROTOCOLS.includes(payload.protocol) || payload.protocol.startsWith('EMERGENCY_')) 
        ? SystemOrchestrator.dispatch(payload) 
        : route(payload);
    } catch (routeError) {
      console.error('[gateway] Error fatal en el despacho del protocolo:', routeError);
      return _buildResponse_(500, { metadata: { status: 'ERROR', error: routeError.message } });
    }

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


function _buildResponse_(code, body, headers = {}) {
  const activeEmail = Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail();
  const response = {
    ...body,
    metadata: {
      ...(body.metadata || {}),
      core_id: activeEmail || 'anonymous@indra',
      core_version: CORE_VERSION
    }
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function _sanitizeTrace_(uqo) {
  const t = { ...uqo };
  delete t.password;
  delete t.api_key;
  delete t.satellite_token; // ADR-041: Privacidad de llave maestra
  return t;
}

function _handleBootstrap_(payload) {
  const activeUserEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  const coreOwnerEmail = readCoreOwnerEmail();
  const isOwner = activeUserEmail === coreOwnerEmail;

  // AXIOMA DE SOBERANÍA: Si el dueño se conecta y el sistema está "desnudo" (sin Ledger),
  // iniciamos el Renacimiento (Renaissance) automáticamente.
  if (isOwner && !readMasterLedgerId()) {
    console.log('[gateway] Iniciando RENACIMIENTO para el dueño...');
    try {
      SystemOrchestrator.triggerRenaissance();
      return _buildResponse_(200, { 
        metadata: { status: 'OK', message: 'INDRA_REBORN', detail: 'Sistema reinicializado bajo el modelo Master Ledger.' } 
      });
    } catch (e) {
      console.error('[gateway] Fallo crítico en el Renacimiento:', e.message);
      return _buildResponse_(500, { metadata: { status: 'ERROR', error: e.message } });
    }
  }

  if (payload.password && payload.protocol === 'SYSTEM_CONFIG_WRITE') {
    bootstrapPassword(payload.password);
    return _buildResponse_(200, { metadata: { status: 'OK', message: 'Nucleo Despierto' } });
  }
  return _buildResponse_(200, { metadata: { status: 'BOOTSTRAP' } });
}

