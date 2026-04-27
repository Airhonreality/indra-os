/**
 * =============================================================================
 * INDRA FRACTAL TREE (Atomic Widget v1.0)
 * =============================================================================
 * Responsabilidad: Proyectar jerarquías de datos (Schemas) de forma recursiva.
 * Agnosticismo Radical: Solo JS Vanilla y CSS Scoped.
 * =============================================================================
 */

const STYLES = `
    :host {
        display: block;
        font-family: 'JetBrains Mono', monospace;
        color: var(--indra-text-main, #1c1c1e);
        --tree-gap: 16px;
        --tree-line: rgba(0,0,0,0.08);
        --accent: #007AFF;
    }

    .tree-root {
        padding: 10px;
        user-select: none;
    }

    .node {
        margin-left: var(--tree-gap);
        border-left: 1px solid var(--tree-line);
        position: relative;
    }

    .node-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        cursor: pointer;
        transition: background 0.2s;
        border-radius: 4px;
        font-size: 11px;
    }

    .node-header:hover {
        background: rgba(255,255,255,0.05);
    }

    .node-header::before {
        content: '';
        position: absolute;
        left: -16px;
        top: 15px;
        width: 12px;
        height: 1px;
        background: var(--tree-line);
    }

    .icon {
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        opacity: 0.7;
    }

    .label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .type-badge {
        font-size: 8px;
        padding: 2px 5px;
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
        opacity: 0.5;
        text-transform: uppercase;
    }

    .children {
        display: none;
    }

    .node.expanded > .children {
        display: block;
    }

    .node.expanded > .node-header .arrow {
        transform: rotate(90deg);
    }

    .arrow {
        font-size: 8px;
        transition: transform 0.2s;
        opacity: 0.5;
    }

    /* Estados de Resonancia */
    .node[data-origin="core"] .node-header { color: #34C759; }
    .node[data-origin="local"] .node-header { color: #007AFF; }

    .import-btn, .export-btn { 
        padding: 2px 6px; font-size: 8px; color: white; border: none; 
        border-radius: 4px; cursor: pointer; display: none; margin-left: 8px; font-family: sans-serif;
    }
    .import-btn { background: #34C759; }
    .export-btn { background: #007AFF; }
    
    .node:hover > .node-header .import-btn { display: inline-block; }
    .node:hover > .node-header .export-btn { display: inline-block; }
    .node:hover > .node-header .delete-btn { display: inline-block; }

    .delete-btn { background: #FF3B30; padding: 2px 6px; font-size: 8px; color: white; border: none; border-radius: 4px; cursor: pointer; display: none; margin-left: 8px; font-family: sans-serif; }
`;

export class IndraFractalTree extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._data = [];
        this._onSelect = null;
    }

    set data(val) {
        this._data = val;
        this.render();
    }

    set onSelect(callback) {
        this._onSelect = callback;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const template = document.createElement('template');
        template.innerHTML = `
            <style>${STYLES}</style>
            <div class="tree-root">
                ${this._data.map(item => this.renderNode(item)).join('')}
            </div>
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.shadowRoot.querySelectorAll('.node-header').forEach(header => {
            header.onclick = (e) => {
                // Si el clic viene del botón de importar, no colapsar/expandir
                if (e.target.classList.contains('import-btn')) return;

                const node = header.parentElement;
                const isSchema = node.getAttribute('data-type') === 'SCHEMA';
                const childrenContainer = node.querySelector('.children');
                const hasChildren = (childrenContainer && childrenContainer.children.length > 0);

                if (isSchema || hasChildren) {
                    node.classList.toggle('expanded');
                }

                // LAZY LOADING: Si expandimos un esquema vacío, notificamos al sistema
                if (isSchema && !hasChildren && node.classList.contains('expanded')) {
                    this.dispatchEvent(new CustomEvent('indra-node-expand', {
                        detail: { id: node.getAttribute('data-id'), origin: node.getAttribute('data-origin') },
                        bubbles: true, composed: true
                    }));
                }
                
                if (this._onSelect) {
                    const id = node.getAttribute('data-id');
                    this._onSelect(id, node.getAttribute('data-type'));
                }
            };
        });

        // Handler para el botón de importación (PULL)
        this.shadowRoot.querySelectorAll('.import-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const nodeEl = btn.closest('.node');
                const nodeId = nodeEl.getAttribute('data-id');
                const nodeData = this._data.find(n => n.id === nodeId);
                
                this.dispatchEvent(new CustomEvent('indra-import-schema', { 
                    detail: nodeData,
                    bubbles: true,
                    composed: true
                }));
            };
        });

        // Handler para el botón de exportación (PUSH)
        this.shadowRoot.querySelectorAll('.export-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const nodeEl = btn.closest('.node');
                const nodeId = nodeEl.getAttribute('data-id');
                const nodeData = this._data.find(n => n.id === nodeId);
                
                this.dispatchEvent(new CustomEvent('indra-export-schema', { 
                    detail: nodeData,
                    bubbles: true,
                    composed: true
                }));
            };
        });

        // Handler para el botón de borrado (DELETE TOTAL)
        this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const nodeEl = btn.closest('.node');
                const nodeId = nodeEl.getAttribute('data-id');
                const origin = nodeEl.getAttribute('data-origin');
                
                this.dispatchEvent(new CustomEvent('indra-delete-node', { 
                    detail: { id: nodeId, origin: origin },
                    bubbles: true,
                    composed: true
                }));
            };
        });
    }

    renderNode(node) {
        const hasChildren = node.children && node.children.length > 0;
        const isExpandable = hasChildren || node.type === 'SCHEMA';
        const icon = node.icon || (node.type === 'SCHEMA' ? '📁' : '📄');
        const origin = node.origin || 'local';

        return `
            <div class="node" data-id="${node.id}" data-type="${node.type}" data-origin="${origin}">
                <div class="node-header">
                    <span class="arrow">${isExpandable ? '▶' : ''}</span>
                    <span class="icon">${icon}</span>
                    <span class="label">${node.label || node.id}</span>
                    ${node.value_type ? `<span class="type-badge">${node.value_type}</span>` : ''}
                    ${node.type === 'SCHEMA' && origin === 'core' ? `<button class="import-btn">PULL</button>` : ''}
                    ${node.type === 'SCHEMA' && origin === 'local' ? `<button class="export-btn">PUSH</button>` : ''}
                    ${node.type === 'SCHEMA' ? `<button class="delete-btn">DELETE</button>` : ''}
                </div>
                <div class="children">
                    ${hasChildren ? node.children.map(child => this.renderNode(child)).join('') : ''}
                </div>
            </div>
        `;
    }
}

customElements.define('indra-hud-tree', IndraFractalTree);
