import { create } from 'zustand';
import { executeDirective } from '../services/directive_executor';
import { toastEmitter } from '../services/toastEmitter';

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
    activeArtifact: null, // Átomo en edición/ejecución (Nivel 3)

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

        set({ activeWorkspaceId: id, pins: [], activeArtifact: null });
        if (id) get().loadPins();
    },

    openArtifact: (atom) => set({ activeArtifact: atom }),
    closeArtifact: () => set({ activeArtifact: null }),

    /**
     * Crea un átomo en el core, lo ancla y lo abre.
     */
    createArtifact: async (atomClass, label) => {
        const { coreUrl, sessionSecret, pinAtom, openArtifact } = get();
        try {
            // ADR-008: Provisión de cuna para tipos estructurados
            const initialPayload = {};
            if (atomClass === 'DATA_SCHEMA') initialPayload.fields = [];
            if (atomClass === 'BRIDGE') initialPayload.operators = [];
            if (atomClass === 'WORKFLOW') initialPayload.stations = [];

            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_CREATE',
                data: {
                    class: atomClass,
                    handle: { label: label },
                    payload: initialPayload
                }
            }, coreUrl, sessionSecret);

            const newAtom = result.items?.[0];
            if (newAtom) {
                await pinAtom(newAtom);
                openArtifact(newAtom);
                toastEmitter.success(`${atomClass} creado correctamente`);
            }
        } catch (err) {
            console.error('[app_state] createArtifact failed:', err);
            toastEmitter.error(`Error al crear ${atomClass}: ${err.message}`);
            throw err;
        }
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

            // AXIOMA: Mezcla Deep-over-Shallow para evitar degradación de átomos hidratados
            const currentPins = get().pins;
            const newPins = (result.items || []).map(newPin => {
                const existing = currentPins.find(p => p.id === newPin.id && p.provider === newPin.provider);
                if (existing && existing.payload && !newPin.payload) {
                    // Mantener la hidratación profunda si ya existe
                    return { ...newPin, payload: existing.payload, protocols: existing.protocols || newPin.protocols };
                }
                return newPin;
            });

            set({ pins: newPins });
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
     * Elimina físicamente un átomo del core y purga sus pins.
     * ADR-008: La eliminación es atómica: primero desancla, luego borra.
     */
    deleteArtifact: async (atomId, provider) => {
        const { coreUrl, sessionSecret, activeWorkspaceId, pins } = get();

        // ── 1. OPTIMISTIC: Quitar de la UI inmediatamente ──
        const previousPins = [...pins];
        set({ pins: pins.filter(p => !(p.id === atomId && p.provider === provider)) });

        try {
            // ── 2. SYSTEM_UNPIN: Limpiar referencia en el workspace (doble seguro) ──
            try {
                await executeDirective({
                    provider: 'system',
                    protocol: 'SYSTEM_UNPIN',
                    workspace_id: activeWorkspaceId,
                    data: { atom_id: atomId, provider }
                }, coreUrl, sessionSecret);
            } catch (unpinErr) {
                console.warn('[app_state] SYSTEM_UNPIN pre-delete falló (no crítico):', unpinErr.message);
            }

            // ── 3. ATOM_DELETE: Eliminar el archivo y que el backend purgue el resto ──
            await executeDirective({
                provider: provider,
                protocol: 'ATOM_DELETE',
                context_id: atomId
            }, coreUrl, sessionSecret);

            // ── 4. Recargar pins para confirmar estado limpio ──
            get().loadPins();
            toastEmitter.success('Artefacto eliminado');
        } catch (err) {
            console.error('[app_state] deleteArtifact failed, reverting:', err);
            set({ pins: previousPins });
            toastEmitter.error(`Error al eliminar: ${err.message}`);
            throw err;
        }
    },

    /**
     * Desancla un átomo del workspace activo.
     */
    unpinAtom: async (atomId, provider) => {
        const { coreUrl, sessionSecret, activeWorkspaceId, pins } = get();

        // ── OPTIMISTIC UNPIN ──
        const previousPins = [...pins];
        const filteredPins = pins.filter(p => !(p.id === atomId && p.provider === provider));
        set({ pins: filteredPins });

        try {
            await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_UNPIN',
                workspace_id: activeWorkspaceId,
                data: { atom_id: atomId, provider }
            }, coreUrl, sessionSecret);

            get().loadPins();
        } catch (err) {
            console.error('[app_state] unpinAtom failed, reverting:', err);
            set({ pins: previousPins });
            throw err;
        }
    },

    /**
     * Renombra un Workspace actualizando el handle.label en el Core.
     */
    renameWorkspace: async (workspaceId, newLabel) => {
        const { coreUrl, sessionSecret, workspaces } = get();
        if (!newLabel.trim()) return;

        const updatedWorkspaces = workspaces.map(w =>
            w.id !== workspaceId ? w : { ...w, handle: { ...w.handle, label: newLabel } }
        );
        set({ workspaces: updatedWorkspaces });

        try {
            await executeDirective({
                provider: 'system',
                protocol: 'ATOM_UPDATE',
                context_id: workspaceId,
                data: { handle: { label: newLabel } }
            }, coreUrl, sessionSecret);
        } catch (err) {
            console.error('[app_state] renameWorkspace failed, reverting:', err);
            set({ workspaces });
            toastEmitter.error('No se pudo guardar el nuevo nombre');
        }
    },

    /**
     * Elimina un Workspace completo.
     * ADR-008: La eliminación es atómica. El backend purga sus pins via ATOM_DELETE.
     * El frontend limpia optimistamente el estado local.
     */
    deleteWorkspace: async (workspaceId) => {
        const { coreUrl, sessionSecret, workspaces, activeWorkspaceId } = get();
        const previousWorkspaces = [...workspaces];

        // ── 1. OPTIMISTIC: Quitar de la lista local ──
        set({ workspaces: workspaces.filter(w => w.id !== workspaceId) });

        // ── 2. Si era el workspace activo, desactivarlo ──
        if (activeWorkspaceId === workspaceId) {
            localStorage.removeItem('indra-active-workspace-id');
            set({ activeWorkspaceId: null, pins: [] });
        }

        try {
            // ── 3. ATOM_DELETE en el backend (incluye purga anti-pin-fantasma) ──
            await executeDirective({
                provider: 'system',
                protocol: 'ATOM_DELETE',
                context_id: workspaceId
            }, coreUrl, sessionSecret);

            // ── 4. Recargar lista de workspaces ──
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, coreUrl, sessionSecret);
            set({ workspaces: result.items || [] });

        } catch (err) {
            console.error('[app_state] deleteWorkspace failed, reverting:', err);
            set({ workspaces: previousWorkspaces });
            toastEmitter.error(`Error al eliminar workspace: ${err.message}`);
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
