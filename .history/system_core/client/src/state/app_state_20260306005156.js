import { create } from 'zustand';
import { executeDirective } from '../services/directive_executor';

/**
 * Indra App State
 * Gestiona el nivel de hidratación y la persistencia de la sesión.
 */
export const useAppState = create((set, get) => ({
    // Identidad del Core
    coreUrl: localStorage.getItem('indra-core-url') || null,
    sessionSecret: localStorage.getItem('indra-session-secret') || null, // Persistencia solicitada
    isConnected: !!localStorage.getItem('indra-session-secret'),
    isConnecting: false,
    error: null,

    // Catálogos
    workspaces: [],
    services: [], // Proviene del SYSTEM_MANIFEST
    activeWorkspaceId: null,

    // UI State
    loadingKeys: {},

    // ── ACCIONES ──

    /**
     * Establece la conexión inicial y valida la contraseña.
     */
    setCoreConnection: async (url, password) => {
        set({ isConnecting: true, error: null });
        try {
            // Intentamos una operación mínima para validar auth: listar workspaces
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, url, password);

            localStorage.setItem('indra-core-url', url);
            set({
                coreUrl: url,
                sessionSecret: password,
                isConnected: true,
                isConnecting: false,
                workspaces: result.items
            });

            // Cargamos el manifest en background
            get().hydrateManifest();

        } catch (err) {
            set({
                isConnecting: false,
                isConnected: false,
                error: err.message || 'Fallo de conexión'
            });
            throw err;
        }
    },

    /**
     * Carga los servicios disponibles (pila de providers).
     */
    hydrateManifest: async () => {
        const { coreUrl, sessionSecret, isConnected } = get();
        if (!isConnected) return;

        try {
            const result = await executeDirective({
                protocol: 'SYSTEM_MANIFEST'
            }, coreUrl, sessionSecret);
            set({ services: result.items });
        } catch (err) {
            console.error('[app_state] Failed to hydrate manifest:', err);
        }
    },

    disconnect: () => {
        localStorage.removeItem('indra-core-url');
        set({
            coreUrl: null,
            isConnected: false,
            activeWorkspaceId: null,
            sessionSecret: null,
            workspaces: [],
            services: []
        });
    },

    setActiveWorkspace: (id) => {
        set({ activeWorkspaceId: id });
    }
}));
