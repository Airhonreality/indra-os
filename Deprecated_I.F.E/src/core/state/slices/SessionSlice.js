/**
 * 🛰️ INDRA SESSION SLICE (core/state/slices/SessionSlice.js)
 * Engineering: Session state management (UI, Zoom, Logs).
 */

export const createSessionSlice = (set, get) => ({
    session: {
        zoom: 1,
        panNormalized: { x: 0.5, y: 0.5 },
        selectedId: null,
        activeFlowId: 'DEFAULT_FLOW_V1',
        cameraMm: { x: 0, y: 0 },
        lastActive: Date.now(),
        searchHistory: [],
        isTokenManagerOpen: false,
        theme: 'theme-obsidian'
    },
    lastError: null,
    lastSync: null,
    bootCompleted: false, // AXIOMA: Prevenir doble ejecución de bootHandshake
    systemContext: null, // MASTER MAP: UUID -> Drive ID
    systemContracts: null, // CORE CAPABILITIES: Executors & Methods
    safeModeActive: false,
    logs: [],

    setSession: (update) => {
        const newSession = { ...get().session, ...update, lastActive: Date.now() };
        set({ session: newSession });
        localStorage.setItem('INDRA_SESSION', JSON.stringify(newSession));
    },

    addLog: (type, msg, meta = null) => {
        set(state => ({
            logs: [{
                type,
                msg,
                meta,
                timestamp: new Date().toLocaleTimeString(),
                fullTime: new Date().toISOString()
            }, ...state.logs].slice(0, 200)
        }));
    },

    setSystemStatus: (status) => set({ systemStatus: status }),
    setHoverDoc: (doc) => set({ hoverDoc: doc }),
    setSystemContext: (context) => set({ systemContext: context }),
    setSystemContracts: (contracts) => set({ systemContracts: contracts }),
    setSafeMode: (active) => set({ safeModeActive: active }),
    setBootCompleted: (completed) => set({ bootCompleted: completed }),
    togglePause: () => set({ isPaused: !get().isPaused }),

    triggerShake: (uuid) => {
        set({ lastVetoId: uuid });
        setTimeout(() => set({ lastVetoId: null }), 500);
    },

    triggerFlashback: (uuid) => {
        set({ lastRecallId: uuid });
        setTimeout(() => set({ lastRecallId: null }), 500);
    }
});
