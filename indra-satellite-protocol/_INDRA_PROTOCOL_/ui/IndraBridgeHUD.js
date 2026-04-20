/**
 * =============================================================================
 * INDRA BRIDGE HUD (Standard UI v4.0 - AXIOMATIC EDITION)
 * =============================================================================
 */

import './widgets/IndraSchemaProjector.js';
import './widgets/IndraUniversalPicker.js';
import './widgets/IndraWorkflowRibbon.js';
import './widgets/IndraParamModal.js';
import './widgets/IndraKeychainWidget.js';
import './widgets/IndraWorkspaceSelector.js';

import { IndraCrystallizer } from '../core/bridge_modules/IndraCrystallizer.js';

const TEMPLATE = `
<link rel="stylesheet" href="/_INDRA_PROTOCOL_/ui/styles/IndraBridgeHUD.css">

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
                <button class="btn-indra" id="btn-save-session" title="Cristalizar ADN">Guardar Sesión</button>
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
        
        // Hidratación Axiomática: Despertando widgets
        this._wakeWidgets(instance);

        this._initialIgnitions = JSON.stringify(instance.ignitions || {});
        this.updateUI();
    }

    _wakeWidgets(bridge) {
        const widgets = ['keychain-ctrl', 'workspace-ctrl', 'schema-projector', 'universal-picker', 'workflow-ribbon'];
        widgets.forEach(id => {
            const el = this.shadowRoot.getElementById(id);
            if (el) el.bridge = bridge;
        });
    }

    logHandshake(detail) {
        const log = this.shadowRoot.getElementById('handshake-log');
        if (!log) return;
        const step = document.createElement('div');
        step.className = 'handshake-step';
        step.innerHTML = `<span>[${detail.step}]</span> ${detail.message}`;
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

        // Detección de Cambios
        const currentIgnitions = JSON.stringify(this._bridge.ignitions || {});
        this._hasChanges = this._initialIgnitions !== null && this._initialIgnitions !== currentIgnitions;

        // 1. Estados Visuales (Cero Hardcode)
        this._updateSaveButton();
        this._updateIdentityLabels();
        this._updateProtocolTags();
        this._updateMasterStatus();
    }

    _updateSaveButton() {
        const saveBtn = this.shadowRoot.getElementById('btn-save-session');
        const syncWarning = this.shadowRoot.getElementById('sync-warning');
        if (!saveBtn) return;

        if (this._hasChanges) {
            saveBtn.classList.add('luminous'); // Definido en CSS externo
            saveBtn.style.opacity = "1";
            saveBtn.style.pointerEvents = "auto";
            saveBtn.style.background = "var(--indra-accent)";
            if (syncWarning) syncWarning.style.opacity = "1";
        } else {
            saveBtn.classList.remove('luminous');
            saveBtn.style.opacity = "0.3";
            saveBtn.style.pointerEvents = "none";
            saveBtn.style.background = "var(--indra-text-dim)";
            if (syncWarning) syncWarning.style.opacity = "0";
        }
    }

    _updateIdentityLabels() {
        const name = this._bridge.contract?.satellite_name || '--';
        const url = this._bridge.coreUrl || 'Desconectado';
        
        ['display-sat-name', 'sat-name'].forEach(id => {
            const el = this.shadowRoot.getElementById(id);
            if (el) el.innerText = name;
        });

        ['display-core-url', 'core-url'].forEach(id => {
            const el = this.shadowRoot.getElementById(id);
            if (el) el.innerText = url;
        });
    }

    _updateProtocolTags() {
        const caps = this._bridge.capabilities?.protocols || [];
        const tags = caps.map(c => `<span class="cap-tag">${c.replace('SYSTEM_', '').replace('ATOM_', '')}</span>`).join('');
        
        ['capabilities-manifest', 'capabilities-manifest-header'].forEach(id => {
            const el = this.shadowRoot.getElementById(id);
            if (el) el.innerHTML = tags;
        });
    }

    _updateMasterStatus() {
        const masterStatus = this.shadowRoot.getElementById('master-status');
        const actionBtn = this.shadowRoot.getElementById('btn-master-action');
        const body = this.shadowRoot.getElementById('hud-body');

        const states = {
            'GHOST': { text: 'Desconectado', class: 'status--ghost', action: 'CONECTAR AL CORE', locked: true },
            'DISCOVERY': { text: 'Buscando...', class: 'status--orphan', action: 'ELEGIR WORKSPACE', locked: false },
            'STABLE': { text: 'Conectado', class: 'status--stable', action: 'SESIÓN ACTIVA', locked: false }
        };

        const current = states[this._mode] || states['GHOST'];
        
        if (masterStatus) {
            masterStatus.innerText = current.text;
            masterStatus.className = `status-badge ${current.class}`;
        }
        if (actionBtn) actionBtn.innerText = current.action;
        if (body) current.locked ? body.classList.add('locked') : body.classList.remove('locked');
    }

    render() {
        this.shadowRoot.innerHTML = TEMPLATE;
        
        this.shadowRoot.getElementById('btn-toggle-settings').onclick = () => {
            this.shadowRoot.getElementById('settings-panel').classList.toggle('active');
        };

        this.shadowRoot.getElementById('btn-master-action').onclick = () => {
            if (this._mode === 'GHOST') this.dispatchEvent(new CustomEvent('indra-master-action'));
            else this.updateUI();
        };

        this.shadowRoot.getElementById('btn-save-session').onclick = async () => {
            const result = await IndraCrystallizer.saveSession(this._bridge);
            if (result.status === 'OK') {
                this._initialIgnitions = JSON.stringify(this._bridge.ignitions);
                this.updateUI();
            }
        };

        this.shadowRoot.getElementById('config-sat-name').oninput = (e) => {
            if (this._bridge) this._bridge.contract.satellite_name = e.target.value;
            this.updateUI();
        };
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
