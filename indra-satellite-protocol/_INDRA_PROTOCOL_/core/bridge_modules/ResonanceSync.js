/**
 * =============================================================================
 * INDRA RESONANCE SYNC (Orchestrator v3.3 - Branching Edition)
 * =============================================================================
 * Responsibilidad: Orquestación de las dos ramas de soberanía:
 * Rama A: Anclaje de Ciudadanía (Nuevo Satélite)
 * Rama B: Sincronización de ADN (Satélite Existente)
 * =============================================================================
 */

export class ResonanceSync {
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * RAMA A: Anclaje de Ciudadanía (Génesis)
     * Se usa cuando el satélite no reconoce un workspace local.
     */
    async anchorCitizenship() {
        console.log("[ResonanceSync:BranchA] Iniciando Anclaje de Ciudadanía...");
        return await this._executeAtomicSync(true);
    }

    /**
     * RAMA B: Sincronización de ADN (Soberanía)
     * Se usa cuando ya existe un workspace pero el ADN ha divergido.
     */
    async syncDNA() {
        console.log("[ResonanceSync:BranchB] Iniciando Sincronización de ADN...");
        return await this._executeAtomicSync(false);
    }

    /**
     * @dharma El gran ciclo atómico de sincronización progresiva.
     */
    async _executeAtomicSync(isNewSatellite = false) {
        const { bridge } = this;
        if (!bridge.coreUrl || !bridge.satelliteToken) throw new Error("AUTH_REQUIRED");
        
        const localChecksum = bridge.contractCortex.calculateChecksum(bridge.contract.schemas);

        try {
            // 1. Cristalizar en Core (Nube)
            // Si es un satélite nuevo, enviamos null en workspace para forzar creación
            const targetWorkspace = isNewSatellite ? null : bridge.activeWorkspaceId;

            const crystalResponse = await bridge.execute({
                protocol: 'SYSTEM_RESONANCE_CRYSTALLIZE',
                provider: 'system',
                data: { 
                    contract: bridge.contract, 
                    checksum: localChecksum,
                    force_new: isNewSatellite,
                    requested_workspace: targetWorkspace
                }
            });

            if (!crystalResponse || crystalResponse.metadata?.status === 'ERROR') {
                throw new Error(crystalResponse?.metadata?.error || "CRYSTALLIZE_FAILED");
            }

            // 2. Extraer Identidad Asignada
            if (crystalResponse.metadata?.generated_workspace_id) {
                bridge.activeWorkspaceId = crystalResponse.metadata.generated_workspace_id;
            }

            // 3. Persistencia Soberana en Disco (Módulo JS)
            const saveResult = await this.persistMetadata();
            
            // 4. Triggerear Compilador Local
            const apiOrigin = window.location.origin;
            await fetch(`${apiOrigin}/api/indra/sync`, { method: 'POST' });

            // 5. Recarga y Verificación Final
            await bridge.contractCortex.load();
            
            console.log(`[ResonanceSync] Sincronía Exitosa. Modo: ${isNewSatellite ? 'GÉNESIS' : 'RESIDENTE'}`);
            window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
            
            return true;

        } catch (e) {
            console.error("[ResonanceSync] Fallo en el Ciclo Atómico:", e);
            throw e;
        }
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
