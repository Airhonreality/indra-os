/**
 * =============================================================================
 * INDRA RESONANCE SYNC (Orchestrator)
 * =============================================================================
 * Responsibilidad: Orquestación de la persistencia mutua y cristalización.
 * =============================================================================
 */

export class ResonanceSync {
    constructor(bridge) {
        this.bridge = bridge;
    }

    async masterSync() {
        const { bridge } = this;
        if (!bridge.coreUrl || !bridge.satelliteToken) throw new Error("AUTH_REQUIRED");
        
        console.log("[ResonanceSync] Iniciando Cristalización...");
        const localChecksum = bridge.contractCortex.calculateChecksum(bridge.contract.schemas);

        // 1. Cristalizar en Core
        const crystalResponse = await bridge.execute({
            protocol: 'SYSTEM_RESONANCE_CRYSTALLIZE',
            provider: 'system',
            data: { contract: bridge.contract, checksum: localChecksum }
        });

        bridge.capabilities = crystalResponse.metadata || {};
        
        // 2. Persistir Ciudadanía
        if (crystalResponse.metadata?.generated_workspace_id) {
            bridge.activeWorkspaceId = crystalResponse.metadata.generated_workspace_id;
            const savedSync = JSON.parse(localStorage.getItem('INDRA_SATELLITE_LINK') || '{}');
            savedSync.workspaceId = bridge.activeWorkspaceId;
            localStorage.setItem('INDRA_SATELLITE_LINK', JSON.stringify(savedSync));
        }

        // 3. Persistencia Local (Daemon)
        await this.persistMetadata();

        // 4. Triggerear Compilador Remoto
        const apiOrigin = window.location.origin;
        await fetch(`${apiOrigin}/api/indra/sync`, { method: 'POST' });

        // 5. Refrescar localmente
        await bridge.contractCortex.load();
        window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
        
        return true;
    }

    async persistMetadata() {
        const payload = {
            satellite_name: this.bridge.contract.satellite_name,
            core_id: this.bridge.contract.core_id,
            workspace_id: this.bridge.activeWorkspaceId
        };
        const apiOrigin = window.location.origin;
        const response = await fetch(`${apiOrigin}/api/indra/metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    }
}
