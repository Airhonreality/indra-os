/**
 * =============================================================================
 * INDRA SCHEMA PROJECTOR (The Fractal Viewer v2.1)
 * =============================================================================
 * Responsabilidad: Proyectar la estructura de los esquemas (ADN) del Contrato.
 * DHARMA: Cascarón funcional, agnóstico de la lógica de negocio.
 * =============================================================================
 */

class IndraSchemaProjector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._schemas = null; // null = Loading State
    }

    set schemas(data) {
        this._schemas = data || [];
        this.render();
    }

    render() {
        const isLoading = this._schemas === null;
        
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; font-family: inherit; }
            .projector-container { display: flex; flex-direction: column; gap: 12px; }
            .schema-card { 
                background: #FFFFFF; 
                border: 1px solid #DADCE0; 
                border-radius: 6px; 
                overflow: hidden; 
                transition: transform 0.2s ease;
            }
            .schema-card:hover { transform: translateX(2px); border-color: #1A73E8; }
            .header { 
                background: #F8F9FA; 
                padding: 8px 12px; 
                font-size: 11px; 
                font-weight: 700; 
                border-bottom: 1px solid #DADCE0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .type-badge { font-size: 8px; color: #5F6368; background: #E8EAED; padding: 2px 6px; border-radius: 4px; }
            .body { padding: 10px 12px; font-size: 11px; }
            .field-row { display: flex; justify-content: space-between; margin-bottom: 4px; color: #3C4043; }
            .field-type { opacity: 0.5; font-size: 9px; }
            
            /* Skeleton Loading Animations */
            @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
            .skeleton { 
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 400px 100%;
                animation: shimmer 1.5s infinite linear;
                border-radius: 4px;
            }
            .sk-header { height: 12px; width: 40%; }
            .sk-badge { height: 12px; width: 25%; }
            .sk-row { height: 10px; margin-bottom: 8px; }
            .sk-row-w1 { width: 70%; }
            .sk-row-w2 { width: 40%; }
            .sk-row-w3 { width: 55%; }
        </style>
        <div class="projector-container">
            ${isLoading ? `
                <div class="schema-card">
                    <div class="header"><div class="skeleton sk-header"></div><div class="skeleton sk-badge"></div></div>
                    <div class="body">
                        <div class="skeleton sk-row sk-row-w1"></div>
                        <div class="skeleton sk-row sk-row-w2"></div>
                        <div class="skeleton sk-row sk-row-w3"></div>
                    </div>
                </div>
                <div class="schema-card" style="opacity: 0.6">
                    <div class="header"><div class="skeleton sk-header"></div><div class="skeleton sk-badge"></div></div>
                    <div class="body">
                        <div class="skeleton sk-row sk-row-w2"></div>
                        <div class="skeleton sk-row sk-row-w1"></div>
                    </div>
                </div>
            ` : 
            (this._schemas.map(s => `
                <div class="schema-card">
                    <div class="header">
                        <span>${(s.handle?.alias || s.id).toUpperCase()}</span>
                        <span class="type-badge">${s.class || 'DATA_SCHEMA'}</span>
                    </div>
                    <div class="body">
                        ${(s.fields || s.payload?.fields || []).map(f => `
                            <div class="field-row">
                                <span>
                                    ${f.label || f.id}
                                    ${f.mapping ? `<span style="font-size:8px; color:#1A73E8; margin-left:6px; background:#E8F0FE; padding:1px 4px; border-radius:2px;">→ ${f.mapping.target_silo}.${f.mapping.target_field}</span>` : ''}
                                </span>
                                <span class="field-type">${f.type}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('') || '<div style="opacity:0.3; font-size:11px; text-align:center; padding: 20px;">SIN ESQUEMAS DETECTADOS</div>')}
        </div>
        `;
    }
}

customElements.define('indra-schema-projector', IndraSchemaProjector);
