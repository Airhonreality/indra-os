import { executeDirective } from '../../services/directive_executor';
import { toastEmitter } from '../../services/toastEmitter';
import { GoogleAuthService } from '../../services/google/GoogleAuthService';

export const createDomainSlice = (set, get) => ({
    // Catálogos e Items
    workspaces: [],
    pins: [], // Átomos anclados al workspace activo
    services: [], // Proviene del SYSTEM_MANIFEST
    activeWorkspaceId: localStorage.getItem('indra-active-workspace-id') || null,
    
    loadingKeys: {},
    activeArtifact: null, // Átomo en edición/ejecución
    isMaterializing: false, // Estado de transición para hidratación
    pendingSyncs: {}, // { atomId: boolean } - Rastreo de resonancia
    pendingCreations: [], // [ { class, handle, status: 'PROVISIONING' } ]

    setActiveWorkspace: (id) => {
        if (id) localStorage.setItem('indra-active-workspace-id', id);
        else localStorage.removeItem('indra-active-workspace-id');

        set({ activeWorkspaceId: id, pins: [], activeArtifact: null });
        if (id) get().loadPins();
    },

    hydrateManifest: async () => {
        const { coreUrl, sessionSecret, isConnected, _normalizeUrl_ } = get();
        if (!isConnected) return;
        const finalUrl = _normalizeUrl_(coreUrl);
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_MANIFEST'
            }, finalUrl, sessionSecret);
            set({ services: result.items || [] });
        } catch (err) {
            console.error('[domain_slice] Failed to hydrate manifest:', err);
        }
    },

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
            set({ pins: result.items || [] });
        } catch (err) {
            console.error('[domain_slice] loadPins failed:', err);
        } finally {
            set({ loadingKeys: { ...get().loadingKeys, pins: false } });
        }
    },

    openArtifact: async (atom) => {
        const { coreUrl, sessionSecret } = get();
        set({ isMaterializing: true });
        try {
            const result = await executeDirective({
                provider: atom.provider || 'system',
                protocol: 'ATOM_READ',
                context_id: atom.id
            }, coreUrl, sessionSecret);

            const fullAtom = result.items?.[0];
            if (fullAtom) {
                set({ activeArtifact: { ...atom, ...fullAtom }, isMaterializing: false });
            } else {
                throw new Error('ATOM_NOT_FOUND_IN_CORE');
            }
        } catch (err) {
            console.error('[domain_slice] Materialization failed:', err);
            toastEmitter.error('Fallo de Sinceridad: No se pudo materializar el contenido.');
            set({ activeArtifact: atom, isMaterializing: false });
        }
    },

    closeArtifact: () => set({ activeArtifact: null }),

    updateArtifact: async (id, provider, updates) => {
        const { coreUrl, sessionSecret, activeArtifact, pins, registerSync, finishSync } = get();
        registerSync(id);
        try {
            const result = await executeDirective({
                provider: provider || 'system',
                protocol: 'ATOM_UPDATE',
                context_id: id,
                data: updates
            }, coreUrl, sessionSecret);
            const updatedAtom = result.items?.[0] || { ...updates };

            if (activeArtifact && activeArtifact.id === id) {
                set({ activeArtifact: { ...activeArtifact, ...updatedAtom } });
            }
            const updatedPins = pins.map(p => 
                (p.id === id && (p.provider || 'system') === (provider || 'system')) 
                    ? { ...p, ...updatedAtom } 
                    : p
            );
            set({ pins: updatedPins });
            toastEmitter.success('Identidad Sincerada');
        } catch (err) {
            console.error('[domain_slice] updateArtifact failed:', err);
            toastEmitter.error(`Error al actualizar atom: ${err.message}`);
            throw err;
        } finally {
            finishSync(id);
        }
    },

    updateAxiomaticIdentity: (id, provider, updates) => {
        const { pins, activeArtifact } = get();
        const cleanProvider = provider || 'system';
        const updatedPins = pins.map(p => 
            (p.id === id && (p.provider || 'system') === cleanProvider) 
                ? { ...p, ...updates, handle: { ...p.handle, ...updates.handle } } 
                : p
        );
        let nextActiveArtifact = activeArtifact;
        if (activeArtifact && activeArtifact.id === id && (activeArtifact.provider || 'system') === cleanProvider) {
            nextActiveArtifact = { 
                ...activeArtifact, 
                ...updates, 
                handle: { ...activeArtifact.handle, ...updates.handle } 
            };
        }
        set({ pins: updatedPins, activeArtifact: nextActiveArtifact });
    },

    registerSync: (id) => {
        set(state => ({
            pendingSyncs: { ...state.pendingSyncs, [id]: true }
        }));
        setTimeout(() => {
            const { pendingSyncs, finishSync } = get();
            if (pendingSyncs[id]) {
                console.warn(`[Watchdog] Purgando resonancia colgada para: ${id}`);
                finishSync(id);
            }
        }, 30000);
    },

    finishSync: (id) => {
        set(state => {
            const next = { ...state.pendingSyncs };
            delete next[id];
            return { pendingSyncs: next };
        });
    },

    /**
     * Crea un átomo en el core, lo ancla y lo abre.
     * Soporta inyección de metadatos opcionales (ADR-XXX).
     */
    createArtifact: async (atomClass, label, initialPayload = {}, meta = null) => {
        const { coreUrl, sessionSecret, pinAtom, openArtifact } = get();
        
        // ── AXIOMA DE RETROALIMENTACIÓN INMEDIATA (Optimismo UI) ──
        const tempId = `temp_${Date.now()}`;
        const provisionalAtom = {
            id: tempId,
            class: atomClass,
            handle: { label: label || 'NUEVO_ARTEFACTO' },
            status: 'PROVISIONING',
            _meta: meta, // Inyectamos si viene de un clon
            updated_at: new Date().toISOString(),
            _provisional: true // Marca interna
        };

        set(state => ({
            pendingCreations: [...state.pendingCreations, provisionalAtom],
            pendingSyncs: { ...state.pendingSyncs, [tempId]: true }
        }));

        try {
            // ADR-008: Provisión de cuna para tipos estructurados
            const dataToCreate = {
                class: atomClass,
                handle: { label: label },
                payload: initialPayload,
                _meta: meta // El core guardará el bloque íntegro
            };

            if (Object.keys(initialPayload).length === 0) {
                if (atomClass === 'DATA_SCHEMA') dataToCreate.payload.fields = [];
                if (atomClass === 'BRIDGE') dataToCreate.payload.operators = [];
                if (atomClass === 'WORKFLOW') dataToCreate.payload.stations = [];
            }

            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_CREATE',
                data: dataToCreate
            }, coreUrl, sessionSecret);

            const newAtom = result.items?.[0];
            
            // Limpiar estado optimista
            set(state => {
                const newPending = state.pendingCreations.filter(a => a.id !== tempId);
                const newSyncs = { ...state.pendingSyncs };
                delete newSyncs[tempId];
                return { pendingCreations: newPending, pendingSyncs: newSyncs };
            });

            if (newAtom) {
                await pinAtom(newAtom);
                openArtifact(newAtom);
                toastEmitter.success(`${atomClass} creado correctamente`);
            }
        } catch (err) {
            // Limpiar estado optimista en error
            set(state => {
                const newPending = state.pendingCreations.filter(a => a.id !== tempId);
                const newSyncs = { ...state.pendingSyncs };
                delete newSyncs[tempId];
                return { pendingCreations: newPending, pendingSyncs: newSyncs };
            });

            console.error('[domain_slice] createArtifact failed:', err);
            toastEmitter.error(`Error al crear ${atomClass}: ${err.message}`);
            throw err;
        }
    },

    pinAtom: async (atom) => {
        const { coreUrl, sessionSecret, activeWorkspaceId } = get();
        try {
            await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_PIN',
                workspace_id: activeWorkspaceId,
                data: { atom }
            }, coreUrl, sessionSecret);
            get().loadPins();
        } catch (err) {
            console.error('[domain_slice] pinAtom failed:', err);
            throw err;
        }
    },

    deleteArtifact: async (atomId, provider = 'system') => {
        const cleanProvider = provider || 'system';
        const { coreUrl, sessionSecret, activeWorkspaceId, pins } = get();
        const previousPins = [...pins];
        set({ pins: pins.filter(p => !(p.id === atomId && (p.provider || 'system') === cleanProvider)) });

        try {
            try {
                await executeDirective({
                    provider: 'system',
                    protocol: 'SYSTEM_UNPIN',
                    workspace_id: activeWorkspaceId,
                    data: { atom_id: atomId, provider: cleanProvider }
                }, coreUrl, sessionSecret);
            } catch (unpinErr) {
                console.warn('[domain_slice] SYSTEM_UNPIN pre-delete falló:', unpinErr.message);
            }
            try {
                await executeDirective({
                    provider: cleanProvider,
                    protocol: 'ATOM_DELETE',
                    context_id: atomId
                }, coreUrl, sessionSecret);
            } catch (deleteErr) {
                const wasGhost = deleteErr.message.includes('No encontrado') || 
                                 deleteErr.message.includes('NOT_FOUND') ||
                                 atomId.startsWith('err_');
                if (!wasGhost) throw deleteErr;
            }
            get().loadPins();
            toastEmitter.success('Artefacto purificado del workspace');
        } catch (err) {
            set({ pins: previousPins });
            toastEmitter.error(`Error al eliminar: ${err.message}`);
            throw err;
        }
    },

    unpinAtom: async (atomId, provider = 'system') => {
        const cleanProvider = provider || 'system';
        const { coreUrl, sessionSecret, activeWorkspaceId, pins } = get();
        const previousPins = [...pins];
        set({ pins: pins.filter(p => !(p.id === atomId && (p.provider || 'system') === cleanProvider)) });
        try {
            await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_UNPIN',
                workspace_id: activeWorkspaceId,
                data: { atom_id: atomId, provider: cleanProvider }
            }, coreUrl, sessionSecret);
            get().loadPins();
        } catch (err) {
            set({ pins: previousPins });
            throw err;
        }
    },

    createWorkspace: async (label = 'Nuevo Workspace') => {
        const { coreUrl, sessionSecret } = get();
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_CREATE',
                data: {
                    class: 'WORKSPACE',
                    handle: { label: label },
                    payload: {}
                }
            }, coreUrl, sessionSecret);
            const newWorkspace = result.items?.[0];
            if (newWorkspace) {
                set(state => ({ workspaces: [...state.workspaces, newWorkspace] }));
                toastEmitter.success('Workspace Materializado');
                return newWorkspace;
            }
        } catch (err) {
            console.error('[domain_slice] createWorkspace failed:', err);
            toastEmitter.error(`Error al materializar Workspace: ${err.message}`);
            throw err;
        }
    },

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
            set({ workspaces });
            toastEmitter.error('No se pudo guardar el nuevo nombre');
        }
    },

    deleteWorkspace: async (workspaceId) => {
        const { coreUrl, sessionSecret, workspaces, activeWorkspaceId } = get();
        const previousWorkspaces = [...workspaces];
        set({ workspaces: workspaces.filter(w => w.id !== workspaceId) });
        if (activeWorkspaceId === workspaceId) {
            localStorage.removeItem('indra-active-workspace-id');
            set({ activeWorkspaceId: null, pins: [] });
        }
        try {
            await executeDirective({
                provider: 'system',
                protocol: 'ATOM_DELETE',
                context_id: workspaceId
            }, coreUrl, sessionSecret);
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, coreUrl, sessionSecret);
            set({ workspaces: result.items || [] });
        } catch (err) {
            set({ workspaces: previousWorkspaces });
            toastEmitter.error(`Error al eliminar workspace: ${err.message}`);
            throw err;
        }
    },

    bootstrap: async () => {
        const oauthData = GoogleAuthService.handleCallback();
        if (oauthData && oauthData.accessToken) {
            await get().discoverFromDrive(oauthData.accessToken);
            return;
        }
        const { coreUrl, sessionSecret, isConnected } = get();
        if (!isConnected || !coreUrl || !sessionSecret) return;
        try {
            const isGuest = sessionSecret === 'PUBLIC_GRANT';
            const ticketId = localStorage.getItem('indra-share-ticket');
            if (isGuest && ticketId) {
                const res = await fetch(`${coreUrl}?action=getShareTicket&id=${ticketId}`);
                const data = await res.json();
                const ticket = data.items?.[0];
                if (ticket) {
                    get().openArtifact({ 
                        id: ticket.artifact_id, 
                        class: ticket.artifact_class,
                        provider: 'system' 
                    });
                    set({ isConnected: true });
                    return;
                }
            }
            set({ loadingKeys: { ...get().loadingKeys, workspaces: true } });
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, coreUrl, sessionSecret);
            set({ workspaces: result.items, loadingKeys: { ...get().loadingKeys, workspaces: false } });
            get().hydrateManifest();
            const { activeWorkspaceId } = get();
            if (activeWorkspaceId) get().loadPins();
            get().refreshInductionTicket();
        } catch (err) {
            console.error('[domain_slice] Bootstrap failed:', err);
            get().disconnect();
        }
    }
});
