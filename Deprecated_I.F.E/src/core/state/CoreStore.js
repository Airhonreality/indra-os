import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createTopologySlice } from './slices/TopologySlice';
import { createSessionSlice } from './slices/SessionSlice';
import { createExecutionSlice } from './slices/ExecutionSlice';
import { createIntelligenceSlice } from './slices/IntelligenceSlice';

/**
 * 🛰️ INDRA CORE STORE (core/state/CoreStore.js)
 * High-fidelity central state for Indra Logic.
 * Consolidates Topology, Sessions, Execution, and System Settings.
 */
export const useCoreStore = create(
    persist(
        (set, get) => ({
            activeTab: 'TERMINAL',
            ...createTopologySlice(set, get),
            ...createSessionSlice(set, get),
            ...createExecutionSlice(set, get),
            ...createIntelligenceSlice(set, get),

            setActiveTab: (tab) => set({ activeTab: tab }),

            // Global System Actions
            addLog: (type, message, context = {}) => {
                const entry = {
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: new Date().toISOString(),
                    type,
                    message,
                    context
                };
                set(state => ({
                    session: {
                        ...state.session,
                        logs: [entry, ...(state.session.logs || [])].slice(0, 100)
                    }
                }));
            }
        }),
        {
            name: 'purity-core-vault', // Unique key for architecture
            version: 1,
            storage: createJSONStorage(() => localStorage),
            // Whitelist critical state
            partialize: (state) => ({
                // CONFIGURATION (Needed to auto-reconnect)
                coreUrl: state.coreUrl,
                activeTab: state.activeTab,

                // USER DATA (Must survive refresh)
                nodes: state.nodes,
                layouts: state.layouts,
                flows: state.flows,
                currentProject: state.currentProject,

                // AI CONTEXT
                messages: state.messages,
                manifestJson: state.manifestJson,
                lastUsedModel: state.lastUsedModel,
                lastUsedAccount: state.lastUsedAccount,

                // SESSION META
                session: state.session
            })
        }
    )
);

export default useCoreStore;
