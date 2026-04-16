/**
 * =============================================================================
 * INDRA RESONANCE SYNC (Orchestrator v3.1)
 * =============================================================================
 * Responsibilidad: Orquestación de la persistencia mutua y cristalización.
 * =============================================================================
 */

export class ResonanceSync {
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * @dharma El gran ciclo de sincronización.
     * 1. Cristaliza ADN en el Core.
     * 2. Persiste Configuración en el Daemon (JS).
     * 3. Dispara compilación remota.
     */
    async masterSync() {
        const { bridge } = this;
        if (!bridge.coreUrl || !bridge.satelliteToken) throw new Error("AUTH_REQUIRED");
        
        console.log("[ResonanceSync] Iniciando Cristalización Atómica...");
        const localChecksum = bridge.contractCortex.calculateChecksum(bridge.contract.schemas);

        try {
            // 1. Cristalizar en Core (Nube)
            const crystalResponse = await bridge.execute({
                protocol: 'SYSTEM_RESONANCE_CRYSTALLIZE',
                provider: 'system',
                data: { contract: bridge.contract, checksum: localChecksum }
            });

            if (!crystalResponse || crystalResponse.metadata?.status === 'ERROR') {
                throw new Error(crystalResponse?.metadata?.error || "CRYSTALLIZE_FAILED");
            }

            // 2. Extraer Ciudadanía
            if (crystalResponse.metadata?.generated_workspace_id) {
                bridge.activeWorkspaceId = crystalResponse.metadata.generated_workspace_id;
            }

            // 3. Persistencia Soberana en Disco (JS Module via Daemon)
            const saveResult = await this.persistMetadata();
            if (saveResult.status !== 'ok') {
                console.warn("[ResonanceSync] El Daemon no pudo persistir el ADN en disco.");
            }

            // 4. Triggerear Compilador Local (Genera el contrato final)
            const apiOrigin = window.location.origin;
            await fetch(`${apiOrigin}/api/indra/sync`, { method: 'POST' });

            // 5. Recarga en Caliente (Hot Reload del ADN)
            await bridge.contractCortex.load();
            
            window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
            return true;

        } catch (e) {
            console.error("[ResonanceSync] Fallo crítico en sincronización:", e);
            throw e;
        }
    }

    /**
     * @dharma Petición al Daemon para escribir el indra_config.js
     */
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
