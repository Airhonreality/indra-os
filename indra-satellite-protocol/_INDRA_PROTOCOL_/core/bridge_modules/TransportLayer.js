const RETRIABLE_CODES = ['LOCK_TIMEOUT', 'GATEWAY_TIMEOUT', 'NETWORK_ERROR'];
const MUTATION_PROTOCOLS = ['ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE', 'SCHEMA_MUTATE', 'SYSTEM_IGNITE_SCHEMA'];

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

        // --- BUFFER DE INTENCIONES (SOBERANÍA) ---
        this.mutationQueue = this._loadMutationQueue();
        this._isSyncing = false;
        
        // Iniciar orquestador de fondo
        setInterval(() => this.processMutationQueue(), 15000); // Intento cada 15s
    }

    purgeQueue() {
        console.warn("[TransportLayer] Purgando cola de peticiones...");
        this.requestQueue.forEach(resolve => resolve());
        this.requestQueue = [];
        this.activeRequests = 0;
    }

    async execute(uqo, options = {}) {
        // --- FILTRO DE CONSCIENCIA: El Nodo Huérfano no puede hablar con el Core ---
        if (this.bridge.status === 'ORPHAN' && uqo.protocol !== 'UI_INVOKE') {
            const error = new Error("SATELLITE_UNLINKED");
            error.code = "UNLINKED_NODE";
            error.detail = "Este Satélite no posee un Sello de Identidad (Handshake) en disco.";
            throw error;
        }

        if (!uqo.provider && uqo.protocol !== 'SYSTEM_MANIFEST') {
            uqo.provider = this.bridge.contract?.satellite_name || 'indra';
        }

        // --- INTERCEPCIÓN DE PROTOCOLO DE INTERFAZ (SHELL MADRE) ---
        if (uqo.protocol === 'UI_INVOKE') {
            return this._invokeUI(uqo);
        }

        // --- BUFFER DE INTENCIONES: Escritura No-Bloqueante ---
        // Si es una mutación y estamos fuera de línea o el bridge aún no está listo:
        if (MUTATION_PROTOCOLS.includes(uqo.protocol) && 
            (this.bridge.status !== 'READY' || this.circuitStatus === 'OPEN' || options.background)) {
            return this._enqueueMutation(uqo);
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
        let { coreUrl, satelliteToken, activeWorkspaceId } = this.bridge;
        if (!coreUrl) throw new Error("CORE_NOT_INITIALIZED");

        // NEXUS SANITIZATION: Limpieza detectada en logs oficiales
        const cleanCoreUrl = coreUrl.split('?')[0].trim();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); 

        // EL PROTOCOLO DEL GUARDIÁN: Sobre Plano (React Nexus Parity)
        const envelope = { 
            workspace_id: activeWorkspaceId, // Valor por defecto del sistema
            ...uqo,                          // Prioridad absoluta al protocolo
            password: satelliteToken, 
            resonance_mode: uqo.resonance_mode || 'SOVEREIGN'
        };

        try {
            console.log(`📡 [Transport:Wire] Llamando a Core (SANITIZED): ${cleanCoreUrl} [Protocol: ${uqo.protocol}]`);
            const response = await fetch(cleanCoreUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

    // --- LÓGICA DE SOBERANÍA (ENCOLADO Y SINCRONÍA) ---

    async _enqueueMutation(uqo) {
        const mutationId = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const mutationEntry = {
            id: mutationId,
            uqo: uqo,
            timestamp: Date.now(),
            attempts: 0
        };

        this.mutationQueue.push(mutationEntry);
        this._saveMutationQueue();

        console.log(`📥 [Transport:Soberanía] Intención encolada: ${uqo.protocol} [${mutationId}]`);

        // Notificar al Vault si existe para una "Resonancia Fantasma" (UI inmediata)
        if (this.bridge.vault) {
            // Creamos un átomo virtual para que la UI no espere
            const virtualAtom = {
                id: mutationId,
                handle: uqo.data?.handle || { label: 'Sincronizando...' },
                class: uqo.data?.class || 'GHOST_ATOM',
                sync_pending: true,
                payload: uqo.data?.payload || {}
            };
            this.bridge.vault.commit(virtualAtom.id, virtualAtom);
        }

        // Retornamos éxito inmediato (Axioma de Cero Latencia)
        return {
            items: [{ id: mutationId, sync_pending: true }],
            metadata: { status: 'QUEUED', mutation_id: mutationId }
        };
    }

    async processMutationQueue() {
        if (this._isSyncing || this.mutationQueue.length === 0) return;
        if (this.bridge.status !== 'READY' || this.circuitStatus === 'OPEN') return;

        this._isSyncing = true;
        console.log(`🔄 [Transport:Resonancia] Procesando ${this.mutationQueue.length} intenciones pendientes...`);

        const entry = this.mutationQueue[0]; // Procesar de uno en uno para mantener orden causal
        
        try {
            const result = await this._executeWithRetry(entry.uqo, 1);
            
            // Éxito: Eliminar de la cola persistente
            this.mutationQueue.shift();
            this._saveMutationQueue();
            
            console.log(`✅ [Transport:Resonancia] Sincronización exitosa: ${entry.uqo.protocol}`);

            // Actualizar Vault con la realidad física (Core) si corresponde
            if (this.bridge.vault && result.items?.[0]) {
                const realAtom = result.items[0];
                this.bridge.vault.commit(realAtom.id, realAtom);
                // Si el ID era virtual, podríamos necesitar un mapeo, pero por ahora simplificamos.
            }

        } catch (error) {
            entry.attempts++;
            console.warn(`⚠️ [Transport:Resonancia] Reintento fallido para ${entry.id}. Intento: ${entry.attempts}`);
            
            if (entry.attempts > 10) {
                console.error(`💥 [Transport:Resonancia] Abortando intención ${entry.id} tras muchos fallos.`);
                this.mutationQueue.shift();
                this._saveMutationQueue();
            }
        } finally {
            this._isSyncing = false;
            // Si quedan más, procesar en el próximo intervalo o recursivamente con delay pequeño
            if (this.mutationQueue.length > 0) setTimeout(() => this.processMutationQueue(), 1000);
        }
    }

    _saveMutationQueue() {
        try {
            localStorage.setItem('INDRA_MUTATION_QUEUE', JSON.stringify(this.mutationQueue));
        } catch (e) {
            console.error("[Transport] Error persistiendo cola de mutaciones.");
        }
    }

    _loadMutationQueue() {
        try {
            const saved = localStorage.getItem('INDRA_MUTATION_QUEUE');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
}
