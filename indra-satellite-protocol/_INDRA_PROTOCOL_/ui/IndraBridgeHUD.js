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
    .config-panel { background: #fdfdfd; padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; gap: 16px; align-items: flex-end; }
    .input-group { display: flex; flex-direction: column; gap: 4px; flex-grow: 1; }
    .input-group label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
    .input-group input { padding: 6px 10px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; font-family: inherit; }
    .btn-forge { background: #1f2937; color: white; border: none; padding: 7px 16px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s; }
    .btn-forge:hover { background: #374151; }
</style>

<div class="hud-container">
    <header class="hud-header">
        <div class="core-identity">
            <span style="font-weight:600; font-size:13px; color:var(--text); letter-spacing: -0.01em;">INDRA SATELLITE HUD</span>
            <div class="status-group" style="margin-top:2px;">
                 <span class="badge badge-core" id="core-status">VERSION 2.5</span>
                 <span class="badge badge-auth" id="auth-status">SINCERIDAD_ESTABLECIDA</span>
            </div>
        </div>
        <button class="btn-ignite" id="btn-ignite-trigger">Conectar al Core</button>
    </header>

    <div class="config-panel" id="config-panel">
        <div class="input-group">
            <label>SATELLITE IDENTIFIER (NAME)</label>
            <input type="text" id="config-sat-name" placeholder="Ej: Veta de Oro">
        </div>
        <div class="input-group">
            <label>CORE ID (NUCLEO TARGET)</label>
            <input type="text" id="config-core-id" placeholder="sovereign.core@indra.protocol" disabled>
        </div>
        <button class="btn-forge" id="btn-forge-identity">Forjar Identidad</button>
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
            <div class="fallback-title">⚠️ Daemon Local Inaccesible</div>
            <p style="font-size: 12px; line-height: 1.5; color: #d1d5db; margin: 0;">
                El servidor local no está disponible para auto-guardar el contrato. Se ha generado una descarga manual.
                Por favor, sobrescribe este archivo exactamente en:
            </p>
            <div class="fallback-path">_INDRA_PROTOCOL_/indra_contract.json</div>
            <button class="btn-forge" style="margin-top: 8px; align-self: flex-end;" onclick="this.closest('.fallback-modal').classList.remove('active')">
                ENTENDIDO
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
        const filteredSchemas = (contract.schemas || []).filter(s => {
            // REGLA AXIOMÁTICA: Si es un esquema de configuración, es de la Shell, no del Satélite
            if (s.class === 'CONFIG_SCHEMA' || s.class === 'SYSTEM_SCHEMA') return false;

            // Filtro de Seguridad por ID (Aduana)
            const isSystemId = s.id?.startsWith('INDRA_') ||
                s.handle?.alias?.startsWith('config_') ||
                s.id === 'notion' ||
                s.id === 'intelligence';

            return !isSystemId;
        });

        // Proyectar a los Widgets
        const projector = this.shadowRoot.getElementById('schema-projector');
        if (projector) projector.schemas = filteredSchemas;

        const picker = this.shadowRoot.getElementById('universal-picker');
        if (picker) picker.providers = contract.capabilities?.providers || [];

        const ribbon = this.shadowRoot.getElementById('workflow-ribbon');
        if (ribbon) ribbon.workflows = contract.workflows || [];

        // 4. Alertas de Resonancia (Trazabilidad)
        const authStatus = this.shadowRoot.getElementById('auth-status');
        if (this._bridge.resonanceWarnings?.length > 0) {
            authStatus.innerText = "ALERTA DE INTEGRIDAD";
            authStatus.style.background = "#FEF7E0";
            authStatus.style.color = "#B06000";
        }
        
        // 5. Poblar el panel de Configuración (Metadata)
        if (contract) {
            const inputName = this.shadowRoot.getElementById('config-sat-name');
            const inputCore = this.shadowRoot.getElementById('config-core-id');
            if (inputName && !inputName.value) inputName.value = contract.satellite_name || '';
            if (inputCore && !inputCore.value) inputCore.value = contract.core_id || '';
        }
    }

    async handleForgeIdentity() {
        if (!this._bridge || !this._bridge.contract) return;
        const inputName = this.shadowRoot.getElementById('config-sat-name').value;
        const btn = this.shadowRoot.getElementById('btn-forge-identity');
        
        // 1. Modificar el contrato en memoria
        this._bridge.contract.satellite_name = inputName;
        
        // 2. Intentar POST al Daemon Local
        btn.innerText = "FORJANDO...";
        let serverSuccess = false;
        
        try {
            const response = await fetch('/api/indra/contract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this._bridge.contract)
            });
            if (response.ok) serverSuccess = true;
        } catch (e) {
            // Falla de red, el daemon no está ejecutándose
            serverSuccess = false;
        }
        
        // 3. Fallback a Opción de Descarga Manual
        if (!serverSuccess) {
            console.warn("[HUD] Daemon local no detectado. Activando fallback de descarga.");
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this._bridge.contract, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "indra_contract.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            this.shadowRoot.getElementById('fallback-modal').classList.add('active');
        } else {
            console.info("[HUD] Metadatos actualizados en el servidor local.");
        }
        
        btn.innerText = "IDENTIDAD FORJADA";
        setTimeout(() => btn.innerText = "FORJAR IDENTIDAD", 3000);
    }

    render() {
        this.shadowRoot.innerHTML = TEMPLATE;
        const btn = this.shadowRoot.getElementById('btn-ignite-trigger');
        if (btn) btn.onclick = () => this.handleIgnition();
        
        const btnForge = this.shadowRoot.getElementById('btn-forge-identity');
        if (btnForge) btnForge.onclick = () => this.handleForgeIdentity();
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
