/**
 * Sovereign_Adapter.js
 * DHARMA: Adaptador Agnostico. Provee una interfaz sin estado para hablar con el Core Connector.
 */

import connector from './Core_Connector';
import compiler from './laws/Law_Compiler';
import { StateBridge } from './state/StateBridge';

class SovereignAdapter {
    constructor() {
        this.isLabMode = window.location.href.includes('mode=lab');
        this.isIgnited = false;
        this.sovereigntyStatus = 'STANDBY';
        this.L0 = null;

        // AXIOMA: Proxy Dinámico.
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) return target[prop];
                return (method, payload) => target.call(prop, method, payload);
            }
        });
    }

    async runSystemAudit() {
        return await this.call('public', 'runSystemAudit', {});
    }

    async call(executor, method, payload = {}) {
        return await connector.call(executor, method, payload);
    }

    async executeAction(action, payload = {}) {
        return await connector.executeAction(action, payload);
    }

    async ignite() {
        const addLog = (msg, level = 'warn') => {
            StateBridge.addLog(msg, level, 'ADAPTER');
            console[level === 'error' ? 'error' : 'log'](`📡 [SovereignAdapter] ${msg}`);
        };

        addLog(`[IGNITION] Iniciando descubrimiento core...`);

        const cached = localStorage.getItem('INDRA_GENOTYPE_L0');
        if (cached && !this.isLabMode) {
            try {
                this.L0 = JSON.parse(cached);
                this.isIgnited = true;
                this.sovereigntyStatus = 'ACTIVE';
                if (this.L0.COMPONENT_REGISTRY) compiler.setOntology(this.L0.COMPONENT_REGISTRY, this.L0);
                addLog(`⚡ [L0] Cache restaurado v${this.L0.VERSION}.`);
            } catch (e) { localStorage.removeItem('INDRA_GENOTYPE_L0'); }
        }

        try {
            addLog("Sincronizando Genotipo con el Core...");
            const response = await connector.call('system', 'getSovereignGenotype', {});

            if (response && response.COMPONENT_REGISTRY) {
                this.L0 = response;
                this.isIgnited = true;
                this.sovereigntyStatus = 'ACTIVE';

                localStorage.setItem('INDRA_GENOTYPE_L0', JSON.stringify(this.L0));
                compiler.setOntology(this.L0.COMPONENT_REGISTRY, this.L0);
                if (this.L0.ARTIFACT_SCHEMAS) compiler.setArtifactSchemas(this.L0.ARTIFACT_SCHEMAS);

                addLog("✅ Genotipo Sincronizado correctamente.", 'info');
            }
        } catch (e) {
            addLog(`⚠️ Fallo en sincronización core: ${e.message}`, 'error');
            if (!this.L0) this.sovereigntyStatus = 'LOCKED';
        }

        return {
            success: this.sovereigntyStatus === 'ACTIVE',
            status: this.sovereigntyStatus,
            genotype: this.L0,
            error: this.sovereigntyStatus === 'LOCKED' ? "CORE_UNREACHABLE" : null
        };
    }

    async getCanon(adapterId) {
        if (!this.L0) return null;
        return compiler.getCanon(adapterId);
    }
}

const adapter = new SovereignAdapter();
export default adapter;



