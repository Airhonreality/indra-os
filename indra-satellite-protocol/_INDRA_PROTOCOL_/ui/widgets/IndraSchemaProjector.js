/**
 * =============================================================================
 * INDRA SCHEMA PROJECTOR (v6.0 - TOTAL REVELATION)
 * =============================================================================
 * Responsabilidad: Visor técnico de metadatos y control de sincronía atómica.
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
        this._autoDiscoverRemoteSignals();
    }

    _autoDiscoverRemoteSignals() {
        if (!this._bridge || !this._schemas) return;
        this._schemas.forEach(s => {
            if (s.metadata?.drive_id && !s._remoteState) {
                this.handleRefreshRemote(s.id);
            }
        });
    }

    render() {
        if (this._schemas === null) {
            this.shadowRoot.innerHTML = `<div style="padding:40px; text-align:center; opacity:0; animation: fadeIn 0.5s forwards;">⌛ Escaneando Estructuras...</div>
            <style>@keyframes fadeIn { to { opacity: 0.5; } }</style>`;
            return;
        }

        this.shadowRoot.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;600;800&display=swap');
            
            :host { 
                display: block; font-family: 'Inter', sans-serif; 
                --indra-accent: #007AFF; 
                --indra-border: rgba(0,0,0,0.1); 
                --indra-bg-soft: #f9f9fb;
                --indra-warning: #ff9f0a;
            }
            
            .projector-container { display: flex; flex-direction: column; gap: 20px; padding: 20px 0; }
            
            .header-info { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; }
            .header-info h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #8e8e93; margin: 0; }
            
            .btn-scan {
                background: white; border: 1px solid var(--indra-border); border-radius: 8px;
                padding: 8px 14px; font-size: 10px; font-weight: 600; cursor: pointer; color: #1c1c1e;
                transition: all 0.2s;
            }
            .btn-scan:hover { background: #f2f2f7; border-color: #8e8e93; }

            /* --- CARDS --- */
            .schema-card { 
                background: white; border: 1px solid var(--indra-border); 
                border-radius: 12px; margin: 10px;
                display: flex; flex-direction: column;
                overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02);
            }
            
            .card-header { 
                padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
                background: white; border-bottom: 1px solid var(--indra-border);
            }
            
            .schema-identity { display: flex; align-items: center; gap: 12px; }
            .status-indicator { width: 8px; height: 8px; border-radius: 50%; background: #d1d1d6; }
            .status-indicator.synced { background: #34c759; box-shadow: 0 0 8px rgba(52, 199, 89, 0.4); }
            .status-indicator.divergent { background: var(--indra-warning); box-shadow: 0 0 8px rgba(255, 159, 10, 0.4); }
            
            .schema-name { font-size: 13px; font-weight: 800; color: #1c1c1e; }
            .schema-file { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #8e8e93; }

            .btn-action-main {
                background: var(--indra-accent); color: white; border: none; border-radius: 10px;
                padding: 8px 18px; font-size: 10px; font-weight: 700; cursor: pointer;
                transition: filter 0.2s; text-transform: uppercase;
            }
            .btn-action-main:hover { filter: brightness(1.1); }
            .btn-action-main.outline { background: white; color: var(--indra-accent); border: 1px solid var(--indra-accent); }

            /* --- METADATA GRID --- */
            .metadata-inspector { padding: 0; }
            
            table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: auto; }
            th { 
                text-align: left; padding: 1rem; color: #8e8e93; font-weight: 600; 
                background: var(--indra-bg-soft); border-bottom: 1px solid var(--indra-border);
                text-transform: uppercase; font-size: 9px;
            }
            td { padding: 1rem; border-bottom: 1px solid rgba(0,0,0,0.03); vertical-align: middle; }
            
            .id-badge { font-family: 'IBM Plex Mono', monospace; color: #8e8e93; font-size: 10px; }
            .type-badge { 
                padding: 4px 8px; background: #f2f2f7; border-radius: 6px; 
                font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600;
            }
            
            .divergence-row { background: rgba(255, 159, 10, 0.05); }
            .divergence-label { color: var(--indra-warning); font-weight: 800; font-size: 8px; margin-top: 4px; }

            /* --- BUTTONS --- */
            .action-cell { display: flex; gap: 8px; justify-content: flex-end; }
            .btn-trad {
                padding: 6px 12px; border-radius: 6px; border: 1px dotted var(--indra-border);
                background: white; color: #1c1c1e; font-size: 10px; font-weight: 600; 
                cursor: pointer; transition: 0.2s;
            }
            .btn-trad:hover { background: #1c1c1e; color: white; border-color: #1c1c1e; }
            .btn-trad.accent { border-style: solid; color: var(--indra-accent); border-color: var(--indra-accent); }
            .btn-trad.accent:hover { background: var(--indra-accent); color: white; }

            details { border-top: 1px solid var(--indra-border); }
            summary { 
                padding: 12px 25px; font-size: 10px; font-weight: 700; color: #8e8e93;
                cursor: pointer; list-style: none; user-select: none;
            }
            summary:hover { color: var(--indra-accent); }
        </style>

        <div class="projector-container">
            <div class="header-info">
                <h3>Esquemas Detectados en Proyecto</h3>
                <button class="btn-scan" id="btn-scan-root">Refrescar Escaneo Local</button>
            </div>

            ${this._schemas.map(s => this._renderSchemaInspector(s)).join('')}
        </div>
        `;

        this._setupListeners();
    }

    _renderSchemaInspector(s) {
        const meta = s.metadata || {};
        const isSynced = !!meta.drive_id;
        const remote = s._remoteState || null;
        const fields = s.payload?.fields || s.fields || [];
        const remoteFields = remote?.fields || remote?.payload?.fields || [];

        // Identificar Divergencias
        let hasDivergence = false;
        if (isSynced && remote) {
            hasDivergence = fields.some(f => {
                const rf = remoteFields.find(r => r.id === f.id);
                return this._checkDivergence(f, rf);
            }) || fields.length !== remoteFields.length;
        }

        return `
        <div class="schema-card">
            <div class="card-header">
                <div class="schema-identity">
                    <div class="status-indicator ${isSynced ? (hasDivergence ? 'divergent' : 'synced') : ''}"></div>
                    <div>
                        <div class="schema-name">${(s.handle?.alias || s.id).toUpperCase()}</div>
                        <div class="schema-file">${s._source?.file || 'manual_entry.js'}</div>
                    </div>
                </div>
                <div class="header-actions">
                    <button class="btn-action-main ${isSynced ? 'outline' : ''}" onclick="this.getRootNode().host.handleFullSync('${s.id}')">
                        ${isSynced ? (hasDivergence ? 'Actualizar Core' : 'Sincronizado') : 'Exportar al Core'}
                    </button>
                </div>
            </div>

            <div class="metadata-inspector">
                <table>
                    <thead>
                        <tr>
                            <th>Propiedad / Metadatos</th>
                            <th>ID Átomo</th>
                            <th>Tipo de Dato</th>
                            <th>Mapeo Drive</th>
                            <th style="text-align:right;">Sincronía Atómica</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fields.map(f => this._renderFieldRow(s.id, f, remoteFields.find(rf => rf.id === f.id), isSynced)).join('')}
                    </tbody>
                </table>
            </div>

            <details>
                <summary>PROPIEDADES DEL TRONCO (JSON)</summary>
                <div style="padding: 20px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #444; background: #fafafa;">
                    <pre style="margin:0;">${JSON.stringify(s, null, 2)}</pre>
                </div>
            </details>
        </div>
        `;
    }

    _renderFieldRow(schemaId, local, remote, isSynced) {
        const isDivergent = isSynced && remote && this._checkDivergence(local, remote);
        return `
            <tr class="${isDivergent ? 'divergence-row' : ''}">
                <td>
                    <div style="font-weight: 600; color: #1c1c1e;">${local.label}</div>
                    ${isDivergent ? `<div class="divergence-label">⚠️ DIVERGENCIA DETECTADA</div>` : ''}
                </td>
                <td class="id-badge">${local.id}</td>
                <td><span class="type-badge">${local.type}</span></td>
                <td style="opacity:0.5; font-size:9px;">${local.mapping?.drive || '--'}</td>
                <td class="action-cell">
                    <button class="btn-trad" onclick="this.getRootNode().host.handleAtomicPull('${schemaId}', '${local.id}')">IMPORTAR</button>
                    <button class="btn-trad accent" onclick="this.getRootNode().host.handleAtomicPush('${schemaId}', '${local.id}')">EXPORTAR</button>
                </td>
            </tr>
        `;
    }

    _checkDivergence(f1, f2) {
        if (!f2) return true;
        return f1.type !== f2.type || f1.label !== f2.label;
    }

    _setupListeners() {
        const scanBtn = this.shadowRoot.getElementById('btn-scan-root');
        if (scanBtn) {
            scanBtn.onclick = () => {
                this.dispatchEvent(new CustomEvent('indra-refresh-local', { bubbles: true, composed: true }));
            };
        }
    }

    async handleAtomicPush(schemaId, fieldId) {
        const schema = this._schemas.find(s => s.id === schemaId);
        const field = (schema.fields || schema.payload?.fields || []).find(f => f.id === fieldId);
        try {
            await this._bridge.resonanceSync.patchSchemaField(schemaId, field);
            this.handleRefreshRemote(schemaId);
        } catch (e) {
            alert("Error en Exportación: " + e.message);
        }
    }

    async handleAtomicPull(schemaId, fieldId) {
        alert("Comando 'IMPORTAR': Esta acción requiere escritura en disco local. No implementada en cliente puro.");
    }

    async handleFullSync(schemaId) {
        try {
            await this._bridge.resonanceSync.anchorSchema(schemaId);
            this.handleRefreshRemote(schemaId);
        } catch (e) {
            alert("Fallo en Exportación Global: " + e.message);
        }
    }

    async handleRefreshRemote(schemaId) {
        const schema = this._schemas.find(s => s.id === schemaId);
        if (!schema || !schema.metadata?.drive_id) return;
        try {
            const resp = await this._bridge.execute({
                protocol: 'ATOM_READ',
                provider: 'drive',
                context_id: schema.metadata.drive_id
            });
            if (resp.metadata?.status === 'OK') {
                schema._remoteState = resp.items?.[0]?.payload;
                this.render();
            }
        } catch (e) {
            console.warn("Fallo el sondeo del Core para " + schemaId);
        }
    }
}

customElements.define('indra-schema-projector', IndraSchemaProjector);
