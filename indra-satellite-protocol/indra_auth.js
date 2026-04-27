/**
 * 👤 INDRA SOVEREIGN AUTH (L2)
 * Dharma: Gestión del Sujeto Humano y la Soberanía de Sesión.
 * 
 * Este módulo facilita el intercambio de tokens sociales por tokens soberanos Indra,
 * gestionando el perfil hidratado y los rangos (roles) del usuario.
 */

export class IndraAuth {
    /**
     * @param {IndraBridge} bridge - Instancia del transporte Indra.
     */
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * Reclama soberanía mediante un token de Google (OAuth).
     * @param {string} idToken - Token de identidad recibido desde Google Auth.
     * @returns {Promise<Object>} Perfil del usuario reconocido por el Core.
     */
    async login(idToken) {
        if (!idToken) throw new Error("idToken es requerido para el login.");

        const response = await this.bridge.execute({
            protocol: 'SYSTEM_IDENTITY_SYNC',
            data: { id_token: idToken }
        });

        if (response.metadata.status === 'OK') {
            const session = response.items[0];

            // Mutación del ContractCortex vía Bridge (Persistiendo Perfil L2)
            this.bridge.setSessionToken(session.token, session.profile);

            console.log(`✅ Soberanía reconocida: ${session.profile.email} [${session.profile.role}]`);
            return session.profile;
        } else if (response.metadata.status === 'PENDING_REGISTRATION') {
            console.warn("⚠️ Usuario no registrado en la malla local.");
            return {
                needsRegistration: true,
                profile: response.items[0],
                idToken: idToken // PRESERVACIÓN DE MATERIA: Enviamos el token de vuelta para el registro
            };
        } else {
            throw new Error(response.metadata.error || response.metadata.message || "Error desconocido en el intercambio.");
        }
    }

    /**
     * Realiza el auto-registro del usuario en el Workspace actual.
     * @param {string} idToken - El token de Google verificado.
     * @param {Object} userData - { name, picture, ... }
     */
    async register(idToken, userData = {}) {
        if (!idToken) throw new Error("Se requiere el idToken para completar el registro.");

        console.log("🚀 Iniciando ignición de identidad en el Core...");

        const response = await this.bridge.execute({
            protocol: 'SYSTEM_IDENTITY_REGISTER',
            workspace_id: this.bridge.activeWorkspaceId,
            data: {
                id_token: idToken,
                ...userData
            }
        });

        if (response.metadata.status === 'OK') {
            console.log("✅ Registro completado. Re-sincronizando soberanía...");
            // Tras registrar, hacemos un login automático para obtener el token L2 real
            return await this.login(idToken);
        } else {
            throw new Error(response.metadata.error || "Fallo en el registro físico del usuario.");
        }
    }

    /**
     * Termina la sesión del usuario y limpia la memoria estructural.
     */
    async logout() {
        try {
            await this.bridge.execute({ protocol: 'SYSTEM_SESSION_REVOKE' });
        } catch (e) {
            console.warn("⚠️ No se pudo invalidar la sesión en el Core, pero limpiaremos la memoria local.");
        }
        this.bridge.logout();
    }

    /**
     * Verifica si el usuario actual tiene un rango específico.
     */
    hasRole(role) {
        const session = this.bridge.getSession();
        return session?.profile?.role === role;
    }
}
