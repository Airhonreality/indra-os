import { executeDirective } from '../../services/directive_executor';
import { GoogleAuthService } from '../../services/google/GoogleAuthService';
import { DriveDiscoveryService } from '../../services/google/DriveDiscoveryService';
import { OrchestratorService } from '../../services/google/OrchestratorService';

export const createAuthSlice = (set, get) => ({
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

    // ── NORMAS DE SOBERANÍA (HELPERS) ──
    _normalizeUrl_: (url) => {
        if (!url) return url;
        const { googleUser } = get();
        if (googleUser?.email && !url.includes('authuser=')) {
            const sep = url.includes('?') ? '&' : '?';
            return `${url}${sep}authuser=${encodeURIComponent(googleUser.email)}`;
        }
        return url;
    },

    // ── ACCIONES ──

    discoverCore: async (url) => {
        const finalUrl = get()._normalizeUrl_(url);
        set({ isConnecting: true, coreStatus: 'SCANNING', error: null });
        try {
            const res = await fetch(`${finalUrl}&mode=echo`);
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
            console.error('[auth_slice] discoverCore failed:', err);
            set({ 
                isConnecting: false, 
                coreStatus: null,
                error: 'El núcleo no responde o la URL es inválida.' 
            });
            throw err;
        }
    },

    setupCore: async (url, secret) => {
        set({ isConnecting: true, error: null });
        try {
            await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_CONFIG_WRITE',
            }, url, secret);
            await get().setCoreConnection(url, secret);
        } catch (err) {
            set({
                isConnecting: false,
                error: err.message || 'SETUP_FAILED'
            });
            throw err;
        }
    },

    setCoreConnection: async (url, secret) => {
        const finalUrl = get()._normalizeUrl_(url);
        set({ isConnecting: true, error: null });
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'workspaces'
            }, finalUrl, secret);

            const coreId = result.metadata?.core_id;
            if (!coreId) {
                throw new Error('CONTRACT_VIOLATION: El núcleo no proporcionó una Identidad Soberana (core_id).');
            }
            
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

            if (get().hydrateManifest) get().hydrateManifest();

        } catch (err) {
            set({
                isConnecting: false,
                error: err.message || 'CONNECTION_FAILED'
            });
            throw err;
        }
    },

    setCoreUrl: (url) => set({ coreUrl: url }),

    resetConnectionState: () => set({ coreStatus: null, error: null, isConnecting: false }),
    clearError: () => set({ error: null }),

    loginWithGoogle: () => {
        GoogleAuthService.login();
    },

    discoverFromDrive: async (token) => {
        set({ isConnecting: true, error: null });
        try {
            const userInfo = await GoogleAuthService.getUserInfo(token);
            set({ googleUser: { ...userInfo, accessToken: token } });

            const result = await DriveDiscoveryService.findCoreManifest(token);
            if (result.ok) {
                const manifest = result.manifest;
                try {
                    const latestRef = await fetch('https://raw.githubusercontent.com/Airhonreality/indra-os/main/system_core/core/version.json').then(r => r.json());
                    if (latestRef && manifest.core_version !== latestRef.version && manifest.script_id && manifest.deployment_id) {
                        await OrchestratorService.syncCore(token, manifest);
                    }
                } catch (vErr) {
                    console.warn('[Sync] Fallo al verificar versión, procediendo con versión local.', vErr);
                }

                const { core_url, satellite_key } = manifest;
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
});
