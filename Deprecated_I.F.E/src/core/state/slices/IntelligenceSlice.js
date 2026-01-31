/**
 * 🛰️ INDRA INTELLIGENCE SLICE (core/state/slices/IntelligenceSlice.js)
 * Manages AI Chat history and Manifest state.
 */

export const createIntelligenceSlice = (set, get) => ({
    messages: [
        { role: 'assistant', text: 'Architect Ready. How can I transform your workspace today?' }
    ],
    manifestJson: '{\n  "name": "CUSTOM_FLOW",\n  "nodes": {},\n  "connections": []\n}',
    isThinking: false,

    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set(state => ({
        messages: [...state.messages, message]
    })),
    setManifestJson: (json) => set({ manifestJson: json }),
    setIsThinking: (isThinking) => set({ isThinking }),

    clearChat: () => set({
        messages: [{ role: 'assistant', text: 'Architect Ready. History cleared.' }]
    }),

    clearMessages: () => set({
        messages: [{ role: 'assistant', text: 'Architect Ready. History cleared.' }]
    }),

    // PERSISTENCE AXIOMS
    lastUsedModel: 'llama-3.3-70b-versatile',
    lastUsedAccount: 'default',
    setLastUsedModel: (model) => set({ lastUsedModel: model }),
    setLastUsedAccount: (account) => set({ lastUsedAccount: account })
});
