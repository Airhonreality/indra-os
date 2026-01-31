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

    const schemas = {
        send: {
            description: "Dispatches a high-integrity email message across industrial messaging channels.",
            semantic_intent: "TRIGGER",
            io_interface: { 
                inputs: {
                    to: { type: "string", io_behavior: "GATE", description: "Target recipient email address(es)." },
                    subject: { type: "string", io_behavior: "STREAM", description: "Standardized subject line identifier." },
                    body: { type: "string", io_behavior: "STREAM", description: "Primary message content (Text or HTML)." },
                    options: { type: "object", io_behavior: "SCHEMA", description: "Technical message configuration (CC, BCC, attachments)." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identity routing." }
                }, 
                outputs: {
                    sentPayload: { type: "object", io_behavior: "PROBE", description: "Dispatched payload metadata confirmation." }
                } 
            }
        }
    };

    return Object.freeze({
        label: "Communication Orchestrator",
        description: "Industrial messaging engine for high-reliability notification dispatch and identity-aware communication.",
        semantic_intent: "BRIDGE",
        archetype: "ADAPTER",
        schemas: schemas,
        send: send
    });
}
