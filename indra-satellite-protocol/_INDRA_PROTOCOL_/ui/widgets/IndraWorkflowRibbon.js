/**
 * =============================================================================
 * INDRA WORKFLOW RIBBON (La Cinta Magnetofónica v2.1)
 * =============================================================================
 * Responsabilidad: Proyectar la secuencia de automatizaciones de la Espina Dorsal.
 * DHARMA: Visualizador lineal de estados de ejecución.
 * =============================================================================
 */

import { SYSTEM_TOOLS } from '../../core/SystemToolsRegistry.js';

class IndraWorkflowRibbon extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._workflows = [];
        this._activeCategory = 'CLIENTE';
        
        window.addEventListener('indra-resonance-sync', () => this._updateResonanceStatus());
    }

    set workflows(data) {
        // Inyectamos las herramientas nativas del sistema desde el Registro Central
        this._workflows = [...this.systemTools, ...data];
        this.render();
    }

    get systemTools() {
        return SYSTEM_TOOLS;
    }

    _setCategory(cat) {
        this._activeCategory = cat;
        this.render();
        this._updateResonanceStatus();
    }

    _updateResonanceStatus() {
        if (this._activeCategory !== 'SYSTEM') return;
        
        const hud = document.querySelector('indra-bridge-hud');
        if (!hud || !hud._bridge) return;

        const monitor = this.shadowRoot.getElementById('dna-monitor');
        if (!monitor) return;

        const bridge = hud._bridge;
        const hasCore = !!bridge.coreUrl;
        const hasAuth = !!bridge.satelliteToken;
        const isStable = (bridge.resonanceWarnings || []).length === 0;

        if (hasCore && hasAuth && isStable) {
            monitor.style.color = '#10b981'; // Verde Esmeralda
            monitor.innerHTML = `<div style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 5px #10b981;"></div> RESONANCIA_ACTIVA`;
        } else if (hasCore && !hasAuth) {
            monitor.style.color = '#f59e0b'; // Ámbar
            monitor.innerHTML = `<div style="width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 5px #f59e0b;"></div> ESPERANDO_AUTH`;
        } else {
            monitor.style.color = '#ef4444'; // Rojo
            monitor.innerHTML = `<div style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 5px #ef4444;"></div> MODO_LOCAL (OFFLINE)`;
        }
    }

    render() {
        const activeCategory = this._activeCategory;
        const filteredWorkflows = this._workflows.filter(wf => (wf.metadata?.category || 'CLIENTE') === activeCategory);

        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; --accent: ${activeCategory === 'SYSTEM' ? '#f59e0b' : '#8B5CF6'}; }
            
            .tabs-nav { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid #DADCE0; background: #EEE; padding: 4px 4px 0 4px; border-radius: 4px; }
            .tab-btn { padding: 6px 12px; font-size: 10px; font-weight: 700; cursor: pointer; border: none; background: transparent; color: #666; border-bottom: 2px solid transparent; text-transform: uppercase; }
            .tab-btn.active { color: #000; border-bottom-color: var(--accent); background: #FFF; border-radius: 4px 4px 0 0; }

            .ribbon-container { display: flex; flex-direction: column; gap: 15px; }
            .workflow-item { background: #FFFFFF; border: 1px solid #DADCE0; border-left: 4px solid var(--accent); border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .wf-header { padding: 12px 15px; border-bottom: 1px solid #F1F3F4; display: flex; justify-content: space-between; align-items: center; }
            .wf-label { font-size: 12px; font-weight: 700; color: #1A1F36; border: none; background: transparent; }
            .wf-actions { display: flex; gap: 8px; }
            .btn { font-size: 9px; font-weight: 700; padding: 5px 10px; border-radius: 4px; cursor: pointer; border: 1px solid transparent; }
            .btn-play { background: #E6F4EA; color: #137333; }
            .btn-ghost { background: transparent; color: #666; border-color: #DADCE0; }
            .btn-ghost:hover { background: #F1F3F4; color: #000; }
            .engineering-actions .btn { white-space: nowrap; }
            .station-list { display: flex; flex-direction: column; padding: 10px; gap: 5px; background: #F8F9FA;}
            .station-item { display: grid; grid-template-columns: 20px 1fr 1fr; gap: 10px; align-items: center; padding: 6px; background: #FFF; border: 1px solid #DADCE0; border-radius: 4px; font-size: 10px; }
            .station-num { font-weight: bold; color: var(--accent); }
        </style>

        <nav class="tabs-nav">
            <button class="tab-btn ${activeCategory === 'CLIENTE' ? 'active' : ''}" onclick="this.getRootNode().host._setCategory('CLIENTE')">🛰️ CLIENTE SATÉLITE</button>
            <button class="tab-btn ${activeCategory === 'SYSTEM' ? 'active' : ''}" onclick="this.getRootNode().host._setCategory('SYSTEM')">🛠️ INDRA TOOLS</button>
            
            ${activeCategory === 'SYSTEM' ? `
                <div class="engineering-actions" style="margin-left: auto; display: flex; gap: 8px; align-items: center; padding-right: 10px;">
                    <div id="dna-monitor" class="dna-status" style="font-size: 8px; font-family: monospace; color: var(--accent); margin-right: 15px; display: flex; align-items: center; gap: 5px; opacity: 0.8;">
                        <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 5px var(--accent);"></div>
                        ADN_SINCRONIZADO
                    </div>
                    <button class="btn btn-ghost" style="font-size: 8px; border: 1px solid #CCC;" onclick="this.getRootNode().host._invokeUI('SCHEMA_DESIGNER')">📐 ESQUEMAS</button>
                    <button class="btn btn-ghost" style="font-size: 8px; border: 1px solid #CCC;" onclick="this.getRootNode().host._invokeUI('WORKFLOW_DESIGNER')">⛓️ FLUJOS</button>
                    <button class="btn btn-play" style="background: #f59e0b; color: white;" onclick="this.getRootNode().host._invokeServiceManager()">SERVICIOS</button>
                </div>
            ` : ''}
        </nav>

        <div class="ribbon-container">
            ${filteredWorkflows.map(wf => {
                const origin = wf.metadata?.origin || 'LOCAL';
                const icon = origin === 'CORE' ? '☁️' : '🛰️';
                
                return `
                <div class="workflow-item">
                    <div class="wf-header">
                        <div class="wf-label">
                            <span style="opacity: 0.6; margin-right: 8px; font-size: 10px;">${icon}</span>
                            ${wf.payload?.label || wf.label || wf.id}
                        </div>
                        <div class="wf-actions">
                            <button class="btn btn-play" onclick="this.getRootNode().host._run('${wf.id}')">EJECUTAR</button>
                        </div>
                    </div>
                    <div class="station-list">
                        ${(wf.payload?.stations || wf.stations || []).map((st, i) => `
                            <div class="station-item">
                                <span class="station-num">${(i + 1).toString().padStart(2, '0')}</span>
                                <div style="display:flex; flex-direction:column; flex:1;">
                                    <span style="font-weight:600;">${st.label || st.id || 'PASO_SIN_NOMBRE'}</span>
                                    <span style="font-size:7px; opacity:0.4; text-transform:uppercase; letter-spacing:0.5px;">PROVEEDOR: ${st.provider || 'SISTEMA'} // ${st.protocol}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;
            }).join('') || `<div style="opacity:0.3; font-size:11px; text-align:center; padding: 20px;">SIN FLUJOS EN ${activeCategory}</div>`}
        </div>
        `;
    }
    async _run(id) {
        const hud = document.querySelector('indra-bridge-hud');
        if (!hud || !hud._bridge) return alert("INDRA_BRIDGE_NOT_FOUND");
        
        // BLOQUEO AXIOMÁTICO: No podemos ejecutar flujos sin motor
        if (!hud._bridge.coreUrl) {
            return alert("❌ ERROR DE MOTOR: El satélite está en MODO_LOCAL.\n\nPara ejecutar Génesis o cualquier flujo, debes abrir el satélite desde la Shell de Indra o configurar una coreUrl válida.");
        }

        const wf = this._workflows.find(w => w.id === id);
        if (!wf) return;

        const portal = hud.shadowRoot.getElementById('param-portal');
        if (!portal) return alert("INDRA_PARAM_PORTAL_NOT_FOUND");

        try {
            // Invocación del Formulario de Ignición
            const params = await portal.prompt(wf);
            
            console.log(`[Ribbon] Ejecutando flujo ${id}...`, params);
            const result = await hud._bridge.runWorkflow(wf, params);
            
            if (result.status === 'SUCCESS') alert("✅ FLUJO COMPLETADO");
            else alert(`❌ ERROR: ${result.message}`);
        } catch (e) {
            if (e.message === 'USER_CANCELLED') return; // Silencio si el usuario canceló
            alert(`Fallo Crítico: ${e.message}`);
        }
    }

    async _invokeUI(moduleName) {
        const hud = document.querySelector('indra-bridge-hud');
        if (!hud || !hud._bridge) return alert("INDRA_BRIDGE_NOT_FOUND");

        try {
            await hud._bridge.execute({
                protocol: 'UI_INVOKE',
                module: moduleName
            });
        } catch (e) {
            console.error(`[Ribbon] Fallo al invocar ${moduleName}:`, e);
            alert(`Error de Portal: ${e.message}`);
        }
    }

    async _invokeServiceManager() {
        const hud = document.querySelector('indra-bridge-hud');
        if (!hud || !hud._bridge) return alert("INDRA_BRIDGE_NOT_FOUND");

        try {
            await hud._bridge.execute({
                protocol: 'UI_INVOKE',
                module: 'SERVICE_MANAGER'
            });
        } catch (e) {
            console.error(e);
        }
    }

    _save(id) {
        alert(`Guardando configuración de ${id} (Mock)`);
    }
}

customElements.define('indra-workflow-ribbon', IndraWorkflowRibbon);
