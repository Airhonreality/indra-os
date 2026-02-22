// ======================================================================
// ARTEFACTO: 3_Adapters/EmailAdapter.gs
// DHARMA: Proporcionar capacidades de comunicación asíncrona y despacho de notificaciones industriales.
// VERSION: 5.6.0 (ADR-022 Compliant — Single CANON)
// ======================================================================

/**
 * @description Factory para crear una instancia inmutable del EmailAdapter.
 * @param {object} deps - { errorHandler, tokenManager }
 * @returns {object} Una instancia congelada del EmailAdapter.
 */
function createEmailAdapter({ errorHandler, tokenManager }) {
    if (!errorHandler || typeof errorHandler.createError !== 'function') {
        throw new TypeError('createEmailAdapter: errorHandler contract not fulfilled');
    }

    // --- AXIOM CANON: Normalización Semántica ---

    function _mapDocumentRecord(data) {
        return {
            id: data.id || Utilities.getUuid(),
            title: data.subject || "Email message",
            content: {
                text: data.body,
                to: data.to,
                type: 'EMAIL'
            },
            url: null,
            lastUpdated: new Date().toISOString(),
            raw: data
        };
    }

    /**
     * @description Obtiene el token para una cuenta de Google.
     * @param {string|null} accountId 
     * @returns {string|null} Access token o null si debe usar la sesión de GmailApp
     */
    function _getAccessToken(accountId) {
        if (!tokenManager) return null;
        try {
            const tokenData = tokenManager.getToken({ provider: 'google', accountId });
            return tokenData ? (tokenData.accessToken || tokenData.apiKey) : null;
        } catch (e) {
            console.warn(`EmailAdapter: No se pudo obtener token para cuenta ${accountId}, usando sesión default.`);
            return null;
        }
    }

    /**
     * @description Envía un correo electrónico. Soporta múltiples cuentas vía TokenManager.
     * @param {object} payload - { to, subject, body, options?, accountId? }
     * @returns {object} El payload original.
     */
    function send(payload) {
        if (!payload || !payload.to || !payload.subject || !payload.body) {
            throw errorHandler.createError('CONFIGURATION_ERROR', 'send: payload debe contener to, subject, y body.');
        }

        const accountId = payload.accountId || null;
        const accessToken = _getAccessToken(accountId);

        try {
            const options = {};
            if (payload.options) {
                if (payload.options.htmlBody) options.htmlBody = payload.options.htmlBody;
                if (payload.options.cc) options.cc = payload.options.cc;
                if (payload.options.bcc) options.bcc = payload.options.bcc;
                if (payload.options.name) options.name = payload.options.name;
                if (payload.options.replyTo) options.replyTo = payload.options.replyTo;

                if (payload.options.attachments) {
                    let attachmentsInput = payload.options.attachments;
                    if (!Array.isArray(attachmentsInput)) {
                        attachmentsInput = [attachmentsInput];
                    }

                    const attachmentsBlobs = attachmentsInput.map(attachment => {
                        if (typeof attachment === 'object' && attachment !== null && typeof attachment.getBytes === 'function') {
                            return attachment;
                        }
                        if (typeof attachment === 'string' && attachment.length > 20) { 
                            try {
                                return DriveApp.getFileById(attachment).getBlob();
                            } catch (e) {
                                console.error(`EmailAdapter: No se pudo encontrar el archivo de Drive con ID '${attachment}' para adjuntar. Será ignorado.`);
                                return null;
                            }
                        }
                        return null;
                    }).filter(b => b !== null);

                    if (attachmentsBlobs.length > 0) {
                        options.attachments = attachmentsBlobs;
                    }
                }
            }
            
            if (accessToken) {
                console.log(`EmailAdapter: Usando cuenta específica (${accountId || 'default'}) vía API REST.`);
                _sendViaRestApi(payload.to, payload.subject, payload.body, options, accessToken);
            } else {
                console.log('EmailAdapter: Usando sesión de GmailApp (cuenta default).');
                GmailApp.sendEmail(payload.to, payload.subject, payload.body, options);
            }
            
            return payload;

        } catch (e) {
            throw errorHandler.createError('SYSTEM_FAILURE', `Email send failed: ${e.message}`, { 
                to: payload.to, subject: payload.subject, originalError: e.toString() 
            });
        }
    }

    /**
     * @private
     * @description Implementación mínima de envío vía Gmail REST API para soporte multi-cuenta.
     */
    function _sendViaRestApi(to, subject, body, options, token) {
        let email = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
        
        if (options.htmlBody) {
            email = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${options.htmlBody}`;
        }

        const base64Email = Utilities.base64EncodeWebSafe(email);
        
        const fetchOptions = {
            method: "post",
            contentType: "application/json",
            headers: {
                "Authorization": "Bearer " + token
            },
            payload: JSON.stringify({ raw: base64Email }),
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", fetchOptions);
        if (response.getResponseCode() !== 200) {
            throw new Error(`Gmail API error: ${response.getContentText()}`);
        }
    }

    /**
     * @description Verifica la conectividad y validez del token para una cuenta específica.
     * @param {object} payload - { accountId? }
     * @returns {object} { status: "ACTIVE" | "BROKEN", success: boolean, error? }
     */
    function verifyConnection(payload) {
        payload = payload || {};
        const accountId = payload.accountId || null;
        const accessToken = _getAccessToken(accountId);
        
        try {
            if (accessToken) {
                const response = UrlFetchApp.fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
                   headers: { "Authorization": "Bearer " + accessToken },
                   muteHttpExceptions: true
                });
                
                if (response.getResponseCode() === 200) {
                    return { status: "ACTIVE", success: true };
                } else {
                    return { status: "BROKEN", success: false, error: `REST API Error: ${response.getContentText()}` };
                }
            } else {
                 GmailApp.getAliases();
                 return { status: "ACTIVE", success: true };
            }
        } catch (e) {
            return { status: "BROKEN", success: false, error: e.message };
        }
    }

    function receive() {
        return { normalized_message: null, info: "Polling not supported by default. Use specialized sensing for intake." };
    }

    /**
     * INTERFAZ UNIVERSAL V9.0 (ADR-022): listContents
     * Permite al frontend listar correos como si fueran archivos en un Vault.
     * io: READ — declarado explícitamente, nunca inferido.
     */
    function listContents(payload) {
        payload = payload || {};
        const folderId = payload.folderId || 'INBOX';
        const query = payload.query || '';
        const accountId = payload.accountId;
        const items = [];
        
        try {
            const threads = query 
                ? GmailApp.search(query, 0, 50)
                : GmailApp.getInboxThreads(0, 50);

            threads.forEach(thread => {
                const lastMsg = thread.getMessages()[thread.getMessageCount() - 1];
                items.push({
                    id: thread.getId(),
                    name: thread.getFirstMessageSubject() || "(No Subject)",
                    type: "FILE",
                    mimeType: "message/rfc822",
                    lastUpdated: thread.getLastMessageDate().toISOString(),
                    raw: {
                        snippet: thread.getSnippet(),
                        from: lastMsg.getFrom(),
                        isUnread: thread.isUnread(),
                        count: thread.getMessageCount()
                    }
                });
            });

            const schema = {
                columns: [
                    { id: 'name', label: 'ASUNTO', type: 'STRING' },
                    { id: 'from', label: 'DE', type: 'STRING' },
                    { id: 'lastUpdated', label: 'FECHA', type: 'DATE' },
                    { id: 'snippet', label: 'EXTRACTO', type: 'STRING' }
                ]
            };

            return {
                results: items,
                items: items,
                origin: 'email',
                schema: schema,
                pagination: {
                    total: items.length,
                    hasMore: items.length === 50,
                    nextToken: null,
                    count: items.length
                },
                identity: {
                    accountId: accountId || 'default',
                    permissions: { canEdit: true, role: 'owner' }
                }
            };
        } catch (e) {
            console.error(`[Email:Vault] Error en listado: ${e.message}`);
            throw e;
        }
    }

    // ======================================================================
    // SOVEREIGN CANON V14.0 (ADR-022 Compliant — Explicit Contract)
    // ======================================================================
    const schemas = {
        send: {
            description: "Dispatches an institutional message stream (email) via the high-integrity Google Mail circuit.",
            semantic_intent: "TRIGGER",
            io_interface: {
                inputs: {
                    to: { type: "string", io_behavior: "GATE", description: "Target recipient linguistic identifier (email)." },
                    subject: { type: "string", io_behavior: "STREAM", description: "Linguistic descriptor for the message envelope." },
                    body: { type: "string", io_behavior: "STREAM", description: "Primary linguistic content stream." },
                    htmlBody: { type: "string", io_behavior: "STREAM", description: "Enriched HTML linguistic stream." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
                },
                outputs: {
                    success: { type: "boolean", io_behavior: "PROBE", description: "Dispatch confirmation status." }
                }
            }
        },
        listContents: {
            description: "Extracts an industrial interaction stream (emails) from the target institutional repository.",
            semantic_intent: "SENSOR",
            io_interface: {
                inputs: {
                    query: { type: "string", io_behavior: "STREAM", description: "Technical query string for stream filtering." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
                },
                outputs: {
                    items: { type: "array", io_behavior: "STREAM", description: "Collection of Axiom EmailRecord: { id, author, subject, body, timestamp, raw }" }
                }
            }
        }
    };

    const CANON = {
        id: "email",
        label: "Email Engine",
        archetype: "adapter",
        domain: "communication",
        REIFICATION_HINTS: {
            id: "id",
            label: "subject || title || id",
            items: "items"
        },
        CAPABILITIES: {
            "send": {
                "id": "SEND_MESSAGE",
                "io": "WRITE",
                "traits": ["COMMUNICATE", "EMAIL", "DISPATCH"],
                "inputs": {
                    "to": { "type": "string", "desc": "Recipient." },
                    "subject": { "type": "string", "desc": "Subject." },
                    "body": { "type": "string", "desc": "Body." },
                    "htmlBody": { "type": "string", "desc": "HTML Body.", "optional": true }
                }
            },
            "listContents": {
                "id": "DATA_STREAM",
                "io": "READ",
                "traits": ["EXPLORE", "COMMUNICATION", "DATA_STREAM"],
                "inputs": {
                    "query": { "type": "string", "desc": "Search query." },
                    "maxResults": { "type": "number", "desc": "Max emails to retrieve." }
                }
            }
        }
    };

    return {
        id: "email",
        label: CANON.label,
        archetype: CANON.archetype,
        domain: CANON.domain,
        description: "Industrial engine for institutional email dispatch, message stream extraction, and communication lifecycle management.",
        CANON: CANON,
        // Protocol mapping (MESSENGER_V1)
        send,
        listContents,
        receive,
        verifyConnection
    };
}
