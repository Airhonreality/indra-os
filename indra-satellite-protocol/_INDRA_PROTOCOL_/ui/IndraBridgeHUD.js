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

        color: #8E8E93;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .panel-content { padding: 0 30px 30px 30px; }
    
    .hud-container.locked { opacity: 0.3; filter: grayscale(1); pointer-events: none; }
    .hud-container.locked .col-adn { opacity: 1; filter: none; pointer-events: auto; } /* Sinceridad: DNA siempre visible */
    
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

    <main class="hud-container locked" id="hud-body">
        <div class="main-grid">
            <!-- COLUMNA 1: IDENTIDAD -->
            <aside class="col col-identity">
                <header class="panel-header">Ciudadanía e Identidad</header>
                <div class="panel-content">
                    <indra-workspace-selector id="workspace-ctrl" style="margin-bottom:40px;"></indra-workspace-selector>
                    <indra-keychain-widget id="keychain-ctrl"></indra-keychain-widget>
                </div>
            </aside>

            <!-- COLUMNA 2: TERRITORIO (Los Esquemas) -->
            <section class="col col-adn">
                <header class="panel-header">ADN Local (Leyes de Datos)</header>
                <div class="panel-content">
                    <indra-schema-projector id="schema-projector"></indra-schema-projector>
                </div>
            </section>

            <!-- COLUMNA 3: ACCIONES -->
            <aside class="col col-actions">
                <header class="panel-header">Manifiesto del Universo</header>
                <div class="panel-content">
                    <indra-universal-picker id="universal-picker" style="margin-bottom:30px;"></indra-universal-picker>
                </div>

                <header class="panel-header">Secuencias de Trabajo</header>
                <div class="panel-content" style="flex: 1; display: flex; flex-direction: column;">
                    <indra-workflow-ribbon id="workflow-ribbon" style="flex: 1;"></indra-workflow-ribbon>
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

        const status = this.shadowRoot.getElementById('resonance-status');
        const satNameDisplay = this.shadowRoot.getElementById('sat-name');
        const coreUrlDisplay = this.shadowRoot.getElementById('core-url');
        const container = this.shadowRoot.getElementById('hud-body');

        // Hidratación de Componentes
        const picker = this.shadowRoot.getElementById('universal-picker');
        const ribbon = this.shadowRoot.getElementById('workflow-ribbon');
        const projector = this.shadowRoot.getElementById('schema-projector');

        satNameDisplay.innerText = this._bridge.contract?.satellite_name || 'Satélite Desconocido';
        coreUrlDisplay.innerText = this._bridge.coreUrl || 'Sin conexión activa';

        // Sincronía Continua de Datos
        if (this._bridge.contract && this._bridge.contract.schemas) {
            projector.schemas = this._bridge.contract.schemas;
        }

        // Población de Universo (Picker y Ribbon)
        if (this._bridge.capabilities) {
            if (picker) picker.providers = this._bridge.capabilities.providers || [];
            if (ribbon) ribbon.workflows = this._bridge.contract?.workflows || [];
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
            if (this._mode === 'GHOST') this.handleMasterAction();
            else if (this._mode === 'DISCOVERY') {
                const selector = this.shadowRoot.getElementById('workspace-ctrl');
                if (selector && selector.shadowRoot.getElementById('ws-select')) {
                    selector.shadowRoot.getElementById('ws-select').focus();
                }
            } else {
                this.handleMasterAction();
            }
        };

        this.shadowRoot.getElementById('config-sat-name').oninput = (e) => {
            if (this._bridge) this._bridge.contract.satellite_name = e.target.value;
            this.shadowRoot.getElementById('display-sat-name').innerText = e.target.value;
        };
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
