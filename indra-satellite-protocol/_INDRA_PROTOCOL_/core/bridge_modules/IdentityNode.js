/**
 * =============================================================================
 * INDRA IDENTITY NODE
 * =============================================================================
 * Responsibilidad: Gestión del nexo de autenticación y resonancia.
 * =============================================================================
 */

const INDRA_MOTHER_SHELL = "https://airhonreality.github.io/indra-os";

export class IdentityNode {
    constructor(bridge) {
        this.bridge = bridge;
    }

    async ignite() {
        console.log("[IndraBridge:Identity] Solicitando Ignición via Portal Soberano (Popup)...");
        
        return new Promise((resolve, reject) => {
            const width = 500;
            const height = 650;
            const left = (window.screen.width / 2) - (width / 2);
            const top = (window.screen.height / 2) - (height / 2);

            const url = `${INDRA_MOTHER_SHELL}#/resonate?origin=${encodeURIComponent(window.location.origin)}&name=${encodeURIComponent(this.bridge.contract.satellite_name || 'Nuevo Satélite')}`;
            
            const popup = window.open(
                url, 
                'IndraResonancePortal', 
                `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=no`
            );

            if (!popup) {
                reject(new Error("POPUP_BLOCKED: Por favor habilita los popups para conectar con Indra."));
                return;
            }

            // Crear un velo de transparencia en el satélite
            const indicator = document.createElement('div');
            indicator.id = 'indra-igniting-indicator';
            indicator.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 999999;
                background: rgba(123, 47, 247, 0.9); color: white; padding: 12px 20px;
                border-radius: 8px; font-family: monospace; font-size: 11px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
                display: flex; align-items: center; gap: 10px; pointer-events: none;
            `;
            indicator.innerHTML = `
                <div class="spin" style="width:12px; height:12px; border:2px solid white; border-top-color:transparent; border-radius:50%;"></div>
                CONECTANDO CON LA MADRE...
            `;
            document.body.appendChild(indicator);

            // Escuchar el Grant de Madre
            const listener = (event) => {
                // Verificamos el origen por seguridad micelar
                if (event.origin !== new URL(INDRA_MOTHER_SHELL).origin) return;

                if (event.data?.type === "INDRA_RESONANCE_GRANT") {
                    this._applyResonance(event.data.payload);
                    cleanup();
                    resolve(true);
                }
            };

            const cleanup = () => {
                window.removeEventListener("message", listener);
                if (document.getElementById('indra-igniting-indicator')) {
                    document.body.removeChild(indicator);
                }
                clearInterval(checkClosed);
            };

            // Detectar cierre manual del popup
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    cleanup();
                    if (!this.bridge.satelliteToken) {
                        reject(new Error("USER_ABORTED"));
                    }
                }
            }, 1000);

            window.addEventListener("message", listener);
        });
    }

    _applyResonance(payload) {
        this.bridge.coreUrl = payload.core_url;
        this.bridge.satelliteToken = payload.google_token;
        this.bridge.environment = payload.environment || 'PRODUCTION';
        
        // UNIFICACIÓN DE SOBERANÍA: Usamos la llave estándar que IndraBridge espera
        localStorage.setItem('INDRA_SATELLITE_LINK', JSON.stringify({
            coreUrl: this.bridge.coreUrl,
            token: this.bridge.satelliteToken,
            workspace_id: payload.workspace_id,
            environment: this.bridge.environment
        }));
        
        console.log("[IdentityNode] Resonancia aplicada. Soberanía otorgada y persistida.");
        window.dispatchEvent(new CustomEvent("indra-ready", { detail: payload }));
        this.bridge.init();
    }

    /**
     * @dharma "La soberanía termina donde la memoria se borra."
     * Revoca la llave en el Core antes de limpiar el estado local para borrar el rastro.
     */
    async disengage() {
        if (!this.bridge.satelliteToken || !this.bridge.coreUrl) {
            this.bridge.clearState();
            return;
        }

        console.log("[IdentityNode] Purgando llave en el Core...");
        try {
            // Intento de revocar en el backend
            await this.bridge.execute({
                protocol: 'SYSTEM_KEYCHAIN_REVOKE',
                provider: 'system',
                data: { token: this.bridge.satelliteToken }
            });
            console.log("[IdentityNode] Llave revocada exitosamente en el Ledger.");
        } catch (e) {
            console.error("[IdentityNode] Falló la revocación remota. El núcleo podría mantener la puerta abierta.", e);
            // Igual limpiamos el estado local para proteger al usuario local actual
        } finally {
            this.bridge.clearState();
            console.log("[IdentityNode] Desconexión local completada.");
        }
    }
}
