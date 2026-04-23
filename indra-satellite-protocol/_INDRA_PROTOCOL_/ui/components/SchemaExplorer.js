/**
 * =============================================================================
 * SCHEMA EXPLORER (HUD Component)
 * =============================================================================
 * Responsibility: Project hierarchical schema structures (Local or Remote).
 * Uses the IndraFractalTree widget internally.
 * =============================================================================
 */

export class SchemaExplorer {
    constructor(container, treeWidget, options = {}) {
        this.container = container;
        this.tree = treeWidget; // Instancia de indra-fractal-tree
        this.origin = options.origin || 'local';
    }

    update(schemas) {
        if (!this.tree) return;

        const _mapFields = (fields) => {
            return (fields || []).map(f => ({
                id: f.id,
                label: f.label || f.id,
                type: 'FIELD',
                value_type: f.type,
                origin: this.origin,
                children: _mapFields(f.children) // Los campos sí pueden tener hijos (Frames)
            }));
        };

        this.tree.data = schemas.map(s => ({
            id: s.id,
            label: s.handle?.label || s.handle?.alias || s.label || s.id,
            type: 'SCHEMA',
            origin: this.origin,
            children: _mapFields(s.payload?.fields)
        }));
    }

    setLoading(msg = 'Refining structure...') {
        if (this.container) {
            const msgEl = this.container.querySelector('.status-msg') || document.createElement('div');
            msgEl.className = 'status-msg';
            msgEl.style = "font-size:10px; opacity:0.5; text-align:center; padding:40px;";
            msgEl.innerText = msg;
            this.container.appendChild(msgEl);
            if (this.tree) this.tree.style.display = 'none';
        }
    }

    showTree() {
        if (this.container) {
            const msgEl = this.container.querySelector('.status-msg');
            if (msgEl) msgEl.remove();
            if (this.tree) this.tree.style.display = 'block';
        }
    }
}
