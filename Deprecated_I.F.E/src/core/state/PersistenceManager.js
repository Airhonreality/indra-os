/**
 * 🛰️ INDRA PERSISTENCE MANAGER (core/state/PersistenceManager.js)
 * Version: 2.0.0
 * Pure engineering replacement for the "Recall" metaphor.
 * Axiom: Temporal Integrity. Node state history management.
 */

import { create } from 'zustand';
import { useCoreStore } from './CoreStore';

export const usePersistenceManager = create((set, get) => ({
    past: [],
    future: [],
    limit: 20,

    // --- UTILS ---
    /**
     * Generador de Hash de Integridad (Simple Checksum).
     */
    _getIntegrityHash: (uuid) => {
        const item = useCoreStore.getState().nodes[uuid];
        if (!item) return 'VOID';
        return `${JSON.stringify(item).length}_${item.x}_${item.y}`;
    },

    /**
     * Registra un cambio en la línea temporal.
     */
    recordAction: (delta) => {
        const { past, limit, _getIntegrityHash } = get();

        const integrityHash = _getIntegrityHash(delta.uuid);

        const secureDelta = { ...delta, integrityHash };
        const newPast = [...past, secureDelta];

        if (newPast.length > limit) {
            newPast.shift();
        }

        set({ past: newPast, future: [] });
    },

    undo: () => {
        const { past, future } = get();
        if (past.length === 0) return;

        const delta = past[past.length - 1];

        try {
            if (!delta.uuid) throw new Error("DELTA_CORRUPT");

            if (!useCoreStore.getState().nodes[delta.uuid] && delta.before) {
                throw new Error("TIME_PARADOX: El objeto ha dejado de existir en el presente.");
            }

            useCoreStore.getState().updateNode(delta.uuid, delta.before);

            set({
                past: past.slice(0, past.length - 1),
                future: [delta, ...future]
            });
        } catch (err) {
            console.error("[PERSISTENCE_CORRUPT] Fallo en viaje temporal. Invalidando historial.", err);
            set({ past: [], future: [] });
            useCoreStore.getState().setSystemStatus('EMERGENCY');
        }
    },

    redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;

        const delta = future[0];

        try {
            if (!delta.uuid) throw new Error("DELTA_CORRUPT");

            useCoreStore.getState().updateNode(delta.uuid, delta.after);

            set({
                past: [...past, delta],
                future: future.slice(1)
            });
        } catch (err) {
            console.error("[PERSISTENCE_CORRUPT] Fallo en Redo. Invalidando historial.");
            set({ past: [], future: [] });
        }
    },

    clearHistory: () => set({ past: [], future: [] })
}));
