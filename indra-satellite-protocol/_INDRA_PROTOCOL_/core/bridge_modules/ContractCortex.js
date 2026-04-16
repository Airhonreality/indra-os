/**
 * =============================================================================
 * INDRA CONTRACT CORTEX (Agnostic JS Edition)
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
     * Esto elimina la dependencia de 'fetch' y 'JSON.parse' para activos locales.
     */
    async load() {
        try {
            // 1. Cargar Configuración de Ciudadanía (JS)
            // Blindaje contra corrupción de archivo: Si el .js está mal formado, caemos a un objeto seguro.
            let config = {};
            try {
                // Query param dinámico para romper caché de disco en caliente
                const configModule = await import(`../indra_config.js?t=${Date.now()}`);
                config = configModule.INDRA_CONFIG || {};
            } catch (importErr) {
                console.warn("[ContractCortex] Error cargando 'indra_config.js' (posible corrupción). Usando memoria.");
            }

            // 2. Cargar Contrato Maestro Consolidado (JS)
            // Este archivo es el resultado del tejido de 'sync_core.js'
            let contract = { schemas: [], workflows: [] };
            try {
                const contractModule = await import(`../indra_contract.js?t=${Date.now()}`);
                contract = contractModule.INDRA_CONTRACT || contract;
            } catch (contractErr) {
                console.warn("[ContractCortex] Error cargando 'indra_contract.js'. ¿Has ejecutado 'npm run sync'?");
            }

            // 3. Inyección y Sincronía Final
            contract.satellite_name = config.satellite_name || contract.satellite_name || 'Satélite Anónimo';
            contract.core_id = config.core_id || contract.core_id;
            
            this.bridge.contract = contract;
            this.bridge.activeWorkspaceId = config.workspace_id || this.bridge.activeWorkspaceId;

            console.log("[ContractCortex] ADN JS sincronizado.");
            return contract;
        } catch (e) {
            console.error('[ContractCortex] Error cargando ADN:', e);
            return { schemas: [], workflows: [] };
        }
    }

    calculateChecksum(schemas) {
        // Normalizamos el JSON (ordenar llaves) para evitar divergencias falsas por formato
        const str = JSON.stringify(schemas || [], Object.keys(schemas || []).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `chk_${Math.abs(hash).toString(36)}`;
    }
}
