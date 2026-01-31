/**
 * 🧠 STATE LAYER (Layer 1)
 * Monitors the Reactive Store integrity and session health.
 */
import { useSystemStore } from '../../state/ReactiveStore';

export class StateLayer {
    constructor() {
        this.name = 'state';
    }

    async init() {
        console.log('[LAYER:1] State Analysis...');
        useSystemStore.getState().initialize(); // Hydrate session
        return true;
    }

    async diagnose() {
        const store = useSystemStore.getState();

        return {
            system_id: store.SYSTEM_ID,
            session_active: !!store.session?.id,
            nodes_active: Object.keys(store.nodes || {}).length,
            is_hydrated: !!store.session?.lastActive
        };
    }
}
