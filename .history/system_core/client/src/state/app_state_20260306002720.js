import { create } from 'zustand';

/**
 * Indra App State
 * Gestiona el nivel de hidratación y la persistencia de la sesión.
 */
export const useAppState = create((set) => ({
    // Identidad del Core
    coreUrl: localStorage.getItem('indra-core-url') || null,
    isConnected: false,
    isConnecting: false,

    // Contexto de Trabajo
    workspaces: [],
    activeWorkspaceId: null,

    // Caché y UI
    loadingKeys: {},

    // Acciones
    setCoreConnection: (url) => {
        localStorage.setItem('indra-core-url', url);
        set({ coreUrl: url, isConnected: true });
    },

    disconnect: () => {
        localStorage.removeItem('indra-core-url');
        set({ coreUrl: null, isConnected: false, activeWorkspaceId: null });
    },

    setActiveWorkspace: (id) => {
        set({ activeWorkspaceId: id });
    },

    setLoading: (key, isLoading) => {
        set((state) => ({
            loadingKeys: { ...state.loadingKeys, [key]: isLoading }
        }));
    }
}));
