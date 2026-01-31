/**
 * 🛠️ INDRA SYSTEM INTEGRITY (brain/vital/IntegrityManager.js)
 * High-Level Industry Standard for Lifecycle Management.
 */

class IntegrityManager {
    constructor() {
        this.layers = {};
        this.status = 'DORMANT';

        // Global exposure for diagnostics
        window.INDRA_INTEGRITY = this;
        console.log('%c 🛡️ SYSTEM INTEGRITY: INITIALIZED ', 'background: #222; color: #bada55');
    }

    registerLayer(name, layerInstance) {
        this.layers[name] = layerInstance;
        console.log(`[INTEGRITY] Layer Registered: ${name}`);
    }

    async boot() {
        console.log('[INTEGRITY] Booting Sequence...');
        this.status = 'BOOTING';

        try {
            // Boot Order: Network -> State -> Visual (Skin Layer)
            if (this.layers.network) await this.layers.network.init();
            if (this.layers.state) await this.layers.state.init();

            this.status = 'ALIVE';
            console.log('%c 🛡️ SYSTEM INTEGRITY: ALIVE ', 'background: #222; color: #0f0; font-size: 14px');
        } catch (error) {
            this.status = 'CRITICAL_FAILURE';
            console.error('[INTEGRITY] Boot Failed:', error);
        }
    }

    async diagnose(layerName) {
        if (!this.layers[layerName]) {
            console.error(`Layer ${layerName} not found.`);
            return;
        }
        console.group(`[DIAGNOSTIC] ${layerName}`);
        try {
            const result = await this.layers[layerName].diagnose();
            console.log('Result:', result);
        } catch (e) {
            console.error('Diagnostic Failed:', e);
        }
        console.groupEnd();
    }

    async systemCheck() {
        console.group('🛡️ SYSTEM CHECK');
        for (const name of Object.keys(this.layers)) {
            await this.diagnose(name);
        }
        console.groupEnd();
    }
}

export const Integrity = new IntegrityManager();
