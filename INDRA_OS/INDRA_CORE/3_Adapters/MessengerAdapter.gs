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

    const schemas = {
        send: {
            description: "Dispatches a linguistic message stream to a specific institutional communication channel via specialized platform circuits.",
            semantic_intent: "TRIGGER",
            io_interface: {
                inputs: {
                    to: { type: "string", io_behavior: "GATE", description: "Target recipient identifier (phone, handle, ID)." },
                    body: { type: "string", io_behavior: "STREAM", description: "Linguistic content stream to be dispatched." },
                    platform: { type: "string", io_behavior: "SCHEMA", description: "Target communication platform circuit (whatsapp, instagram, tiktok)." },
                    mediaUrl: { type: "string", io_behavior: "STREAM", description: "External URL for attached media assets." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identity-aware routing." }
                },
                outputs: {
                    success: { type: "boolean", io_behavior: "PROBE", description: "Dispatch confirmation status." },
                    platform: { type: "string", io_behavior: "SCHEMA", description: "Platform circuit used for dispatch." },
                    externalId: { type: "string", io_behavior: "PROBE", description: "External tracking identifier." }
                }
            }
        },
        receive: {
            description: "Normalizes an incoming data stream from any registered communication channel into an institutional canonical format.",
            semantic_intent: "PROBE",
            io_interface: {
                inputs: {
                    webhookRawPayload: { type: "object", io_behavior: "STREAM", description: "Raw data stream from the external webhook." },
                    sourcePlatform: { type: "string", io_behavior: "SCHEMA", description: "Origin platform circuit identifier." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
                },
                outputs: {
                    message: { type: "object", io_behavior: "STREAM", description: "Normalized Indra SocialComment: { id, author, text, timestamp, stats, raw }" }
                }
            }
        },
        broadcast: {
            description: "Executes a collective dispatch of a message stream to multiple target receivers across various circuits.",
            semantic_intent: "TRIGGER",
            io_interface: {
                inputs: {
                    destinations: { type: "array", io_behavior: "STREAM", description: "Collection of target recipients {to, platform}." },
                    body: { type: "string", io_behavior: "STREAM", description: "Collective linguistic content stream." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
                },
                outputs: {
                    results: { type: "array", io_behavior: "PROBE", description: "Collection of individual dispatch statuses." }
                }
            }
        }
    };

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

    return {
        description: "Industrial bridge for multi-platform communication, collective message broadcasting, and data normalization.",
        semantic_intent: "BRIDGE",
        schemas: schemas,
        send,
        broadcast,
        receive,
        verifyConnection,
        registerProvider
    };
}

