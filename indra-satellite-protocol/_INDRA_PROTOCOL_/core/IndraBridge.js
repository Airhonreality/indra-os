import { TransportLayer } from './bridge_modules/TransportLayer.js';
import { IdentityNode } from './bridge_modules/IdentityNode.js';
import { ContractCortex } from './bridge_modules/ContractCortex.js';
import { ResonanceSync } from './bridge_modules/ResonanceSync.js';
import { CapabilitiesResolver } from './bridge_modules/CapabilitiesResolver.js';

class IndraBridge {
    constructor(config = {}) {
        // --- ESTADO NUCLEO ---
        this.coreUrl = config.coreUrl || "https://airhonreality.github.io/indra-os";
        this.satelliteToken = null;
        this.activeWorkspaceId = null; 
        this.availableWorkspaces = []; // Descubrimiento físico de realidad
        this.environment = config.environment || 'PRODUCTION';

        // --- ESTADO REACTIVO (NUEVO) ---
        /** @type {'GHOST'|'IGNITING'|'READY'|'ERROR'} */
        this.status = 'GHOST'; 
        this._onReadyCallbacks = [];
        this._initializing = false;

        // --- DATOS ADN ---
        this.contract = { satellite_name: 'Satélite Anónimo', capabilities: { protocols: [], providers: [] }, schemas: [] };
        this.capabilities = { protocols: [], providers: [], core_version: '0.0', system_state: 0 };
        this.allowedProtocols = []; // Cache of protocols allowed by the Gateway
        
        // --- MODULOS ---
        this.transport = new TransportLayer(this);
        this.identity = new IdentityNode(this);
        this.contractCortex = new ContractCortex(this);
        this.resonanceSync = new ResonanceSync(this);
        this.capabilitiesOracle = new CapabilitiesResolver(this);

        // --- SISTEMA DE EVENTOS ---
        this.pendingUIRequests = new Map();
        this._listeners = {};
        this.onStateChange = config.onStateChange || null;

        // AUTO-IGNICIÓN POR INERCIA DE IDENTIDAD
        if (config.autoInit !== false) {
            this._checkInertia();
        }
    }

    /**
     * Revisa si existe un pacto previo para encender el motor en background.
     */
    _checkInertia() {
        const linkData = localStorage.getItem('INDRA_SATELLITE_LINK');
        if (linkData) {
            console.log("🌀 [IndraBridge] Detectada inercia de identidad. Iniciando ignición autónoma...");
            this.init().catch(() => {});
        }
    }

    /**
     * @dharma Patrón de Suscripción Segura.
     * Ejecuta el callback inmediatamente si ya está READY, o lo encola.
     */
    onReady(callback) {
        if (this.status === 'READY') {
            callback(this);
        } else {
            this._onReadyCallbacks.push(callback);
        }
    }

    /**
     * Actualiza el estado y notifica a los observadores.
     */
    _setStatus(newStatus) {
        if (this.status === newStatus) return;
        this.status = newStatus;
        console.log(`📡 [IndraBridge] Cambio de Fase: ${newStatus}`);
        
        if (newStatus === 'READY') {
            const callbacks = [...this._onReadyCallbacks];
            this._onReadyCallbacks = [];
            callbacks.forEach(cb => {
                try { cb(this); } catch (e) { console.error("[IndraBridge:onReady] Callback error:", e); }
            });
        }
        
        this._notify('status_change', { status: newStatus });
    }

    // --- RAMAS DE SOBERANÍA ---
    async ignite() { 
        this.transport.purgeQueue(); 
        return await this.identity.ignite(); 
    }
    
    async anchorCitizenship() { return await this.resonanceSync.anchorCitizenship(); }
    async crystallizeResonance() { return await this.resonanceSync.crystallizeResonance(); }
    async syncDNA() { return await this.resonanceSync.syncDNA(); }

