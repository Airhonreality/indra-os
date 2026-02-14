// ======================================================================
// ARTEFACTO: 3_Adapters/EmailAdapter.gs
// DHARMA: Proporcionar capacidades de comunicación asíncrona y despacho de notificaciones industriales.
// VERSION: 5.5.0 (MCEP-Ready)
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

    // --- INDRA CANON: Normalización Semántica ---

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
        const url = "https://www.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media";
        
        // Construir email simple en formato RFC 2822
        // Nota: Para adjuntos complejos esto requiere una construcción MIME robusta.
        // Por ahora, implementamos lo básico para cumplir el contrato multi-cuenta.
        let email = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
        
        if (options.htmlBody) {
            // Nota: Esto es ultra-simplificado. 
            // En producción usaríamos una librería de construcción MIME.
            email = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${options.htmlBody}`;
        }

        const base64Email = Utilities.base64EncodeWebSafe(email);
        
        const fetchOptions = {
            method: "post",
            contentType: "application/json",
            headers: {
                "Authorization": "Bearer " + token
            },
            payload: JSON.stringify({
                raw: base64Email
            }),
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", fetchOptions);
        if (response.getResponseCode() !== 200) {
            throw new Error(`Gmail API error: ${response.getContentText()}`);
        }
    }


    function verifyConnection() {
        try {
            GmailApp.getAliases();
            return { status: "ACTIVE" };
        } catch (e) {
            return { status: "BROKEN", error: e.message };
        }
    }

    function receive() {
        return { normalized_message: null, info: "Polling not supported by default. Use specialized sensing for intake." };
    }

    // --- SOVEREIGN CANON V8.0 ---

    // --- SOVEREIGN CANON V8.0 (Excellence Standard) ---
    const CANON = {
        id: "email",
        LABEL: "Email Interface",
        ARCHETYPE: "ADAPTER",
        DOMAIN: "COMMUNICATION",
        SEMANTIC_INTENT: "BRIDGE",
        CAPABILITIES: {
            "send": { 
                "io": "WRITE", 
                "desc": "Dispatch courier",
                "inputs": {
                    "to": { type: "string", desc: "Recipient address." },
                    "subject": { type: "string", desc: "Message header." },
                    "body": { type: "string", desc: "Content payload." },
                    "options": { type: "object", desc: "Configuration." },
                    "accountId": { type: "string", desc: "Routing key." }
                }
            },
            "listContents": { 
                "io": "READ", 
                "desc": "Inbox telemetry and listing",
                "exposure": "public",
                "inputs": {
                    "folderId": { type: "string", desc: "Target label (INBOX, SENT, TRASH)." },
                    "query": { type: "string", desc: "Filter syntax." }
                },
                "outputs": {
                    "items": { type: "array", desc: "Collection of Email nodes." }
                }
            }
        },
        VITAL_SIGNS: {
            "SMTP_RELAY": { "criticality": "NOMINAL", "value": "ACTIVE", "trend": "stable" },
            "QUOTA_USED": { "criticality": "NOMINAL", "value": "12%", "trend": "flat" }
        },
        UI_LAYOUT: {
            "SIDE_PANEL": "ENABLED",
            "TERMINAL_STREAM": "ENABLED"
        }
    };

    return {
        // Identidad Canónica
        CANON: CANON,
        id: "email",

        // Legacy Bridge (Auto-generated from Canon)
        get schemas() { 
            return { send: { io_interface: { inputs: CANON.CAPABILITIES.send.inputs, outputs: {} } } }; 
        },
        send: send,
        verifyConnection,
        receive,

        /**
         * INTERFAZ UNIVERSAL V9.0: listContents
         * Permite al frontend listar correos como si fueran archivos en un Vault.
         */
        listContents: function(payload = {}) {
            const { folderId = 'INBOX', query = '', accountId } = payload;
            const items = [];
            
            try {
                // AXIOMA: Búsqueda Inducida vs Listado Simple
                // Usamos GmailApp para el listado por simplicidad de la sesión
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

                // AXIOMA: Reducción de Entropía (Esquema de Email)
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
                    items: items, // Forward compatibility
                    ORIGIN_SOURCE: 'email',
                    SCHEMA: schema,
                    PAGINATION: {
                        total: items.length,
                        hasMore: items.length === 50,
                        nextToken: null,
                        count: items.length
                    },
                    IDENTITY_CONTEXT: {
                        accountId: accountId || 'default',
                        permissions: {
                            canEdit: true,
                            role: 'owner'
                        }
                    }
                };
            } catch (e) {
                console.error(`[Email:Vault] Error en listado: ${e.message}`);
                throw e;
            }
        }
    };
}
