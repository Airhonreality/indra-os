/**
 * =============================================================================
 * INDRA BRIDGE HUD (Standard UI v3.5)
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

    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 9px; font-weight: 800; color: var(--indra-text-dim); text-transform: uppercase; }
    .form-group input { 
        padding: 12px 16px; 
        border: 1px solid var(--indra-border); 
        border-radius: 10px; 
        font-size: 13px; 
    }

    .hud-body { display: grid; grid-template-columns: 350px 1fr; background: var(--indra-border); gap: 1px; }
    .hud-body.locked { opacity: 0.15; filter: grayscale(1); pointer-events: none; }
    .hud-body.locked aside { opacity: 1; filter: none; pointer-events: auto; } /* Excepción de Soberanía: Los esquemas siempre se ven */
    
    .panel-indra { background: rgba(255,255,255,0.8); padding: 30px; }
    .panel-title { 
        font-size: 11px; 
        color: var(--indra-text-dim); 
        text-transform: uppercase; 
        letter-spacing: 0.1em; 
        font-weight: 800; 
        margin-bottom: 24px; 
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .panel-title::after { content: ''; flex: 1; height: 1px; background: var(--indra-border); }

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
            
            <div style="margin-top:12px;" id="capabilities-manifest"></div>

            <div class="handshake-monitor" id="handshake-log">
                <div class="handshake-step"><span>[INFO]</span> Sistema cargado. Esperando conexión.</div>
            </div>
        </div>
        
        <div class="status-area">
            <div id="master-status" class="status-badge status--ghost">Sin Conexión</div>
            <button class="btn-indra" id="btn-master-action">CONECTAR AL CORE</button>
        </div>
    </header>

    <div class="toolbar-indra" style="padding: 10px 30px; border-bottom: 1px solid var(--indra-border); display:flex; justify-content:flex-end;">
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

    <main class="hud-body locked" id="hud-body">
        <aside class="panel-indra">
            <h3 class="panel-title">Espacio de Trabajo</h3>
            <indra-workspace-selector id="workspace-ctrl" style="margin-bottom:30px;"></indra-workspace-selector>
            
            <h3 class="panel-title">Seguridad (Keychain)</h3>
            <indra-keychain-widget id="keychain-ctrl"></indra-keychain-widget>
            
            <h3 class="panel-title" style="margin-top:40px;">Esquemas de Datos</h3>
            <indra-schema-projector id="schema-projector"></indra-schema-projector>
        </aside>

        <section style="display: flex; flex-direction: column; gap: 1px; background: var(--indra-border);">
            <div class="panel-indra">
                <h3 class="panel-title">Buscador de Átomos</h3>
                <indra-universal-picker id="universal-picker"></indra-universal-picker>
            </div>
            
            <div class="panel-indra" style="flex-grow: 1;">
                <h3 class="panel-title">Flujos de Trabajo Activos</h3>
                <indra-workflow-ribbon id="workflow-ribbon"></indra-workflow-ribbon>
            </div>
        </section>
    </main>
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
        window.addEventListener('indra-handshake-step', (e) => this.logHandshake(e.detail));
        window.addEventListener('indra-ready', () => this.updateUI());
    }

    set bridge(instance) {
        this._bridge = instance;
        this._bridge.onStateChange = () => this.updateUI();
        
        // Hidratación inmediata (Soberanía Local)
        this.shadowRoot.getElementById('keychain-ctrl').bridge = instance;
        this.shadowRoot.getElementById('workspace-ctrl').bridge = instance;
        this.shadowRoot.getElementById('schema-projector').bridge = instance;
        
        if (instance.contract && instance.contract.schemas) {
            this.shadowRoot.getElementById('schema-projector').schemas = instance.contract.schemas;
        }

        this.updateUI();
    }

    logHandshake(detail) {
        const log = this.shadowRoot.getElementById('handshake-log');
        if (!log) return;
        
        let msg = detail.message;
        // Traducción de logs comunes
        if (msg.includes('Cargando ADN')) msg = "Leyendo contrato local...";
        if (msg.includes('Solicitando Manifiesto')) msg = "Obteniendo datos del Core...";
        if (msg.includes('Explorando Territorio')) msg = "Buscando Workspaces en Drive...";
        if (msg.includes('Modo Descubrimiento')) msg = "Listo. Selecciona un Workspace.";
        if (msg.includes('Resonancia Estable')) msg = "Conexión exitosa.";

        const step = document.createElement('div');
        step.className = 'handshake-step';
        step.innerHTML = `<span>[${detail.step}]</span> ${msg}`;
        log.appendChild(step);
        log.scrollTop = log.scrollHeight;
    }

    handleResonanceUpdate(detail) {
        this._mode = detail.mode; 
        this.updateUI();
    }

    updateUI() {
        if (!this.shadowRoot || !this._bridge) return;

        const body = this.shadowRoot.getElementById('hud-body');
        const status = this.shadowRoot.getElementById('master-status');
        const actionBtn = this.shadowRoot.getElementById('btn-master-action');
        const satNameDisplay = this.shadowRoot.getElementById('display-sat-name');
        const coreUrlDisplay = this.shadowRoot.getElementById('display-core-url');
        const capManifest = this.shadowRoot.getElementById('capabilities-manifest');

        satNameDisplay.innerText = this._bridge.contract?.satellite_name || 'Satélite Desconocido';
        coreUrlDisplay.innerText = this._bridge.coreUrl || 'Sin conexión activa';

        // Actualizar esquemas (Sincronía Continua)
        if (this._bridge.contract && this._bridge.contract.schemas) {
            const projector = this.shadowRoot.getElementById('schema-projector');
            if (projector) projector.schemas = this._bridge.contract.schemas;
        }

        switch (this._mode) {
            case 'GHOST':
                status.innerText = 'Desconectado';
                status.className = 'status-badge status--ghost';
                actionBtn.innerText = 'CONECTAR AL CORE';
                actionBtn.className = 'btn-indra';
                body.classList.add('locked');
                break;

            case 'DISCOVERY':
                status.innerText = 'Buscando...';
                status.className = 'status-badge status--orphan';
                actionBtn.innerText = 'ELEGIR WORKSPACE';
                actionBtn.className = 'btn-indra';
                body.classList.remove('locked');
                break;

            case 'STABLE':
                status.innerText = 'Conectado';
                status.className = 'status-badge status--stable';
                actionBtn.innerText = 'SESIÓN ACTIVA';
                actionBtn.className = 'btn-indra stable';
                body.classList.remove('locked');
                break;
            
            case 'ERROR_LEDGER':
                status.innerText = 'Error de Enlace';
                status.className = 'status-badge status--error';
                actionBtn.innerText = 'REINTENTAR';
                actionBtn.className = 'btn-indra';
                body.classList.add('locked');
                break;
        }

        if (capManifest) {
            const caps = this._bridge.capabilities?.protocols || [];
            capManifest.innerHTML = caps.slice(0, 6).map(c => `<span class="cap-tag">${c.replace('SYSTEM_', '')}</span>`).join('');
        }
    }

    render() {
        this.shadowRoot.innerHTML = TEMPLATE;
        
        this.shadowRoot.getElementById('btn-toggle-settings').onclick = () => {
            this.shadowRoot.getElementById('settings-panel').classList.toggle('active');
        };

        this.shadowRoot.getElementById('btn-master-action').onclick = () => {
            if (this._mode === 'GHOST') this._bridge.init();
            else if (this._mode === 'DISCOVERY') {
                const selector = this.shadowRoot.getElementById('workspace-ctrl');
                if (selector && selector.shadowRoot.getElementById('ws-select')) {
                    selector.shadowRoot.getElementById('ws-select').focus();
                }
            }
        };

        this.shadowRoot.getElementById('config-sat-name').oninput = (e) => {
            if (this._bridge) this._bridge.contract.satellite_name = e.target.value;
            this.shadowRoot.getElementById('display-sat-name').innerText = e.target.value;
        };
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
