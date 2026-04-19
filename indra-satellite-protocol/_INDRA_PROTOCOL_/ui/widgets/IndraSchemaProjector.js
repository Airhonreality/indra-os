/**
 * =============================================================================
 * INDRA SCHEMA PROJECTOR (The Fractal Viewer v2.1)
 * =============================================================================
 * Responsabilidad: Proyectar la estructura de los esquemas (ADN) del Contrato.
 * DHARMA: Cascarón funcional, agnóstico de la lógica de negocio.
 * =============================================================================
 */

class IndraSchemaProjector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._schemas = null; // null = Loading State
    }

    set schemas(data) {
        this._schemas = data || [];
        this.render();
    }

    render() {
        const isLoading = this._schemas === null;
        
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; font-family: inherit; }
            .projector-container { display: flex; flex-direction: column; gap: 12px; }
            .schema-card { 
                background: #FFFFFF; 
                border: 1px solid #DADCE0; 
                border-radius: 6px; 
                overflow: hidden; 
                transition: transform 0.2s ease;
            }
            .schema-card:hover { transform: translateX(2px); border-color: #1A73E8; }
            .header { 
                background: #F8F9FA; 
                padding: 8px 12px; 
                font-size: 11px; 
                font-weight: 700; 
                border-bottom: 1px solid #DADCE0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .type-badge { font-size: 8px; color: #5F6368; background: #E8EAED; padding: 2px 6px; border-radius: 4px; }
            .body { padding: 10px 12px; font-size: 11px; }
            .field-row { display: flex; justify-content: space-between; margin-bottom: 4px; color: #3C4043; }
            .field-type { opacity: 0.5; font-size: 9px; }
            
            /* Skeleton Loading Animations */
            @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
            .skeleton { 
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 400px 100%;
                animation: shimmer 1.5s infinite linear;
                border-radius: 4px;
            }
            .sk-header { height: 12px; width: 40%; }
            .sk-badge { height: 12px; width: 25%; }
            .sk-row { height: 10px; margin-bottom: 8px; }
            .sk-row-w1 { width: 70%; }
            .sk-row-w2 { width: 40%; }
            .sk-row-w3 { width: 55%; }
        </style>
            .btn-update {
                background: #F8F9FA; 
                color: #3C4043; 
                border: 1px solid #DADCE0; 
                padding: 4px 10px; 
                border-radius: 4px; 
                font-size: 9px; 
                font-weight: 700; 
                cursor: pointer; 
                transition: 0.2s; 
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .btn-update:hover { background: #E8EAED; border-color: #BDC1C6; }
            .btn-ignite { 
                background: #1A73E8; 
                color: white; 
                border: none; 
                padding: 4px 10px; 
                border-radius: 4px; 
                font-size: 9px; 
                font-weight: 700; 
                cursor: pointer; 
                transition: 0.2s; 
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .btn-ignite:hover { background: #174EA6; box-shadow: 0 0 10px rgba(26, 115, 232, 0.4); }
            .status-indicator { font-size: 14px; margin-left: 8px; cursor: default; }
            .status-cristal { color: #1E8E3E; }
            .status-void { color: #DADCE0; filter: drop-shadow(0 0 2px #fff); }

            .igniting, .updating { animation: pulse-blue 1.5s infinite; pointer-events: none; }
            @keyframes pulse-blue { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            
            .reality-selector {
                font-size: 9px;
                padding: 3px;
                border: 1px solid #DADCE0;
                border-radius: 4px;
                background: white;
            }
        </style>
        <div class="projector-container">
            ${isLoading ? `
                <div class="schema-card">
                    <div class="header"><div class="skeleton sk-header"></div><div class="skeleton sk-badge"></div></div>
                    <div class="body">
                        <div class="skeleton sk-row sk-row-w1"></div>
                        <div class="skeleton sk-row sk-row-w2"></div>
                        <div class="skeleton sk-row sk-row-w3"></div>
                    </div>
                </div>
            ` : 
            (this._schemas.map(s => {
                const isMaterialized = s.mapping || (s.metadata && s.metadata.silo_id);
                return `
                <div class="schema-card ${!isMaterialized ? 'incorporeal' : ''}" id="card-${s.id}">
                    <div class="header">
                        <div style="display:flex; align-items:center;">
                            <span>${(s.handle?.alias || s.id).toUpperCase()}</span>
                            ${isMaterialized 
                                ? `<span class="status-indicator status-cristal" title="Esquema Cristalizado en Silo">⦿</span>` 
                                : `<span class="status-indicator status-void" title="Estado Incorpóreo (Solo Local)">○</span>`}
                        </div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            ${!isMaterialized ? `
                                <select class="reality-selector" id="reality-${s.id}">
                                    <option value="drive">🟢 Drive</option>
                                    <option value="notion">🟣 Notion</option>
                                </select>
                                <button class="btn-ignite" onclick="this.getRootNode().host.handleIgnite('${s.id}')">
                                    <span>⚡</span> MATERIALIZAR
                                </button>
                            ` : `
                                <button class="btn-update" onclick="this.getRootNode().host.handleUpdate('${s.id}')">
                                    <span>🔄</span> ACTUALIZAR EN ${String(s.metadata?.target_provider || 'DRIVE').toUpperCase()}
                                </button>
                            `}
                            <span class="type-badge">${s.class || 'DATA_SCHEMA'}</span>
                        </div>
                    </div>
                    <div class="body">
                        ${(s.fields || s.payload?.fields || []).map(f => `
                            <div class="field-row">
                                <span style="display:flex; align-items:center; gap:6px;">
                                    ${f.label || f.id}
                                    ${(s.metadata && s.metadata.silo_id) ? `<span style="font-size:7px; color:#1E8E3E; opacity:0.8;">🔗 CRYSTALLIZED</span>` : ''}
                                </span>
                                <span class="field-type">${f.type}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;
            }).join('') || '<div style="opacity:0.3; font-size:11px; text-align:center; padding: 20px;">SIN ESQUEMAS DETECTADOS</div>')}
        </div>
        `;
    }

    async handleIgnite(schemaId) {
        const bridge = window.IndraInstance || (window.parent && window.parent.indraBridge);
        if (!bridge) return alert("Indra Bridge no detectado.");

        const realitySelector = this.shadowRoot.getElementById(`reality-${schemaId}`);
        const provider = realitySelector ? realitySelector.value : 'drive';

        const card = this.shadowRoot.getElementById(`card-${schemaId}`);
        card.classList.add('igniting');

        try {
            console.log(`[UI:Projector] Iniciando materialización en plano: ${provider}`);
            await bridge.resonanceSync.materializeSchema(schemaId, { provider });
        } catch (e) {
            alert("COLAPSO INDUSTRIAL: " + e.message);
            card.classList.remove('igniting');
        }
    }

    async handleUpdate(schemaId) {
        const bridge = window.IndraInstance || (window.parent && window.parent.indraBridge);
        if (!bridge) return alert("Indra Bridge no detectado.");

        const card = this.shadowRoot.getElementById(`card-${schemaId}`);
        card.classList.add('updating');

        try {
            console.log(`[UI:Projector] Iniciando actualización contextual: ${schemaId}`);
            // El protocolo de actualización usará INDUSTRIAL_SYNC en el Core
            await bridge.resonanceSync.resonateSchema(schemaId);
        } catch (e) {
            alert("FALLO DE ACTUALIZACIÓN: " + e.message);
        } finally {
            card.classList.remove('updating');
        }
    }
}

customElements.define('indra-schema-projector', IndraSchemaProjector);
