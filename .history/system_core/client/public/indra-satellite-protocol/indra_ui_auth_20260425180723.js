/**
 * 👁️ INDRA AUTH UI (AGNOSTIC BRIDGE)
 * Dharma: Facilitar la proyección del botón oficial de Google sin imponer estética.
 * 
 * Este módulo carga dinámicamente la API de Google Identity Services (GSI)
 * y renderiza el botón estándar en el contenedor proporcionado.
 */

export class IndraAuthUI {
    /**
     * @param {IndraAuth} authModule - Instancia del módulo de identidad L2.
     */
    constructor(authModule) {
        this.auth = authModule;
        this.scriptLoaded = false;
    }

    /**
     * Carga el script oficial de Google Identity Services.
     * @private
     */
    async _loadGoogleScript() {
        if (this.scriptLoaded || window.google?.accounts?.id) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                this.scriptLoaded = true;
                resolve();
            };
            script.onerror = () => reject(new Error("No se pudo cargar el script de Google Identity Services."));
            document.head.appendChild(script);
        });
    }

    /**
     * Renderiza el botón estándar de Google en un contenedor.
     * @param {string} containerId - ID del elemento HTML donde se proyectará el botón.
     * @param {Object} options - { clientId, onSuccess, theme, size }
     */
    async renderButton(containerId, options = {}) {
        const { clientId, onSuccess, theme = "outline", size = "large" } = options;

        if (!clientId) throw new Error("Se requiere clientId para inicializar Google Auth.");
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`No se encontró el contenedor con ID: ${containerId}`);

        await this._loadGoogleScript();

        // Inicialización nativa de Google
        google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
                try {
                    const profile = await this.auth.login(response.credential);
                    if (onSuccess) onSuccess(profile);
                } catch (e) {
                    console.error("❌ Fallo en intercambio de soberanía:", e.message);
                }
            }
        });

        // Renderizado del botón estándar (Zero CSS Indra)
        google.accounts.id.renderButton(container, {
            theme: theme,
            size: size,
            shape: options.shape || "rectangular",
            text: options.text || "signin_with"
        });

        // Habilitar One-Tap (Opcional, mejora la UX industrial)
        if (options.oneTap) {
            google.accounts.id.prompt();
        }
    }
}
