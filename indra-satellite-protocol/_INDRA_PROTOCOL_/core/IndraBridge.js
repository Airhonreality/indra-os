import { TransportLayer } from './bridge_modules/TransportLayer.js';
import { IdentityNode } from './bridge_modules/IdentityNode.js';
import { ContractCortex } from './bridge_modules/ContractCortex.js';
import { ResonanceSync } from './bridge_modules/ResonanceSync.js';

class IndraBridge {
    constructor(config = {}) {
        // --- ESTADO NUCLEO ---
        this.coreUrl = config.coreUrl || "https://airhonreality.github.io/indra-os";
        this.satelliteToken = null;
        this.activeWorkspaceId = null; 
        this.availableWorkspaces = []; // Descubrimiento físico de realidad
        this.environment = config.environment || 'PRODUCTION';

        // --- DATOS ADN ---
        this.contract = { satellite_name: 'Satélite Anónimo', capabilities: { protocols: [], providers: [] }, schemas: [] };
        this.capabilities = { protocols: [], providers: [], core_version: '0.0', system_state: 0 };
        this.allowedProtocols = []; // Cache of protocols allowed by the Gateway
        
        // --- MODULOS ---
        this.transport = new TransportLayer(this);
        this.identity = new IdentityNode(this);
        this.contractCortex = new ContractCortex(this);
        this.resonanceSync = new ResonanceSync(this);

        // --- SISTEMA DE EVENTOS ---
        this.pendingUIRequests = new Map();
        this._listeners = {};
        this.onStateChange = config.onStateChange || null;
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
            if (uqo.protocol !== 'SYSTEM_MANIFEST' && uqo.protocol !== 'SYSTEM_RESONANCE_CRYSTALLIZE') {
                console.error(`[IndraBridge:Aduana] El protocolo '${uqo.protocol}' no está permitido.`);
                throw new Error("PROTOCOL_NOT_ALLOWED_BY_GATEWAY");
            }
        }
        return await this.transport.execute(uqo, options); 
    }

    /**
     * @dharma Ignición Síncrona (Axioma de Sinceridad).
     */
    async init() {
        if (this._initializing) return this._initPromise;
        this._initializing = true;
        
        this._initPromise = (async () => {
            console.log("🚀 [IndraBridge] Iniciando Ignición Síncrona...");
            
            try {
                // PASO 0: Carga del contrato (ADN Lógico)
                await this.loadContract();

                // Recuperar pacto desde localStorage (Soberanía Pura: Solo URL y Token)
                const linkData = localStorage.getItem('INDRA_SATELLITE_LINK');
                if (linkData) {
                    try {
                        const parsed = JSON.parse(linkData);
                        this.coreUrl = parsed.coreUrl || this.coreUrl;
                        this.satelliteToken = parsed.token || this.satelliteToken;
                        // El workspaceId NO se recupera de disco. Es volátil.
                    } catch (e) { /* Fail silently */ }
                }

                if (!this.coreUrl || !this.satelliteToken) {
                    throw new Error("GHOST: Sin nexo configurado.");
                }

                // PASO 1: Validación de Red e Identidad (Discovery de Capacidades)
                const statusPulse = await this.execute({ protocol: 'SYSTEM_MANIFEST', provider: 'system' });
                this.capabilities = statusPulse.metadata || {};
                this.allowedProtocols = this.capabilities.allowed_protocols || [];
                
                // PASO 2: REALIDAD SINCERA (Discovery de Territorio)
                // Si no hay ID o si queremos ser sinceros, escaneamos.
                const discovery = await this.execute({ protocol: 'SYSTEM_SATELLITE_DISCOVER', provider: 'system' });
                this.availableWorkspaces = discovery.items || [];

                // AXIOMA: Si el Core tiene una asignación primaria, la respetamos.
                if (statusPulse.metadata?.primary_workspace) {
                    this.activeWorkspaceId = statusPulse.metadata.primary_workspace;
                }

                // SI NO TENEMOS ID, lanzamos modo DISCOVERY para que el usuario elija
                if (!this.activeWorkspaceId) {
                    console.log("📡 [Indra] Iniciando en modo Descubrimiento de Realidades.");
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { 
                        detail: { mode: 'DISCOVERY', items: this.availableWorkspaces } 
                    }));
                    return;
                }

                // PASO 3: Validación de Ledger Físico (Solo si el Core nos asignó algo o ya lo teníamos)
                try {
                    await this.execute({ 
                        protocol: 'ATOM_EXISTS', 
                        context_id: this.activeWorkspaceId, 
                        data: { ids: [this.activeWorkspaceId] } 
                    });
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
                } catch (error) {
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { 
                        detail: { mode: 'ERROR_LEDGER', error: error.message, id: this.activeWorkspaceId } 
                    }));
                }

            } catch (e) {
                console.warn(`❌ [Bridge] Ignición abortada: ${e.message}`);
                window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'GHOST', error: e.message } }));
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
        if (event === 'sync') window.dispatchEvent(new CustomEvent('indra-ready', { detail: data }));
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
