import { create } from 'zustand';

/**
 * 🏛️ ISK: USSP STATE STORE (v1.0)
 * Almacén de estado soberano para la verdad local.
 * Gestiona el Snapshot del diseño y el motor de Diffing para optimizar la red.
 */
export const useUSSPStateStore = create((set, get) => ({
    // Snapshot actual del .layout.json (Estado Hidratado)
    snapshot: {
        nodes: {},
        edges: [],
        metadata: {}
    },

    // Historial de cambios para Undo/Redo
    history: [],
    historyPointer: -1,

    /**
     * Inicializa el almacén con datos del Core.
     */
    hydrate: (rawLayout) => {
        set({ snapshot: rawLayout, history: [JSON.stringify(rawLayout)], historyPointer: 0 });
    },

    /**
     * Aplica un cambio atómico al snapshot y genera el Delta.
     * @param {Object} change - El payload del USSP.
     */
    applyChange: (change) => {
        const { target_id, property, value } = change;
        const current = get().snapshot;

        // Actualización inmutable del snapshot
        const updatedNodes = { ...current.nodes };
        const node = { ...(updatedNodes[target_id] || {}) };

        node[property.replace('u_', '')] = value;
        updatedNodes[target_id] = node;

        const newSnapshot = { ...current, nodes: updatedNodes };

        set({ snapshot: newSnapshot });
        get()._recordHistory(newSnapshot);
    },

    undo: () => {
        const { history, historyPointer } = get();
        if (historyPointer > 0) {
            const newPointer = historyPointer - 1;
            set({
                snapshot: JSON.parse(history[newPointer]),
                historyPointer: newPointer
            });
        }
    },

    redo: () => {
        const { history, historyPointer } = get();
        if (historyPointer < history.length - 1) {
            const newPointer = historyPointer + 1;
            set({
                snapshot: JSON.parse(history[newPointer]),
                historyPointer: newPointer
            });
        }
    },

    _recordHistory: (snapshot) => {
        const { history, historyPointer } = get();
        const serialized = JSON.stringify(snapshot);

        // Si el estado no ha cambiado realmente, no registramos
        if (serialized === history[historyPointer]) return;

        const newHistory = history.slice(0, historyPointer + 1);
        newHistory.push(serialized);

        // Limitamos el historial a 50 pasos
        if (newHistory.length > 50) newHistory.shift();

        set({
            history: newHistory,
            historyPointer: newHistory.length - 1
        });
    }
}));

export default useUSSPStateStore;




