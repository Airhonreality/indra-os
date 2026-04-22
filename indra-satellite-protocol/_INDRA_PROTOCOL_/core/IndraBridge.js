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
     * AXIOMA DE RESOLUCIÓN DE IDENTIDAD (v15.0)
     * Resuelve un alias de esquema a su identidad física real (silo_id + provider).
     * El Satélite debe usar este método antes de cualquier TABULAR_STREAM para
     * asegurar un enrutamiento determinista y evitar el "Eco de Seguridad" del Core.
     * @param {string} alias - El alias del esquema (ej: 'master_inventory').
     * @returns {Object} { id, provider }
     */
    resolveSilo(alias) {
        const schemaAlias = String(alias).trim().toLowerCase();
        const schema = (this.contract.schemas || []).find(s => 
            (s.handle?.alias || '').toLowerCase() === schemaAlias
        );

        if (!schema) {
            console.error(`[IndraBridge:Error] El esquema "${alias}" no ha sido proyectado en este Satélite.`);
            throw new Error(`SCHEMA_NOT_FOUND: ${alias}`);
        }

        const siloId = schema.payload?.target_silo_id;
        const provider = schema.payload?.target_provider || 'sheets';

        if (!siloId) {
            console.warn(`[IndraBridge:Warn] El esquema "${alias}" existe pero carece de MATERIA FÍSICA (Ignición pendiente).`);
            throw new Error(`MATTER_NOT_IGNITED: ${alias}`);
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
     * @dharma Patrón de Ingesta Peristáltica Universal (Indra synergize v1.0).
     * Transforma una intención masiva en una serie rítmica de pulsos cristalizados.
     */
    async synergize(config) {
        const { source, target, mapping, policy, chunkSize = 100, onProgress } = config;
        
        console.log(`🌊 [IndraBridge:synergize] Iniciando transferencia industrial: ${source.provider} -> ${target.provider}`);

        // 1. GÉNESIS DEL TICKET PERISTÁLTICO (Core Persistence)
        const startRes = await this.execute({
            provider: 'automation',
            protocol: 'INDUCTION_START',
            data: {
                mode: 'PERISTALTIC',
                peristaltic: true,
                source: source,
                target: target,
                mapping: mapping,
                chunk_size: chunkSize,
                total_expected: config.total_expected || 0,
                policy: policy
            }
        });

        const ticketId = startRes.metadata?.ticket_id;
        if (!ticketId) throw new Error("Fallo al generar Ticket Peristáltico en el Núcleo.");

        // 2. REGISTRO EN EL VAULT (Resiliencia Local / Sesión Zombie)
        if (this.vault) {
             this.vault.commit(`active_peristalsis_${ticketId}`, { 
                 ticketId, 
                 source, 
                 target, 
                 status: 'RUNNING',
                 timestamp: Date.now() 
             });
        }

        // 3. BUCLE DE PULSO RÍTMICO
        let isCompleted = false;
        let lastTicket = null;

        while (!isCompleted) {
             const pulseRes = await this.execute({
                 provider: 'automation',
                 protocol: 'INDUCTION_PULSE',
                 data: { ticket_id: ticketId }
             });

             lastTicket = pulseRes.items[0];
             const progress = lastTicket.payload?.progress || 0;
             
             if (onProgress) {
                 onProgress({ 
                     percent: Math.round(progress * 100), 
                     cursor: lastTicket.payload?.cursor,
                     status: lastTicket.payload?.status,
                     ticket: lastTicket 
                 });
             }

             if (lastTicket.payload?.status === 'COMPLETED') {
                 isCompleted = true;
                 if (this.vault) this.vault.commit(`active_peristalsis_${ticketId}`, null); // Limpiar sesión
             }
             
             // Axioma de Seguridad: Pequeño respiro para el event loop si es necesario
             await new Promise(r => setTimeout(r, 10));
        }

        console.log(`✅ [IndraBridge:synergize] Transferencia industrial completada: ${ticketId}`);
        return lastTicket;
    }

    /**
     * @dharma Ignición Síncrona (Axioma de Sinceridad).
     * Evolucionada v5.5 para soportar Soberanía Local (T=0).
     */
    async init(options = { use_cache: true }) {
        if (this._initializing && !options.force) return this._initPromise;
        this._initializing = true;
        this._setStatus('IGNITING');
        
        const notifyStep = (step, detail) => {
            window.dispatchEvent(new CustomEvent("indra-handshake-step", { detail: { step, ...detail } }));
        };

        this._initPromise = (async () => {
            console.log("🚀 [IndraBridge] Iniciando Ignición Axial...");
            notifyStep('BRIDGE_INIT', { message: 'Iniciando Bridge...' });
            
            try {
                // --- FASE 1: IGNICIÓN FRÍA (T=0 / SOBERANÍA) ---
                notifyStep('LOAD_LOCAL_ADN', { message: 'Cargando ADN desde Memoria Estructural...' });
                const localDNA = await this.contractCortex.load({ use_cache: options.use_cache });
                
                // Inicializar Vault si no existe y tenemos componentes que lo requieran
                if (!this.vault) {
                    const { AgnosticVault } = await import('../../src/score/logic/AgnosticVault.js');
                    this.vault = new AgnosticVault(this);
                }

                if (localDNA && (localDNA.schemas?.length > 0 || localDNA.workflows?.length > 0)) {
                    console.log("🟢 [Bridge] Modo SOBERANO activado. Notificando LOCAL_READY.");
                    this._setStatus('READY'); // Permitimos que la UI proceda
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'LOCAL_READY' } }));
                }

                // --- FASE 2: IGNICIÓN CALIENTE (FONDO / RESONANCIA) ---
                
                // Recuperar pacto desde localStorage (si no se pasó por constructor)
                const linkData = localStorage.getItem('INDRA_SATELLITE_LINK');
                if (linkData && !this.satelliteToken) {
                    try {
                        const parsed = JSON.parse(linkData);
                        this.coreUrl = parsed.coreUrl || this.coreUrl;
                        this.satelliteToken = parsed.token || this.satelliteToken;
                    } catch (e) { /* Fail silently */ }
                }

                if (!this.coreUrl || !this.satelliteToken) {
                    console.warn("⚠️ [Bridge] Ignición Caliente en espera: Sin nexo configurado.");
                    if (this.status !== 'READY') this._setStatus('GHOST');
                    return;
                }

                notifyStep('FETCH_MANIFEST', { message: 'Sincronizando con el Core...' });
                const statusPulse = await this.execute({ protocol: 'SYSTEM_MANIFEST', provider: 'system' });
                this.capabilities = statusPulse.metadata || {};
                this.allowedProtocols = this.capabilities.allowed_protocols || [];
                
                await this.capabilitiesOracle.sync();
                
                notifyStep('DISCOVER_TERRITORY', { message: 'Validando Consistencia Global...' });
                const discovery = await this.execute({ protocol: 'SYSTEM_SATELLITE_DISCOVER', provider: 'system' });
                this.availableWorkspaces = discovery.items || [];

                if (statusPulse.metadata?.primary_workspace) {
                    this.activeWorkspaceId = statusPulse.metadata.primary_workspace;
                }

                if (!this.activeWorkspaceId) {
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { 
                        detail: { mode: 'DISCOVERY', items: this.availableWorkspaces } 
                    }));
                    if (this.status !== 'READY') this._setStatus('READY');
                    return;
                }

                // Validación de Ledger Físico y Sincronía Final
                try {
                    await this.execute({ 
                        protocol: 'ATOM_EXISTS', 
                        context_id: this.activeWorkspaceId, 
                        data: { ids: [this.activeWorkspaceId] } 
                    });
                    
                    console.log("✨ [Bridge] Resonancia Total Consolidada.");
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
                    
                    // --- DESCUBRIMIENTO DE ESQUEMAS REMOTOS (DRY/DRIFT) ---
                    // Cargamos lo que el Core ya tiene para comparar con lo local
                    try {
                        const remoteSchemas = await this.resonanceSync.discoverRemoteSchemas();
                        this.contract.remote_schemas = remoteSchemas;
                    } catch (e) { console.warn("[Bridge] Falló descubrimiento inicial de esquemas remotos."); }

                    this._setStatus('READY');
                    
                    // Notificar a los componentes que la "verdad global" ha llegado
                    window.dispatchEvent(new CustomEvent("indra-core-synced", { detail: { timestamp: Date.now() } }));

                } catch (error) {
                    console.error("❌ [Bridge] Fallo de Estabilidad Global:", error.message);
                    if (this.status !== 'READY') this._setStatus('ERROR');
                }

            } catch (e) {
                console.warn(`❌ [Bridge] Fallo en Ignición Caliente: ${e.message}`);
                if (this.status !== 'READY') this._setStatus('GHOST');
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
