import { create } from 'zustand';
import { executeDirective } from '../services/directive_executor';

/**
 * Indra App State
 * Gestiona el nivel de hidratación y la persistencia de la sesión.
 */
export const useAppState = create((set, get) => ({
    // Identidad del Core
    coreUrl: localStorage.getItem('indra-core-url') || null,
    sessionSecret: localStorage.getItem('indra-session-secret') || null,
    lang: localStorage.getItem('indra-lang') || 'es', // Axioma de Neutralidad
    isConnected: !!localStorage.getItem('indra-session-secret'),
    isConnecting: false,
    error: null,

    // Catálogos
    workspaces: [],
    pins: [], // Átomos anclados al workspace activo (ADR-003)
    services: [], // Proviene del SYSTEM_MANIFEST
    activeWorkspaceId: localStorage.getItem('indra-active-workspace-id') || null,

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
            localStorage.setItem('indra-session-secret', password); // Persistir

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
            localStorage.removeItem('indra-session-secret');
            set({
                isConnecting: false,
                isConnected: false,
                sessionSecret: null,
                error: err.message || 'CONNECTION_FAILED'
            });
            throw err;
        }
    },

    clearError: () => set({ error: null }),

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
        localStorage.removeItem('indra-session-secret');
        localStorage.removeItem('indra-active-workspace-id');
        set({
            coreUrl: null,
            isConnected: false,
            activeWorkspaceId: null,
            sessionSecret: null,
            workspaces: [],
            pins: [],
            services: []
        });
    },

    setActiveWorkspace: (id) => {
        if (id) localStorage.setItem('indra-active-workspace-id', id);
        else localStorage.removeItem('indra-active-workspace-id');

        set({ activeWorkspaceId: id, pins: [] });
        if (id) get().loadPins();
    },

    /**
     * Carga los pins del workspace activo.
     */
    loadPins: async () => {
        const { coreUrl, sessionSecret, activeWorkspaceId } = get();
        if (!activeWorkspaceId) return;

        set({ loadingKeys: { ...get().loadingKeys, pins: true } });
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_PINS_READ',
                workspace_id: activeWorkspaceId
            }, coreUrl, sessionSecret);
            set({ pins: result.items });
        } catch (err) {
            console.error('[app_state] loadPins failed:', err);
        } finally {
            set({ loadingKeys: { ...get().loadingKeys, pins: false } });
        }
    },

    /**
     * Ancla un átomo al workspace activo y refresca.
     */
    pinAtom: async (atom) => {
        const { coreUrl, sessionSecret, activeWorkspaceId } = get();
        try {
            await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_PIN',
                workspace_id: activeWorkspaceId,
                data: { atom }
            }, coreUrl, sessionSecret);
            get().loadPins(); // Recarga síncrona/blocking
        } catch (err) {
            console.error('[app_state] pinAtom failed:', err);
            throw err;
        }
    },

    /**
     * Re-hidrata el estado de workspaces si ya hay coreUrl y secret.
     */
    bootstrap: async () => {
        const { coreUrl, sessionSecret, isConnected } = get();
        if (!isConnected || !coreUrl || !sessionSecret) return;

        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, coreUrl, sessionSecret);
            set({ workspaces: result.items });
            get().hydrateManifest();

            // Si hay un workspace activo persistido, hidratar sus pins
            const { activeWorkspaceId } = get();
            if (activeWorkspaceId) {
                get().loadPins();
            }
        } catch (err) {
            console.error('[app_state] Bootstrap failed:', err);
            // Si el secret falló, desconectar
            get().disconnect();
        }
    }
}));
