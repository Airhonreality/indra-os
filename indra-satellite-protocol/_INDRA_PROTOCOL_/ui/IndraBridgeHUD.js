/**
 * =============================================================================
 * INDRA BRIDGE HUD (Standard UI v3.6 - SINCERITY EDITION)
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
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        --indra-accent: #007AFF;
        --indra-success: #34C759;
        --indra-warning: #FF9500;
        --indra-danger: #FF3B30;
        --indra-bg: rgba(255, 255, 255, 0.8);
        --indra-surface: rgba(242, 242, 247, 0.6);
        --indra-glass: blur(16px) saturate(180%);
        --indra-border: rgba(60, 60, 67, 0.12);
        --indra-text-main: #1C1C1E;
        --indra-text-dim: #8E8E93;
    }

    .hud-container {
        display: flex;
        flex-direction: column;
        background: var(--indra-bg);
        backdrop-filter: var(--indra-glass);
        -webkit-backdrop-filter: var(--indra-glass);
        border: 1px solid var(--indra-border);
        border-radius: 20px;
        overflow: hidden;
        color: var(--indra-text-main);
        margin: 20px auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.08);
        animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .main-grid {
        display: flex;
        flex: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
        gap: 1px;
        background: rgba(60, 60, 67, 0.1);
    }

    .col {
        display: flex;
        flex-direction: column;
        background: var(--indra-bg);
        overflow-y: auto;
    }
    
    .col-identity { flex: 0 0 25%; min-width: 200px; }
    .col-dna      { flex: 0 0 45%; border-left: 1px solid var(--indra-border); border-right: 1px solid var(--indra-border); }
    .col-actions  { flex: 0 0 30%; min-width: 250px; }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .resonance-header {
        background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
        padding: 30px;
        border-bottom: 1px solid var(--indra-border);
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 30px;
        align-items: flex-start;
    }

    .identity-box h4 { 
        margin: 0; 
        font-size: 10px; 
        font-weight: 800;
        text-transform: uppercase; 
        letter-spacing: 0.12em; 
        color: var(--indra-accent);
        margin-bottom: 8px;
    }
    .identity-box .name { 
        font-size: 28px; 
        font-weight: 900; 
        margin: 0; 
        letter-spacing: -0.02em;
        background: linear-gradient(90deg, var(--indra-text-main) 0%, #444 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .identity-box .core-url { 
        font-family: 'JetBrains Mono', monospace; 
        font-size: 11px; 
        color: var(--indra-text-dim); 
        margin-top: 6px;
    }

    .handshake-monitor {
        margin-top: 20px;
        background: rgba(0,0,0,0.03);
        border-radius: 12px;
        padding: 12px 16px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        max-height: 80px;
        overflow-y: auto;
        border: 1px solid rgba(0,0,0,0.05);
    }
    .handshake-step { margin-bottom: 4px; display: flex; gap: 8px; align-items: center; }
    .handshake-step span { color: var(--indra-accent); font-weight: 700; }

    .status-area { display: flex; flex-direction: column; align-items: flex-end; gap: 16px; }

    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 18px;
        border-radius: 99px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: var(--indra-surface);
    }
    .status-badge::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
    
    .status--ghost { color: var(--indra-text-dim); }
    .status--orphan { color: var(--indra-warning); }
    .status--stable { color: var(--indra-success); }
    .status--error { color: var(--indra-danger); }

    .btn-indra {
        background: var(--indra-accent);
        color: white;
        border: none;
        padding: 14px 32px;
        border-radius: 14px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        box-shadow: 0 8px 24px rgba(0, 122, 255, 0.25);
    }
    .btn-indra:hover { transform: translateY(-3px); }
    .btn-indra.stable { background: var(--indra-success); }

    .config-card {
        background: var(--indra-surface);
        padding: 24px 30px;
        border-bottom: 1px solid var(--indra-border);
        display: none;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
    }
    .config-card.active { display: grid; }

    .panel-header {
        padding: 20px 30px;
        border-bottom: 1px solid var(--indra-border);
        font-size: 10px;
        font-weight: 800;
        color: var(--indra-text-dim);
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .panel-content { padding: 0 30px 30px 30px; }
    
    .hud-container.locked { opacity: 0.3; filter: grayscale(1); pointer-events: none; }
    .hud-container.locked .col-adn { opacity: 1; filter: none; pointer-events: auto; }
    
    .cap-tag {
        font-size: 9px;
        padding: 4px 10px;
        background: rgba(0, 122, 255, 0.1);
        color: var(--indra-accent);
        border-radius: 7px;
        font-weight: 700;
        text-transform: uppercase;
        margin-right: 4px;
    }
</style>

<div class="hud-container">
    <header class="resonance-header">
        <div class="identity-box">
            <h4>Perfil del Satélite</h4>
            <div class="name" id="display-sat-name">--</div>
            <div class="core-url" id="display-core-url">Desconectado del Core</div>
            
            <div style="margin-top:12px;" id="capabilities-manifest-header"></div>

            <div class="handshake-monitor" id="handshake-log">
                <div class="handshake-step"><span>[INFO]</span> Sistema cargado. Esperando conexión.</div>
            </div>
        </div>
        
        <div class="status-area">
            <div id="master-status" class="status-badge status--ghost">Sin Conexión</div>
            <div style="display:flex; gap:8px;">
                <button class="btn-indra" id="btn-save-session" style="opacity:0.3; pointer-events:none; background:var(--indra-text-dim); box-shadow:none;">Guardar Sesión</button>
                <button class="btn-indra" id="btn-master-action">CONECTAR AL CORE</button>
            </div>
        </div>
    </header>

    <div class="toolbar-indra" style="padding: 10px 30px; border-bottom: 1px solid var(--indra-border); display:flex; justify-content:space-between; align-items:center;">
        <div id="sync-warning" style="font-size:9px; color:var(--indra-warning); font-weight:800; opacity:0; transition:opacity 0.3s;">⚠️ CAMBIOS SIN GUARDAR EN EL ADN</div>
        <button id="btn-toggle-settings" style="background: none; border: none; font-size: 16px; cursor: pointer; opacity: 0.5;">⚙️ Configuración</button>
    </div>

    <section class="config-card" id="settings-panel">
        <div class="form-group">
            <label>ALIAS DEL NODO</label>
            <input type="text" id="config-sat-name" placeholder="Nombre local...">
        </div>
        <div class="form-group">
            <label>ID DEL CORE</label>
            <input type="text" id="config-core-id" placeholder="ID de propietario...">
        </div>
    </section>

    <main class="hud-body-wrapper locked" id="hud-body">
        <div class="main-grid">
            <aside class="col col-identity">
                <header class="panel-header">IDENTIDAD: <span id="sat-name" style="color:var(--indra-accent);">---</span></header>
                <div class="panel-content">
                    <indra-workspace-selector id="workspace-ctrl" style="margin-bottom:40px;"></indra-workspace-selector>
                    <indra-keychain-widget id="keychain-ctrl"></indra-keychain-widget>
                </div>
                <div style="padding: 20px; font-size: 8px; font-family: monospace; opacity: 0.5; border-top: 1px solid var(--indra-border);">
                    CORE: <span id="core-url">---</span><br>
                    RESONANCIA: <span id="resonance-status">INIT</span>
                    <div id="capabilities-manifest" style="display:flex; gap:4px; flex-wrap:wrap; margin-top:10px;"></div>
                </div>
            </aside>

            <section class="col col-dna">
                <header class="panel-header">ADN Local (Leyes de Datos)</header>
                <indra-schema-projector id="schema-projector"></indra-schema-projector>
            </section>

            <aside class="col col-actions">
                <header class="panel-header">Universo y Acciones</header>
                <div class="panel-content" style="padding: 20px;">
                    <indra-universal-picker id="universal-picker" style="margin-bottom:30px;"></indra-universal-picker>
                    <indra-workflow-ribbon id="workflow-ribbon"></indra-workflow-ribbon>
                </div>
            </aside>
        </div>
    </main>
</div>
`;

class IndraBridgeHUD extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._bridge = null;
        this._mode = 'GHOST';
        this._initialIgnitions = null;
        this._hasChanges = false;
    }

    connectedCallback() {
        this.render();
        window.addEventListener('indra-resonance-sync', (e) => this.handleResonanceUpdate(e.detail));
        window.addEventListener('indra-handshake-step', (e) => this.logHandshake(e.detail));
        window.addEventListener('indra-ready', () => this.updateUI());
    }

    set bridge(instance) {
        this._bridge = instance;
        this._bridge.onStateChange = () => this.updateUI();
        
        if (instance.contract && instance.contract.schemas) {
            this.shadowRoot.getElementById('schema-projector').schemas = instance.contract.schemas;
        }

        // Snapshot inicial para detección de cambios
        this._initialIgnitions = JSON.stringify(instance.ignitions || {});
        
        this.updateUI();
    }

    logHandshake(detail) {
        const log = this.shadowRoot.getElementById('handshake-log');
        if (!log) return;
        
        let msg = detail.message;
        const step = document.createElement('div');
        step.className = 'handshake-step';
        step.innerHTML = `<span>[${detail.step}]</span> ${msg}`;
        log.appendChild(step);
        log.scrollTop = log.scrollHeight;
    }

    handleResonanceUpdate(detail) {
        if (this._mode === detail.mode) return;
        this._mode = detail.mode; 
        this.updateUI();
    }

    updateUI() {
        if (!this.shadowRoot || !this._bridge) return;

        const statusLabel = this.shadowRoot.getElementById('resonance-status');
        const masterStatus = this.shadowRoot.getElementById('master-status');
        const satNameDisplay = this.shadowRoot.getElementById('sat-name');
        const dispSatName = this.shadowRoot.getElementById('display-sat-name');
        const coreUrlDisplay = this.shadowRoot.getElementById('core-url');
        const dispCoreUrl = this.shadowRoot.getElementById('display-core-url');
        const body = this.shadowRoot.getElementById('hud-body');
        const actionBtn = this.shadowRoot.getElementById('btn-master-action');
        const saveBtn = this.shadowRoot.getElementById('btn-save-session');
        const syncWarning = this.shadowRoot.getElementById('sync-warning');
        const capManifest = this.shadowRoot.getElementById('capabilities-manifest');

        // Detección de Cambios
        const currentIgnitions = JSON.stringify(this._bridge.ignitions || {});
        this._hasChanges = this._initialIgnitions !== null && this._initialIgnitions !== currentIgnitions;

        if (saveBtn) {
            if (this._hasChanges) {
                saveBtn.style.opacity = "1";
                saveBtn.style.pointerEvents = "auto";
                saveBtn.style.background = "var(--indra-accent)";
                saveBtn.style.boxShadow = "0 8px 24px rgba(0, 122, 255, 0.4)";
                if (syncWarning) syncWarning.style.opacity = "1";
            } else {
                saveBtn.style.opacity = "0.3";
                saveBtn.style.pointerEvents = "none";
                saveBtn.style.background = "var(--indra-text-dim)";
                saveBtn.style.boxShadow = "none";
                if (syncWarning) syncWarning.style.opacity = "0";
            }
        }

        if (satNameDisplay) satNameDisplay.innerText = this._bridge.contract?.satellite_name || 'Desconocido';
        if (dispSatName) dispSatName.innerText = this._bridge.contract?.satellite_name || '--';
        if (coreUrlDisplay) coreUrlDisplay.innerText = this._bridge.coreUrl || 'Sin conexión';
        if (dispCoreUrl) dispCoreUrl.innerText = this._bridge.coreUrl || 'Desconectado';

        const projector = this.shadowRoot.getElementById('schema-projector');
        if (projector && this._bridge.contract?.schemas) {
            projector.schemas = this._bridge.contract.schemas;
            projector.bridge = this._bridge;
        }

        switch (this._mode) {
            case 'GHOST':
                if (masterStatus) { masterStatus.innerText = 'Desconectado'; masterStatus.className = 'status-badge status--ghost'; }
                if (actionBtn) actionBtn.innerText = 'CONECTAR AL CORE';
                if (body) body.classList.add('locked');
                break;
            case 'DISCOVERY':
                if (masterStatus) { masterStatus.innerText = 'Buscando...'; masterStatus.className = 'status-badge status--orphan'; }
                if (actionBtn) actionBtn.innerText = 'ELEGIR WORKSPACE';
                if (body) body.classList.remove('locked');
                break;
            case 'STABLE':
                if (masterStatus) { masterStatus.innerText = 'Conectado'; masterStatus.className = 'status-badge status--stable'; }
                if (actionBtn) actionBtn.innerText = 'SESIÓN ACTIVA';
                if (body) body.classList.remove('locked');
                break;
        }
    }

    render() {
        this.shadowRoot.innerHTML = TEMPLATE;
        
        this.shadowRoot.getElementById('btn-toggle-settings').onclick = () => {
            this.shadowRoot.getElementById('settings-panel').classList.toggle('active');
        };

        this.shadowRoot.getElementById('btn-master-action').onclick = () => {
            if (this._mode === 'GHOST') this.handleMasterAction ? this.handleMasterAction() : console.log("Master Action Triggered");
            else this.updateUI();
        };

        this.shadowRoot.getElementById('btn-save-session').onclick = () => this.handleSaveSession();

        this.shadowRoot.getElementById('config-sat-name').oninput = (e) => {
            if (this._bridge) this._bridge.contract.satellite_name = e.target.value;
            this.updateUI();
        };
        
        // Link widgets
        const keychain = this.shadowRoot.getElementById('keychain-ctrl');
        const workspace = this.shadowRoot.getElementById('workspace-ctrl');
        if (this._bridge) {
            keychain.bridge = this._bridge;
            workspace.bridge = this._bridge;
        }
    }

    handleSaveSession() {
        if (!this._hasChanges) return;

        const contract = {
            satellite_name: this._bridge.contract.satellite_name,
            core_id: this._bridge.contract.core_id,
            ignitions: this._bridge.ignitions,
            synced_at: new Date().toISOString()
        };

        const fileContent = `/**
 * =============================================================================
 * INDRA CONTRACT SNAPSHOT (Crystalized DNA)
 * =============================================================================
 */
export const INDRA_CONTRACT = ${JSON.stringify(contract, null, 4)};
`;

        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'indra_contract.js';
        a.click();
        URL.revokeObjectURL(url);

        this._initialIgnitions = JSON.stringify(this._bridge.ignitions);
        this.updateUI();
        console.log("💎 [Sincerity] Sesión cristalizada.");
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
