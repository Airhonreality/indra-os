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
   * @param {Object} contract - El contrato de protocolo resuelto.
   * @returns {Object|null} Contexto de identidad o null si falla.
   */
  function authorize(uqo, contract) {
    const activeEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
    let coreOwnerEmail = readCoreOwnerEmail(); 
    
    // AXIOMA v7.1: ANCLAJE AUTOMÁTICO DE SOBERANÍA
    // Si el sistema es huérfano (Estado 0), el primer ejecutor humano se convierte en dueño.
    if (!coreOwnerEmail && activeEmail) {
      console.log(`[auth] ANCLAJE AUTOMÁTICO: Corona de Soberanía otorgada a ${activeEmail}`);
      PropertiesService.getScriptProperties().setProperty('SYS_CORE_OWNER_UID', activeEmail);
      coreOwnerEmail = activeEmail;
    }

    // 1. RECONOCIMIENTO DE SANGRE (Soberanía Directa)
    const isOwner = activeEmail === coreOwnerEmail;
    
    // 2. VALIDACIÓN DE LLAVERO (Satelital)
    let satelliteContext = null;
    if (uqo.satellite_token) {
      satelliteContext = _keychain_validate(uqo.satellite_token); 
    }

    // 3. VALIDACIÓN DE TICKETS (Público)
    let validTicket = null;
    if (uqo.share_ticket) {
      const contextId = uqo.context_id || (uqo.data && uqo.data.context_id);
      validTicket = _share_validateTicket(uqo.share_ticket, contextId); 
    }

    // --- CONSOLIDACIÓN DE AUTORIDAD ---
    let result = null;
    
    if (isOwner) {
      result = { identity_type: 'SOVEREIGN', label: "Sovereign", class: "MASTER", owner_id: coreOwnerEmail, is_master: true };
    } else if (satelliteContext) {
      // --- RESOLUCIÓN SATELLITAL AXIOMÁTICA (v13.2) ---
      // Delegamos la carga física al IdentityProvider (Capa 2) para evitar acoplamiento.
      const resolution = IdentityProvider.getSatelliteResolution(satelliteContext.atom_id);
      
      result = { 
        identity_type: 'SATELLITE', 
        label: satelliteContext.name || "Satellite Agent", 
        class: resolution?.class || satelliteContext.class, 
        owner_id: coreOwnerEmail, 
        is_master: (resolution?.class === 'MASTER' || satelliteContext.class === 'MASTER'),
        scopes: resolution?.scopes || satelliteContext.scopes || [],
        atom_id: satelliteContext.atom_id 
      };
    } else if (validTicket) {
      result = { identity_type: 'GUEST', label: "Guest", class: 'GUEST', owner_id: validTicket.core_id, is_master: false, is_public: true };
    } else {
      result = { identity_type: 'UNIDENTIFIED', owner_id: 'anonymous@indra-os.com' };
    }

    // AXIOMA ADR-052: El actor debe estar en la lista blanca del contrato
    if (!ProtocolRegistry.isActorAuthorized(contract, result.identity_type)) {
      console.warn(`[auth] Actor '${result.identity_type}' NO AUTORIZADO para protocolo '${uqo.protocol}'.`);
      return null;
    }

    return result;
  }

  return {
    authorize: authorize
  };

})();
