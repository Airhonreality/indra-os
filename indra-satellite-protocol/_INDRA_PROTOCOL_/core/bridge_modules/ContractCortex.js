/**
 * =============================================================================
 * INDRA CONTRACT CORTEX
 * =============================================================================
 * Responsibilidad: Gestión del ADN local (Contratos y Schemas).
 * =============================================================================
 */

export class ContractCortex {
    constructor(bridge) {
        this.bridge = bridge;
    }

    async load(path = './_INDRA_PROTOCOL_/indra_contract.json') {
        try {
            const localAssets = await this._harvestLocalAssets();
            const response = await fetch(path);
            const contract = await response.json();

            if (localAssets.schemas.length > 0) {
                contract.schemas = [...(contract.schemas || []), ...localAssets.schemas];
            }
            if (localAssets.workflows.length > 0) {
                contract.workflows = localAssets.workflows;
            }

            this.bridge.contract = contract;
            return contract;
        } catch (e) {
            console.error('[ContractCortex] Error cargando contrato:', e);
            throw e;
        }
    }

    async _harvestLocalAssets() {
        return { schemas: [], workflows: [] }; // Placeholder para escaneo estático
    }

    calculateChecksum(schemas) {
        const str = JSON.stringify(schemas || []);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `chk_${Math.abs(hash).toString(36)}`;
    }
}
