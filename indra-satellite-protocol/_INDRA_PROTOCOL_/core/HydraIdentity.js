/**
 * =============================================================================
 * HYDRA IDENTITY SYSTEM (v1.0)
 * =============================================================================
 * Responsabilidad: Gestión de perfiles, sesiones y jurisdicción del usuario.
 * Axioma: El usuario es una "Entidad de Paso" identificada por el Llavero.
 * =============================================================================
 */

class HydraIdentity {
    constructor(bridge) {
        this.bridge = bridge;
        this.currentUser = null;
        this.activeProfile = null;
        this.isLoggedIn = false;
    }

    /**
     * AUTENTICACIÓN NATIVA (ADR-033)
     * Inicia el proceso de login con Google y Handshake con el Core.
     */
    async login(googleAuthResponse) {
        try {
            const idToken = googleAuthResponse.credential;
            
            // Handshake con el Bridge para autodescubrimiento
            const success = await this.bridge.init(idToken);
            
            if (success) {
                this.isLoggedIn = true;
                // Extraemos info básica del token (JWT Decode simplificado)
                const payload = this._decodeToken(idToken);
                this.currentUser = {
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    uid: payload.sub
                };
                
                console.info(`[Hydra] Sesión iniciada para: ${this.currentUser.email}`);
                return this.currentUser;
            }
            return null;
        } catch (error) {
            console.error("[Hydra] Error en el proceso de login:", error);
            throw error;
        }
    }

    /**
     * GESTIÓN DE JURISDICCIÓN (Perfiles)
     * Si el Core es compartido, aquí seleccionamos qué "Llavero" usar.
     */
    setProfile(profileData) {
        this.activeProfile = profileData;
        if (profileData.token) {
            this.bridge.satelliteToken = profileData.token;
        }
    }

    /**
     * LOGOUT
     */
    logout() {
        this.currentUser = null;
        this.activeProfile = null;
        this.isLoggedIn = false;
        this.bridge.satelliteToken = 'indra_satellite_omega'; // Reset al bootstrap
        console.log("[Hydra] Sesión cerrada.");
    }

    /**
     * UTILS: Decodificador de JWT para extraer perfil de Google
     * @private
     */
    _decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return {};
        }
    }
}

export default HydraIdentity;
