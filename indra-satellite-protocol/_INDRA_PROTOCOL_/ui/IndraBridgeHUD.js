/**
 * =============================================================================
 * INDRA BRIDGE HUD (Sovereign Host v2.7)
 * =============================================================================
 * AXIOMA: Es un Cascarón Vacío. Su única misión es proveer el chasis (Layout)
 * y la comunicación con el Bridge. La funcionalidad reside en los WIDGETS.
 * =============================================================================
 */

import './widgets/IndraSchemaProjector.js';
import './widgets/IndraUniversalPicker.js';
import './widgets/IndraWorkflowRibbon.js';
import './widgets/IndraParamModal.js';
import './widgets/IndraKeychainWidget.js';
import './widgets/IndraWorkspaceSelector.js';

const TEMPLATE = `
<style>
    :host {
        display: block;
        font-family: var(--indra-font, 'Inter', system-ui, sans-serif);
        --accent: #2563eb;
        --bg: #ffffff;
        --surface: #f3f4f6;
        --text: #1f2937;
        --border: #e5e7eb;
    }

    .hud-container {
        display: flex;
        flex-direction: column;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 4px;
        overflow: hidden;
        color: var(--text);
        margin: 10px auto;
    }

    .hud-header {
        background: var(--surface);
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border);
    }

    .status-group { display: flex; gap: 8px; align-items: center; }
    .badge { font-size: 8px; padding: 2px 8px; border-radius: 20px; font-weight: 700; text-transform: uppercase; border: 1px solid transparent; transition: 0.3s; }
    .badge-core { background: #fff; color: #4b5563; border-color: var(--border); }
    .badge-citizen { background: #f3e8ff; color: #6b21a8; border-color: #d8b4fe; font-family: monospace; }
    .badge-divergent { background: #fef3c7; color: #92400e; border-color: #fcd34d; animation: pulse 2s infinite; }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .btn-master {
        background: var(--accent);
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    .btn-master:hover { filter: brightness(1.1); }
    .btn-master:disabled { background: #9ca3af; cursor: not-allowed; }
    .btn-master.divergent { background: #f43f5e; box-shadow: 0 0 15px rgba(244, 63, 94, 0.4); }
    .btn-master.stable { background: #10b981; }

    .hud-body { 
        display: grid; 
        grid-template-columns: 280px 1fr; 
        background: var(--border); 
        gap: 1px;
        transition: opacity 0.5s, filter 0.5s;
    }
    .hud-body.locked { opacity: 0.15; pointer-events: none; filter: grayscale(1) blur(2px); }
    
    .panel { background: #ffffff; padding: 20px; }
    .panel-title { 
        font-size: 11px; 
        color: #6b7280; 
        text-transform: uppercase; 
        letter-spacing: 1px; 
        font-weight: 600; 
        margin-bottom: 15px; 
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .panel-title::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--surface);
    }

    .main-stage { display: flex; flex-direction: column; gap: 1px; background: var(--border); }
    
    /* Config Panel */
    .config-panel { background: #fdfdfd; padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; align-items: center; }
    .input-group { display: flex; flex-direction: column; gap: 4px; }
    .btn-unlock { background: none; border: none; cursor: pointer; font-size: 10px; opacity: 0.5; padding: 0; transition: 0.2s; }
    .btn-unlock:hover { opacity: 1; transform: scale(1.1); }
    .btn-unlock.unlocked { opacity: 1; color: var(--accent); }

    .input-group label { font-size: 8px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; display: flex; justify-content: space-between; align-items: center; }
    .input-group input { padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 11px; background: transparent; transition: 0.3s; }
    .input-group input:disabled { background: #f9fafb; color: #9ca3af; border-style: dashed; }
</style>

<div class="hud-container">
    <header class="hud-header">
        <div class="core-identity">
            <span style="font-weight:700; font-size:11px; color:var(--text); letter-spacing: 0.05em; text-transform:uppercase;">Indra Satellite OS</span>
            <div class="status-group" style="margin-top:4px;">
                 <span class="badge" id="master-status">IDENTIFICANDO...</span>
                 <span class="badge badge-citizen" id="citizen-badge" style="display:none;"></span>
            </div>
        </div>
        <div id="master-action-zone">
            <button class="btn-master" id="btn-master-action">Conectar al Core</button>
        </div>
    </header>

    <div class="config-panel" id="config-panel">
        <div class="input-group" style="flex:1">
            <label>
                <span>Jurisdicción (Satélite)</span>
                <button class="btn-unlock" id="btn-unlock-config" title="Desbloquear configuración">🔒</button>
            </label>
            <input type="text" id="config-sat-name" placeholder="Ej: Veta de Oro">
        </div>
        <div class="input-group" style="flex:2">
            <label>Nexo de Resonancia (Core URL)</label>
            <input type="text" id="config-core-id" style="width:100%">
        </div>
    </div>

    <div class="hud-body locked" id="hud-body">
        <div class="panel">
            <h3 class="panel-title">Soberanía</h3>
            <indra-workspace-selector id="workspace-ctrl" style="margin-bottom:20px;"></indra-workspace-selector>
            <indra-keychain-widget id="keychain-ctrl" style="margin-bottom:20px;"></indra-keychain-widget>
            
            <h3 class="panel-title">Espina Dorsal</h3>
            <indra-schema-projector id="schema-projector"></indra-schema-projector>
        </div>

        <div class="main-stage">
            <section class="panel">
                <h3 class="panel-title">Universal Picker</h3>
                <indra-universal-picker id="universal-picker"></indra-universal-picker>
            </section>
            
            <section class="panel" style="flex-grow: 1;">
                <h3 class="panel-title">Workflows</h3>
                <indra-workflow-ribbon id="workflow-ribbon"></indra-workflow-ribbon>
            </section>
        </div>
    </div>
    <indra-param-modal id="param-portal"></indra-param-modal>
</div>
`;

