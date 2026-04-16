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
        console.log("[IndraBridge:Identity] Solicitando Ignición...");
        const width = 500, height = 600;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        
        const popup = window.open(
            `${INDRA_MOTHER_SHELL}#/resonate?origin=${encodeURIComponent(window.location.origin)}&name=${encodeURIComponent(this.bridge.contract.satellite_name || 'Nuevo Satélite')}`,
            "IndraResonance",
            `width=${width},height=${height},top=${top},left=${left}`
        );

        // --- VIGILANCIA DE CIERRE MANUAL ---
        const watchDog = setInterval(() => {
            if (popup.closed) {
                clearInterval(watchDog);
                if (!this.bridge.satelliteToken) {
                    console.warn("[IdentityNode] El nexo de resonancia se cerró prematuramente.");
                    this.bridge.clearState();
                }
            }
        }, 500);

        if (!popup) throw new Error("POPUP_BLOCKED");

        return new Promise((resolve, reject) => {
            const listener = (event) => {
                if (event.data?.type === "INDRA_RESONANCE_GRANT") {
                    this._applyResonance(event.data.payload);
                    window.removeEventListener("message", listener);
                    if (popup) popup.close();
                    resolve(true);
                }
            };
            window.addEventListener("message", listener);
            
            setTimeout(() => {
                window.removeEventListener("message", listener);
                reject(new Error("RESONANCE_TIMEOUT"));
            }, 60000);
        });
    }

    _applyResonance(payload) {
        this.bridge.coreUrl = payload.core_url;
        this.bridge.satelliteToken = payload.google_token;
        this.bridge.environment = payload.environment || 'PRODUCTION';
        
        console.log("[IdentityNode] Resonancia aplicada.");
        window.dispatchEvent(new CustomEvent("indra-ready", { detail: payload }));
        this.bridge.init();
    }
}
