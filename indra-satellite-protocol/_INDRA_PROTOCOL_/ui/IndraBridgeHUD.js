/**
 * =============================================================================
 * INDRA BRIDGE HUD (Sovereign Host v2.5)
 * =============================================================================
 * AXIOMA: Es un Cascarón Vacío. Su única misión es proveer el chasis (Layout)
 * y la comunicación con el Bridge. La funcionalidad reside en lso WIDGETS.
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
    .badge { font-size: 8px; padding: 2px 8px; border-radius: 20px; font-weight: 700; text-transform: uppercase; border: 1px solid transparent; }
    .badge-core { background: #fff; color: #4b5563; border-color: var(--border); }
    .badge-auth { background: #dcfce7; color: #166534; }
    .badge-citizen { background: #f3e8ff; color: #6b21a8; border-color: #d8b4fe; font-family: monospace; }
    
    .btn-ignite {
        background: var(--accent);
        color: white;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
        transition: filter 0.2s;
        text-transform: uppercase;
    }
    .btn-ignite:hover { filter: brightness(1.1); }
    .btn-ignite:disabled { background: #9ca3af; cursor: not-allowed; }

    .hud-body { 
        display: grid; 
        grid-template-columns: 280px 1fr; 
        background: var(--border); 
        gap: 1px;
    }
    
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
    
    /* MODAL DE CAÍDA (FALLBACK) */
    .fallback-modal {
        position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000;
        display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px);
    }
    .fallback-modal.active { display: flex; }
    .fallback-box {
        background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 24px;
        max-width: 400px; color: #f9fafb; display: flex; flex-direction: column; gap: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .fallback-title { color: #f87171; font-weight: bold; display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .fallback-path { background: #111827; padding: 10px; font-family: monospace; font-size: 11px; border-radius: 4px; color: #34d399; user-select: all; }
    
    /* Config Panel */
    .config-panel { background: #fdfdfd; padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
    .config-row { display: flex; gap: 16px; align-items: flex-end; width: 100%; }
    .input-group { display: flex; flex-direction: column; gap: 4px; flex-grow: 1; }
    .input-group label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
    .input-group input { padding: 6px 10px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; font-family: inherit; }
    
    .btn-forge { background: #1f2937; color: white; border: none; padding: 7px 16px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s; }
    .btn-forge:hover { background: #374151; }
    .btn-secondary { background: transparent; color: #4b5563; border: 1px solid var(--border); }
    .btn-secondary:hover { background: #f3f4f6; }
</style>

<div class="hud-container">
    <header class="hud-header">
        <div class="core-identity">
            <span style="font-weight:600; font-size:13px; color:var(--text); letter-spacing: -0.01em;">INDRA SATELLITE HUD</span>
            <div class="status-group" style="margin-top:2px;">
                 <span class="badge badge-core" id="core-status">VERSION 2.5</span>
                 <span class="badge badge-auth" id="auth-status">SINCERIDAD_ESTABLECIDA</span>
                 <span class="badge badge-citizen" id="citizen-status" style="display:none;">CIUDADANO: ...</span>
                 <button class="badge" id="btn-sync-now" style="background:#8b5cf6; color:white; cursor:pointer; border:none; display:none;">🔄 SINCRONIZAR ADN</button>
            </div>
        </div>
        <button class="btn-ignite" id="btn-ignite-trigger">Conectar al Core</button>
    </header>

    <div class="config-panel" id="config-panel">
        <div class="config-row">
            <div class="input-group">
                <label>SATELLITE IDENTIFIER (NAME)</label>
                <input type="text" id="config-sat-name" placeholder="Ej: Veta de Oro">
            </div>
            <div class="input-group">
                <label>CORE ID (NUCLEO TARGET)</label>
                <input type="text" id="config-core-id" placeholder="sovereign.core@indra.protocol" disabled>
            </div>
        </div>
        <div class="config-row" style="justify-content: flex-end; gap: 8px;">
            <button class="btn-forge btn-secondary" id="btn-forge-manual">⬇️ Descargar Metadata (Manual)</button>
            <button class="btn-forge" id="btn-forge-daemon">⚡ Guardar en Daemon (Auto)</button>
        </div>
    </div>

    <div class="hud-body">
        <div class="panel">
            <h3 class="panel-title">Soberanía (Contexto)</h3>
            <indra-workspace-selector id="workspace-ctrl" style="margin-bottom:20px;"></indra-workspace-selector>
            <indra-keychain-widget id="keychain-ctrl" style="margin-bottom:20px;"></indra-keychain-widget>
            
            <h3 class="panel-title">Espina Dorsal (Schemas)</h3>
            <indra-schema-projector id="schema-projector"></indra-schema-projector>
        </div>

        <div class="main-stage">
            <section class="panel">
                <h3 class="panel-title">Universal Picker</h3>
                <indra-universal-picker id="universal-picker"></indra-universal-picker>
            </section>
            
            <section class="panel" style="flex-grow: 1;">
                <h3 class="panel-title">Cinta Magnetofónica (Workflows)</h3>
                <indra-workflow-ribbon id="workflow-ribbon"></indra-workflow-ribbon>
            </section>
        </div>
    </div>
    <indra-param-modal id="param-portal"></indra-param-modal>
    
    <div class="fallback-modal" id="fallback-modal">
        <div class="fallback-box">
            <div class="fallback-title">⚠️ Instrucciones de Sincronización Manual</div>
            <p style="font-size: 12px; line-height: 1.5; color: #d1d5db; margin: 0;">
                Has descargado la Metadata Soberana del Satélite puro.
                Coloca este archivo exactamente en la siguiente ruta relativa:
            </p>
            <div class="fallback-path">_INDRA_PROTOCOL_/indra_satellite.meta.json</div>
            <p style="font-size: 11px; line-height: 1.5; color: #9ca3af; margin: 0;">
                Después, abre tu terminal y ejecuta <strong>npm run sync</strong> para que el compilador fusione esta metadata y genere el contrato final.
            </p>
            <button class="btn-forge" style="margin-top: 8px; align-self: flex-end;" onclick="this.closest('.fallback-modal').classList.remove('active')">
                ENTENDIDO Y COMPILADO
            </button>
        </div>
    </div>
</div>
`;

class IndraBridgeHUD extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._bridge = null;
    }

    connectedCallback() {
        this.render();
    }

    /**
     * @dharma INYECCIÓN DE SOBERANÍA
     * Este setter actúa como el punto de ignición para todos los sub-widgets.
     * Pasa la instancia del Bridge al Llavero y al Selector de Workspace
     * para que estos puedan iniciar sus propios procesos de resonancia.
     */
    set bridge(instance) {
        this._bridge = instance;
        this._bridge.onStateChange = () => this.updateUI();

        // Inyectar Bridge al Llavero y Selector (Jerarquía de Jurisdicción)
        const keychain = this.shadowRoot.getElementById('keychain-ctrl');
        if (keychain) keychain.bridge = instance;

        const workspaceCtrl = this.shadowRoot.getElementById('workspace-ctrl');
        if (workspaceCtrl) workspaceCtrl.bridge = instance;

        this.updateUI();
    }

    async handleIgnition() {
        if (!this._bridge) return;
        const btn = this.shadowRoot.getElementById('btn-ignite-trigger');
        try {
            btn.disabled = true;
            btn.innerText = "Resonando...";
            await this._bridge.ignite();
            btn.innerText = "Pacto Firmado";
            btn.style.background = "#34A853";
        } catch (e) {
            console.error("[HUD] Fallo en ignición:", e);
            btn.disabled = false;
            btn.innerText = "Reintentar Ignición";
            btn.style.background = "#EA4335";
        }
    }

    updateUI() {
        if (!this.shadowRoot || !this._bridge) return;

        const { contract } = this._bridge;

        // --- FILTRADO DE DHARMA: Separar Negocio de Sistema ---
        const filteredSchemas = contract ? (contract.schemas || []).filter(s => {
            if (s.class === 'CONFIG_SCHEMA' || s.class === 'SYSTEM_SCHEMA') return false;
            const isSystemId = s.id?.startsWith('INDRA_') || s.handle?.alias?.startsWith('config_') || s.id === 'notion' || s.id === 'intelligence';
            return !isSystemId;
        }) : null;

        // Proyectar a los Widgets (null = Loading State)
        const projector = this.shadowRoot.getElementById('schema-projector');
        if (projector) projector.schemas = filteredSchemas;

        const picker = this.shadowRoot.getElementById('universal-picker');
        if (picker) picker.providers = contract ? contract.capabilities?.providers : null;

        const ribbon = this.shadowRoot.getElementById('workflow-ribbon');
        if (ribbon) ribbon.workflows = contract ? contract.workflows : null;

        // 4. Alertas de Resonancia (Trazabilidad)
        const authStatus = this.shadowRoot.getElementById('auth-status');
        if (this._bridge.resonanceWarnings?.length > 0) {
            authStatus.innerText = "ALERTA DE INTEGRIDAD";
            authStatus.style.background = "#FEF7E0";
            authStatus.style.color = "#B06000";
        }
        
        // 6. Ciudadanía (Workspace Anclado)
        const citizenStatus = this.shadowRoot.getElementById('citizen-status');
        const syncBtn = this.shadowRoot.getElementById('btn-sync-now');
        if (this._bridge.activeWorkspaceId) {
            if (citizenStatus) {
                citizenStatus.innerText = `CIUDADADANO: ${this._bridge.activeWorkspaceId.substring(0,6)}...`;
                citizenStatus.style.display = 'inline-block';
                citizenStatus.title = `Anclado al Workspace: ${this._bridge.activeWorkspaceId}`;
            }
            if (syncBtn) syncBtn.style.display = 'inline-block';
        }
    }

    async handleForgeDaemon() {
        if (!this._bridge) return;
        const btn = this.shadowRoot.getElementById('btn-forge-daemon');
        btn.innerText = "FORJANDO...";
        
        try {
            // Actualizamos el nombre en memoria antes de persistir
            this._bridge.contract.satellite_name = this.shadowRoot.getElementById('config-sat-name').value;
            
            const result = await this._bridge.persistMetadata();
            if (result.status === 'ok') {
                btn.innerText = "SINCERADO EN DAEMON";
                setTimeout(() => btn.innerText = "⚡ Guardar en Daemon (Auto)", 3000);
            } else {
                this._triggerManualDownload(this._buildMetaPayload());
                btn.innerText = "⚡ Guardar en Daemon (Auto)";
            }
        } catch (e) {
            console.warn("[HUD] Daemon local no detectado. Forzando descarga manual.");
            this._triggerManualDownload(this._buildMetaPayload());
            btn.innerText = "⚡ Guardar en Daemon (Auto)";
        }
    }

    async handleLocalSync() {
        const btn = this.shadowRoot.getElementById('btn-sync-now');
        const originalText = btn.innerText;
        btn.innerText = "⌛ SINCRONIZANDO...";
        btn.disabled = true;

        try {
            const response = await fetch('/api/indra/sync', { method: 'POST' });
            const result = await response.json();
            if (result.status === 'ok') {
                btn.innerText = "✅ ADN ACTUALIZADO";
                // Forzar recarga del contrato en el bridge para reflejar cambios
                await this._bridge.loadContract();
            } else {
                alert(`Error en sincronización: ${result.message}`);
            }
        } catch (e) {
            alert("Error: El Daemon local no respondió a la sincronización.");
        } finally {
            setTimeout(() => {
                btn.innerText = originalText;
                btn.disabled = false;
            }, 2000);
        }
    }

    handleForgeManual() {
        const payload = this._buildMetaPayload();
        this._triggerManualDownload(payload);
    }

    _buildMetaPayload() {
        const inputName = this.shadowRoot.getElementById('config-sat-name').value;
        return {
            satellite_name: inputName,
            core_id: this._bridge.contract?.core_id || 'sovereign.core@indra.protocol',
            workspace_id: this._bridge.activeWorkspaceId
        };
    }

    _triggerManualDownload(payload) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "indra_satellite.meta.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        this.shadowRoot.getElementById('fallback-modal').classList.add('active');
    }

    render() {
        this.shadowRoot.innerHTML = TEMPLATE;
        const btn = this.shadowRoot.getElementById('btn-ignite-trigger');
        if (btn) btn.onclick = () => this.handleIgnition();
        
        const btnForceDaemon = this.shadowRoot.getElementById('btn-forge-daemon');
        if (btnForceDaemon) btnForceDaemon.onclick = () => this.handleForgeDaemon();

        const btnForgeManual = this.shadowRoot.getElementById('btn-forge-manual');
        if (btnForgeManual) btnForgeManual.onclick = () => this.handleForgeManual();

        const btnSync = this.shadowRoot.getElementById('btn-sync-now');
        if (btnSync) btnSync.onclick = () => this.handleLocalSync();
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
