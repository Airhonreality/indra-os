/**
 * =============================================================================
 * INDRA SATELLITE BRIDGE (v3.0) - FRAKTAL NEXUS
 * =============================================================================
 * Responsibilidad: Orquestación modular y soberana.
 * =============================================================================
 */

import { TransportLayer } from './bridge_modules/TransportLayer.js';
import { IdentityNode } from './bridge_modules/IdentityNode.js';
import { ContractCortex } from './bridge_modules/ContractCortex.js';
import { ResonanceSync } from './bridge_modules/ResonanceSync.js';

class IndraBridge {
    constructor(config = {}) {
        const savedSync = JSON.parse(localStorage.getItem('INDRA_SATELLITE_LINK') || '{}');

        // --- ESTADO NUCLEO ---
        this.coreUrl = config.coreUrl || savedSync.coreUrl || "https://airhonreality.github.io/indra-os";
        this.satelliteToken = config.satelliteToken || savedSync.token || null;
        this.activeWorkspaceId = savedSync.workspaceId || null; 
        this.environment = config.environment || 'PRODUCTION';
        this.shareTicket = config.shareTicket || null;

        // --- DATOS ADN ---
        this.contract = { satellite_name: 'Nuevo Satélite', capabilities: { protocols: [], providers: [] }, schemas: [] };
        this.capabilities = { protocols: [], providers: [], core_version: '0.0' };
        
        // --- MODULOS (Fractalidad) ---
        this.transport = new TransportLayer(this);
        this.identity = new IdentityNode(this);
        this.contractCortex = new ContractCortex(this);
        this.resonanceSync = new ResonanceSync(this);

        // --- SISTEMA DE EVENTOS ---
        this.pendingUIRequests = new Map();
        this._listeners = {};
        this.onStateChange = config.onStateChange || null;
    }

    // --- DELEGACIÓN DE IDENTIDAD ---
    async ignite() { return await this.identity.ignite(); }
    
    clearState() {
        this.satelliteToken = null;
        localStorage.removeItem('INDRA_SATELLITE_LINK');
        this._notify('sync', { status: 'DISCONNECTED' });
        window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'OFFLINE' } }));
    }

    // --- DELEGACIÓN DE ADN ---
    async loadContract(path) { 
        return await this.contractCortex.load(path).then(c => {
            this._notify('contract_loaded', c);
            return c;
        });
    }

    // --- DELEGACIÓN DE COMUNICACIÓN ---
    async execute(uqo, options) { return await this.transport.execute(uqo, options); }

    // --- DELEGACIÓN DE SINCRONIZACIÓN ---
    async masterSync() { return await this.resonanceSync.masterSync(); }
    async persistMetadata() { return await this.resonanceSync.persistMetadata(); }

    /**
     * @dharma Inicializar el sistema nervioso completo.
     */
    async init() {
        console.log("[IndraBridge:Nexus] Inicializando...");
        await this.loadContract();

        if (this.coreUrl && this.satelliteToken) {
            try {
                const localChecksum = this.contractCortex.calculateChecksum(this.contract.schemas);
                const statusPulse = await this.execute({ protocol: 'SYSTEM_MANIFEST', provider: 'system' });
                
                const coreChecksum = statusPulse.metadata?.schema_checksum;
                this.capabilities = statusPulse.metadata || {};
                
                if (localChecksum !== coreChecksum) {
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { 
                        detail: { mode: 'DIVERGENT', local: localChecksum, core: coreChecksum } 
                    }));
                } else {
                    window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
                }

                if (statusPulse.metadata?.generated_workspace_id) {
                    this.activeWorkspaceId = statusPulse.metadata.generated_workspace_id;
                }

            } catch (e) {
                console.warn("[IndraBridge:Nexus] Fallo en handshake core.", e);
                window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'OFFLINE' } }));
            }
        } else {
            window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'GHOST' } }));
        }

        this._notify('sync', { status: this.satelliteToken ? 'CONNECTED' : 'DISCONNECTED' });
    }

    _notify(event, data) {
        if (this.onStateChange) this.onStateChange(this, event, data);
        if (this._listeners[event]) this._listeners[event].forEach(cb => cb(data));
        window.dispatchEvent(new CustomEvent(`indra:${event}`, { detail: data }));
        if (event === 'sync') window.dispatchEvent(new CustomEvent('indra-ready', { detail: data }));
    }

    audit() {
        const report = {
            id: this.contract.core_id || 'ANONYMOUS',
            status: this.coreUrl ? 'CONNECTED' : 'LOCAL_ONLY',
            schemas: this.contract.schemas.length,
            auth: this.satelliteToken ? 'PRESENT' : 'MISSING'
        };
        console.table(report);
        return report;
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
