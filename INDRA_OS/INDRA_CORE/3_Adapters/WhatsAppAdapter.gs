// ======================================================================
// ARTEFACTO: 3_Adapters/WhatsAppAdapter.gs
// DHARMA: Ser el Mensajero Instantáneo del Sistema.
// PROPÓSITO: Proporcionar acceso a la API de WhatsApp Business (Meta Graph API)
//            utilizando el sistema multi-cuenta de TokenManager.
// ======================================================================

/**
 * Factory para crear una instancia inmutable del WhatsAppAdapter.
 * @param {object} deps - { errorHandler, tokenManager }
 * @returns {object} Una instancia congelada del WhatsAppAdapter.
 */
function createWhatsAppAdapter({ errorHandler, tokenManager }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('[WhatsAppAdapter] errorHandler contract not fulfilled');
  }
  if (!tokenManager || typeof tokenManager.getToken !== 'function') {
    throw errorHandler.createError('CONFIGURATION_ERROR', '[WhatsAppAdapter] tokenManager es obligatorio');
  }

  // ============================================================
  // LÓGICA PRIVADA: Ayudantes
  // ============================================================

  /**
   * Obtiene los datos de conexión para WhatsApp.
   * @param {string|null} accountId 
   * @returns {object} { apiKey, phoneNumberId }
   */
  function _getConnectionData(accountId = null) {
    try {
      const tokenData = tokenManager.getToken({ provider: 'whatsapp', accountId });
      if (!tokenData || !tokenData.apiKey) {
        throw new Error(`No se encontró apiKey para el proveedor whatsapp`);
      }
      return {
        apiKey: tokenData.apiKey,
        phoneNumberId: tokenData.phoneNumberId // Opcional, puede venir en el payload
      };
    } catch (e) {
      throw errorHandler.createError('CONFIGURATION_ERROR', `[WhatsAppAdapter] Error al obtener token: ${e.message}`);
    }
  }

  // --- AXIOM CANON: Normalización Semántica ---

  function _mapIncomingMessage(raw) {
    // Normalización de mensaje entrante de WhatsApp (Webhook)
    return {
      id: raw.id,
      author: {
        id: raw.from, // Número de teléfono
        handle: raw.from 
      },
      text: raw.text ? raw.text.body : (raw.button ? raw.button.text : ""),
      timestamp: raw.timestamp ? new Date(parseInt(raw.timestamp) * 1000).toISOString() : new Date().toISOString(),
      stats: { likes: 0 },
      hidden: false,
      raw: raw
    };
  }

  // ============================================================
  // MÉTODOS PÚBLICOS
  // ============================================================

  /**
   * Envía un mensaje de texto o plantilla por WhatsApp.
   * @param {object} resolvedPayload - { to, message?, template?, phoneNumberId?, accountId? }
   * @returns {object} Respuesta de la API de Meta
   */
  function sendMessage(resolvedPayload) {
    const { 
      to, 
      message, 
      template, 
      phoneNumberId: payloadPhoneId, 
      accountId = null 
    } = resolvedPayload;

    if (!to) {
      throw errorHandler.createError('INVALID_INPUT', '[WhatsAppAdapter.sendMessage] "to" (número de destino) es obligatorio');
    }

    const connection = _getConnectionData(accountId);
    const phoneNumberId = payloadPhoneId || connection.phoneNumberId;

    if (!phoneNumberId) {
      throw errorHandler.createError('CONFIGURATION_ERROR', '[WhatsAppAdapter.sendMessage] phoneNumberId es obligatorio (en TokenManager o payload)');
    }

    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    
    let requestPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to
    };

    if (template) {
      requestPayload.type = "template";
      requestPayload.template = template;
    } else if (message) {
      requestPayload.type = "text";
      requestPayload.text = { body: message };
    } else {
      throw errorHandler.createError('INVALID_INPUT', '[WhatsAppAdapter.sendMessage] Debe proporcionar "message" o "template"');
    }

    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + connection.apiKey
        },
        payload: JSON.stringify(requestPayload),
        muteHttpExceptions: true
      });

      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (statusCode < 200 || statusCode >= 300) {
        throw errorHandler.createError('WHATSAPP_API_ERROR', `WhatsApp API error (${statusCode}): ${responseText}`);
      }

      return JSON.parse(responseText);

    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('SYSTEM_FAILURE', `[WhatsAppAdapter.sendMessage] ${e.message}`);
    }
  }

  /**
   * Verifica la conectividad con WhatsApp.
   */
  function verifyConnection(payload = {}) {
    try {
      const { phoneNumberId } = _getConnectionData(payload.accountId);
      if (!phoneNumberId) throw new Error("phoneNumberId no configurado");
      
      const url = `https://graph.facebook.com/v17.0/${phoneNumberId}`;
      const connection = _getConnectionData(payload.accountId);
      
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: { 'Authorization': 'Bearer ' + connection.apiKey },
        muteHttpExceptions: true
      });
      
      const statusCode = response.getResponseCode();
      if (statusCode === 200) {
        return { success: true, message: "Conexión exitosa con WhatsApp Business API" };
      } else {
        return { success: false, message: `Error de API (${statusCode}): ${response.getContentText()}` };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Configura la identidad de WhatsApp en el Vault.
   * @param {object} payload - { accountId, apiKey, phoneNumberId, isDefault }
   */
  function configureIdentity(payload = {}) {
    const { accountId, apiKey, phoneNumberId, isDefault = false } = payload;
    if (!accountId || !apiKey || !phoneNumberId) {
      throw errorHandler.createError('INVALID_INPUT', '[WhatsAppAdapter.configureIdentity] accountId, apiKey y phoneNumberId son obligatorios');
    }
    
    tokenManager.setToken({ 
      provider: 'whatsapp', 
      accountId, 
      tokenData: { apiKey, phoneNumberId, isDefault } 
    });
    
    return { success: true, message: `Cuenta '${accountId}' configurada correctamente para WhatsApp.` };
  }

  // ============================================================
  // RETORNO DE INTERFAZ
  // ============================================================
  
  function receive(payload) {
    const { webhookEvent } = payload;
    if (!webhookEvent) throw errorHandler.createError('INVALID_INPUT', '[WhatsAppAdapter.receive] webhookEvent es obligatorio');

    // Canon de Eventos Axiom
    const normalized = {
      source: 'social_whatsapp',
      type: 'unknown',
      data: webhookEvent,
      timestamp: new Date().toISOString()
    };

    try {
        const entry = webhookEvent.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            normalized.type = 'social_comment';
            normalized.message = _mapIncomingMessage(message);
            normalized.id = message.id;
        }
    } catch (e) {
        // Silencio en la normalización fallida, mantenemos tipo unknown
    }

    return normalized;
  }

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
    id: "whatsapp",
    label: "Axiom WhatsApp",
    archetype: "adapter",
    domain: "communication",
    REIFICATION_HINTS: {
        id: "id",
        label: "from || name || id",
        items: "messages || items"
    },
    CAPABILITIES: {
        "sendMessage": {
            "id": "SEND_MESSAGE",
            "io": "WRITE",
            "desc": "Dispatches a high-integrity industrial instant message or template.",
            "traits": ["COMMUNICATE", "MESSAGING"],
            "inputs": {
                "to": { "type": "string", "desc": "Target recipient phone number." },
                "message": { "type": "string", "desc": "Primary linguistic text payload stream." },
                "template": { "type": "object", "desc": "Standardized industrial message template definition." },
                "phoneNumberId": { "type": "string", "desc": "Meta-assigned industrial identifier." },
                "accountId": { "type": "string", "desc": "Account selector." }
            }
        },
        "verifyConnection": {
            "id": "HEALTH_CHECK",
            "io": "READ",
            "desc": "Executes a high-integrity health check of the WhatsApp Business connectivity.",
            "traits": ["DIAGNOSTICS"],
            "inputs": {
                "accountId": { "type": "string", "desc": "Account selector." }
            }
        },
        "configureIdentity": {
            "id": "WRITE_DATA",
            "io": "WRITE",
            "desc": "Registers or updates the secure credentials for the WhatsApp Business technical circuit.",
            "traits": ["STRUCTURE", "IDENTITY"],
            "inputs": {
                "accountId": { "type": "string", "desc": "Unique identifier for this account linkage." },
                "apiKey": { "type": "string", "desc": "Access token." },
                "phoneNumberId": { "type": "string", "desc": "Industrial identifier for the WhatsApp Phone." },
                "isDefault": { "type": "boolean", "desc": "Elevates this credential to the primary circuit." }
            }
        }
    }
  };

  return {
    id: "whatsapp",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    description: "Industrial messaging bridge for high-reliability instant communication, template management, and identity-aware dispatch via Meta Graph API.",
    CANON: CANON,
    
    // Protocol mapping (MESSENGER_V1)
    send: sendMessage,
    receive,
    verifyConnection,
    
    // Original methods
    sendMessage,
    configureIdentity
  };
}








