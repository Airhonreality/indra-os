/**
 * =============================================================================
 * INDRA PARAM MODAL (El Portal de Datos v1.0)
 * =============================================================================
 * Responsabilidad: Recolectar parámetros de ejecución sin romper el flujo visual.
 * DHARMA: Agnosticismo de campo y fidelidad al tema global.
 * =============================================================================
 */

class IndraParamModal extends HTMLElement {
    constructor() {
        super();
        this._resolve = null;
        this._reject = null;
    }

    /**
     * @dharma Abre el portal y espera la voluntad del usuario.
     * @param {Object} workflow - El flujo que solicita datos.
     * @returns {Promise} - Los parámetros validados.
     */
    async prompt(workflow) {
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
            this._render(workflow);
        });
    }

    _close(data = null) {
        this.innerHTML = ''; // Limpiar el portal
        if (data) this._resolve(data);
        else this._reject(new Error("USER_CANCELLED"));
    }

    _render(workflow) {
        const isGenesis = workflow.id.includes('genesis');
        const title = isGenesis ? 'IGNICIÓN DE SOBERANÍA' : `PARÁMETROS: ${workflow.label}`;
        
        // Estructura Canonica con Fallbacks de Seguridad
        this.innerHTML = `
        <style>
            indra-param-modal {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.8);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: inherit;
            }

            .modal-shell {
                background: var(--color-bg-elevated, #ffffff);
                color: var(--color-text-primary, #1A1F36);
                width: 100%;
                max-width: 400px;
                padding: 24px;
                border-radius: var(--radius-lg, 12px);
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            header { margin-bottom: 20px; }
            h2 { 
                margin: 0; font-size: 14px; letter-spacing: 2px; font-weight: 800; 
                color: var(--color-accent, #8B5CF6);
                text-transform: uppercase;
            }
            p { font-size: 11px; opacity: 0.6; margin-top: 5px; }

            .field-group { margin-bottom: 16px; }
            label { display: block; font-size: 9px; font-weight: 700; opacity: 0.5; margin-bottom: 6px; text-transform: uppercase; }
            input {
                width: 100%;
                box-sizing: border-box;
                padding: 10px 12px;
                background: rgba(0,0,0,0.05);
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: var(--radius-sm, 4px);
                color: inherit;
                font-size: 13px;
                transition: all 0.2s ease;
            }
            input:focus {
                outline: none;
                border-color: var(--color-accent, #8B5CF6);
                background: transparent;
            }

            .actions { display: flex; gap: 12px; margin-top: 24px; }
            .btn {
                flex: 1; padding: 12px; border: none; border-radius: var(--radius-sm, 4px);
                font-size: 10px; font-weight: 800; text-transform: uppercase; cursor: pointer;
                transition: transform 0.1s ease;
            }
            .btn:active { transform: scale(0.98); }
            .btn-primary { 
                background: var(--color-accent, #8B5CF6); 
                color: white; 
                box-shadow: 0 4px 15px var(--color-accent-dim, rgba(139, 92, 246, 0.3));
            }
            .btn-cancel { background: transparent; color: inherit; opacity: 0.4; }
        </style>

        <div class="modal-shell">
            <header>
                <h2>${title}</h2>
                <p>Configura los parámetros para materializar este flujo en el Core.</p>
            </header>

            <div id="form-body">
                ${isGenesis ? `
                    <div class="field-group">
                        <label>Vórtice de Datos (Nombre de Carpeta)</label>
                        <input type="text" id="target_folder" value="INDRA_PROJECT_VAULT" placeholder="Ej: MI_PROYECTO_VAULT">
                    </div>
                ` : `
                    <div class="field-group">
                        <label>ID del Recurso</label>
                        <input type="text" id="resource_id" placeholder="ID de la Sheet o Schema">
                    </div>
                `}
            </div>

            <div class="actions">
                <button class="btn btn-cancel" id="cancel-btn">CANCELAR</button>
                <button class="btn btn-primary" id="confirm-btn">IGNICIÓN</button>
            </div>
        </div>
        `;

        // Eventos
        this.querySelector('#cancel-btn').onclick = () => this._close();
        this.querySelector('#confirm-btn').onclick = async () => {
            const hud = document.querySelector('indra-bridge-hud');
            const bridge = hud?._bridge;

            if (!bridge) return alert("BRIDGE_NOT_FOUND");

            // AXIOMA DE SINCERIDAD PROACTIVA
            // Si no hay token de satélite, forzamos la resonancia antes de enviar el flujo
            if (!bridge.satelliteToken) {
                try {
                    const btn = this.shadowRoot.getElementById('confirm-btn');
                    const originalText = btn.innerText;
                    btn.innerText = "RESONANDO...";
                    btn.disabled = true;

                    await bridge.ignite();
                    
                    btn.innerText = originalText;
                    btn.disabled = false;
                } catch (e) {
                    alert(`Fallo de Resonancia: ${e.message}`);
                    const btn = this.shadowRoot.getElementById('confirm-btn');
                    btn.innerText = "REINTENTAR IGNICIÓN";
                    btn.disabled = false;
                    return;
                }
            }

            const data = {};
            this.shadowRoot.querySelectorAll('input').forEach(input => {
                data[input.id] = input.value;
            });
            this._close(data);
        };
    }
}

customElements.define('indra-param-modal', IndraParamModal);
