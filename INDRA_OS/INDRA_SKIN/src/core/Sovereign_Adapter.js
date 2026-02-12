/**
 * Sovereign_Adapter.js
 * DHARMA: Adaptador Agnostico. Provee una interfaz sin estado para hablar con el Core Connector.
 * Axioma: "La UI no toca el Core, el Adaptador es la Membrana."
 * 
 * UPDATE (2630): Implementación de "Optimistic Ignition" (L0 Cache) para arranque instantáneo (Fat Client).
 */

import connector from './Core_Connector';
import compiler from './laws/Law_Compiler';

class SovereignAdapter {
    constructor() {
        this.isLabMode = window.location.href.includes('mode=lab');
        this.isIgnited = false;
        this.sovereigntyStatus = 'STANDBY';
        this.L0 = null;

        // AXIOMA: Proxy Dinámico. Permite llamar a cualquier adaptador/método sin registrarlo en el Front.
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) return target[prop];

                // Si llamamos a algo que no existe en la clase, asumimos que es un nodo del core
                // Uso: adapter.drive('find', { query: '...' })
                return (method, payload) => target.call(prop, method, payload);
            }
        });
    }

    /**
     * Puente con la PublicAPI para diagnósticos de Verdad Atómica.
     */
    async runSystemAudit() {
        return await this.call('public', 'runSystemAudit', {});
    }

    async call(executor, method, payload = {}) {
        return await connector.call(executor, method, payload);
    }

    async executeAction(action, payload = {}) {
        return await connector.executeAction(action, payload);
    }

    /**
     * Ignición Simplificada: Descubrimiento de Genotipo Directo.
     */
    async ignite() {
        const addLog = (msg, level = 'warn') => {
            if (window.INDRA_DEBUG) window.INDRA_DEBUG.logs.push({ msg, level, time: new Date().toLocaleTimeString(), node: 'ADAPTER' });
            console[level === 'error' ? 'error' : 'log'](`📡 [SovereignAdapter] ${msg}`);
        };

        addLog(`[IGNITION] Iniciando descubrimiento core...`);

        // 1. Intentar Cargar Cache L0 (Consciencia Instantánea)
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

        // 2. Sincronización Real con el Core
        try {
            addLog("Sincronizando Genotipo con el Core...");
            // AXIOMA: Usamos 'system' en lugar de 'public' para evitar rutas legacy rotas.
            const response = await connector.call('system', 'getSovereignGenotype', {});

            if (response && response.COMPONENT_REGISTRY) {
                this.L0 = response;
                this.isIgnited = true;
                this.sovereigntyStatus = 'ACTIVE';

                // Actualizar Cache y Compilador
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