class IndraBridgeHUD extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._bridge = null;
        this._mode = 'GHOST';
    }

    connectedCallback() {
        this.render();
        window.addEventListener('indra-resonance-sync', (e) => this.handleResonanceUpdate(e.detail));
        window.addEventListener('indra-ready', () => this.updateUI());
    }

    set bridge(instance) {
        this._bridge = instance;
        this._bridge.onStateChange = () => this.updateUI();
        this.shadowRoot.getElementById('keychain-ctrl').bridge = instance;
        this.shadowRoot.getElementById('workspace-ctrl').bridge = instance;
        this._configLocked = !!(this._bridge.contract?.satellite_name);
        this.updateUI();
    }

    handleResonanceUpdate(detail) {
        this._mode = detail.mode; // Sincronizar con el modo soberano
        this.updateUI();
    }

    updateUI() {
        if (!this.shadowRoot || !this._bridge) return;

        const body = this.shadowRoot.getElementById('hud-body');
        const status = this.shadowRoot.getElementById('master-status');
        const citizenBadge = this.shadowRoot.getElementById('citizen-badge');
        const actionBtn = this.shadowRoot.getElementById('btn-master-action');
        const satNameInput = this.shadowRoot.getElementById('config-sat-name');
        const coreUrlInput = this.shadowRoot.getElementById('config-core-id');
        const unlockBtn = this.shadowRoot.getElementById('btn-unlock-config');

        // Sincronizar inputs básicos (evitando sobrescribir si el usuario tiene el foco)
        const activeEl = this.shadowRoot.activeElement;
        
        if (satNameInput) {
            satNameInput.disabled = this._configLocked;
            if (activeEl !== satNameInput) {
                satNameInput.value = this._bridge.contract.satellite_name || '';
            }
        }
        if (coreUrlInput) {
            coreUrlInput.disabled = this._configLocked;
            coreUrlInput.value = this._bridge.coreUrl || '';
        }

        if (unlockBtn) {
            unlockBtn.innerHTML = this._configLocked ? '🔒' : '🔓';
            unlockBtn.classList.toggle('unlocked', !this._configLocked);
        }

        // --- MÁQUINA DE ESTADOS SECUENCIAL (Branched v3.3) ---
        switch (this._mode) {
            case 'GHOST':
                status.innerText = 'PASO 1: CONECTAR CORE';
                status.className = 'badge';
                actionBtn.innerText = '🔗 VINCULAR NODO';
                actionBtn.className = 'btn-master';
                actionBtn.disabled = false;
                actionBtn.onclick = () => this.handleIgnition();
                body.classList.add('locked');
                break;

            case 'REJECTED':
                status.innerText = 'ERROR: NODO RECHAZADO';
                status.className = 'badge badge-divergent';
                actionBtn.innerText = '🔄 REINTENTAR VÍNCULO';
                actionBtn.className = 'btn-master divergent';
                actionBtn.disabled = false; 
                actionBtn.onclick = () => this.handleIgnition();
                body.classList.add('locked');
                console.error("Fallo de Autorización:", this._bridge.lastError);
                break;

            case 'ORPHAN':
                status.innerText = 'PASO 2: ANCLAR CIUDADANÍA';
                status.className = 'badge badge-divergent';
                actionBtn.innerText = '👑 GÉNESIS DE SATÉLITE';
                actionBtn.className = 'btn-master divergent';
                actionBtn.disabled = false; // DESBLOQUEO FORZADO
                actionBtn.onclick = () => this.handleAnchorCitizenship();
                body.classList.add('locked');
                break;

            case 'DIVERGENT':
                status.innerText = 'ADVERTENCIA: ADN DIVERGENTE';
                status.className = 'badge badge-divergent';
                actionBtn.innerText = '🧬 SINCRONIZAR ADN';
                actionBtn.className = 'btn-master divergent';
                actionBtn.onclick = () => this.handleDNAsync();
                body.classList.add('locked');
                break;

            case 'STABLE':
                status.innerText = 'SISTEMA RESONANTE';
                status.className = 'badge badge-auth';
                actionBtn.innerText = '✅ ESTABLE';
                actionBtn.className = 'btn-master stable';
                actionBtn.onclick = null;
                body.classList.remove('locked');
                break;

            case 'BROKEN':
                status.innerText = 'ERROR: ADN ROTO';
                status.className = 'badge badge-divergent';
                actionBtn.innerText = '⚠️ EJECUTAR SYNC';
                actionBtn.onclick = () => window.location.reload();
                body.classList.add('locked');
                break;

            default:
                status.innerText = 'MODO LOCAL / OFFLINE';
                actionBtn.innerText = 'REINTENTAR';
                actionBtn.onclick = () => this._bridge.init();
                body.classList.remove('locked');
                break;
        }

        // Mostrar Badge de Ciudadano si existe
        if (this._bridge.activeWorkspaceId) {
            citizenBadge.style.display = 'inline-block';
            citizenBadge.innerText = `CIUDADANO: ${this._bridge.activeWorkspaceId.substring(0,8)}`;
        } else {
            citizenBadge.style.display = 'none';
        }

        // Proyectar datos a widgets solo si no está bloqueado
        if (!body.classList.contains('locked')) {
            const { contract } = this._bridge;
            console.groupCollapsed("🛂 [HUD:Aduana] Filtrando Esquemas de Negocio");
            const filteredSchemas = contract ? (contract.schemas || []).filter(s => {
                if (s.class === 'CONFIG_SCHEMA' || s.class === 'SYSTEM_SCHEMA') {
                    console.log(`🚫 [Aduana] Esquema [${s.id}] bloqueado por regla: CLASE_SISTEMA`);
                    return false;
                }
                const isSystemId = s.id?.startsWith('INDRA_') || s.handle?.alias?.startsWith('config_') || s.id === 'notion' || s.id === 'intelligence';
                if (isSystemId) {
                    console.log(`🚫 [Aduana] Esquema [${s.id}] bloqueado por regla: ID_RESERVADO_SHELL`);
                    return false;
                }
                console.log(`✅ [Aduana] Esquema [${s.id}] permitido para proyección.`);
                return true;
            }) : null;
            console.groupEnd();

            this.shadowRoot.getElementById('schema-projector').schemas = filteredSchemas;
            this.shadowRoot.getElementById('universal-picker').providers = contract?.capabilities?.providers || null;
            this.shadowRoot.getElementById('workflow-ribbon').workflows = contract?.workflows || null;
        }
    }

    async handleIgnition() {
        const btn = this.shadowRoot.getElementById('btn-master-action');
        btn.disabled = true;
        btn.innerText = "VINCULANDO...";
        try {
            await this._bridge.ignite();
        } catch (e) {
            btn.disabled = false;
            this.updateUI();
        }
    }

    async handleAnchorCitizenship() {
        const btn = this.shadowRoot.getElementById('btn-master-action');
        btn.disabled = true;
        btn.innerText = "GÉNESIS...";
        try {
            await this._bridge.anchorCitizenship();
        } catch (e) {
            alert("Fallo el génesis: " + e.message);
            btn.disabled = false;
            this.updateUI();
        }
    }

    async handleDNAsync() {
        const btn = this.shadowRoot.getElementById('btn-master-action');
        btn.disabled = true;
        btn.innerText = "TEJIENDO...";
        try {
            await this._bridge.syncDNA();
        } catch (e) {
            alert("Error de sincronía: " + e.message);
            btn.disabled = false;
            this.updateUI();
        }
    }

    render() {
        this.shadowRoot.innerHTML = TEMPLATE;
        
        // Listener para Desbloqueo de Intención
        const unlockBtn = this.shadowRoot.getElementById('btn-unlock-config');
        if (unlockBtn) {
            unlockBtn.onclick = () => {
                this._configLocked = !this._configLocked;
                this.updateUI();
            };
        }

        // Listeners para cambios de identidad
        const satNameInput = this.shadowRoot.getElementById('config-sat-name');
        if (satNameInput) {
            satNameInput.onchange = () => {
                if (this._bridge && this._bridge.contract) {
                    this._bridge.contract.satellite_name = satNameInput.value;
                }
            };
        }

        const coreUrlInput = this.shadowRoot.getElementById('config-core-id');
        if (coreUrlInput) {
            coreUrlInput.onchange = () => {
                if (this._bridge) {
                    this._bridge.coreUrl = coreUrlInput.value;
                }
            };
        }
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
