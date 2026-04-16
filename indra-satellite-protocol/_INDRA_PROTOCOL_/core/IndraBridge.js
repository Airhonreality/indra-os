/**
 * =============================================================================
 * INDRA SATELLITE BRIDGE (v2.3) - SOVEREIGN ARCH NODE
 * =============================================================================
 * Responsabilidad: Gestión soberana, orquestada y resiliente.
 * Consolidación: Ahora incluye la lógica del ContractReader de forma nativa.
 * =============================================================================
 */

const ADR_ERROR_MAP = {
    'IDENTITY_VIOLATION': 'El ID del recurso es inválido o fue eliminado.',
    'NOT_FOUND': 'El recurso fue movido o borrado del almacenamiento.',
    'AUTH_REQUIRED': 'Se requiere una sesión activa o ticket válido.',
    'CONTRACT_VIOLATION': 'Error de integridad en los datos (viola el ADR-001).',
    'GENESIS_FAILED': 'No se pudo crear la infraestructura física.',
    'LOCK_TIMEOUT': 'El Core está ocupado. Intenta de nuevo en unos segundos.',
    'SECURITY_VIOLATION': 'Acceso denegado. El token no tiene jurisdicción.',
    'GATEWAY_TIMEOUT': 'El servidor de Google tardó demasiado en responder.',
    'NETWORK_ERROR': 'No se pudo establecer conexión con el Core (Offline?).'
};

const RETRIABLE_CODES = ['LOCK_TIMEOUT', 'GATEWAY_TIMEOUT', 'NETWORK_ERROR'];

const INDRA_MOTHER_SHELL = "https://airhonreality.github.io/indra-os";

class IndraBridge {
    constructor(config = {}) {
        this.coreUrl = config.coreUrl || INDRA_MOTHER_SHELL;
        this.satelliteToken = config.satelliteToken || null;
        this.shareTicket = config.shareTicket || null;
        this.coreVersion = null;
        this.logger = config.logger || console;
        
        // El Contrato es el ADN cargado localmente
        this.contract = { capabilities: { protocols: [], providers: [] }, schemas: [] };
        // Las capacidades son las dinámicas del Core
        this.capabilities = { protocols: [], providers: [], core_version: '0.0' };

        this.MAX_CONCURRENT = config.maxConcurrent || 1; // Axioma Peristáltico: 1 a la vez por defecto
        this.activeRequests = 0;
        this.requestQueue = [];
        
        this.workflowEngine = null;
        this.resonanceWarnings = []; 
        this.environment = config.environment || 'PRODUCTION'; // PRODUCTION | SANDBOX
        this.onStateChange = config.onStateChange || null;

        this.pendingUIRequests = new Map(); // Para rastrear llamadas a la UI del Core
    }

    /**
     * @dharma Escucha resonancia desde una Shell Madre (Iframe Host).
     */
    listenFromShell() {
        window.addEventListener("message", (event) => {
            this._handleResonanceMessage(event);
        });
    }

    _handleResonanceMessage(event) {
        const { type, payload, request_id } = event.data || {};

        // 1. Handshake de Resonancia
        if (type === "INDRA_RESONANCE_GRANT") {
            this.coreUrl = payload.core_url;
            this.satelliteToken = payload.google_token;
            this.environment = payload.environment || 'PRODUCTION';
            console.log("[IndraBridge] Resonancia concedida.");
            
            // Dispara evento nativo para que el satélite sepa que puede empezar
            window.dispatchEvent(new CustomEvent("indra-ready", { detail: payload }));
            window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
            this.init(); // Auto-ignición
        }

        // 2. Respuesta de una invocación de UI
        if (type === "INDRA_UI_RESPONSE" && request_id) {
            const pending = this.pendingUIRequests.get(request_id);
            if (pending) {
                if (payload.status === 'SUCCESS') pending.resolve(payload.data);
                else pending.reject(new Error(payload.error || "UI_INVOKE_FAILED"));
                this.pendingUIRequests.delete(request_id);
            }
        }
    }

