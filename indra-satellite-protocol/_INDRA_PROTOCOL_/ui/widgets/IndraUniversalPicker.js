/**
 * =============================================================================
 * INDRA UNIVERSAL PICKER (v2.1)
 * =============================================================================
 * Responsabilidad: Interfaz de búsqueda y selección de Átomos en Silos externos.
 * DHARMA: Invocador de protocolos de descubrimiento (SEARCH_DEEP / HIERARCHY_TREE).
 * =============================================================================
 */

export class IndraUniversalPicker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._providers = null; // null = Loading State
    }

    set providers(data) {
        this._providers = data || [];
        this.render();
    }

    render() {
        const isLoading = this._providers === null;
        
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; }
            .picker-box { padding: 15px; background: #F8F9FA; border: 1px dashed #DADCE0; border-radius: 6px; }
            .picker-label { font-size: 10px; font-weight: 700; color: #5F6368; margin-bottom: 8px; text-transform: uppercase; }
            .provider-tags { display: flex; gap: 6px; flex-wrap: wrap; }
            .tag { font-size: 10px; background: #FFF; border: 1px solid #DADCE0; padding: 4px 10px; border-radius: 12px; cursor: pointer; transition: background 0.15s ease; }
            .tag:hover { background: #E8EAED; }
            .search-input { width: 100%; margin-top: 10px; padding: 6px; border: 1px solid #DADCE0; border-radius: 4px; font-size: 12px; box-sizing: border-box; }
            
            /* Skeleton Loading Animations */
            @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
            .skeleton { 
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 400px 100%;
                animation: shimmer 1.5s infinite linear;
                border-radius: 12px;
            }
            .sk-tag { height: 22px; width: 60px; }
            .sk-tag-l { width: 90px; }
            .sk-tag-s { width: 45px; }
            .sk-input { height: 30px; width: 100%; border-radius: 4px; margin-top: 10px; }
        </style>
        <div class="picker-box">
            <div class="picker-label">Explorador de Silos</div>
            <div class="provider-tags" id="tags-container">
                ${isLoading ? `
                    <div class="skeleton sk-tag"></div>
                    <div class="skeleton sk-tag sk-tag-l"></div>
                    <div class="skeleton sk-tag sk-tag-s"></div>
                ` : ''}
            </div>
            ${isLoading ? '<div class="skeleton sk-input"></div>' : '<input type="text" class="search-input" id="search-input" placeholder="Buscar silo en el universo...">'}
        </div>
        `;

        if (!isLoading) {
            this.renderTags(this._providers);
            const input = this.shadowRoot.getElementById('search-input');
            input.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = this._providers.filter(p => p.toLowerCase().includes(query));
                this.renderTags(filtered);
            });
        }
    }

    renderTags(list) {
        const container = this.shadowRoot.getElementById('tags-container');
        if (!container) return;
        container.innerHTML = list.length === 0 
            ? '<span style="opacity:0.5; font-size:10px;">No se encontraron silos.</span>'
            : list.map(p => `<span class="tag">${p.toUpperCase()}</span>`).join('');
    }
}

customElements.define('indra-universal-picker', IndraUniversalPicker);
