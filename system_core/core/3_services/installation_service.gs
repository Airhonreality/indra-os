/**
 * =============================================================================
 * ARTEFACTO: 3_services/installation_service.gs
 * CAPA: 3 — Services (Gestión de Nacimiento)
 * RESPONSABILIDAD: Orquestación del ciclo de vida de instalación.
 * AXIOMA: Soberanía de Identidad en el primer aliento.
 * =============================================================================
 */

const InstallationService = (function() {

  /**
   * Punto de entrada para protocolos de bajo nivel de consciencia (0 y 1).
   */
  function handle(uqo) {
    const protocol = uqo.protocol;

    // AXIOMA: Las funciones internas del InstallationService ahora coinciden con el protocolo.
    // Intentamos resolución dinámica local o global.
    const handler = _resolveInstallationHandler_(protocol);
    if (handler) {
      return handler(uqo);
    }

    throw new Error(`[installation_service] Protocolo '${protocol}' no soportado en esta capa.`);
  }

  /**
   * Resuelve el handler para protocolos de instalación.
   * @private
   */
  function _resolveInstallationHandler_(protocol) {
    const scope = globalThis || this;
    
    // 1. Buscar en scope global (Auto-Discovery)
    if (typeof scope[protocol] === 'function') return scope[protocol];
    
    // 2. Buscar alias internos (Mapeo de legado)
    const aliases = {
      'SYSTEM_MANIFEST':          () => SYSTEM_MANIFEST(),
      'SYSTEM_INSTALL_HANDSHAKE': (p) => SYSTEM_INSTALL_HANDSHAKE(p),
      'SYSTEM_CONFIG_WRITE':      (p) => SYSTEM_CONFIG_WRITE(p)
    };
    
    return aliases[protocol] || null;
  }

  /**
   * Handshake de Ignición: Anclaje de identidad del dueño.
   * @private
   */
  function SYSTEM_INSTALL_HANDSHAKE(uqo) {
    const currentState = SystemStateManager.getState();
    const activeEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();

    // LEY DE SOBERANÍA: Si el Core es huerfano, el primer contacto humano es el dueño.
    if (currentState === SYSTEM_STATE.UNINITIALIZED && activeEmail) {
      PropertiesService.getScriptProperties().setProperty('SYS_CORE_OWNER_UID', activeEmail);
      console.log(`[ignition] SOBERANÍA ANCLADA: ${activeEmail}. Indra tiene dueño.`);
    }

    return {
      metadata: {
        status: 'OK',
        message: 'INDRA_IDENTITY_LOCKED',
        system_state: SystemStateManager.getLabel(SystemStateManager.getState()),
        identity_anchor: activeEmail
      }
    };
  }

  /**
   * Ignición de Soberanía: Ejecución de las tareas de activación.
   * @private
   */
  function SYSTEM_CONFIG_WRITE_IGNITION(uqo) {
    console.log('[ignition] Iniciando ignición de soberanía...');

    try {
      // 1. Configurar credenciales (Diferenciando casos)
      if (uqo.data && uqo.data.satellite_key) {
        bootstrapWithSatelliteKey(uqo.data.satellite_key, uqo.data.email);
      } else if (uqo.password) {
        bootstrapPassword(uqo.password);
      } else {
        throw new Error('No se detectaron credenciales válidas (password/satellite_key).');
      }

      // 2. Cristalizar el núcleo (Renaissance) si no existe
      if (!readMasterLedgerId()) {
        SystemOrchestrator.triggerRenaissance();
      }

      return {
        metadata: {
          status: 'ACTIVE',
          message: 'CORE_IGNITED',
          detail: 'Indra ha despertado plenamente.'
        }
      };
    } catch (e) {
      console.error('[ignition] FALLO CRÍTICO:', e.message);
      return {
        metadata: {
          status: 'ERROR',
          error: `Fallo en el protocolo de ignición: ${e.message}`
        }
      };
    }
  }

  return { 
    handle,
    SYSTEM_INSTALL_HANDSHAKE 
  };

})();
