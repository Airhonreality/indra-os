/**
 * =============================================================================
 * WORKSPACE CONTROLLER (HUD Component)
 * =============================================================================
 * Responsibility: Handle workspace discovery and selection logic.
 * No business logic, only UI management for connection points.
 * =============================================================================
 */

const STYLES = `
    .workspace-list { display: flex; flex-direction: column; gap: 8px; }
    .card { 
        padding: 12px; border: 1px solid var(--indra-border); border-radius: 8px; 
        cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.02);
    }
    .card:hover { border-color: var(--indra-accent); background: var(--indra-bg); }
    .card.active { border-color: var(--indra-accent); background: rgba(0,122,255,0.05); }
    .alias { font-weight: 800; font-size: 11px; display: block; }
    .id { font-size: 9px; opacity: 0.5; font-family: 'JetBrains Mono', monospace; }
`;

export class WorkspaceController {
    constructor(container, bridge, onSelect) {
        this.container = container;
        this.bridge = bridge;
        this.onSelect = onSelect;
        this.workspaces = [];
        this.selectedId = null;
    }

    async init() {
        this.container.innerHTML = `<style>${STYLES}</style><div class="workspace-list">Loading Workspaces...</div>`;
        await this.refresh();
    }

    async refresh() {
        // AXIAL REDEMPTION: Usar Workspaces descubiertos, no los pins (atoms)
        if (!this.bridge || !this.bridge.availableWorkspaces) return;
        
        try {
            this.workspaces = this.bridge.availableWorkspaces || [];
            this.render();
        } catch (e) {
            this.container.innerHTML = `<div style="font-size:10px; color:red;">Discovery Error</div>`;
        }
    }

    render() {
        const list = this.container.querySelector('.workspace-list');
        if (!list) return;

        if (this.workspaces.length === 0) {
            list.innerHTML = `<div style="font-size:10px; opacity:0.5; padding:20px;">No workspaces found.</div>`;
            return;
        }

        list.innerHTML = this.workspaces.map(ws => `
            <div class="card ${this.selectedId === ws.id ? 'active' : ''}" data-id="${ws.id}">
                <span class="alias">${ws.handle?.label || ws.handle?.alias || 'Unnamed'}</span>
                <span class="id">${ws.id.substring(0, 16)}...</span>
            </div>
        `).join('');

        list.querySelectorAll('.card').forEach(card => {
            card.onclick = () => {
                const id = card.getAttribute('data-id');
                this.selectedId = id;
                this.render();
                if (this.onSelect) this.onSelect(id);
            };
        });
    }
}
