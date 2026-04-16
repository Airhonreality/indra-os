/**
 * =============================================================================
 * INDRA SATELLITE BRIDGE (v3.3) - BRANCHING NEXUS
 * =============================================================================
 * Responsibilidad: Orquestación modular con separación de ramas de soberanía.
 * =============================================================================
 */

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
        this.environment = config.environment || 'PRODUCTION';

        // --- DATOS ADN ---
        this.contract = { satellite_name: 'Satélite Anónimo', capabilities: { protocols: [], providers: [] }, schemas: [] };
        this.capabilities = { protocols: [], providers: [], core_version: '0.0' };
        
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
        this.transport.purgeQueue(); // Limpiar ruidos previos
        return await this.identity.ignite(); 
    }
    
    // RAMA A: Anclaje de nueva identidad
    async anchorCitizenship() { return await this.resonanceSync.anchorCitizenship(); }
    
    // RAMA B: Sincronización de DNA existente
    async syncDNA() { return await this.resonanceSync.syncDNA(); }

    clearState() {
        this.satelliteToken = null;
        this.activeWorkspaceId = null;
        localStorage.removeItem('INDRA_SATELLITE_LINK');
        window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'GHOST' } }));
    }

    async loadContract(path) { return await this.contractCortex.load(path); }
    async execute(uqo, options) { return await this.transport.execute(uqo, options); }

    /**
     * @dharma Inicializar el sistema nervioso (Nexo de Conectividad).
     */
    async init() {
        if (this._initializing) return this._initPromise;
        this._initializing = true;
        
        this._initPromise = (async () => {
            console.log("[IndraBridge:Nexus] Analizando Vias de Resonancia...");
            await this.loadContract();

            if (this.coreUrl && this.satelliteToken) {
                try {
                    const localChecksum = this.contractCortex.calculateChecksum(this.contract.schemas);
                    const statusPulse = await this.execute({ protocol: 'SYSTEM_MANIFEST', provider: 'system' });
                    this.capabilities = statusPulse.metadata || {};

                    // --- DECISIÓN DE RAMA AXIOMÁTICA ---
                    if (!this.activeWorkspaceId) {
                        // RAMA A: Conectado pero sin Ciudadanía (Huérfano)
                        window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'ORPHAN' } }));
                    } else {
                        // RAMA B: Ciudadano detectado (Residente)
                        const coreChecksum = statusPulse.metadata?.schema_checksum;
                        if (localChecksum !== coreChecksum) {
                            window.dispatchEvent(new CustomEvent("indra-resonance-sync", { 
                                detail: { mode: 'DIVERGENT', local: localChecksum, core: coreChecksum } 
                            }));
                        } else {
                            window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
                        }
                    }

                } catch (e) {
                    console.warn("[IndraBridge:Nexus] Error en Handshake. Modo Offline.", e);
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'OFFLINE' } }));
                }
            } else {
                // Estado inicial: Sin conexión al Core
                window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'GHOST' } }));
            }

            this._notify('sync', { status: this.satelliteToken ? 'CONNECTED' : 'DISCONNECTED' });
            this._initializing = false;
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
