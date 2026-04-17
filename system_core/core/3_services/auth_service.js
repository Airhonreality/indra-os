/**
 * =============================================================================
 * ARTEFACTO: 3_services/auth_service.gs
 * RESPONSABILIDAD: Motor de identidad y autorización micelar.
 * AXIOMA: Soberanía de Sangre + Validación de Satélites + Tickets Públicos.
 * =============================================================================
 */

const AuthService = (function() {

  /**
   * Autoriza un UQO entrante y le inyecta el contexto de identidad efectivo.
   * @param {Object} uqo - El UQO de entrada.
   * @returns {Object|null} Contexto de identidad o lanza error de autorización.
   */
  function authorize(uqo) {
    const activeEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
    const coreOwnerEmail = readCoreOwnerEmail(); // -> system_config.gs
    
    // 1. RECONOCIMIENTO DE SANGRE (Soberanía Directa)
    const isOwner = activeEmail === coreOwnerEmail;
    
    // 2. VALIDACIÓN DE LLAVERO (Satelital)
    let satelliteContext = null;
    if (uqo.satellite_token) {
      satelliteContext = _keychain_validate(uqo.satellite_token); // -> keychain_service.js
    }

    // 3. VALIDACIÓN DE TICKETS (Público)
    let validTicket = null;
    if (uqo.share_ticket) {
      const contextId = uqo.context_id || (uqo.data && uqo.data.context_id);
      validTicket = _share_validateTicket(uqo.share_ticket, contextId); // -> share_manager.js
    }

    // --- CONSOLIDACIÓN DE AUTORIDAD ---
    
    // CASO A: El dueño tiene acceso MASTER absoluto (Bypass total)
    if (isOwner) {
      return {
        identity_type: 'SOVEREIGN',
        label: "Propietario del Core (Sovereign)",
        class: "MASTER",
        owner_id: coreOwnerEmail,
        is_master: true,
        scopes: ["ALL"],
        sovereignty: "BLOOD_RIGHT"
      };
    }

    // CASO B: Satélite validado
    if (satelliteContext) {
      // Un satélite MASTER hereda el poder del dueño pero bajo auditoría de token
      return {
        identity_type: 'SATELLITE',
        label: satelliteContext.label || "Satélite Autorizado",
        class: satelliteContext.class || 'LIMITED',
        owner_id: coreOwnerEmail,
        is_master: (satelliteContext.class === 'MASTER'),
        scopes: satelliteContext.scopes || [],
        token_id: uqo.satellite_token
      };
    }

    // CASO C: Ticket público (Modo Espejo)
    if (validTicket) {
      return {
        identity_type: 'GUEST',
        label: validTicket.label || "Invitado (Ticket)",
        class: 'GUEST',
        owner_id: validTicket.core_id,
        is_master: false,
        is_public: true,
        mode: 'MIRROR',
        scopes: [validTicket.context_id]
      };
    }

    // CASO D: Contraseña Maestra (Legacy, pero mantenemos por bootstrap)
    if (verifyPassword(uqo.password)) {
       return {
        identity_type: 'PASSWORD',
        label: "Acceso vía Password",
        class: "MASTER",
        owner_id: coreOwnerEmail,
        is_master: true,
        scopes: ["ALL"]
      };
    }

    return null; // No autorizado
  }

  return {
    authorize: authorize
  };

})();
