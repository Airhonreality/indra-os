/**
 * =============================================================================
 * COMPONENTE: IndraWorkspaceSelector (v1.0)
 * RESPONSABILIDAD: Motor de Selección de Jurisdicción (Contexto).
 * 
 * Este widget permite al usuario Maestro definir sobre qué 'Veta' de datos
 * desea operar. Al cambiar de workspace, el Bridge se re-inicializa para
 * forzar una nueva cristalización de esquemas y flujos específicos.
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
        
        /**
         * AXIOMA ISP v2.5: Resonancia vía Ventana Nativa.
         * Escuchamos 'indra-ready' para refrescar el catálogo de contextos
         * cada vez que el Bridge establece una conexión sólida.
         */
        window.addEventListener('indra-ready', () => this.fetchWorkspaces());
    }

    async fetchWorkspaces() {
        if (!this._bridge || !this._bridge.satelliteToken) return;

        try {
            // Axioma: Descubrimiento Físico Directo (Sinceridad de Territorio)
            const response = await this._bridge.execute({
                protocol: 'SYSTEM_SATELLITE_DISCOVER',
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
        
        // 1. Actualizar el Bridge (Memoria RAM únicamente)
        this._bridge.activeWorkspaceId = workspaceId;
        
        // 2. Reiniciar el Bridge para cristalizar el nuevo contexto
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
                ${this._workspaces.length === 0 ? `
                    <button id="btn-create-ws" style="margin-top:10px; background: #34A853; color: white; border: none; padding: 6px; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: bold;">
                        + CREAR PRIMER WORKSPACE
                    </button>
                ` : ''}
            </div>
        `;

        const select = this.shadowRoot.getElementById('ws-select');
        if (select) select.onchange = (e) => this.handleSelection(e);

        const btnCreate = this.shadowRoot.getElementById('btn-create-ws');
        if (btnCreate) btnCreate.onclick = () => this.createWorkspace();
    }

    async createWorkspace() {
        const name = prompt("Nombre del Nuevo Workspace:", "Mi Veta");
        if (!name) return;

        try {
            await this._bridge.execute({
                protocol: 'ATOM_CREATE',
                data: { label: name, class: 'WORKSPACE' },
                provider: 'system'
            });
            this.fetchWorkspaces();
        } catch (e) {
            alert("Error al crear workspace. Verifica la conexión.");
        }
    }
}

customElements.define('indra-workspace-selector', IndraWorkspaceSelector);
