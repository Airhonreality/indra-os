/**
 * =============================================================================
 * INDRA CONTRACT CORTEX (Agnostic JS Edition v3.2.1)
 * =============================================================================
 * Responsibilidad: Gestión del ADN local vía ES Modules.
 * =============================================================================
 */

export class ContractCortex {
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * @dharma Carga el contrato y la configuración vía Módulos JS Dinámicos.
     */
    async load() {
        try {
            // 1. Cargar Configuración de Ciudadanía (JS)
            // Ubicación: _INDRA_PROTOCOL_/indra_config.js (2 niveles arriba de 'bridge_modules/')
            let config = {};
            try {
                const configModule = await import(`../../indra_config.js?t=${Date.now()}`);
                config = configModule.INDRA_CONFIG || {};
            } catch (importErr) {
                console.warn("[ContractCortex] indra_config.js no detectado o corrupto. Usando estado en memoria.");
            }

            // 2. Cargar Contrato Maestro Consolidado (JS)
            // Ubicación: _INDRA_PROTOCOL_/indra_contract.js (2 niveles arriba)
            let contract = { schemas: [], workflows: [] };
            try {
                const contractModule = await import(`../../indra_contract.js?t=${Date.now()}`);
                contract = contractModule.INDRA_CONTRACT || contract;
            } catch (contractErr) {
                console.error("[ContractCortex] ERROR FATAL: No se encontró 'indra_contract.js'.");
                window.dispatchEvent(new CustomEvent("indra-resonance-sync", { 
                    detail: { mode: 'BROKEN', message: 'Falta Tejido de ADN. Ejecuta npm run sync' } 
                }));
                throw contractErr;
            }

            // 3. Inyección y Sincronía Final
            contract.satellite_name = config.satellite_name || contract.satellite_name || 'Satélite Anónimo';
            contract.core_id = config.core_id || contract.core_id;
            
            this.bridge.contract = contract;
            this.bridge.activeWorkspaceId = config.workspace_id || this.bridge.activeWorkspaceId;

            console.log("[ContractCortex] ADN JS sincronizado exitosamente.");
            return contract;
        } catch (e) {
            console.error('[ContractCortex] Fallo en la carga del ADN:', e);
            return { schemas: [], workflows: [] };
        }
    }

    calculateChecksum(schemas) {
        // Normalizamos el JSON (ordenar llaves) para evitar divergencias falsas por formato
        const str = JSON.stringify(schemas || [], Object.keys(schemas || [] || {}).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `chk_${Math.abs(hash).toString(36)}`;
    }
}