    /**
     * @dharma Invoca a la Madre Shell de forma proactiva (PopUp).
     * Útil cuando el satélite no está dentro de un Iframe.
     */
    async ignite() {
        console.log("[IndraBridge] Solicitando Ignición a la Nave Nodriza...");
        const width = 500, height = 600;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        
        const popup = window.open(
            `${INDRA_MOTHER_SHELL}#/resonate?origin=${encodeURIComponent(window.location.origin)}`,
            "IndraResonance",
            `width=${width},height=${height},top=${top},left=${left}`
        );

        if (!popup) throw new Error("POPUP_BLOCKED");

        return new Promise((resolve, reject) => {
            const listener = (event) => {
                if (event.data?.type === "INDRA_RESONANCE_GRANT") {
                    this._handleResonanceMessage(event);
                    window.removeEventListener("message", listener);
                    if (popup) popup.close();
                    resolve(true);
                }
            };
            window.addEventListener("message", listener);
            
            // Timeout de seguridad
            setTimeout(() => {
                window.removeEventListener("message", listener);
                reject(new Error("RESONANCE_TIMEOUT"));
            }, 60000);
        });
    }

    /**
     * @dharma Genera un Checksum ligero del ADN local para validar la sinceridad.
     */
    _generateChecksum(schemas) {
        const str = JSON.stringify(schemas || []);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit int
        }
        return `chk_${Math.abs(hash).toString(36)}`;
    }

    /**
     * @dharma Carga el contrato local (ADN del Satélite).
     */
    async loadContract(path = './_INDRA_PROTOCOL_/indra_contract.json') {
        try {
            // 1. Intentamos cosechar materia local en desarrollo (Vite Mode)
            const localAssets = await this._harvestLocalAssets();
            
            // 2. Cargamos el contrato base
            const response = await fetch(path);
            this.contract = await response.json();

            // 3. Fusión de Sinceridad: Los archivos locales mandan sobre el JSON estático
            if (localAssets.schemas.length > 0) {
                console.log(`[IndraBridge] 🧬 Cosecha local exitosa: ${localAssets.schemas.length} esquemas detectados.`);
                this.contract.schemas = [...(this.contract.schemas || []), ...localAssets.schemas];
            }
            if (localAssets.workflows.length > 0) {
                this.contract.workflows = localAssets.workflows;
            }

            this._notify();
            return this.contract;
        } catch (e) {
            this.logger.error('[IndraBridge] Error cargando contrato local:', e);
            return null;
        }
    }

    /**
     * @dharma Escáner de Materia Local.
     * En modo estático (Public), dependemos del indra_contract.json consolidado.
     */
    async _harvestLocalAssets() {
        const assets = { schemas: [], workflows: [] };
        // El auto-scanner vía import.meta.glob solo funciona en SRC, no en PUBLIC.
        // Por ahora, devolvemos vacío para no romper el hilo de ejecución.
        return assets;
    }

    /**
     * @dharma Inicializar el sistema nervioso completo.
     */
    async init() {
        console.log("[IndraBridge] Handshake iniciado...");
        
        // 1. Carga automática del contrato local como base
        await this.loadContract();

        // 2. Handshake y Checksum de Sinceridad
        if (this.coreUrl) {
            try {
                const localChecksum = this._generateChecksum(this.contract.schemas);
                
                // Primero intentamos un pulso ligero para verificar el estado
                const statusPulse = await this.execute({
                    protocol: 'SYSTEM_MANIFEST',
                    provider: 'system'
                });
                
                const coreChecksum = statusPulse.metadata?.schema_checksum;
                
                if (localChecksum !== coreChecksum) {
                    this.logger.warn(`[IndraBridge] Divergencia de ADN detectada (Local: ${localChecksum} vs Core: ${coreChecksum}). Forzando Cristalización...`);
                    // ADR-Resonancia: Empujamos el ADN local para cristalizarlo en el Core
                    const crystalResponse = await this.execute({
                        protocol: 'SYSTEM_RESONANCE_CRYSTALLIZE',
                        provider: 'system',
                        data: { contract: this.contract, checksum: localChecksum }
                    });
                    this.capabilities = crystalResponse.metadata || {};
                    this.resonanceWarnings = crystalResponse.metadata?.integrity_warnings || [];
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'CRYSTALLIZED' } }));
                } else {
                    console.log("[IndraBridge] Resonancia perfecta. No se requiere cristalización.");
                    this.capabilities = statusPulse.metadata || {};
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
                }
                
                this.coreVersion = this.capabilities.core_version;
                
                if (this.resonanceWarnings.length > 0) {
                    this.logger.warn("⚠️ Advertencias de Resonancia detectadas:", this.resonanceWarnings);
                }

                console.log("[IndraBridge] Resonancia establecida con el Core.");
            } catch (e) {
                this.logger.warn("⚠️ Fallo en Handshake/Cristalización. Operando en modo Local/Desconectado.", e);
            }
        }

        this._notify();
        return { 
            core: this.capabilities, 
            contract: this.contract 
        };
    }

    _notify() {
        if (this.onStateChange) this.onStateChange(this);
    }

    /**
     * @dharma Auditoría técnica para el IDE/Terminal.
     */
    audit() {
        const report = {
            id: this.contract.core_id || 'ANONYMOUS',
            status: this.coreUrl ? 'CONNECTED' : 'LOCAL_ONLY',
            protocols: this.contract.capabilities.protocols.length,
            schemas: this.contract.schemas.length,
            auth: this.satelliteToken ? 'PRESENT' : 'MISSING',
            resonance: this.capabilities.core_version !== '0.0'
        };
        console.table(report);
        return report;
    }

    // --- MÉTODOS HEREDADOS DEL CONTRACT READER ---

    supports(protocol) {
        return this.contract.capabilities.protocols.includes(protocol.toUpperCase());
    }

    getSilos() {
        return this.contract.capabilities.providers || [];
    }

    getSchemas() {
        return this.contract.schemas || [];
    }

    // --- SISTEMA DE EJECUCIÓN ---

    async execute(uqo, options = {}) {
        if (!uqo.provider && uqo.protocol !== 'SYSTEM_MANIFEST') {
            uqo.provider = 'system';
        }

        // --- INTERCEPCIÓN DE PROTOCOLO DE INTERFAZ (SHELL MADRE) ---
        if (uqo.protocol === 'UI_INVOKE') {
            return new Promise((resolve, reject) => {
                const requestId = `ui_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                this.pendingUIRequests.set(requestId, { resolve, reject });

                window.parent.postMessage({
                    type: 'INDRA_UI_INVOKE',
                    request_id: requestId,
                    payload: uqo
                }, "*");
            });
        }

        const maxRetries = options.maxRetries ?? 3;
        
        // COLUMNA PERISTÁLTICA: Encolado ordenado para evitar asfixiar al Core
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
                next(); // Libera el siguiente pulso en la cola
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
        if (!this.coreUrl) throw new Error("CORE_NOT_INITIALIZED");
        const envelope = { 
            satellite_token: this.satelliteToken, 
            environment: this.environment,
            ...uqo 
        };
        if (this.shareTicket) envelope.share_ticket = this.shareTicket;

        const response = await fetch(this.coreUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(envelope)
        });

        const rawText = await response.text();
        const result = JSON.parse(rawText);

        if (result.metadata?.status === 'ERROR') {
            const error = new Error(ADR_ERROR_MAP[result.metadata.error] || result.metadata.error);
            error.code = result.metadata.error;
            throw error;
        }
        return result;
    }

    async runWorkflow(workflowJson, triggerData = {}) {
        if (!this.workflowEngine) {
            const Engine = (await import('./WorkflowEngine.js')).default;
            this.workflowEngine = new Engine(this);
        }
        return await this.workflowEngine.run(workflowJson, triggerData);
    }
}

export default IndraBridge;
