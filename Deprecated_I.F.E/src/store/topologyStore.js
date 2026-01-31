import { create } from 'zustand';
import CoreBridge, { getConfig } from '../core/bridge/CoreBridge';

/**
 * 🗺️ TOPOLOGY STORE (store/topologyStore.js)
 * Manages spatial state (coordinates) of graph artifacts.
 * Axis: Layer 2 - Spatial Persistence.
 */
const useTopologyStore = create((set, get) => ({
    nodePositions: {}, // { [id]: { x, y, z } }
    loading: false,
    saveTimeout: null,

    /**
     * Load spatial state from Core for a specific context.
     * @param {string} folderId - Context ID
     */
    loadSpatialState: async (folderId) => {
        // Validation: If no folderId provided, try to use Root
        const targetFolder = folderId || getConfig().FOLDER_ID;

        set({ loading: true });
        try {
            console.log(`[TOPOLOGY] Loading spatial state for: ${targetFolder}`);
            const response = await CoreBridge.callCore('sensing', 'getSpatialState', { folderId: targetFolder });

            if (response && response.nodes) {
                const positions = {};
                response.nodes.forEach(n => {
                    positions[n.id] = { x: n.x, y: n.y, z: n.z };
                });
                set({ nodePositions: positions });
                console.log(`[TOPOLOGY] Loaded ${response.nodes.length} positions.`);
            }
        } catch (e) {
            console.warn('[TOPOLOGY] Failed to load spatial state or no state exists:', e.message);
        } finally {
            set({ loading: false });
        }
    },

    /**
     * Update local position immediately (UI Optimistic) and trigger sync.
     * @param {string} id - Node ID
     * @param {Object} position - {x, y, z}
     * @param {string} folderId - Context ID (optional constraint)
     */
    updateNodePosition: (id, position, folderId) => {
        set(state => ({
            nodePositions: {
                ...state.nodePositions,
                [id]: position
            }
        }));

        // Trigger save
        get()._scheduleSave(folderId);
    },

    /**
     * Internal: Schedule debounced save to Core.
     */
    _scheduleSave: (folderId) => {
        const { saveTimeout, nodePositions } = get();
        if (saveTimeout) clearTimeout(saveTimeout);

        const targetFolder = folderId || getConfig().FOLDER_ID;

        const timeout = setTimeout(async () => {
            console.log('[TOPOLOGY] Syncing spatial state to Core...');
            const nodes = Object.entries(nodePositions).map(([id, pos]) => ({
                id,
                ...pos
            }));

            try {
                await CoreBridge.callCore('sensing', 'reconcileSpatialState', {
                    folderId: targetFolder,
                    nodes
                });
                console.log('[TOPOLOGY] Spatial state synced successfully.');
            } catch (e) {
                console.error('[TOPOLOGY] Sync failed:', e);
            }
        }, 1000); // 1000ms debounce

        set({ saveTimeout: timeout });
    }
}));

export default useTopologyStore;
