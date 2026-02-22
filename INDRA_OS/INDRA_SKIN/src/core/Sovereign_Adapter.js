import connector from './Core_Connector.js';
import compiler from './2_Semantic_Transformation/Law_Compiler.js';
import { StateBridge } from './1_Axiomatic_Store/StateBridge.js';
import InterdictionUnit from './1_Axiomatic_Store/InterdictionUnit.js';

class SovereignAdapter {
    constructor() {
        // ADR-022: isLabMode PURGADO — DevLab erradicado
        this.isIgnited = false;
        this.sovereigntyStatus = 'STANDBY';
        this.L0 = null;

        // AXIOMA: Proxy Dinámico.
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) return target[prop];
                // Redirigir llamadas dinámicas a InterdictionUnit
                return (method, payload) => InterdictionUnit.call(prop, method, payload);
            }
        });
    }

    async runSystemAudit() {
        return await InterdictionUnit.call('public', 'runSystemAudit', {});
    }

    async call(executor, method, payload = {}) {
        // Redirigir a la membrana de contención
        return await InterdictionUnit.call(executor, method, payload);
    }

    async executeAction(action, payload = {}) {
        // action suele ser 'nodeId:method'
        const [executor, method] = action.includes(':') ? action.split(':') : ['system', action];
        return await InterdictionUnit.call(executor, method, payload);
    }

    async ignite() {
        const addLog = (msg, level = 'warn') => {
            StateBridge.addLog(msg, level, 'ADAPTER');
            console[level === 'error' ? 'error' : 'log'](`📡 [SovereignAdapter] ${msg}`);
        };

        addLog(`[IGNITION] Iniciando descubrimiento core...`);

        // ADR-022: Cache siempre se respeta — sin condición isLabMode
        const cached = localStorage.getItem('AXIOM_GENOTYPE_L0');
        if (cached) {
            try {
                this.L0 = JSON.parse(cached);
                this.isIgnited = true;
                this.sovereigntyStatus = 'ACTIVE';
                if (this.L0.COMPONENT_REGISTRY) compiler.setOntology(this.L0.COMPONENT_REGISTRY, this.L0);
                addLog(`⚡ [L0] Cache restaurado v${this.L0.VERSION}.`);
            } catch (e) { localStorage.removeItem('AXIOM_GENOTYPE_L0'); }
        }

        try {
            addLog("Sincronizando Genotipo con el Core...");
            const response = await connector.call('system', 'getSovereignGenotype', {});

            if (response && response.COMPONENT_REGISTRY) {
                this.L0 = response;
                this.isIgnited = true;
                this.sovereigntyStatus = 'ACTIVE';

                localStorage.setItem('AXIOM_GENOTYPE_L0', JSON.stringify(this.L0));
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
            sovereignty: this.sovereigntyStatus, // <--- AÑADIDO PARA COMPATIBILIDAD
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




