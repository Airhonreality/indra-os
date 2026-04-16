/**
 * =============================================================================
 * INDRA TRANSPORT LAYER (Agnostic Node)
 * =============================================================================
 * Responsibilidad: Gestión ferrosa de peticiones, colas y retries.
 * =============================================================================
 */

const RETRIABLE_CODES = ['LOCK_TIMEOUT', 'GATEWAY_TIMEOUT', 'NETWORK_ERROR'];

export class TransportLayer {
    constructor(bridge) {
        this.bridge = bridge;
        this.activeRequests = 0;
        this.requestQueue = [];
        this.MAX_CONCURRENT = 5; // Mayor paralelismo para evitar bloqueos en handshakes
    }

    purgeQueue() {
        console.warn("[TransportLayer] Purgando cola de peticiones...");
        this.requestQueue.forEach(resolve => resolve());
        this.requestQueue = [];
        this.activeRequests = 0;
    }

    async execute(uqo, options = {}) {
        if (!uqo.provider && uqo.protocol !== 'SYSTEM_MANIFEST') {
            uqo.provider = 'system';
        }

        // --- INTERCEPCIÓN DE PROTOCOLO DE INTERFAZ (SHELL MADRE) ---
        if (uqo.protocol === 'UI_INVOKE') {
            return this._invokeUI(uqo);
        }

        const maxRetries = options.maxRetries ?? 3;
        
        // COLUMNA PERISTÁLTICA: Encolado ordenado
        if (this.activeRequests >= this.MAX_CONCURRENT) {
            await new Promise(resolve => this.requestQueue.push(resolve));
        }
        
        this.activeRequests++;
        
        try {
            return await this._executeWithRetry(uqo, maxRetries);
        } finally {
            this.activeRequests--;
            if (this.requestQueue.length > 0) {
                const next = this.requestQueue.shift();
                next();
            }
        }
    }

    async _executeWithRetry(uqo, maxRetries) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this._rawFetch(uqo);
            } catch (error) {
                if (attempt === maxRetries || !RETRIABLE_CODES.includes(error.code)) throw error;
                const delay = Math.pow(2, attempt) * 1000 + (Math.random() * 500);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    async _rawFetch(uqo) {
        const { coreUrl, satelliteToken, environment, activeWorkspaceId, shareTicket } = this.bridge;
        if (!coreUrl) throw new Error("CORE_NOT_INITIALIZED");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s deadline

        const envelope = { 
            satellite_token: satelliteToken, 
            environment,
            workspace_id: activeWorkspaceId,
            ...uqo 
        };
        if (shareTicket) envelope.share_ticket = shareTicket;

        try {
            const response = await fetch(coreUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                credentials: 'include', // AXIOMA: Permite que el Core vea la sesión de Google del dueño
                signal: controller.signal,
                body: JSON.stringify(envelope)
            });

            clearTimeout(timeoutId);

            const rawText = await response.text();
            const result = JSON.parse(rawText);

            if (result.metadata?.status === 'ERROR') {
                const error = new Error(result.metadata.error);
                error.code = result.metadata.error;
                throw error;
            }
            return result;
        } catch (error) {
             if (error.name === 'AbortError') {
                 const err = new Error("GATEWAY_TIMEOUT");
                 err.code = "GATEWAY_TIMEOUT";
                 throw err;
             }
             throw error;
        }
    }

    _invokeUI(uqo) {
        return new Promise((resolve, reject) => {
            const requestId = `ui_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            this.bridge.pendingUIRequests.set(requestId, { resolve, reject });

            window.parent.postMessage({
                type: 'INDRA_UI_INVOKE',
                request_id: requestId,
                payload: uqo
            }, "*");
        });
    }
}
