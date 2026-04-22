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
        
        // --- VAULT SOBERANO (NUEVO) ---
        this.vault = null; // Se inicializa en init()

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

    /**
     * AXIOMA DE RESOLUCIÓN DE IDENTIDAD (v16.2)
     * Resuelve un alias de esquema a su identidad física real.
     * Blindado contra colisiones de red antes de firma de pacto.
     */
    resolveSilo(alias) {
        const schemaAlias = String(alias).trim().toLowerCase();
        const schema = (this.contract.schemas || []).find(s => 
            (s.handle?.alias || '').toLowerCase() === schemaAlias
        );

        if (!schema) {
            console.error(`[IndraBridge:Error] El esquema "${alias}" no existe.`);
            throw new Error(`SCHEMA_NOT_FOUND: ${alias}`);
        }

        const siloId = schema.payload?.target_silo_id;
        const provider = schema.payload?.target_provider || 'sheets';

        // 🛡️ AXIOMA DE MATERIA REAL (Anti-IllegalID)
        const isPlaceholder = !siloId || siloId === alias || siloId === 'project';
        
        if (isPlaceholder) {
            console.warn(`[IndraBridge:Warn] "${alias}" no tiene base de datos física vinculada.`);
            throw new Error(`MATTER_NOT_IGNITED: ${alias}`);
        }

        // 🛡️ AXIOMA DE AUTORIZACIÓN
        if (!this.satelliteToken && provider !== 'system') {
             throw new Error(`SATELLITE_NOT_LINKED: Se requiere firma de pacto para acceder a "${alias}"`);
        }

        return { id: siloId, provider: provider };
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
            if (error.message.includes('SYSTEM_REBUILD_LEDGER') && uqo.protocol !== 'SYSTEM_REBUILD_LEDGER') {
                console.warn("🛡️ [Self-Healing] Detectada inconsistencia en Ledger...");
                try {
                    await this.transport.execute({ protocol: 'SYSTEM_REBUILD_LEDGER', provider: 'system' });
                    return await this.transport.execute(uqo, options);
                } catch (rebuildErr) { throw error; }
            }
            throw error;
        }
    }

    /**
     * @dharma Ignición Agrupada v16.1 (Eficiencia Industrial).
     */
    async init(options = { use_cache: true }) {
        if (this._initializing && !options.force) return this._initPromise;
        this._initializing = true;
        this._setStatus('IGNITING');
        
        const notifyStep = (step, detail) => {
            window.dispatchEvent(new CustomEvent("indra-handshake-step", { detail: { step, ...detail } }));
        };

        this._initPromise = (async () => {
            console.log("🚀 [IndraBridge] Iniciando Ignición Eficiente v16.1...");
            
            try {
                // --- FASE 1: SOBERANÍA LOCAL (T=0) ---
                const localDNA = await this.contractCortex.load({ use_cache: options.use_cache });
                
                if (!this.vault) {
                    const { AgnosticVault } = await import('../../src/score/logic/AgnosticVault.js');
                    this.vault = new AgnosticVault(this);
                }

                if (localDNA && (localDNA.schemas?.length > 0 || localDNA.workflows?.length > 0)) {
                    console.log("🟢 [Bridge] Modo SOBERANO ready.");
                    this._setStatus('READY'); 
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'LOCAL_READY' } }));
                }

                // --- FASE 2: RESONANCIA AGRUPADA (EL RAYO) ---
                const linkData = localStorage.getItem('INDRA_SATELLITE_LINK');
                if (linkData && !this.satelliteToken) {
                    const parsed = JSON.parse(linkData);
                    this.coreUrl = parsed.coreUrl || this.coreUrl;
                    this.satelliteToken = parsed.token || this.satelliteToken;
                }

                if (!this.coreUrl || !this.satelliteToken) {
                    if (this.status !== 'READY') this._setStatus('GHOST');
                    return;
                }

                notifyStep('SYNC_CORE', { message: 'Sincronizando con el Core...' });

                // PARALELISMO AXIAL
                const [statusPulse, discovery] = await Promise.all([
                    this.execute({ protocol: 'SYSTEM_MANIFEST', provider: 'system' }),
                    this.execute({ protocol: 'SYSTEM_SATELLITE_DISCOVER', provider: 'system' })
                ]);

                this.capabilities = statusPulse.metadata || {};
                this.allowedProtocols = this.capabilities.allowed_protocols || [];
                this.availableWorkspaces = discovery.items || [];
                this.activeWorkspaceId = statusPulse.metadata.primary_workspace || this.activeWorkspaceId;

                await this.capabilitiesOracle.sync();

                if (this.activeWorkspaceId) {
                    try {
                        const remoteSchemas = await this.resonanceSync.discoverRemoteSchemas();
                        this.contract.remote_schemas = remoteSchemas;
                    } catch (e) {}
                }

                this._setStatus('READY');
                window.dispatchEvent(new CustomEvent("indra-core-synced", { detail: { timestamp: Date.now() } }));

            } catch (e) {
                console.warn(`❌ [Bridge] Fallo en Ignición Caliente: ${e.message}`);
                if (this.status !== 'READY') this._setStatus('GHOST');
            } finally {
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
