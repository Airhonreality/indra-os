// ======================================================================
// ARTEFACTO: 3_Adapters/MessengerAdapter.gs
// DHARMA: Despachador omnicanal de alta disponibilidad para la normalización 
//         y ruteo de comunicaciones industriales.
// VERSION: 5.5.0 (MCEP-Ready)
// ======================================================================

/**
 * Factory para el MessengerAdapter (Omnichannel Dispatcher).
 * Actúa como un Hub Central para redirigir peticiones a adaptadores soberanos (WhatsApp, Instagram, TikTok, etc.)
 * 
 * @param {object} dependencies - { errorHandler, adapters }
 * @returns {object} El adaptador centralizador congelado.
 */
function createMessengerAdapter({ errorHandler, adapters }) {
    if (!errorHandler) throw new Error("MessengerAdapter: errorHandler is required");
    
    // El mapa de proveedores se inyecta o se descubre desde las dependencias
    const _providers = adapters || {};


    /**
     * Despacha un mensaje ruteándolo al adaptador correspondiente.
     */
    function send(params = {}) {
        const { platform, to, body, mediaUrl, accountId } = params;

        const adapter = _providers[platform];
        if (!adapter) {
            throw errorHandler.createError("MESSENGER_PLATFORM_UNSUPPORTED", `No adapter found for platform: ${platform}`);
        }

        try {
            let result;
            switch (platform) {
                case 'whatsapp':
                    // WhatsAppAdapter usa sendMessage({ to, message, accountId })
                    result = adapter.sendMessage({ to, message: body, accountId });
                    return {
                        success: true,
                        platform: 'whatsapp',
                        externalId: result.metaResponse?.messages?.[0]?.id || 'unknown'
                    };

                case 'instagram':
                    // InstagramAdapter usa sendDirectMessage({ recipientId, text, accountId })
                    result = adapter.sendDirectMessage({ recipientId: to, text: body, accountId });
                    return {
                        success: true,
                        platform: 'instagram',
                        externalId: result.message_id
                    };

                case 'tiktok':
                    // TikTok no suele permitir DMs via API abierta sin ser partner especial, 
                    // pero el adaptador podría tener replyComment
                    throw errorHandler.createError("PLATFORM_CAPABILITY_ERROR", "TikTok DM is not natively supported in current circuit.");

                default:
                    throw errorHandler.createError("MESSENGER_ROUTING_ERROR", `Routing not implemented for platform: ${platform}`);
            }
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError("MESSENGER_DISPATCH_FAILURE", e.message, { platform, to });
        }
    }

    /**
     * Normaliza un webhook entrante.
     */
    function receive(params = {}) {
        const { webhookRawPayload, sourcePlatform, accountId } = params;
        const adapter = _providers[sourcePlatform];

        if (!adapter || typeof adapter.receive !== 'function') {
            throw errorHandler.createError("MESSENGER_RECEIVE_UNSUPPORTED", `Platform ${sourcePlatform} does not support normalized reception.`);
        }

        try {
            return adapter.receive({ webhookRawPayload, accountId });
        } catch (e) {
            throw errorHandler.createError("MESSENGER_NORMALIZATION_FAILURE", e.message, { sourcePlatform });
        }
    }

    /**
     * Envío masivo a múltiples destinos.
     */
    function broadcast(params = {}) {
        const { destinations, body, accountId } = params;
        const results = [];

        destinations.forEach(dest => {
            try {
                const res = send({ ...dest, body, accountId });
                results.push({ to: dest.to, platform: dest.platform, success: true, externalId: res.externalId });
            } catch (e) {
                results.push({ to: dest.to, platform: dest.platform, success: false, error: e.message });
            }
        });

        return { results };
    }

    /**
     * Registra un nuevo proveedor de mensajería dinámicamente.
     */
    function registerProvider(platform, adapter) {
        if (!platform || !adapter) {
            throw errorHandler.createError("INVALID_ARGUMENTS", "Platform and adapter are required");
        }
        _providers[platform] = adapter;
    }

    function verifyConnection(payload = {}) {
        return { 
            status: "ACTIVE", 
            message: "Messenger Dispatcher Ready", 
            registeredProviders: Object.keys(_providers) 
        };
    }

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
      id: "messenger",
      label: "Axiom Messenger Hub",
      archetype: "adapter",
      domain: "communication",
      REIFICATION_HINTS: {
          "id": "id",
          "label": "text || summary || id",
          "items": "results || items"
      },
      CAPABILITIES: {
          "send": {
              "id": "SEND_MESSAGE",
              "io": "WRITE",
              "desc": "Dispatches a linguistic message stream to a specific institutional communication channel.",
              "traits": ["COMMUNICATE", "MESSAGING", "DISPATCH"],
              "inputs": {
                  "to": { "type": "string", "desc": "Target recipient identifier." },
                  "body": { "type": "string", "desc": "Linguistic content stream." },
                  "platform": { "type": "string", "desc": "Target communication platform circuit." }
              }
          },
          "receive": {
              "id": "RECEPTION",
              "io": "READ",
              "desc": "Normalizes an incoming data stream from any registered communication channel.",
              "traits": ["COMMUNICATE", "NORMALIZATION"],
              "inputs": {
                  "webhookRawPayload": { "type": "object", "desc": "Raw data stream from the external webhook." },
                  "sourcePlatform": { "type": "string", "desc": "Origin platform circuit identifier." }
              }
          },
          "broadcast": {
              "id": "SEND_MESSAGE",
              "io": "WRITE",
              "desc": "Executes a collective dispatch of a message stream to multiple target receivers.",
              "traits": ["COMMUNICATE", "BROADCAST"],
              "inputs": {
                  "destinations": { "type": "array", "desc": "Collection of target recipients {to, platform}." },
                  "body": { "type": "string", "desc": "Collective linguistic content stream." }
              }
          }
      }
  };

  return {
      id: "messenger",
      label: CANON.label,
      archetype: CANON.archetype,
      domain: CANON.domain,
      description: "Industrial bridge for multi-platform communication, collective message broadcasting, and data normalization.",
      CANON: CANON,
      send,
      broadcast,
      receive,
      verifyConnection,
      registerProvider
  };
}








