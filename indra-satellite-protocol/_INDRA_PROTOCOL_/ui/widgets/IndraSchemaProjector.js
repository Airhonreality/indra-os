/**
 * =============================================================================
 * INDRA SCHEMA PROJECTOR (SINCERITY EDITION v5.0 - THE PURE SEED)
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
        if (this._schemas === null) {
            this.shadowRoot.innerHTML = `<div style="padding:40px; text-align:center; opacity:0.5; font-family:inherit; font-size:11px;">📡 Sincronizando con el Manifiesto...</div>`;
            return;
        }

        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; font-family: inherit; }
            .projector-container { 
                display: flex; 
                flex-direction: column; 
                gap: 16px; 
                padding: 10px 20px 30px 20px;
                max-height: calc(100vh - 150px);
                overflow-y: auto; 
            }
            .projector-container::-webkit-scrollbar { width: 6px; }
            .projector-container::-webkit-scrollbar-thumb { background: var(--indra-border); border-radius: 10px; }

            .schema-card { 
                background: white;
                border: 1px solid var(--indra-border); 
                border-radius: 16px; 
                overflow: hidden; 
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            }
            .schema-card:hover { border-color: var(--indra-accent); }

            .header { 
                padding: 12px 20px; 
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid var(--indra-border);
            }
            .schema-title { display: flex; align-items: center; font-size: 11px; font-weight: 800; color: var(--indra-text-main); letter-spacing: 0.05em; }
            
            .body { background: #fafafa; }
            
            summary {
                padding: 10px 20px;
                font-size: 9px;
                font-weight: 800;
                color: var(--indra-text-dim);
                cursor: pointer;
                background: white;
                border-top: 1px solid var(--indra-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                text-transform: uppercase;
                list-style: none;
            }
            summary:hover { color: var(--indra-accent); }
            summary::after { content: '↓'; font-size: 10px; opacity: 0.5; transition: transform 0.3s; }
            details[open] summary::after { transform: rotate(180deg); }
            
            .fields-list { 
                padding: 12px 20px; 
                background: #fff;
                border-top: 1px solid var(--indra-border);
            }
            .field-row { 
                display: flex; 
                justify-content: space-between; 
                padding: 6px 0;
                border-bottom: 1px solid rgba(0,0,0,0.03);
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
            }
            .field-type { color: var(--indra-accent); font-weight: 600; font-size: 9px; opacity: 0.8; }

            .metadata-box {
                padding: 15px 20px;
                background: #fdfdfd;
                border-top: 1px solid var(--indra-border);
                font-family: 'JetBrains Mono', monospace;
                font-size: 9px;
            }
            .meta-item { display: flex; gap: 8px; margin-bottom: 6px; }
            .meta-key { color: var(--indra-text-dim); font-weight: 800; min-width: 80px; }
            .meta-val { color: #444; word-break: break-all; }

            .btn-sync {
                padding: 8px 20px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 800;
                cursor: pointer;
                border: 1px solid var(--indra-accent);
                background: white;
                color: var(--indra-accent);
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .btn-sync:hover { background: var(--indra-accent); color: white; }
            .btn-sync.synced { background: var(--indra-success); color: white; border-color: var(--indra-success); }
            
            .btn-unlink { 
                background: transparent; 
                color: var(--indra-danger); 
                border: none; 
                font-size: 14px; 
                cursor: pointer;
                padding: 4px 8px;
                opacity: 0.4;
            }
            .btn-unlink:hover { opacity: 1; background: rgba(255, 59, 48, 0.1); border-radius: 6px; }
            
            .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 12px; }
            .status-sync { background: var(--indra-success); box-shadow: 0 0 10px var(--indra-success); }
            .status-local { background: var(--indra-text-dim); opacity: 0.3; }

            .badge-sync {
                font-size: 8px;
                background: #000;
                color: #fff;
                padding: 2px 6px;
                border-radius: 4px;
                margin-left: 10px;
            }

            .error-banner {
                padding: 10px 20px;
                background: #fff5f5;
                color: #c53030;
                font-size: 9px;
                border-top: 1px solid #feb2b2;
                font-weight: 600;
            }
        </style>
        <div class="projector-container">
            ${this._schemas.map(s => {
                const meta = s.metadata || {};
                const isSynced = !!meta.drive_id;
                const error = s._lastError;
                
                return `
                <div class="schema-card" id="card-${s.id}">
                    <div class="header">
                        <div class="schema-title">
                            <span class="status-dot ${isSynced ? 'status-sync' : 'status-local'}"></span>
                            <span>${(s.handle?.alias || s.id).toUpperCase()}</span>
                            ${isSynced ? `<span class="badge-sync">NATIVO WORKSPACE</span>` : ''}
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            ${isSynced ? `<button class="btn-unlink" title="Desvincular" onclick="this.getRootNode().host.handleUnlink('${s.id}')">✕</button>` : ''}
                            <button class="btn-sync ${isSynced ? 'synced' : ''}" onclick="this.getRootNode().host.handleSync('${s.id}')">
                                ${isSynced ? 'Actualizar' : 'Sincronizar'}
                            </button>
                        </div>
                    </div>
                    ${error ? `<div class="error-banner">⚠ ERROR: ${error}</div>` : ''}
                    <div class="body">
                        <details name="indra-accordion">
                            <summary>Estructura de Datos</summary>
                            <div class="fields-list">
                                ${(s.fields || s.payload?.fields || []).map(f => `
                                    <div class="field-row">
                                        <span class="field-label">${f.label || f.id}</span>
                                        <span class="field-type">${f.type}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                        
                        ${isSynced ? `
                        <details name="indra-accordion">
                            <summary>Evidencia Física (Sinceridad)</summary>
                            <div class="metadata-box">
                                <div class="meta-item"><span class="meta-key">DRIVE_FILE_ID:</span> <span class="meta-val">${meta.drive_id}</span></div>
                                <div class="meta-item"><span class="meta-key">SYNCED_AT:</span> <span class="meta-val">${meta.synced_at || 'Desconocido'}</span></div>
                                <div class="meta-item"><span class="meta-key">LOCATION:</span> <span class="meta-val">${meta.artifacts_folder || 'Workspace Folder'}</span></div>
                            </div>
                        </details>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        `;
    }

    async handleSync(schemaId) {
        const bridge = this._bridge;
        const schema = this._schemas.find(s => s.id === schemaId);
        if (!schema) return;

        try {
            schema._lastError = null;
            this.render();
            console.log(`[Sincerity] Sincronizando semilla: ${schemaId}...`);
            await bridge.resonanceSync.anchorSchema(schemaId);
        } catch (e) {
            schema._lastError = e.message;
        } finally {
            this.render();
        }
    }

    async handleUnlink(schemaId) {
        if (!confirm(`¿Deseas desvincular físicamente '${schemaId}' de este Workspace?`)) return;
        const bridge = this._bridge;
        const schema = this._schemas.find(s => s.id === schemaId);
        if (schema) {
            schema.metadata = {};
            if (bridge.ignitions) delete bridge.ignitions[schemaId];
            localStorage.setItem('INDRA_IGNITIONS', JSON.stringify(bridge.ignitions));
        }
        this.render();
    }
}

customElements.define('indra-schema-projector', IndraSchemaProjector);
