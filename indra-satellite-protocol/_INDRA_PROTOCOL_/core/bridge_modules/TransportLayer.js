const RETRIABLE_CODES = ['LOCK_TIMEOUT', 'GATEWAY_TIMEOUT', 'NETWORK_ERROR'];

export class TransportLayer {
    constructor(bridge) {
        this.bridge = bridge;
        this.activeRequests = 0;
        this.requestQueue = [];
        this.MAX_CONCURRENT = 5; // Mayor paralelismo para evitar bloqueos en handshakes
        
        // --- CIRCUIT BREAKER ---
        this.circuitStatus = 'CLOSED'; // CLOSED, OPEN, HALF-OPEN
        this.circuitOpenUntil = null;
        this.consecutiveFailures = 0;
        this.FAILURE_THRESHOLD = 3;
        this.CIRCUIT_REST_TIME_MS = 30000;
    }

    purgeQueue() {
        console.warn("[TransportLayer] Purgando cola de peticiones...");
        this.requestQueue.forEach(resolve => resolve());
        this.requestQueue = [];
        this.activeRequests = 0;
    }

    async execute(uqo, options = {}) {
        if (!uqo.provider && uqo.protocol !== 'SYSTEM_MANIFEST') {
            uqo.provider = this.bridge.contract?.satellite_name || 'indra';
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
        if (this.circuitStatus === 'OPEN') {
            if (Date.now() > this.circuitOpenUntil) {
                console.warn("[TransportLayer] Circuito en modo HALF-OPEN. Probando terreno...");
                this.circuitStatus = 'HALF-OPEN';
            } else {
                const error = new Error("CIRCUIT_OPEN");
                error.code = "CIRCUITO_ABIERTO";
                error.detail = "El Gateway del Core no responde. Previniendo bloqueo de red.";
                throw error;
            }
        }

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await this._rawFetch(uqo);
                
                // Si llegamos aquí y estábamos fallando, nos recuperamos
                if (this.circuitStatus === 'HALF-OPEN' || this.consecutiveFailures > 0) {
                    console.log("[TransportLayer] Conexión estable restaurada. Circuito CLOSED.");
                    this.circuitStatus = 'CLOSED';
                    this.consecutiveFailures = 0;
                }
                
                return response;
            } catch (error) {
                if (RETRIABLE_CODES.includes(error.code) || error.code === '503') {
                    this.consecutiveFailures++;
                    
                    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
                        console.error(`[TransportLayer] Superado el umbral de fallos (${this.FAILURE_THRESHOLD}). Abriendo Circuito.`);
                        this.circuitStatus = 'OPEN';
                        this.circuitOpenUntil = Date.now() + this.CIRCUIT_REST_TIME_MS;
                        throw new Error("CIRCUITO_ABIERTO");
                    }
                }

                if (attempt === maxRetries || (!RETRIABLE_CODES.includes(error.code) && error.code !== '503')) throw error;
                
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
            bridge_version: '4.0_NEXUS',
            ...uqo 
        };
        if (shareTicket) envelope.share_ticket = shareTicket;

        try {
            console.log(`📡 [Transport:Fetch] Llamando a Core: ${coreUrl} [Protocol: ${uqo.protocol}]`);
            const response = await fetch(coreUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                signal: controller.signal,
                body: JSON.stringify(envelope)
            });

            clearTimeout(timeoutId);

            const rawText = await response.text();
            const result = JSON.parse(rawText);

            if (result.metadata?.status === 'ERROR') {
                // --- DHARMA DE ERRORES: Detección Atómica ---
                const errorAtom = result.items?.find(item => item.class === 'INDRA_ERROR');
                
                if (errorAtom) {
                    console.error(`[Transport:AtomicError] Protocolo ${uqo.protocol} falló [${errorAtom.payload.code}]:`, errorAtom.payload.message);
                    
                    // --- EMISIÓN GLOBAL PARA EL HUD ---
                    window.dispatchEvent(new CustomEvent('indra-error-atom', { detail: errorAtom }));

                    const error = new Error(errorAtom.payload.message);
                    error.code = errorAtom.payload.code;
                    error.severity = errorAtom.payload.severity;
                    error.recovery_hint = errorAtom.payload.recovery_hint;
                    error.isAtomic = true;
                    error.details = errorAtom.payload.details;
                    throw error;
                } else {
                    // Fallback para errores no atómicos (Legacy)
                    console.error(`[Transport:LegacyError] Protocolo ${uqo.protocol} falló:`, result.metadata.error);
                    const error = new Error(result.metadata.error || 'Error desconocido del sistema.');
                    error.code = 'SYSTEM_FAILURE';
                    throw error;
                }
            }
            return result;
        } catch (error) {
             console.error(`❌ [Transport:Critical] Fallo de red hacia ${coreUrl}:`, error.message || error);
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
