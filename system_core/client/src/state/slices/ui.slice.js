export const createUiSlice = (set) => ({
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
    isIntelligencePortalOpen: false,

    openConnector: () => {
        localStorage.setItem('indra-show-connector', 'true');
        set({ showConnector: true });
    },
    closeConnector: () => {
        localStorage.setItem('indra-show-connector', 'false');
        set({ showConnector: false });
    },
    openDocs: (tab = 'BIENVENIDA') => {
        localStorage.setItem('indra-docs-tab', tab);
        set({ isDocsOpen: true, docsTab: tab });
    },
    closeDocs: () => {
        set({ isDocsOpen: false });
    },
    toggleDocs: () => set(s => ({ isDocsOpen: !s.isDocsOpen })),

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

    openSelector: () => set({ isGlobalSelectorOpen: true }),
    closeSelector: () => set({ isGlobalSelectorOpen: false }),

    toggleIntelligencePortal: (open) => set(s => ({ 
        isIntelligencePortalOpen: open !== undefined ? open : !s.isIntelligencePortalOpen 
    })),

    // --- DHARMA DE ERRORES: Sincronización Atómica ---
    activeError: null, // El átomo INDRA_ERROR activo
    raiseError: (errorAtom) => set({ activeError: errorAtom }),
    clearError: () => set({ activeError: null }),
});
