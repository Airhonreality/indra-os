/**
 * =============================================================================
 * COMPONENTE: IndraKeychainWidget
 * RESPONSABILIDAD: Gestionar y visualizar el enlace (Pacto) en el satélite.
 * Permite cambiar de token, ver el estado de conexión y desvincularse.
 * =============================================================================
 */

class IndraKeychainWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._bridge = null;
    }

    set bridge(val) {
        this._bridge = val;
        this.render();
        this._bridge.on('sync', () => this.render());
    }

    connectedCallback() {
        this.render();
    }

    handleUnlink() {
        if (confirm("¿Confirmas desvincular este satélite? Se borrarán las llaves del almacenamiento local.")) {
            localStorage.removeItem('INDRA_SATELLITE_LINK');
            window.location.reload();
        }
    }

    render() {
        if (!this._bridge) return;

        const isConnected = !!this._bridge.satelliteToken;
        const color = isConnected ? '#34A853' : '#EA4335';
        const tokenDisplay = this._bridge.satelliteToken ? `${this._bridge.satelliteToken.substring(0, 10)}...` : 'NONE';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'JetBrains Mono', monospace;
                    color: white;
                }
                .keychain-card {
                    background: rgba(0,0,0,0.8);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 10px;
                    backdrop-filter: blur(10px);
                }
                .status-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: ${color};
                    display: inline-block;
                    margin-right: 5px;
                }
                .core-url {
                    opacity: 0.5;
                    font-size: 9px;
                    word-break: break-all;
                    margin-bottom: 8px;
                    display: block;
                }
                .token-tag {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    color: #4285F4;
                }
                button {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 9px;
                    cursor: pointer;
                    margin-top: 10px;
                    width: 100%;
                }
                button:hover {
                    background: rgba(255,255,255,0.05);
                }
            </style>
            <div class="keychain-card">
                <div class="status-row">
                    <span><span class="dot"></span>${isConnected ? 'CONNECTED' : 'STANDBY'}</span>
                    <span style="opacity: 0.4;">v2.5</span>
                </div>
                <span class="core-url">${this._bridge.coreUrl}</span>
                <div>KEY: <span class="token-tag">${tokenDisplay}</span></div>
                
                ${isConnected ? `<button id="btn-unlink">DESVINCULAR NODO</button>` : ''}
            </div>
        `;

        const btnUnlink = this.shadowRoot.getElementById('btn-unlink');
        if (btnUnlink) btnUnlink.onclick = () => this.handleUnlink();
    }
}

customElements.define('indra-keychain-widget', IndraKeychainWidget);
