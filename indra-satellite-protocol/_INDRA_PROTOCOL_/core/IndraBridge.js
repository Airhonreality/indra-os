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
        this.infraToken = null; // Token original de indra_identity.js (Capa 0)
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

            // --- FASE 3: RESONANCIA AXIAL (EL PULSO OPTIMIZADO v20.0) ---
            notifyStep('SYNC_CORE', { message: 'Sincronizando ADN Soberano...' });

            // 1. DEDUPLICACIÓN: Usamos datos precargados por el Cortex (Hiper-Ignición)
            if (!this.capabilities || !this.capabilities.core_id) {
                const statusPulse = await this.execute({ protocol: 'SYSTEM_MANIFEST', provider: 'system' });
                this.capabilities = statusPulse.metadata || {};
            }
            
            this.allowedProtocols = this.capabilities.allowed_protocols || [];
            if (!this.contract) this.contract = {};
            this.contract.owner_email = this.capabilities.owner_email || this.capabilities.core_id;

            // 2. CONSUMO DE HIPER-IGNICIÓN: Evitamos peticiones si el Cortex ya las hizo
            const discovery = this.preloaded_discovery || await this.execute({ protocol: 'SYSTEM_SATELLITE_DISCOVER', provider: 'system' });
            this.availableWorkspaces = (discovery.items || []).filter(i => i.class === 'WORKSPACE');
            
            const targetWorkspace = this.activeWorkspaceId || this.capabilities.primary_workspace;
            if (targetWorkspace) {
                this.activeWorkspaceId = targetWorkspace;
                
                // Si no hay pins precargados, los pedimos, de lo contrario los usamos
                const pinsRes = this.preloaded_pins?.items?.length ? this.preloaded_pins : await this.execute({ 
                    protocol: 'SYSTEM_PINS_READ', 
                    workspace_id: targetWorkspace, 
                    provider: 'system' 
                });
                
                this.contract.remote_schemas = (pinsRes.items || []).filter(i => i.class === 'DATA_SCHEMA');
                console.log(`⚡ [Bridge] Jurisdicción sincronizada: ${this.activeWorkspaceId} (${this.contract.remote_schemas.length} esquemas).`);
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

    /**
     * @dharma Muta la identidad del bridge a una sesión de usuario y la persiste físicamente.
     * Preserva el token de infraestructura original para restauraciones o fallbacks.
     * @param {string} token - El token de sesión emitido por el Core (L2).
     * @param {Object} profile - El perfil hidratado del usuario.
     */
    setSessionToken(token, profile = null) {
        // Guardamos el token L0 original si es la primera vez que mutamos
        if (!this.infraToken) this.infraToken = this.satelliteToken;
        
        this.satelliteToken = token;
        this.sessionProfile = profile;
        
        // --- AXIOMA DE PERSISTENCIA (v18.0) ---
        const satelliteId = this.contract?.id || 'indra-node';
        const sessionKey = `indra_session_${satelliteId}`;
        const profileKey = `indra_profile_${satelliteId}`;
        
        localStorage.setItem(sessionKey, token);
        if (profile) localStorage.setItem(profileKey, JSON.stringify(profile));
        
        console.log(`🔐 [Bridge] Sesión de usuario persistida: ${sessionKey}`);
    }

    /**
     * @dharma Recupera la sesión activa desde la memoria local.
     */
    getSession() {
        const satelliteId = this.contract?.id || 'indra-node';
        const sessionKey = `indra_session_${satelliteId}`;
        const profileKey = `indra_profile_${satelliteId}`;
        
        const token = localStorage.getItem(sessionKey);
        const profile = JSON.parse(localStorage.getItem(profileKey) || 'null');
        
        if (!token) return null;
        return { token, profile };
    }

    /**
     * @dharma Cierra la sesión de usuario, purga la persistencia física y restaura L0.
     */
    logout() {
        const satelliteId = this.contract?.id || 'indra-node';
        const sessionKey = `indra_session_${satelliteId}`;
        
        localStorage.removeItem(sessionKey);
        this.restoreInfrastructureToken();
        
        console.log("🔓 [Bridge] Sesión cerrada. Retornando a Capa de Infraestructura (L0).");
        
        // Notificar a la UI del cambio de estado
        window.dispatchEvent(new CustomEvent('indra-auth-logout'));
    }

    /**
     * @dharma Restaura la identidad de infraestructura (Capa 0).
     * Útil cuando un usuario cierra sesión pero el satélite debe seguir sincronizando infra.
     */
    restoreInfrastructureToken() {
        if (this.infraToken) {
            this.satelliteToken = this.infraToken;
            console.log("🛰️ [Bridge] Identidad de Infraestructura (L0) restaurada.");
        }
    }
}

export default IndraBridge;
