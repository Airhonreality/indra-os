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
    
    // 2. VALIDACIÓN DE LLAVERO (Satelital / Sesión)
    // AXIOMA DE SINCERIDAD: El token puede viajar en 'satellite_token', 'password' o 'token'.
    // Esto permite la paridad con el TransportLayer del satélite sin duplicar campos.
    const activeToken = uqo.satellite_token || uqo.password || uqo.token;
    let satelliteContext = null;
    
    if (activeToken) {
      satelliteContext = _keychain_validate(activeToken); 
      
      // AXIOMA DE CONSCIENCIA: Si el token está vinculado a un Átomo (clase IDENTITY), 
      // inyectamos el sujeto directamente en el UQO para la lógica de negocio.
      if (satelliteContext && satelliteContext.atom_id) {
        uqo.subject_id = satelliteContext.atom_id;
        uqo.is_user_session = true;
        logInfo(`[auth] Sujeto detectado: ${uqo.subject_id} | Resonando como Usuario.`);
      }
    }

    // 3. VALIDACIÓN DE TICKETS (Público / Compartido)
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
    authorize: authorize,
    
    /**
     * SYSTEM_IDENTITY_SYNC: El gran intercambiador de identidades.
     * Recibe una validación externa (Google OAuth) y devuelve un token de sesión Indra.
     */
    syncIdentity: function(uqo) {
      const data = uqo.data || {};
      const idToken = data.id_token;
      
      if (!idToken) throw createError('INVALID_INPUT', 'Se requiere id_token para la sincronización.');

      // --- AXIOMA DE SINCERIDAD EXTERNA ---
      // En una implementación real, aquí validaríamos el token contra los servidores de Google.
      // Por ahora, simulamos la extracción del email para el flujo de desarrollo.
      // TODO: Implementar validación JWT real.
      let email;
      try {
        // Simulación: asumimos que el token es el email en este sandbox (Solo para pruebas iniciales)
        // En producción, esto debe ser: const email = GoogleTokenVerifier.verify(idToken);
        email = idToken.includes('@') ? idToken : "user@example.com"; 
      } catch(e) {
        throw createError('AUTH_FAILED', 'Token externo inválido o expirado.');
      }

      logInfo(`[auth:sync] Intentando emparejar sujeto: ${email}`);

      // 1. Buscar el átomo IDENTITY vía Ledger (Con Búsqueda Profunda Integrada v18.0)
      const userAtom = ledger_find_atom_deep('IDENTITY', { email: email }, uqo);

      if (!userAtom) {
        logWarn(`[auth:sync] Sujeto ${email} no encontrado en la malla. Abortando.`);
        return { 
          metadata: { status: 'NOT_AUTHORIZED', error: 'El usuario no está registrado en este Workspace.' }, 
          items: [] 
        };
      }

      // 2. Emitir ticket de sesión de larga duración con Hidratación de Rango (v18.0)
      const userRole = userAtom.payload?.role || 'GUEST';
      const sessionToken = keychain_issue_session(userAtom.id, {
        name: `Sesión de ${userAtom.handle?.label || email}`,
        scopes: ['USER_ACCESS', userRole]
      });

      logSuccess(`[auth:sync] ¡Soberanía Delegada! Sesión emitida para ${email} con rango ${userRole}`);

      return {
        items: [{
          token: sessionToken,
          profile: {
            id: userAtom.id,
            name: userAtom.handle?.label,
            email: email,
            role: userAtom.payload?.role || 'USER'
          }
        }],
        metadata: { status: 'OK' }
      };
    }
  };

})();
