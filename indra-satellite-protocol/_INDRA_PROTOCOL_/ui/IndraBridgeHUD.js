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
    </header>

    <div class="hud-body">
        <div class="panel">
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

    set bridge(instance) {
        this._bridge = instance;
        this._bridge.onStateChange = () => this.updateUI();
        this.updateUI();
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
    }

    render() {
        this.shadowRoot.innerHTML = TEMPLATE;
    }
}

customElements.define('indra-bridge-hud', IndraBridgeHUD);
