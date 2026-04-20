/**
 * =============================================================================
 * INDRA SCHEMA PROJECTOR (Standard UI v3.0)
 * =============================================================================
 */

class IndraSchemaProjector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._schemas = null; 
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
                background: white; 
                border: 1px solid rgba(60, 60, 67, 0.12); 
                border-radius: 12px; 
                overflow: hidden; 
            }
            .header { 
                background: #F8F9FA; 
                padding: 12px; 
                font-size: 11px; 
                font-weight: 700; 
                border-bottom: 1px solid rgba(60, 60, 67, 0.12);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .type-badge { font-size: 8px; color: #8E8E93; background: #E8EAED; padding: 2px 6px; border-radius: 4px; }
            .body { padding: 12px; font-size: 11px; }
            .field-row { display: flex; justify-content: space-between; margin-bottom: 6px; color: #1C1C1E; }
            .field-type { color: #8E8E93; font-size: 9px; }
            
            .btn-action {
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 800;
                cursor: pointer;
                border: none;
                text-transform: uppercase;
                transition: all 0.2s;
            }
            .btn-ignite { background: #007AFF; color: white; }
            .btn-ignite:hover { background: #0051FF; }
            .btn-update { background: #E8EAED; color: #1C1C1E; border: 1px solid rgba(0,0,0,0.1); }
            
            .status-indicator { font-size: 12px; margin-right: 6px; }
            .status-sync { color: #34C759; }
            .status-local { color: #8E8E93; }

            .igniting { opacity: 0.5; pointer-events: none; }
            
            .target-selector {
                font-size: 10px;
                padding: 4px;
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: 6px;
                background: white;
                margin-right: 8px;
            }
        </style>
        <div class="projector-container">
            ${isLoading ? `<div style="padding:20px; text-align:center; opacity:0.5;">Cargando esquemas...</div>` : 
            (this._schemas.map(s => {
                const isSynced = s.metadata?.silo_id || s.mapping;
                return `
                <div class="schema-card" id="card-${s.id}">
                    <div class="header">
                        <div style="display:flex; align-items:center;">
                            <span class="status-indicator ${isSynced ? 'status-sync' : 'status-local'}">●</span>
                            <span>${(s.handle?.alias || s.id).toUpperCase()}</span>
                        </div>
                        <div style="display:flex; align-items:center;">
                            ${!isSynced ? `
                                <select class="target-selector" id="target-${s.id}">
                                    <option value="drive">Google Sheets</option>
                                    <option value="notion" disabled>Notion</option>
                                </select>
                                <button class="btn-action btn-ignite" onclick="this.getRootNode().host.handleExport('${s.id}')">
                                    Exportar a Sheets
                                </button>
                            ` : `
                                <button class="btn-action btn-update" onclick="this.getRootNode().host.handleSync('${s.id}')">
                                    Sincronizar Datos
                                </button>
                            `}
                        </div>
                    </div>
                    <div class="body">
                        ${(s.fields || s.payload?.fields || []).map(f => `
                            <div class="field-row">
                                <span>${f.label || f.id}</span>
                                <span class="field-type">${f.type}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;
            }).join('') || '<div style="opacity:0.3; font-size:11px; text-align:center; padding: 40px;">No se encontraron esquemas en el contrato.</div>')}
        </div>
        `;
    }

    async handleExport(schemaId) {
        const bridge = window.IndraInstance || window.indraBridge;
        if (!bridge) return alert("Error: No se detectó conexión con el Bridge.");

        const target = this.shadowRoot.getElementById(`target-${schemaId}`).value;
        const card = this.shadowRoot.getElementById(`card-${schemaId}`);
        card.classList.add('igniting');

        try {
            console.log(`[Projector] Exportando esquema ${schemaId} a ${target}...`);
            // El método materializeSchema sigue siendo el técnico en el bridge
            await bridge.resonanceSync.materializeSchema(schemaId, { provider: target });
            alert("Esquema exportado con éxito.");
        } catch (e) {
            alert("Error al exportar: " + e.message);
        } finally {
            card.classList.remove('igniting');
        }
    }

    async handleSync(schemaId) {
        const bridge = window.IndraInstance || window.indraBridge;
        if (!bridge) return;

        const card = this.shadowRoot.getElementById(`card-${schemaId}`);
        card.classList.add('igniting');

        try {
            await bridge.resonanceSync.resonateSchema(schemaId);
            alert("Datos sincronizados.");
        } catch (e) {
            alert("Error de sincronización: " + e.message);
        } finally {
            card.classList.remove('igniting');
        }
    }
}

customElements.define('indra-schema-projector', IndraSchemaProjector);
