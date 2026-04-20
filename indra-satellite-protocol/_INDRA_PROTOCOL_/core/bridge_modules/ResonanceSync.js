/**
 * =============================================================================
 * INDRA RESONANCE SYNC (Orchestrator v5.1 - CLASS ONE CITIZEN)
 * =============================================================================
 */

export class ResonanceSync {
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * PROTOCOLO DE ANCLAJE (THE PURE SEED - SYSTEM EDITION)
     * Sincroniza el ADN local con el Core usando el proveedor de SISTEMA.
     * Esto asegura que el átomo se registre en el LEDGER y sea visible para React.
     */
    async anchorSchema(schemaName) {
        const { bridge } = this;
        const schema = bridge.contract.schemas.find(s => s.id === schemaName || s.handle?.alias === schemaName);
        
        if (!schema) throw new Error(`SCHEMA_NOT_FOUND: ${schemaName}`);

        const workspaceId = bridge.activeWorkspaceId;
        if (!workspaceId) {
            throw new Error("No hay un Workspace activo seleccionado.");
        }

        console.log(`[Sincerity:Anchor] Inyectando semilla '${schemaName}' vía SYSTEM en Workspace: ${workspaceId}...`);

        try {
            // 2. EJECUCIÓN DE PROTOCOLO DE SISTEMA (Inscripción en el Ledger Maestro)
            const response = await bridge.execute({
                protocol: 'ATOM_CREATE',
                provider: 'system', // <--- ELEVACIÓN A CIUDADANO CLASE 1
                workspace_id: workspaceId,
                data: {
                    class: 'DATA_SCHEMA',
                    name: schema.label || schemaName,
                    handle: { 
                        alias: schema.handle?.alias || schemaName, 
                        label: schema.label || schemaName 
                    },
                    payload: {
                        fields: schema.fields || [],
                        source: 'SATELLITE_SYNC' // Firma nativa de React
                    }
                }
            });

            if (response.metadata?.status === 'OK') {
                const coreAtom = response.items?.[0];
                
                // 3. CAPTURA DE EVIDENCIA REAL
                schema.metadata = {
                    drive_id: coreAtom.id,
                    synced_at: new Date().toLocaleString(),
                    workspace_id: workspaceId
                };

                // 4. PERSISTENCIA
                bridge.ignitions = bridge.ignitions || {};
                bridge.ignitions[schemaName] = schema.metadata;
                localStorage.setItem('INDRA_IGNITIONS', JSON.stringify(bridge.ignitions));
                
                console.log(`🚀 [Sincerity] Semilla anclada y registrada en Ledger: ${schemaName} -> ID:${coreAtom.id}`);
                return response;
            }

            throw new Error(response.metadata?.error || "CORE_REJECTED_SYSTEM_SEED");

        } catch (e) {
            console.error(`[Sincerity:Anchor] Error en anclaje de sistema de ${schemaName}:`, e);
            throw e;
        }
    }

    /**
     * CIRUGÍA ATÓMICA (PATCHING)
     * Actualiza solo un sub-conjunto de la estructura del esquema en el Core.
     */
    async patchSchemaField(schemaName, fieldDelta) {
        const { bridge } = this;
        const schema = bridge.contract.schemas.find(s => s.id === schemaName || s.handle?.alias === schemaName);
        
        if (!schema || !schema.metadata?.drive_id) {
            throw new Error(`SCHEMA_NOT_ANCHORED: ${schemaName}. Primero debes anclar el esquema al core.`);
        }

        console.log(`[Sincerity:Patch] Aplicando cirugía atómica a '${schemaName}' - Campo: ${fieldDelta.id}...`);

        try {
            const response = await bridge.execute({
                protocol: 'ATOM_PATCH',
                provider: 'drive',
                context_id: schema.metadata.drive_id,
                data: {
                    payload: {
                        fields: schema.fields // El delta se aplica en el Core, pero mandamos el estado deseado de la lista
                    }
                }
            });

            if (response.metadata?.status === 'OK') {
                schema.metadata.synced_at = new Date().toLocaleString();
                console.log(`✅ [Sincerity] Campo '${fieldDelta.id}' sincronizado exitosamente.`);
                return response;
            }

            throw new Error(response.metadata?.error || "CORE_REJECTED_PATCH");
        } catch (e) {
            console.error(`[Sincerity:Patch] Falló la cirugía en ${schemaName}:`, e);
            throw e;
        }
    }

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

    async materializeSchema() { console.warn("DEPRECATED: Use anchorSchema."); }
    async resonateSchema() { console.warn("DEPRECATED: Use anchorSchema."); }
}
