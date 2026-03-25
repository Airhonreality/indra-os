import { create } from 'zustand';
import { executeDirective } from '../services/directive_executor';
import { toastEmitter } from '../services/toastEmitter';
import { DataProjector } from '../services/DataProjector';
import { GoogleAuthService } from '../services/google/GoogleAuthService';
import { DriveDiscoveryService } from '../services/google/DriveDiscoveryService';
import { OrchestratorService } from '../services/google/OrchestratorService';

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

    // Google Identity (Session Volátil)
    googleUser: null, // { email, name, picture, accessToken }
    
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
    coreStatus: null, // null, 'SCANNING', 'BOOTSTRAP', 'STABLE'
    error: null,
    pendingCoreUrl: null, // Para autorización manual tras ignición
    installStatus: { step: null, progress: 0 }, // Seguimiento de la ignición

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
    pendingCreations: [], // [ { class, handle, status: 'PROVISIONING' } ] - Creación optimista
    inductionTicketId: localStorage.getItem('indra-induction-ticket-id') || null,
    inductionTicketSnapshot: _loadInductionSnapshot_(),
    
    // Persistencia de Vista (Axioma de Continuidad)
    showConnector: localStorage.getItem('indra-show-connector') === 'true',
    docsTab: localStorage.getItem('indra-docs-tab') || 'BIENVENIDA',
    manifestId: null, 
    // Infraestructura & Bóveda
    isServiceManagerOpen: false,
    isDiagnosticHubOpen: false, 
    isDocsOpen: false,
    serviceFilter: null, // 'intelligence', 'storage', null (all)
    isGlobalSelectorOpen: false,

    // ── ACCIONES ──

    /**
     * SENSADO (Paso 1): Verifica el estado del núcleo sin enviar contraseñas.
     * Utiliza el endpoint GET ?mode=echo del api_gateway.gs.
     */
    discoverCore: async (url) => {
        set({ isConnecting: true, coreStatus: 'SCANNING', error: null });
        try {
            // El modo echo devuelve { metadata: { status: 'ALIVE', bootstrapped: boolean } }
            const res = await fetch(`${url}?mode=echo`);
            
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            
            const data = await res.json();
            
            if (data.metadata?.status === 'ALIVE') {
                const isBootstrapped = data.metadata.bootstrapped;
                set({ 
                    coreStatus: isBootstrapped ? 'STABLE' : 'BOOTSTRAP',
                    isConnecting: false 
                });
                return isBootstrapped ? 'STABLE' : 'BOOTSTRAP';
            } else {
                throw new Error('La URL no devolvió una firma válida de Indra V4.');
            }
        } catch (err) {
            console.error('[app_state] discoverCore failed:', err);
            set({ 
                isConnecting: false, 
                coreStatus: null,
                error: 'El núcleo no responde o la URL es inválida.' 
            });
            throw err;
        }
    },

    /**
     * INICIALIZACIÓN (Paso 2 Boot): Crea la identidad del núcleo e inyecta la clave maestra.
     */
    setupCore: async (url, secret) => {
        set({ isConnecting: true, error: null });
        try {
            // El Api Gateway espera esto para marcar BOOTSTRAP_COMPLETED
            await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_CONFIG_WRITE',
            }, url, secret);

            // Una vez inicializado, logueamos normalmente
            await get().setCoreConnection(url, secret);
        } catch (err) {
            set({
                isConnecting: false,
                error: err.message || 'SETUP_FAILED'
            });
            throw err;
        }
    },

    /**
     * Establece la conexión inicial (Login) y carga los workspaces.
     * Soporta registro automático en la Bóveda de Núcleos (Multi-Core).
     */
    setCoreConnection: async (url, secret) => {
        set({ isConnecting: true, error: null });
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, url, secret);


            const coreId = result.metadata?.core_id;
            
            if (!coreId) {
                throw new Error('CONTRACT_VIOLATION: El núcleo no proporcionó una Identidad Soberana (core_id).');
            }
            
            // ── ACTUALIZAR REGISTRO (BÓVEDA) ──
            const { coreRegistry } = get();
            const newRegistry = [...coreRegistry.filter(c => c.url !== url)];
            newRegistry.unshift({
                id: coreId,
                class: 'SYSTEM_CORE',
                handle: {
                    ns: 'com.indra.core',
                    alias: coreId,
                    label: coreId
                },
                url: url,
                secret: secret,
                lastActive: new Date().toISOString()
            });

            localStorage.setItem('indra-core-registry', JSON.stringify(newRegistry));
            localStorage.setItem('indra-core-url', url);
            localStorage.setItem('indra-core-id', coreId);
            
            // AXIOMA DE SINCERIDAD (Soberanía):
            // Si el Core nos dio un ticket de sesión, lo usamos para el futuro.
            // Si no, guardamos el secret original (Satellite Key).
            const sessionSecret = result.metadata?.session_ticket || secret;
            localStorage.setItem('indra-session-secret', sessionSecret);

            set({
                coreUrl: url,
                coreId: coreId,
                sessionSecret: sessionSecret,
                coreRegistry: newRegistry,
                isConnected: true,
                isConnecting: false,
                workspaces: result.items,
                activeWorkspaceId: null 
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

    resetConnectionState: () => set({ coreStatus: null, error: null, isConnecting: false }),
    clearError: () => set({ error: null }),

    openConnector: () => {
        localStorage.setItem('indra-show-connector', 'true');
        set({ showConnector: true });
    },
    closeConnector: () => {
        localStorage.setItem('indra-show-connector', 'false');
        set({ showConnector: false });
    },
    openDocs: (tab) => {
        localStorage.setItem('indra-docs-tab', tab);
        set({ docsTab: tab });
    },
    closeDocs: () => {
        localStorage.setItem('indra-show-connector', 'false');
        set({ showConnector: false });
    },

    /**
     * Inicia el flujo de autenticación soberana.
     */
    loginWithGoogle: () => {
        GoogleAuthService.login();
    },

    /**
     * Proceso de autodescubrimiento tras el login.
     */
    discoverFromDrive: async (token) => {
        set({ isConnecting: true, error: null });
        try {
            const userInfo = await GoogleAuthService.getUserInfo(token);
            set({ googleUser: { ...userInfo, accessToken: token } });

            const result = await DriveDiscoveryService.findCoreManifest(token);
            if (result.ok) {
                const manifest = result.manifest;
                
                // --- 🛡️ SINCRONIZACIÓN MICELLAR SILENCIOSA (v4.0) ---
                // Si el núcleo está desactualizado respecto a GitHub, lo actualizamos en caliente.
                try {
                    const latestRef = await fetch('https://raw.githubusercontent.com/Airhonreality/indra-os/main/system_core/core/version.json').then(r => r.json());
                    if (latestRef && manifest.core_version !== latestRef.version && manifest.script_id && manifest.deployment_id) {
                        await OrchestratorService.syncCore(token, manifest);
                    }
                } catch (vErr) {
                    console.warn('[Sync] Fallo al verificar versión, procediendo con versión local.', vErr);
                }

                const { core_url, satellite_key } = manifest;
                // Intentar conexión con los datos del manifiesto (ya actualizado o previo)
                await get().setCoreConnection(core_url, satellite_key);
                return { success: true };
            } else {
                set({ 
                    isConnecting: false, 
                    error: result.reason, 
                    manifestId: result.manifest_id 
                });
                return { success: false, reason: result.reason };
            }
        } catch (err) {
            set({ isConnecting: false, error: 'DRIVE_DISCOVERY_FAILED' });
            throw err;
        }
    },

    /**
     * Orquestación de la instalación de un nuevo núcleo.
     */
    installNewCore: async () => {
        const { googleUser } = get();
        if (!googleUser || !googleUser.accessToken) return;

        set({ isConnecting: true, error: null, installStatus: { step: 'INICIANDO_IGNICION', progress: 5 } });
        try {
            const result = await OrchestratorService.installCore(
                googleUser.accessToken, 
                googleUser.email,
                (step, progress) => {
                    set({ installStatus: { step, progress } });
                }
            );

            if (result.ok) {
                const { core_url, satellite_key } = result.manifest;
                await get().setCoreConnection(core_url, satellite_key);
                toastEmitter.success('Indra ha sido instalado con éxito.');
            } else {
                if (result.error === 'AUTORIZACION_PENDIENTE') {
                    set({ 
                        isConnecting: false, 
                        error: 'AUTORIZACION_PENDIENTE',
                        pendingCoreUrl: result.coreUrl,
                        installStatus: { step: 'AUTORIZACIÓN REQUERIDA', progress: 97 }
                    });
                } else {
                    set({ isConnecting: false, error: result.error });
                }
            }
        } catch (err) {
            set({ isConnecting: false, error: err.message });
        }
    },

    purgePreviousInstall: async (manifestId) => {
        const { googleUser } = get();
        if (!googleUser || !googleUser.accessToken) return;
        
        set({ isConnecting: true, error: null });
        try {
            // 1. Borrar el manifiesto específico si existe (en zona visible o fantasma)
            if (manifestId) {
                await OrchestratorService.deleteFile(googleUser.accessToken, manifestId);
            }

            // 2. EXORCISMO: Limpieza profunda de CUALQUIER archivo en la zona fantasma (AppData)
            // Esto resuelve los problemas de reinstalación donde quedaban "ruinas" invisibles.
            await OrchestratorService.purgeGhostPersistence(googleUser.accessToken);

            set({ error: null, isConnecting: false }); 
            
            // 3. Reiniciar el autodescubrimiento para volver al estado de "Instalación Limpia"
            await get().discoverFromDrive(googleUser.accessToken); 
        } catch (err) {
            console.error('[app_state] Purge failed:', err);
            set({ isConnecting: false, error: 'FALLO_AL_PURGAR_RASTRO' });
        }
    },
    
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

    openSelector: () => set({ isGlobalSelectorOpen: true }),
    closeSelector: () => set({ isGlobalSelectorOpen: false }),

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
            set({ activeArtifact: atom, isMaterializing: false });
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
            const result = await executeDirective({
                provider: provider || 'system',
                protocol: 'ATOM_UPDATE',
                context_id: id,
                data: updates
            }, coreUrl, sessionSecret);

            const updatedAtom = result.items?.[0] || { ...updates };

            // Refrescar activo si es el mismo
            if (activeArtifact && activeArtifact.id === id) {
                set({ activeArtifact: { ...activeArtifact, ...updatedAtom } });
            }

            // Refrescar en la lista de pins
            const updatedPins = pins.map(p => 
                (p.id === id && (p.provider || 'system') === (provider || 'system')) 
                    ? { ...p, ...updatedAtom } 
                    : p
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
     * Actualiza la identidad axiomática de un átomo en todas las capas del frontend.
     * RESONANCIA GLOBAL: Sincroniza tanto el Pin (Nivel 2) como el Artefacto Activo (Nivel 3).
     */
    updateAxiomaticIdentity: (id, provider, updates) => {
        const { pins, activeArtifact } = get();
        const cleanProvider = provider || 'system';
        
        // 1. Mutar Pins (Nivel 2)
        const updatedPins = pins.map(p => 
            (p.id === id && (p.provider || 'system') === cleanProvider) 
                ? { ...p, ...updates, handle: { ...p.handle, ...updates.handle } } 
                : p
        );

        // 2. Mutar Artefacto Activo (Nivel 3) si es el mismo
        let nextActiveArtifact = activeArtifact;
        if (activeArtifact && activeArtifact.id === id && (activeArtifact.provider || 'system') === cleanProvider) {
            nextActiveArtifact = { 
                ...activeArtifact, 
                ...updates, 
                handle: { ...activeArtifact.handle, ...updates.handle } 
            };
        }

        set({ 
            pins: updatedPins, 
            activeArtifact: nextActiveArtifact 
        });

        // AXIOMA: Si mutamos la identidad, el sistema debe re-reaccionar a través del puente reactivo.
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
        
        // ── AXIOMA DE RETROALIMENTACIÓN INMEDIATA (Optimismo UI) ──
        const tempId = `temp_${Date.now()}`;
        const provisionalAtom = {
            id: tempId,
            class: atomClass,
            handle: { label: label || 'NUEVO_ARTEFACTO' },
            status: 'PROVISIONING',
            updated_at: new Date().toISOString(),
            _provisional: true // Marca interna
        };

        set(state => ({
            pendingCreations: [...state.pendingCreations, provisionalAtom],
            pendingSyncs: { ...state.pendingSyncs, [tempId]: true }
        }));

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

            console.error('[app_state] createArtifact failed:', err);
            toastEmitter.error(`Error al crear ${atomClass}: ${err.message}`);
            throw err;
        }
    },

    /**
     * Crea un nuevo Workspace en el Core.
     */
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
                set(state => ({
                    workspaces: [...state.workspaces, newWorkspace]
                }));
                toastEmitter.success('Workspace Materializado');
                return newWorkspace;
            }
        } catch (err) {
            console.error('[app_state] createWorkspace failed:', err);
            toastEmitter.error(`Error al materializar Workspace: ${err.message}`);
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
    deleteArtifact: async (atomId, provider = 'system') => {
        const cleanProvider = provider || 'system';
        const { coreUrl, sessionSecret, activeWorkspaceId, pins } = get();

        // ── 1. OPTIMISTIC: Quitar de la UI inmediatamente ──
        const previousPins = [...pins];
        set({ pins: pins.filter(p => !(p.id === atomId && (p.provider || 'system') === cleanProvider)) });

        try {
            // ── 2. SYSTEM_UNPIN: Limpiar referencia en el workspace (doble seguro) ──
            try {
                await executeDirective({
                    provider: 'system',
                    protocol: 'SYSTEM_UNPIN',
                    workspace_id: activeWorkspaceId,
                    data: { atom_id: atomId, provider: cleanProvider }
                }, coreUrl, sessionSecret);
            } catch (unpinErr) {
                console.warn('[app_state] SYSTEM_UNPIN pre-delete falló (no crítico):', unpinErr.message);
            }

            // ── 3. ATOM_DELETE: Eliminar el archivo y que el backend purgue el resto ──
            try {
                await executeDirective({
                    provider: cleanProvider,
                    protocol: 'ATOM_DELETE',
                    context_id: atomId
                }, coreUrl, sessionSecret);
            } catch (deleteErr) {
                // AXIOMA DE HOMEOSTASIS: Si el átomo no existe (NOT_FOUND) o es un ID de error (err_),
                // el objetivo del usuario era "limpiar el fantasma" y ya está cumplido en el Core.
                // Permitimos que el flujo continúe para que el UNPIN del Paso 2 sea permanente.
                const wasGhost = deleteErr.message.includes('No encontrado') || 
                                 deleteErr.message.includes('NOT_FOUND') ||
                                 atomId.startsWith('err_');
                
                if (!wasGhost) throw deleteErr;
                console.info('[app_state] Purificando fantasma:', atomId);
            }

            // ── 4. Recargar pins para confirmar estado limpio ──
            get().loadPins();
            toastEmitter.success('Artefacto purificado del workspace');
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
    unpinAtom: async (atomId, provider = 'system') => {
        const cleanProvider = provider || 'system';
        const { coreUrl, sessionSecret, activeWorkspaceId, pins } = get();

        // ── OPTIMISTIC UNPIN ──
        const previousPins = [...pins];
        const filteredPins = pins.filter(p => !(p.id === atomId && (p.provider || 'system') === cleanProvider));
        set({ pins: filteredPins });

        try {
            await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_UNPIN',
                workspace_id: activeWorkspaceId,
                data: { atom_id: atomId, provider: cleanProvider }
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
        // --- 0. INTERCEPCIÓN DE OAUTH CALLBACK (Soberanía Directa) ---
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
            set({ loadingKeys: { ...get().loadingKeys, workspaces: true } });
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, coreUrl, sessionSecret);

            set({ workspaces: result.items, loadingKeys: { ...get().loadingKeys, workspaces: false } });
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
