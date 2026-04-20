/**
 * =============================================================================
 * INDRA RESONANCE SYNC (Orchestrator v5.0 - SINCERITY EDITION)
 * =============================================================================
 */

export class ResonanceSync {
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * PROTOCOLO DE ANCLAJE (THE PURE SEED)
     * Sincroniza el ADN local (JS/JSON) con el territorio del Workspace.
     * Crea o actualiza un archivo .json nativo que React puede consumir.
     */
    async anchorSchema(schemaName) {
        const { bridge } = this;
        const schema = bridge.contract.schemas.find(s => s.id === schemaName || s.handle?.alias === schemaName);
        
        if (!schema) throw new Error(`SCHEMA_NOT_FOUND: ${schemaName}`);

        // 1. LOCALIZACIÓN TERRITORIAL
        const activeWS = bridge.availableWorkspaces.find(w => w.id === bridge.activeWorkspaceId);
        const folderId = activeWS?.payload?.artifacts_folder_id;

        if (!folderId) {
            throw new Error("No se detectó una carpeta de /artifacts en el Workspace activo. El anclaje es imposible.");
        }

        console.log(`[Sincerity:Anchor] Inyectando semilla '${schemaName}' en artifacts (${folderId})...`);

        try {
            // 2. EJECUCIÓN DE PROTOCOLO PURO (ATOM_CREATE de clase DATA_SCHEMA)
            const response = await bridge.execute({
                protocol: 'ATOM_CREATE',
                provider: 'drive',
                context_id: folderId,
                data: {
                    ...schema,
                    class: 'DATA_SCHEMA'
                }
            });

            if (response.metadata?.status === 'OK') {
                const coreAtom = response.items?.[0];
                
                // 3. CAPTURA DE EVIDENCIA REAL (Sin inventos)
                schema.metadata = {
                    drive_id: coreAtom.id,
                    synced_at: new Date().toLocaleString(),
                    artifacts_folder: folderId
                };

                // 4. PERSISTENCIA DE SOBERANÍA (LocalStorage para la sesión)
                bridge.ignitions = bridge.ignitions || {};
                bridge.ignitions[schemaName] = schema.metadata;
                localStorage.setItem('INDRA_IGNITIONS', JSON.stringify(bridge.ignitions));
                
                console.log(`🚀 [Sincerity] Semilla anclada: ${schemaName} -> Drive:${coreAtom.id}`);
                return response;
            }

            throw new Error(response.metadata?.error || "CORE_REJECTED_SEED");

        } catch (e) {
            console.error(`[Sincerity:Anchor] Error en anclaje de ${schemaName}:`, e);
            throw e;
        }
    }

    /**
     * RAMA A: Anclaje de Vínculo Celular
     */
    async anchorCitizenship(workspaceId = null) {
        const { bridge } = this;
        try {
            const response = await bridge.execute({
                protocol: 'SYSTEM_RESONANCE_CRYSTALLIZE',
                provider: 'system',
                data: { 
                    satellite_name: bridge.contract.satellite_name, 
                    requested_workspace: workspaceId,
                    force_new: !workspaceId 
                }
            });

            if (response.metadata?.status === 'OK') {
                bridge.activeWorkspaceId = response.metadata.generated_workspace_id;
                window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
                return bridge.activeWorkspaceId;
            }
            throw new Error(response.metadata?.error || "LINKAGE_FAILED");
        } catch (e) {
            console.error("[ResonanceSync:Anchor] Fallo el vínculo celular:", e);
            throw e;
        }
    }

    // El resto de métodos industriales quedan depreciados en favor del Anclaje de Semillas
    async materializeSchema() { console.warn("DEPRECATED: Use anchorSchema for Sincerity Protocol."); }
    async resonateSchema() { console.warn("DEPRECATED: Use anchorSchema for Sincerity Protocol."); }
}
