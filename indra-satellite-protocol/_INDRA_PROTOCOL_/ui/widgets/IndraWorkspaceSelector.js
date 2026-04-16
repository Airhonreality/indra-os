/**
 * =============================================================================
 * COMPONENTE: IndraWorkspaceSelector
 * RESPONSABILIDAD: Permitir la elección del contexto (Silo) de trabajo.
 * Solo se activa si el Bridge tiene jurisdicción MASTER.
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
        // Escuchar cambios globales (ej: por si el token cambia)
        this._bridge.on('sync', () => this.fetchWorkspaces());
    }

    async fetchWorkspaces() {
        if (!this._bridge || !this._bridge.satelliteToken) return;

        try {
            // Axioma: Consultar workspaces disponibles al Core
            const response = await this._bridge.execute({
                protocol: 'ATOM_READ',
                context_id: 'workspaces',
                provider: 'system'
            });

            this._workspaces = response.items || [];
            this.render();
        } catch (e) {
            console.error("[WorkspaceSelector] No se pudo obtener la lista de Workspaces:", e);
        }
    }

    handleSelection(e) {
        const workspaceId = e.target.value;
        if (!workspaceId) return;

        console.log(`[WorkspaceSelector] Cambiando contexto a: ${workspaceId}`);
        
        // 1. Actualizar el Bridge
        this._bridge.activeWorkspaceId = workspaceId;
        
        // 2. Persistir para refrescos
        const link = JSON.parse(localStorage.getItem('INDRA_SATELLITE_LINK') || '{}');
        link.workspaceId = workspaceId;
        localStorage.setItem('INDRA_SATELLITE_LINK', JSON.stringify(link));

        // 3. Reiniciar el Bridge para cristalizar el nuevo contexto
        this._bridge.init().then(() => {
             // Notificar al HUD que todo cambió
             window.dispatchEvent(new CustomEvent('indra:workspace_changed', { detail: { workspaceId } }));
        });
    }

    render() {
        const activeId = this._bridge?.activeWorkspaceId || '';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; width: 100%; }
                .selector-container {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                label {
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    opacity: 0.6;
                    font-weight: 700;
                }
                select {
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #4285F4;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-family: 'JetBrains Mono', monospace;
                    width: 100%;
                    cursor: pointer;
                    outline: none;
                }
                select:hover { border-color: rgba(255,255,255,0.2); }
                option { background: #1a1a1a; color: white; }
            </style>
            <div class="selector-container">
                <label>Contexto de Trabajo (Workspace)</label>
                <select id="ws-select">
                    <option value="">-- SELECCIONE WORKSPACE --</option>
                    ${this._workspaces.length === 0 ? '<option disabled>SIN_WORKSPACES_DETECTADOS</option>' : ''}
                    ${this._workspaces.map(ws => `
                        <option value="${ws.id}" ${ws.id === activeId ? 'selected' : ''}>
                            ${ws.handle?.label || ws.id}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;

        const select = this.shadowRoot.getElementById('ws-select');
        if (select) select.onchange = (e) => this.handleSelection(e);
    }
}

customElements.define('indra-workspace-selector', IndraWorkspaceSelector);
