/**
 * =============================================================================
 * 🏛️ INDRA AXIOMATIC MODULE: INDRA BRIDGE (v17.5 OMEGA)
 * =============================================================================
 */

import { TransportLayer } from './bridge_modules/TransportLayer.js';
import { IdentityNode } from './bridge_modules/IdentityNode.js';
import { ContractCortex } from './bridge_modules/ContractCortex.js';
import { ResonanceSync } from './bridge_modules/ResonanceSync.js';

class IndraBridge {
    constructor(config = {}) {
        this.coreUrl = config.coreUrl || null;
        this.satelliteToken = null;
        this.activeWorkspaceId = null; 
        this.availableWorkspaces = [];
        this.status = 'GHOST'; 
        this._onReadyCallbacks = [];
        this._initializing = false;

        this.contract = { satellite_name: 'Satélite Anónimo', capabilities: { protocols: [], providers: [] }, schemas: [] };
        this.capabilities = { protocols: [], providers: [], core_version: '0.0', system_state: 0 };
        this.allowedProtocols = [];
        
        this.transport = new TransportLayer(this);
        this.identity = new IdentityNode(this);
        this.contractCortex = new ContractCortex(this);
        this.resonanceSync = new ResonanceSync(this);
        this.vault = null;
    }

    onReady(callback) {
        if (this.status === 'READY') callback(this);
        else this._onReadyCallbacks.push(callback);
    }

    _setStatus(newStatus) {
        if (this.status === newStatus) return;
        this.status = newStatus;
        if (newStatus === 'READY') {
            const callbacks = [...this._onReadyCallbacks];
            this._onReadyCallbacks = [];
            callbacks.forEach(cb => cb(this));
        }
    }

    async init(options = {}) {
        if (this._initializing) return;
        this._initializing = true;
        this._setStatus('IGNITING');
        
        const notifyStep = (step, detail) => {
            window.dispatchEvent(new CustomEvent("indra-handshake-step", { detail: { step, ...detail } }));
        };

        try {
            // --- FASE 1: SOBERANÍA LOCAL (T=0) ---
            await this.contractCortex.load({ use_cache: options.use_cache });
            
            if (!this.vault) {
                const { AgnosticVault } = await import('./bridge_modules/AgnosticVault.js');
                this.vault = new AgnosticVault(this);
            }

            // --- FASE 2: CONSCIENCIA DE IDENTIDAD ---
            if (!this.coreUrl || !this.satelliteToken) {
                console.warn("💎 [Bridge] Nodo Huérfano detectado. Operando sin Resonancia Axial.");
                this._setStatus('ORPHAN'); 
                return;
            }

            // --- FASE 3: RESONANCIA AXIAL (EL PULSO) ---
            notifyStep('SYNC_CORE', { message: 'Invocando Manifiesto Real...' });
            const statusPulse = await this.execute({ protocol: 'SYSTEM_MANIFEST', provider: 'system' });
            this.capabilities = statusPulse.metadata || {};
            this.allowedProtocols = this.capabilities.allowed_protocols || [];
            
            if (!this.contract) this.contract = {};
            this.contract.owner_email = this.capabilities.owner_email || this.capabilities.core_id;

            // FASE 3.1: DESCUBRIMIENTO DE TERRITORIO
            notifyStep('DISCOVER_TERRITORY', { message: 'Descubriendo Workspaces...' });
            const discovery = await this.execute({ protocol: 'SYSTEM_SATELLITE_DISCOVER', provider: 'system' });
            this.availableWorkspaces = (discovery.items || []).filter(i => i.class === 'WORKSPACE');
            
            if (this.capabilities.primary_workspace && !this.activeWorkspaceId) {
                this.activeWorkspaceId = this.capabilities.primary_workspace;
            }

            // --- FASE 4: RESONANCIA DE ESQUEMAS ---
            if (this.activeWorkspaceId) {
                try {
                    const remoteRes = await this.execute({ 
                        protocol: 'SYSTEM_PINS_READ', 
                        workspace_id: this.activeWorkspaceId 
                    });
                    this.contract.remote_schemas = (remoteRes.items || []).filter(i => i.class === 'DATA_SCHEMA');
                } catch (e) {
                    console.warn("[Bridge] Jurisdicción inválida detectada.");
                    this.activeWorkspaceId = null;
                }
            }

            this._setStatus('READY');

        } catch (e) {
            console.error(`❌ [Bridge] DESCONEXIÓN AXIAL: ${e.message}`);
            this._setStatus('ERROR');
        } finally {
            this._initializing = false;
            window.dispatchEvent(new CustomEvent("indra-core-synced", { detail: { 
                status: this.status,
                timestamp: Date.now() 
            }}));
        }
    }

    async execute(params) { return await this.transport.execute(params); }
}

export default IndraBridge;
