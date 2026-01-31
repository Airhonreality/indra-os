/**
 * 🛰️ INDRA EXECUTION SLICE (core/state/slices/ExecutionSlice.js)
 * Architecture: Manages available Contracts, Method selection, and Execution History.
 */

export const createExecutionSlice = (set, get) => ({
    contracts: {},          // Discovered capabilities (from getSystemContracts)
    status: 'disconnected', // AXIOMA: Estado inicial determinista
    coreUrl: '',           // AXIOMA: Endpoint de conexión
    selectedMethod: null,   // Current target: { adapter, method, schema }
    executionLog: [],       // Atomic history of interactions
    lastOutput: null,       // Result of the last successful execution
    registry: {
        flows: [],
        layouts: [],
        system: []
    },
    laws: {
        ROLES: [],
        ARCHETYPES: [],
        INTENTS: [],
        VISUAL_INTENTS: [],
        MOTION_TOKENS: [],
        UI_GRAMMAR: {},
        UI_SCHEMA: {}
    },

    setContracts: (contracts) => set({ contracts }),

    setLaws: (laws) => {
        // 🔥 DEFENSIVE NORMALIZATION: Corregir doble anidamiento SIEMPRE
        let normalizedLaws = { ...laws };

        if (normalizedLaws.GENETIC?.GENETIC) {
            console.warn('🔴 setLaws: Double nested GENETIC detected. Auto-correcting...');
            normalizedLaws.GENETIC = normalizedLaws.GENETIC.GENETIC;
            console.log('✅ GENETIC normalized. Archetypes:', normalizedLaws.GENETIC.ARCHETYPES?.length || 0);
        }

        set({ laws: normalizedLaws });

        // Logging detallado solo en modo debug
        if (window.__DEBUG_LAWS__) {
            console.group('🔥 setLaws DETAILED DEBUG');
            console.log('Received laws:', laws);
            console.log('Normalized laws:', normalizedLaws);
            console.groupEnd();
        }
    },

    setSelectedMethod: (methodData) => set({ selectedMethod: methodData }),

    setRegistry: (update) => set(state => ({
        registry: { ...state.registry, ...update }
    })),

    setStatus: (status) => set({ status }),

    setCoreUrl: (url) => set({ coreUrl: url }),

    logExecution: (entry) => set((state) => ({
        executionLog: [
            {
                ...entry,
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toISOString()
            },
            ...state.executionLog
        ].slice(0, 50),
        lastOutput: entry.status === 'success' ? entry.response : state.lastOutput
    })),

    clearExecutionLogs: () => set({ executionLog: [] }),

    setLastOutput: (data) => set({ lastOutput: data }),

    resetExecution: () => set({
        contracts: {},
        registry: { flows: [], layouts: [], system: [] },
        laws: {
            ROLES: [], ARCHETYPES: [], INTENTS: [], VISUAL_INTENTS: [],
            MOTION_TOKENS: [], UI_GRAMMAR: {}, UI_SCHEMA: {}
        },
        selectedMethod: null,
        executionLog: [],
        lastOutput: null,
        status: 'disconnected'
    })
});