    clearState() {
        this.satelliteToken = null;
        this.activeWorkspaceId = null;
        this.status = 'GHOST';
        localStorage.removeItem('INDRA_SATELLITE_LINK');
        window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'GHOST' } }));
    }

    async loadContract(path) { return await this.contractCortex.load(path); }
    
    async invokeUI(module, payload = {}) {
        return await this.execute({
            protocol: 'UI_INVOKE',
            module: module,
            payload: payload
        });
    }
    
    async execute(uqo, options) { 
        if (this.allowedProtocols.length > 0 && !this.allowedProtocols.includes(uqo.protocol)) {
            if (!['SYSTEM_MANIFEST', 'SYSTEM_RESONANCE_CRYSTALLIZE', 'SYSTEM_REBUILD_LEDGER'].includes(uqo.protocol)) {
                console.error(`[IndraBridge:Aduana] El protocolo '${uqo.protocol}' no está permitido.`);
                throw new Error("PROTOCOL_NOT_ALLOWED_BY_GATEWAY");
            }
        }
        
        try {
            const response = await this.transport.execute(uqo, options);
            return response;
        } catch (error) {
            // AXIOMA DE AUTO-SANACIÓN: Si el error sugiere un Rebuild, lo intentamos.
            if (error.message.includes('SYSTEM_REBUILD_LEDGER') && uqo.protocol !== 'SYSTEM_REBUILD_LEDGER') {
                console.warn("🛡️ [Self-Healing] Detectada inconsistencia en Ledger. Intentando reconstrucción automática...");
                try {
                    await this.transport.execute({ protocol: 'SYSTEM_REBUILD_LEDGER', provider: 'system' });
                    console.log("✅ [Self-Healing] Ledger reconstruido. Reintentando operación original...");
                    return await this.transport.execute(uqo, options);
                } catch (rebuildErr) {
                    console.error("❌ [Self-Healing] Falló la reconstrucción automática:", rebuildErr);
                    throw error; // Lanzamos el error original si la sanación falla
                }
            }
            throw error;
        }
    }

    /**
     * @dharma Ignición Síncrona (Axioma de Sinceridad).
     */
    async init() {
        if (this._initializing) return this._initPromise;
        this._initializing = true;
        this._setStatus('IGNITING');
        
        const notifyStep = (step, detail) => {
            window.dispatchEvent(new CustomEvent("indra-handshake-step", { detail: { step, ...detail } }));
        };

        this._initPromise = (async () => {
            console.log("🚀 [IndraBridge] Iniciando Ignición Síncrona...");
            notifyStep('BRIDGE_INIT', { message: 'Iniciando Bridge...' });
            
            try {
                // PASO 0: Carga del contrato (ADN Lógico)
                notifyStep('LOAD_CONTRACT', { message: 'Cargando ADN Lógico...' });
                await this.loadContract();

                // Recuperar pacto desde localStorage
                const linkData = localStorage.getItem('INDRA_SATELLITE_LINK');
                if (linkData) {
                    try {
                        const parsed = JSON.parse(linkData);
                        this.coreUrl = parsed.coreUrl || this.coreUrl;
                        this.satelliteToken = parsed.token || this.satelliteToken;
                    } catch (e) { /* Fail silently */ }
                }

                if (!this.coreUrl || !this.satelliteToken) {
                    throw new Error("GHOST: Sin nexo configurado.");
                }

                // PASO 1: Validación de Red e Identidad
                notifyStep('FETCH_MANIFEST', { message: 'Solicitando Manifiesto al Core...' });
                const statusPulse = await this.execute({ protocol: 'SYSTEM_MANIFEST', provider: 'system' });
                this.capabilities = statusPulse.metadata || {};
                this.allowedProtocols = this.capabilities.allowed_protocols || [];
                
                // PASO 1.5: Sincronización del Oráculo de Capacidades
                await this.capabilitiesOracle.sync();
                
                // PASO 2: REALIDAD SINCERA (Discovery de Territorio)
                notifyStep('DISCOVER_TERRITORY', { message: 'Explorando Territorio Físico...' });
                const discovery = await this.execute({ protocol: 'SYSTEM_SATELLITE_DISCOVER', provider: 'system' });
                this.availableWorkspaces = discovery.items || [];

                // AXIOMA: Si el Core tiene una asignación primaria, la respetamos.
                if (statusPulse.metadata?.primary_workspace) {
                    this.activeWorkspaceId = statusPulse.metadata.primary_workspace;
                }

                // SI NO TENEMOS ID, lanzamos modo DISCOVERY
                if (!this.activeWorkspaceId) {
                    notifyStep('DISCOVERY_MODE', { message: 'Modo Descubrimiento Activo.' });
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { 
                        detail: { mode: 'DISCOVERY', items: this.availableWorkspaces } 
                    }));
                    this._setStatus('READY'); // Estamos listos pero en modo descubrimiento
                    return;
                }

                // PASO 3: Validación de Ledger Físico
                notifyStep('VERIFY_STABILITY', { message: 'Verificando Estabilidad de la Realidad...' });
                try {
                    await this.execute({ 
                        protocol: 'ATOM_EXISTS', 
                        context_id: this.activeWorkspaceId, 
                        data: { ids: [this.activeWorkspaceId] } 
                    });
                    notifyStep('SYNC_COMPLETE', { message: 'Resonancia Estable.' });
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
                    this._setStatus('READY');
                } catch (error) {
                    notifyStep('ERROR_STABILITY', { message: 'Fallo de Estabilidad.', error: error.message });
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { 
                        detail: { mode: 'ERROR_LEDGER', error: error.message, id: this.activeWorkspaceId } 
                    }));
                    this._setStatus('ERROR');
                }

            } catch (e) {
                notifyStep('IGNITION_ABORTED', { message: 'Ignición Fallida.', error: e.message });
                console.warn(`❌ [Bridge] Ignición abortada: ${e.message}`);
                window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'GHOST', error: e.message } }));
                this._setStatus('GHOST');
            } finally {
                this._notify('sync', { status: this.satelliteToken ? 'CONNECTED' : 'DISCONNECTED' });
                this._initializing = false;
            }
        })();

        return this._initPromise;
    }

    _notify(event, data) {
        if (this.onStateChange) this.onStateChange(this, event, data);
        window.dispatchEvent(new CustomEvent(`indra:${event}`, { detail: data }));
        if (event === 'sync') window.dispatchEvent(new CustomEvent('indra-ready', { detail: { ...data, bridge: this } }));
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
