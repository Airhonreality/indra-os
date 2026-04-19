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
        --surface: #f8fafc;
        --text-main: #1e293b;
        --text-dim: #64748b;
        --border: #e2e8f0;
        --success: #10b981;
        --warning: #f59e0b;
        --danger: #ef4444;
    }

    .hud-container {
        display: flex;
        flex-direction: column;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        color: var(--text-main);
        margin: 20px auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    /* RESONANCE CARD (Soberanía Visible) */
    .resonance-card {
        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
        padding: 24px;
        border-bottom: 1px solid var(--border);
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 24px;
        align-items: center;
    }

    .identity-box h4 { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim); }
    .identity-box .name { font-size: 18px; font-weight: 700; margin: 4px 0; color: var(--accent); }
    .identity-box .core-url { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }

    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        border-radius: 99px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .status-badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    
    .status--ghost { background: #f1f5f9; color: var(--text-dim); }
    .status--orphan { background: #fff7ed; color: var(--warning); animation: pulse 2s infinite; }
    .status--stable { background: #ecfdf5; color: var(--success); }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    .capabilities-list {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
    }
    .cap-tag {
        font-size: 9px;
        padding: 2px 8px;
        background: rgba(37, 99, 235, 0.05);
        border: 1px solid rgba(37, 99, 235, 0.1);
        color: var(--accent);
        border-radius: 4px;
        font-weight: 500;
    }

    .btn-master {
        background: var(--accent);
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s, filter 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
    .btn-master:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-master:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-master.stable { background: var(--success); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }

    /* Panel de Ajustes (Standard Settings) */
    .settings-panel { 
        background: #f8fafc; 
        padding: 20px 24px; 
        border-bottom: 1px solid var(--border); 
        display: none; 
        gap: 20px; 
        animation: slideDown 0.3s ease-out;
    }
    .settings-panel.active { display: flex; flex-direction: column; }
    
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; }
    .form-group input { padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; font-family: 'JetBrains Mono', monospace; }

    .hud-body { 
        display: grid; 
        grid-template-columns: 320px 1fr; 
        background: var(--border); 
        gap: 1px;
        transition: opacity 0.5s, filter 0.5s;
    }
    .hud-body.locked { opacity: 0.15; pointer-events: none; filter: grayscale(1) blur(4px); }
    
    .panel { background: #ffffff; padding: 24px; }
    .panel-title { 
        font-size: 11px; 
        color: var(--text-dim); 
        text-transform: uppercase; 
        letter-spacing: 1px; 
        font-weight: 700; 
        margin-bottom: 20px; 
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .panel-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

    .main-stage { display: flex; flex-direction: column; gap: 1px; background: var(--border); }
    
    /* Toolbar Refinado */
    .toolbar { background: #fff; padding: 12px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .toolbar-tools { display: flex; gap: 16px; align-items: center; }
    
    .config-trigger { background: none; border: none; font-size: 14px; cursor: pointer; opacity: 0.5; transition: 0.2s; }
    .config-trigger:hover { opacity: 1; transform: rotate(45deg); }
</style>

<div class="hud-container">
    <!-- Card de Conexión Soberana -->
    <div class="resonance-card">
        <div class="identity-box">
            <h4>IDENTIDAD DEL SATÉLITE</h4>
            <div class="name" id="display-sat-name">--</div>
            <div class="core-url" id="display-core-url">Esperando configuración de nexo...</div>
            
            <div class="capabilities-list" id="capabilities-manifest">
                <!-- Se inyectan dinámicamente -->
            </div>
        </div>
        
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 12px;">
            <div id="master-status" class="status-badge status--ghost">DESCONECTADO</div>
            <button class="btn-master" id="btn-master-action">Establecer Vínculo</button>
        </div>
    </div>

    <div class="toolbar" id="toolbar-zone">
        <div style="display: flex; align-items: center; gap: 12px;">
            <button class="config-trigger" id="btn-toggle-settings" title="Ajustes de Conexión">⚙️</button>
            <span id="citizen-badge" style="font-size: 10px; font-weight: 700; color: var(--text-dim); display: none;"></span>
        </div>
        <div class="toolbar-tools">
            <button class="btn-master" id="btn-export-citizenship" style="background:#475569; padding: 6px 12px; font-size: 10px; display:none;">📥 Exportar Manifiesto</button>
        </div>
    </div>

    <!-- Panel de Ajustes -->
    <div class="settings-panel" id="settings-panel">
        <div class="form-group">
            <label>Nombre del Satélite (Jurisdicción)</label>
            <input type="text" id="config-sat-name" placeholder="Ej: Veta de Oro">
        </div>
        <div class="form-group">
            <label>Nave Nodriza (URL de Google Apps Script)</label>
            <input type="text" id="config-core-id" placeholder="https://script.google.com/macros/s/...">
        </div>
        <div style="font-size: 10px; color: var(--text-dim); font-style: italic;">
            * Estos ajustes definen la intención de conexión del satélite.
        </div>
    </div>

    <div class="hud-body locked" id="hud-body">
        <div class="panel">
            <h3 class="panel-title">Entorno</h3>
            <indra-workspace-selector id="workspace-ctrl" style="margin-bottom:24px;"></indra-workspace-selector>
            <indra-keychain-widget id="keychain-ctrl"></indra-keychain-widget>
            
            <h3 class="panel-title" style="margin-top:32px;">Estructura de Datos</h3>
            <indra-schema-projector id="schema-projector"></indra-schema-projector>
        </div>

        <div class="main-stage">
            <section class="panel">
                <h3 class="panel-title">Buscador Universal</h3>
                <indra-universal-picker id="universal-picker"></indra-universal-picker>
            </section>
            
            <section class="panel" style="flex-grow: 1;">
                <h3 class="panel-title">Workflows de Negocio</h3>
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
        const satNameDisplay = this.shadowRoot.getElementById('display-sat-name');
        const coreUrlDisplay = this.shadowRoot.getElementById('display-core-url');
        const capManifest = this.shadowRoot.getElementById('capabilities-manifest');
        
        const satNameInput = this.shadowRoot.getElementById('config-sat-name');
        const coreUrlInput = this.shadowRoot.getElementById('config-core-id');

        // Sincronizar Display Card
        if (satNameDisplay) satNameDisplay.innerText = this._bridge.contract.satellite_name || 'Satélite Anónimo';
        if (coreUrlDisplay) coreUrlDisplay.innerText = this._bridge.coreUrl || 'Sin URL de nexo';

        // Sincronizar Inputs (Solo si no tienen el foco)
        if (satNameInput && this.shadowRoot.activeElement !== satNameInput) {
            satNameInput.value = this._bridge.contract.satellite_name || '';
        }
        if (coreUrlInput && this.shadowRoot.activeElement !== coreUrlInput) {
            coreUrlInput.value = this._bridge.coreUrl || '';
        }

        // --- MÁQUINA DE ESTADOS ESTÁNDAR ---
        switch (this._mode) {
            case 'GHOST':
                status.innerText = 'Desconectado';
                status.className = 'status-badge status--ghost';
                actionBtn.innerText = 'Establecer Vínculo';
                actionBtn.className = 'btn-master';
                actionBtn.disabled = false;
                actionBtn.onclick = () => this.handleIgnition();
                body.classList.add('locked');
                break;

            case 'ORPHAN':
                status.innerText = 'Identidad Activa';
                status.className = 'status-badge status--orphan';
                actionBtn.innerText = 'Vincular a Espacio';
                actionBtn.className = 'btn-master';
                actionBtn.disabled = false;
                actionBtn.onclick = () => this.handleAnchorCitizenship();
                body.classList.add('locked');
                break;

            case 'STABLE':
                status.innerText = 'Vínculo Estable';
                status.className = 'status-badge status--stable';
                actionBtn.innerText = 'Sincronizado';
                actionBtn.className = 'btn-master stable';
                actionBtn.disabled = false;
                actionBtn.onclick = () => this.handleDNAsync();
                body.classList.remove('locked');
                break;

            default:
                status.innerText = 'Modo Local';
                actionBtn.innerText = 'Reintentar';
                actionBtn.onclick = () => this._bridge.init();
                body.classList.remove('locked');
                break;
        }

        // Render de Capacidades (Manifiesto Honesto)
        if (capManifest) {
            const caps = this._bridge.contract?.capabilities?.protocols || [];
            if (caps.length > 0) {
                capManifest.innerHTML = caps.slice(0, 5).map(c => `<span class="cap-tag">${c.replace('SYSTEM_', '')}</span>`).join('') + (caps.length > 5 ? `<span class="cap-tag">+${caps.length - 5}</span>` : '');
            } else {
                capManifest.innerHTML = '<span style="font-size:9px; opacity:0.3">Sin capacidades detectadas</span>';
            }
        }

        // Mostrar ID de Espacio
        if (this._bridge.activeWorkspaceId) {
            citizenBadge.style.display = 'inline-block';
            citizenBadge.innerText = `ESPACIO: ${this._bridge.activeWorkspaceId.substring(0,8)}`;
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

    handleExportCitizenship() {
        const config = {
            satellite_name: this._bridge.contract.satellite_name,
            workspace_id: this._bridge.activeWorkspaceId,
            ignitions: this._bridge.ignitions || {}
        };
        
        const code = `/**
 * MANIFIESTO DE CIUDADANÍA INDRA
 * Guarda este archivo como '_INDRA_PROTOCOL_/indra_config.js' en tu repositorio.
 */
export const INDRA_CONFIG = ${JSON.stringify(config, null, 4)};`;

        console.log("--- MANIFIESTO GENERADO ---");
        console.log(code);
        
        // Copiar al portapapeles si es posible
        navigator.clipboard.writeText(code).then(() => {
            alert("✅ Manifiesto de Ciudadanía copiado al portapapeles.\n\nGuárdalo en '_INDRA_PROTOCOL_/indra_config.js' para que tu satélite sea soberano.");
        }).catch(() => {
            alert("No se pudo copiar automáticamente. Revisa la consola (F12) para copiar el código.");
        });
    }

    async handleIgnition() {
        const btn = this.shadowRoot.getElementById('btn-master-action');
        btn.disabled = true;
        btn.innerText = "Conectando...";
        try {
            await this._bridge.ignite();
        } catch (e) {
            btn.disabled = false;
            this.updateUI();
        }
    }

    async handleAnchorCitizenship(workspaceId = null) {
        const btn = this.shadowRoot.getElementById('btn-master-action');
        btn.disabled = true;
        btn.innerText = "Vinculando...";
        try {
            await this._bridge.anchorCitizenship(workspaceId);
        } catch (e) {
            alert("Error al vincular: " + e.message);
            btn.disabled = false;
            this.updateUI();
        }
    }

    async handleDNAsync() {
        const btn = this.shadowRoot.getElementById('btn-master-action');
        btn.disabled = true;
        btn.innerText = "Sincronizando...";
        try {
            await this._bridge.syncDNA();
        } catch (e) {
            alert("Error de sincronización: " + e.message);
            btn.disabled = false;
            this.updateUI();
        }
    }

    render() {
        this.shadowRoot.innerHTML = TEMPLATE;
        
        // Toggle de Ajustes
        const toggleBtn = this.shadowRoot.getElementById('btn-toggle-settings');
        const settingsPanel = this.shadowRoot.getElementById('settings-panel');
        if (toggleBtn && settingsPanel) {
            toggleBtn.onclick = () => {
                settingsPanel.classList.toggle('active');
                toggleBtn.style.opacity = settingsPanel.classList.contains('active') ? "1" : "0.5";
            };
        }

        // Listeners para cambios de identidad (In-memory sync)
        const satNameInput = this.shadowRoot.getElementById('config-sat-name');
        if (satNameInput) {
            satNameInput.oninput = () => {
                if (this._bridge && this._bridge.contract) {
                    this._bridge.contract.satellite_name = satNameInput.value;
                    this.shadowRoot.getElementById('display-sat-name').innerText = satNameInput.value;
                }
            };
        }

        const coreUrlInput = this.shadowRoot.getElementById('config-core-id');
        if (coreUrlInput) {
            coreUrlInput.oninput = () => {
                if (this._bridge) {
                    this._bridge.coreUrl = coreUrlInput.value;
                    this.shadowRoot.getElementById('display-core-url').innerText = coreUrlInput.value;
                }
            };
        }
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
