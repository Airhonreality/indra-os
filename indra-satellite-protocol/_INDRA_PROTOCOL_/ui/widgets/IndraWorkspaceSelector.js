/**
 * =============================================================================
 * COMPONENTE: IndraWorkspaceSelector (v3.2 - FINAL STABLE)
 * =============================================================================
 */

class IndraWorkspaceSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._bridge = null;
        this._workspaces = [];
    }

    set bridge(val) {
        this._bridge = val;
        this.fetchWorkspaces();
        
        // Sincronía con los pasos del Handshake
        window.addEventListener('indra-handshake-step', (e) => {
            if (e.detail.step === 'DISCOVER_TERRITORY' || e.detail.step === 'SYNC_COMPLETE') {
                this.fetchWorkspaces();
            }
        });

        window.addEventListener('indra-resonance-sync', (e) => {
            if (e.detail.items) {
                this._workspaces = e.detail.items;
                this.render();
            }
        });
    }

    async fetchWorkspaces() {
        if (!this._bridge || !this._bridge.satelliteToken) return;
        try {
            const response = await this._bridge.execute({
                protocol: 'ATOM_READ',
                context_id: 'workspaces',
                provider: 'system'
            });
            this._workspaces = response.items || [];
            this.render();
        } catch (e) {
            console.error("[WorkspaceSelector] Fallo de escaneo:", e);
        }
    }

    handleSelection(e) {
        const workspaceId = e.target.value;
        if (!workspaceId) return;
        this._bridge.activeWorkspaceId = workspaceId;
        this._bridge.init();
    }

    async createWorkspace() {
        const satName = this._bridge?.contract?.satellite_name || 'Nodo';
        const name = prompt("Nombre de la Nueva Realidad:", `${satName} Alpha 1`);
        if (!name) return;

        try {
            const response = await this._bridge.execute({
                protocol: 'ATOM_CREATE',
                data: { label: name, class: 'WORKSPACE' },
                provider: 'system'
            });

            if (response.metadata?.status === 'OK') {
                await this.fetchWorkspaces();
                alert(`Realidad '${name}' cristalizada.`);
            }
        } catch (e) {
            console.error("[WorkspaceSelector] Error en Génesis:", e);
        }
    }

    render() {
        const activeId = this._bridge?.activeWorkspaceId || '';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; width: 100%; font-family: inherit; }
                .selector-container { display: flex; flex-direction: column; gap: 8px; }
                label { 
                    font-size: 9px; 
                    font-weight: 800; 
                    color: #8E8E93; 
                    text-transform: uppercase; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                }
                .refresh-btn { 
                    cursor: pointer; 
                    color: #007AFF; 
                    text-decoration: none; 
                    font-size: 8px; 
                    border: 1px solid rgba(0,122,255,0.2); 
                    background: rgba(0,122,255,0.05); 
                    padding: 2px 6px; 
                    border-radius: 4px;
                    font-weight: 800;
                }
                .refresh-btn:hover { background: #007AFF; color: white; }
                
                .select-wrapper {
                    background: white;
                    border: 1px solid rgba(60, 60, 67, 0.12);
                    border-radius: 12px;
                    padding: 2px;
                }
                select {
                    background: transparent;
                    border: none;
                    color: #1C1C1E;
                    padding: 10px 12px;
                    font-size: 13px;
                    font-family: 'JetBrains Mono', monospace;
                    width: 100%;
                    outline: none;
                    cursor: pointer;
                }
                .btn-create {
                    background: #34C759;
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 900;
                    cursor: pointer;
                    text-transform: uppercase;
                    margin-top: 8px;
                    box-shadow: 0 4px 12px rgba(52, 199, 89, 0.2);
                    transition: all 0.2s;
                }
                .btn-create:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(52, 199, 89, 0.3); }
            </style>
            <div class="selector-container">
                <label>
                    Seleccionar Workspace
                    <button class="refresh-btn" id="btn-force-scan">Refrescar Lista 🔄</button>
                </label>
                <div class="select-wrapper">
                    <select id="ws-select">
                        <option value="">-- ELIGE UN WORKSPACE --</option>
                        ${this._workspaces.map(ws => `
                            <option value="${ws.id}" ${ws.id === activeId ? 'selected' : ''}>
                                ${ws.handle?.label || ws.id.substring(0,8)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                ${this._workspaces.length === 0 ? `
                    <button id="btn-create-ws" class="btn-create">
                        + Crear Nuevo Workspace
                    </button>
                ` : ''}
            </div>
        `;

        const select = this.shadowRoot.getElementById('ws-select');
        if (select) select.onchange = (e) => this.handleSelection(e);

        const btnCreate = this.shadowRoot.getElementById('btn-create-ws');
        if (btnCreate) btnCreate.onclick = () => this.createWorkspace();

        const btnScan = this.shadowRoot.getElementById('btn-force-scan');
        if (btnScan) btnScan.onclick = () => {
            btnScan.innerText = "BUSCANDO...";
            this.fetchWorkspaces().then(() => btnScan.innerText = "Refrescar Lista 🔄");
        };
    }
}

customElements.define('indra-workspace-selector', IndraWorkspaceSelector);
