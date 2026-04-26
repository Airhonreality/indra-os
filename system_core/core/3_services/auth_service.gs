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
      let idPayload = { email: '', name: '' };

      try {
        idPayload = _auth_verifyGoogleToken(idToken);
        email = idPayload.email;
      } catch(e) {
        throw e;
      }

      logInfo(`[auth:sync] Intentando emparejar sujeto: ${email}`);

      // 1. Buscar el átomo IDENTITY vía Ledger (Con Búsqueda Profunda Integrada v18.0)
      const userAtom = ledger_find_atom_deep('IDENTITY', { email: email }, uqo);

      if (!userAtom) {
        logWarn(`[auth:sync] Sujeto ${email} no encontrado. Enviando invitación de registro.`);
        return { 
          items: [{
            email: email,
            name: idPayload?.name || email,
            picture: idPayload?.picture || null,
            can_register: true
          }],
          metadata: { 
            status: 'PENDING_REGISTRATION', 
            message: 'El usuario no existe en la malla de este Workspace.' 
          } 
        };
      }

      // 2. Emitir ticket de sesión de larga duración con Hidratación de Rango (v18.0)
      const userRole = userAtom.payload?.role || 'GUEST';
      const sessionToken = keychain_issue_session(userAtom.id, {
        name: `Sesión de ${userAtom.handle?.label || email}`,
        scopes: ['USER_ACCESS', userRole]
      });

      logSuccess(`[auth] Session issued for ${email} with role ${userRole}`);

      const userName = userAtom.payload?.name || userAtom.handle?.label || email;

      return {
        items: [{
          token: sessionToken,
          profile: {
            id: userAtom.id,
            name: userName,
            email: email,
            role: userRole
          }
        }],
        metadata: { status: 'OK' }
      };
    },

    /**
     * SYSTEM_SESSION_REVOKE: Protocolo de destrucción de sesión.
     */
    /**
     * SYSTEM_IDENTITY_REGISTER: El acto de ignición de un nuevo sujeto.
     */
    register: function(uqo) {
      const data = uqo.data || {};
      const idToken = data.id_token;
      const workspaceId = uqo.workspace_id || 'system';

      if (!idToken) throw createError('INVALID_INPUT', 'Se requiere id_token para el registro.');

      // 1. Verificación Primordial (SUH v20.0)
      const idPayload = _auth_verifyGoogleToken(idToken);
      const email = idPayload.email;
      const name = idPayload.name;

      logInfo(`[auth] Initiating identity registration for ${email}...`);

      // 2. Registro Físico en la Hoja de Entidades
      // AXIOMA: Usamos el IdentityProvider para la creación atómica
      try {
        const profile = IdentityProvider.createProfile({
          workspace_id: workspaceId,
          data: {
            payload: {
              email: email,
              name: name,
              role: 'GUEST',
              picture: data.picture || null
            }
          }
        });

        logSuccess(`[auth] Identity ${email} registered in Workspace.`);
        
        return {
          items: [profile],
          metadata: { status: 'OK', message: 'Registro completado con éxito.' }
        };
      } catch (e) {
        logError(`❌ [auth:register] Error al crear perfil: ${e.message}`);
        throw e;
      }
    },

    revokeSession: function(uqo) {
      const token = uqo.satellite_token || uqo.password || uqo.token;
      const success = keychain_revoke_session(token);
      
      return {
        items: [],
        metadata: { 
          status: success ? 'OK' : 'NOT_FOUND',
          message: success ? 'Sesión revocada físicamente.' : 'No se encontró una sesión activa para revocar.'
        }
      };
    }
  };

  /**
   * GOOGLE ID TOKEN VERIFIER
   * Validates the provided token against Google's OAuth2 API.
   * @private
   */
  function _auth_verifyGoogleToken(idToken) {
    if (!idToken) throw createError('INVALID_INPUT', 'ID Token is missing.');

    try {
      logInfo(`[auth] Verifying Google ID Token...`);
      const response = UrlFetchApp.fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, { muteHttpExceptions: true });
      const payload = JSON.parse(response.getContentText());

      if (payload.error || !payload.email) {
        logError(`[auth] Google Token Verification Failed: ${payload.error_description || 'Invalid Identity'}`);
        throw createError('GOOGLE_AUTH_FAILED', `Google ID Token validation failed: ${payload.error_description || 'Unknown error'}`);
      }

      logSuccess(`[auth] Identity Verified: ${payload.email}`);
      
      return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || null
      };

    } catch (e) {
      if (e.code) throw e;
      throw createError('SYSTEM_FAILURE', `Google Auth API communication error: ${e.message}`);
    }
  }

})();
