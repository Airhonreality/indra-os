import { create } from 'zustand';
import { executeDirective } from '../services/directive_executor';
import { toastEmitter } from '../services/toastEmitter';
import { DataProjector } from '../services/DataProjector';

function _loadInductionSnapshot_() {
    try {
        const raw = localStorage.getItem('indra-induction-ticket-snapshot');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Indra App State
 * Gestiona el nivel de hidratación y la persistencia de la sesión.
 */
export const useAppState = create((set, get) => ({
    // Identidad del Core
    coreUrl: localStorage.getItem('indra-core-url') || null,
    coreId: localStorage.getItem('indra-core-id') || null,
    sessionSecret: localStorage.getItem('indra-session-secret') || null,
    
    // Registro Multi-Core (Bóveda de Realidades) - ADR-002
    coreRegistry: (() => {
        try {
            return JSON.parse(localStorage.getItem('indra-core-registry')) || [];
        } catch (e) {
            return [];
        }
    })(),

    lang: localStorage.getItem('indra-lang') || 'es', 
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
    isMaterializing: false, // Estado de transición para hidratación de átomos
    pendingSyncs: {}, // { atomId: boolean } - Rastreo de resonancia en segundo plano
    inductionTicketId: localStorage.getItem('indra-induction-ticket-id') || null,
    inductionTicketSnapshot: _loadInductionSnapshot_(),
    
    // Infraestructura & Bóveda
    isServiceManagerOpen: false,
    isDiagnosticHubOpen: false, 
    isDocsOpen: false,
    docsTab: 'BIENVENIDA',
    serviceFilter: null, // 'intelligence', 'storage', null (all)

    // ── ACCIONES ──

    /**
     * Establece la conexión inicial y valida la contraseña.
     * Soporta registro automático en la Bóveda de Núcleos (Multi-Core).
     */
    setCoreConnection: async (url, password, alias = 'Core') => {
        set({ isConnecting: true, error: null });
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, url, password);

            const coreId = result.metadata?.core_id || 'unidentified_sovereign';
            
            // ── ACTUALIZAR REGISTRO (BÓVEDA) ──
            const { coreRegistry } = get();
            const newRegistry = [...coreRegistry.filter(c => c.url !== url)];
            newRegistry.unshift({
                alias: alias || 'Indra_Core',
                url: url,
                coreId: coreId,
                secret: password, // Persistido localmente (Soberanía de Usuario)
                lastActive: new Date().toISOString()
            });

            localStorage.setItem('indra-core-registry', JSON.stringify(newRegistry));
            localStorage.setItem('indra-core-url', url);
            localStorage.setItem('indra-core-id', coreId);
            localStorage.setItem('indra-session-secret', password);

            set({
                coreUrl: url,
                coreId: coreId,
                sessionSecret: password,
                coreRegistry: newRegistry,
                isConnected: true,
                isConnecting: false,
                workspaces: result.items,
                activeWorkspaceId: null // Reseteo de seguridad al cambiar de núcleo
            });

            get().hydrateManifest();

        } catch (err) {
            set({
                isConnecting: false,
                error: err.message || 'CONNECTION_FAILED'
            });
            throw err;
        }
    },

    clearError: () => set({ error: null }),
    
    /**
     * Gestión universal de la Bóveda (ServiceManager)
     */
    openServiceManager: (filter = null) => set({ 
        isServiceManagerOpen: true, 
        serviceFilter: filter 
    }),
    closeServiceManager: () => set({ 
        isServiceManagerOpen: false, 
        serviceFilter: null 
    }),

    openDiagnosticHub: () => set({ isDiagnosticHubOpen: true }),
    closeDiagnosticHub: () => set({ isDiagnosticHubOpen: false }),

    openDocs: (tab = 'BIENVENIDA') => set({ isDocsOpen: true, docsTab: tab }),
    closeDocs: () => set({ isDocsOpen: false }),
    toggleDocs: () => set(s => ({ isDocsOpen: !s.isDocsOpen })),

    /**
     * Carga los servicios disponibles (pila de providers).
     */
    hydrateManifest: async () => {
        const { coreUrl, sessionSecret, isConnected } = get();
        if (!isConnected) return;

        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_MANIFEST'
            }, coreUrl, sessionSecret);
            
            // AXIOMA DE SINCERIDAD: Guardamos los ítems tal cual vienen del Núcleo (Materia Prima).
            // La proyección se realiza en la frontera de cada componente.
            set({ services: result.items || [] });
            
        } catch (err) {
            console.error('[app_state] Failed to hydrate manifest:', err);
        }
    },
    
    /**
     * Elimina un núcleo del registro local.
     */
    removeCoreFromRegistry: (url) => {
        const { coreRegistry } = get();
        const next = coreRegistry.filter(c => c.url !== url);
        localStorage.setItem('indra-core-registry', JSON.stringify(next));
        set({ coreRegistry: next });
    },

    disconnect: () => {
        localStorage.removeItem('indra-core-url');
        localStorage.removeItem('indra-core-id');
        localStorage.removeItem('indra-session-secret');
        localStorage.removeItem('indra-active-workspace-id');
        localStorage.removeItem('indra-induction-ticket-id');
        localStorage.removeItem('indra-induction-ticket-snapshot');
        set({
            coreUrl: null,
            coreId: null,
            isConnected: false,
            activeWorkspaceId: null,
            sessionSecret: null,
            workspaces: [],
            pins: [],
            services: [],
            inductionTicketId: null,
            inductionTicketSnapshot: null
        });
    },

    setInductionTicket: (ticketId, snapshot = null) => {
        if (ticketId) {
            localStorage.setItem('indra-induction-ticket-id', ticketId);
        } else {
            localStorage.removeItem('indra-induction-ticket-id');
        }

        if (snapshot) {
            localStorage.setItem('indra-induction-ticket-snapshot', JSON.stringify(snapshot));
        } else {
            localStorage.removeItem('indra-induction-ticket-snapshot');
        }

        set({
            inductionTicketId: ticketId || null,
            inductionTicketSnapshot: snapshot || null
        });
    },

    clearInductionTicket: () => {
        localStorage.removeItem('indra-induction-ticket-id');
        localStorage.removeItem('indra-induction-ticket-snapshot');
        set({ inductionTicketId: null, inductionTicketSnapshot: null });
    },

    refreshInductionTicket: async () => {
        const { coreUrl, sessionSecret, inductionTicketId, clearInductionTicket } = get();
        if (!inductionTicketId || !coreUrl || !sessionSecret) return null;

        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'INDUCTION_STATUS',
                query: { ticket_id: inductionTicketId }
            }, coreUrl, sessionSecret);

            const ticket = result.metadata?.ticket || null;
            if (!ticket) return null;

            get().setInductionTicket(inductionTicketId, ticket);

            if (['COMPLETED', 'ERROR', 'CANCELLED'].includes(ticket.status)) {
                if (ticket.status === 'COMPLETED') {
                    setTimeout(() => clearInductionTicket(), 15000);
                }
            }

            return ticket;
        } catch (err) {
            console.warn('[app_state] refreshInductionTicket failed:', err?.message || err);
            return null;
        }
    },

    setActiveWorkspace: (id) => {
        if (id) localStorage.setItem('indra-active-workspace-id', id);
        else localStorage.removeItem('indra-active-workspace-id');

        set({ activeWorkspaceId: id, pins: [], activeArtifact: null });
        if (id) get().loadPins();
    },

    /**
     * Abre un artefacto asegurando su sinceridad (Hidratación).
     * Si el átomo es un Puntero (Pin), descarga la materia completa del Core.
     */
    openArtifact: async (atom) => {
        const { coreUrl, sessionSecret } = get();
        
        // AXIOMA: Si ya tiene payload, la materia es sincera.
        if (atom.payload && (atom.payload.blocks || atom.payload.fields || atom.payload.stations)) {
            set({ activeArtifact: atom });
            return;
        }

        set({ isMaterializing: true });
        try {
            const result = await executeDirective({
                provider: atom.provider || 'system',
                protocol: 'ATOM_READ',
                context_id: atom.id
            }, coreUrl, sessionSecret);

            const fullAtom = result.items?.[0];
            if (fullAtom) {
                // Mezclamos metadatos del pin con la materia del core
                set({ activeArtifact: { ...atom, ...fullAtom }, isMaterializing: false });
            } else {
                throw new Error('ATOM_NOT_FOUND_IN_CORE');
            }
        } catch (err) {
            console.error('[app_state] Materialization failed:', err);
            toastEmitter.error('Fallo de Sinceridad: No se pudo materializar el contenido.');
            set({ isMaterializing: false });
        }
    },
    closeArtifact: () => set({ activeArtifact: null }),

    /**
     * Actualiza un átomo en el core y refresca el estado local.
     */
    updateArtifact: async (id, provider, updates) => {
        const { coreUrl, sessionSecret, activeArtifact, pins, registerSync, finishSync } = get();
        
        registerSync(id);
        try {
            await executeDirective({
                provider: provider,
                protocol: 'ATOM_UPDATE',
                context_id: id,
                data: updates
            }, coreUrl, sessionSecret);

            // Refrescar activo si es el mismo
            if (activeArtifact && activeArtifact.id === id) {
                set({ activeArtifact: { ...activeArtifact, ...updates } });
            }

            // Refrescar en la lista de pins
            const updatedPins = pins.map(p => 
                (p.id === id && p.provider === provider) ? { ...p, ...updates } : p
            );
            set({ pins: updatedPins });

            toastEmitter.success('Identidad Sincerada');
        } catch (err) {
            console.error('[app_state] updateArtifact failed:', err);
            toastEmitter.error(`Error al actualizar atom: ${err.message}`);
            throw err;
        } finally {
            finishSync(id);
        }
    },

    /**
     * Registra un artefacto en proceso de sincronización global.
     */
    registerSync: (id) => {
        set(state => ({
            pendingSyncs: { ...state.pendingSyncs, [id]: true }
        }));

        // AXIOMA DE SUPERVIVENCIA: Purgado de seguridad tras 30s de silencio de red
        setTimeout(() => {
            const { pendingSyncs, finishSync } = get();
            if (pendingSyncs[id]) {
                console.warn(`[Watchdog] Purgando resonancia colgada para: ${id}`);
                finishSync(id);
            }
        }, 30000);
    },

    /**
     * Finaliza la sincronización de un artefacto.
     */
    finishSync: (id) => {
        set(state => {
            const next = { ...state.pendingSyncs };
            delete next[id];
            return { pendingSyncs: next };
        });
    },

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

            // AXIOMA DE SINCERIDAD: La lista de pins es una colección de punteros ligeros.
            // La hidratación (materia completa) ocurre exclusivamente en openArtifact.
            set({ pins: result.items || [] });
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
            const isGuest = sessionSecret === 'PUBLIC_GRANT';
            const ticketId = localStorage.getItem('indra-share-ticket');

            if (isGuest && ticketId) {
                // Modo Resolución Micelar (ADR-019)
                const res = await fetch(`${coreUrl}?action=getShareTicket&id=${ticketId}`);
                const data = await res.json();
                const ticket = data.items?.[0];

                if (ticket) {
                    // Abrimos el artefacto directamente (con ID ficticio para forzar ATOM_READ)
                    get().openArtifact({ 
                        id: ticket.artifact_id, 
                        class: ticket.artifact_class,
                        provider: 'system' 
                    });
                    set({ isConnected: true });
                    return;
                }
            }

            // Flujo Normal (Dueño)
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

            // Reenganche de inducción tras refresh accidental
            get().refreshInductionTicket();
        } catch (err) {
            console.error('[app_state] Bootstrap failed:', err);
            // Si el secret falló, desconectar
            get().disconnect();
        }
    }
}));
