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
        this._bridge = null;
    }

    set bridge(val) {
        this._bridge = val;
    }

    set schemas(data) {
        const newData = data || [];
        if (JSON.stringify(this._schemas) === JSON.stringify(newData)) return;
        this._schemas = newData;
        this.render();
    }

    render() {
        const isLoading = this._schemas === null;
        
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; font-family: inherit; }
            :host { display: block; font-family: inherit; }
            .projector-container { 
                display: flex; 
                flex-direction: column; 
                gap: 12px; 
                padding: 20px;
                max-height: 80vh; 
                overflow-y: auto; 
            }
            /* Custom Scrollbar */
            .projector-container::-webkit-scrollbar { width: 4px; }
            .projector-container::-webkit-scrollbar-track { background: transparent; }
            .projector-container::-webkit-scrollbar-thumb { background: var(--indra-border); border-radius: 10px; }

            .schema-card { 
                background: white;
                border: 1px solid var(--indra-border); 
                border-radius: 12px; 
                overflow: hidden; 
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            }
            .schema-card:hover { border-color: var(--indra-accent); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }

            .header { 
                padding: 12px 16px; 
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(0,0,0,0.01);
            }
            .schema-title { font-size: 11px; font-weight: 800; color: var(--indra-text-main); }
            
            .body { 
                border-top: 1px solid var(--indra-border);
                padding: 0;
            }
            
            summary {
                padding: 10px 16px;
                font-size: 10px;
                font-weight: 700;
                color: var(--indra-text-dim);
                cursor: pointer;
                background: var(--indra-surface);
                list-style: none;
                display: flex;
                justify-content: space-between;
            }
            summary:hover { background: #eee; }
            summary::after { content: '▾'; opacity: 0.5; }
            
            .fields-list { padding: 10px 16px; background: white; }
            .field-row { 
                display: flex; 
                justify-content: space-between; 
                padding: 4px 0;
                border-bottom: 1px solid rgba(0,0,0,0.03);
                font-size: 10px;
            }
            .field-row:last-child { border-bottom: none; }
            .field-type { color: var(--indra-accent); font-family: monospace; font-size: 9px; }

            .btn-action {
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 800;
                cursor: pointer;
                border: none;
                transition: all 0.2s;
            }
            .btn-ignite { background: var(--indra-accent); color: white; }
            .btn-update { background: transparent; color: var(--indra-accent); border: 1px solid var(--indra-accent); }
            
            .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 8px; }
            .status-sync { background: var(--indra-success); box-shadow: 0 0 8px var(--indra-success); }
            .status-local { background: var(--indra-text-dim); }

            .igniting { opacity: 0.5; pointer-events: none; }
            
            .target-selector {
                font-size: 9px;
                padding: 3px 6px;
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: 6px;
                background: white;
                margin-right: 6px;
                font-weight: 700;
            }
        </style>
        <div class="projector-container">
            ${isLoading ? `<div style="padding:20px; text-align:center; opacity:0.5;">Cargando esquemas...</div>` : 
            (this._schemas.map(s => {
                const isSynced = s.metadata?.silo_id || s.mapping;
                return `
                <div class="schema-card" id="card-${s.id}">
                    <div class="header">
                        <div class="schema-title">
                            <span class="status-dot ${isSynced ? 'status-sync' : 'status-local'}"></span>
                            <span>${(s.handle?.alias || s.id).toUpperCase()}</span>
                        </div>
                        <div style="display:flex; align-items:center;">
                            ${!isSynced ? `
                                <select class="target-selector" id="target-${s.id}">
                                    <option value="drive">Google Sheets</option>
                                    <option value="notion" disabled>Notion</option>
                                </select>
                                <button class="btn-action btn-ignite" onclick="this.getRootNode().host.handleExport('${s.id}')">
                                    Exportar
                                </button>
                            ` : `
                                <button class="btn-action btn-update" onclick="this.getRootNode().host.handleSync('${s.id}')">
                                    Sincronizar
                                </button>
                            `}
                        </div>
                    </div>
                    <div class="body">
                        <details>
                            <summary>Estructura de Datos</summary>
                            <div class="fields-list">
                                ${(s.fields || s.payload?.fields || []).map(f => `
                                    <div class="field-row">
                                        <span>${f.label || f.id}</span>
                                        <span class="field-type">${f.type}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    </div>
                </div>
                `;
            }).join('') || '<div style="opacity:0.3; font-size:11px; text-align:center; padding: 40px;">No se encontraron esquemas en el contrato.</div>')}
        </div>
        `;
    }

    async handleExport(schemaId) {
        const bridge = this._bridge;
        if (!bridge) return alert("Error: No se detectó conexión con el Bridge.");

        const target = this.shadowRoot.getElementById(`target-${schemaId}`).value;
        const card = this.shadowRoot.getElementById(`card-${schemaId}`);
        card.classList.add('igniting');

        try {
            console.log(`[Projector] Exportando esquema ${schemaId} a ${target}...`);
            await bridge.resonanceSync.materializeSchema(schemaId, { provider: target });
            alert("Esquema exportado con éxito.");
        } catch (e) {
            alert("Error al exportar: " + e.message);
        } finally {
            card.classList.remove('igniting');
        }
    }

    async handleSync(schemaId) {
        const bridge = this._bridge;
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
