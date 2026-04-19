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
     * RAMA A: Anclaje de Vínculo Celular (Génesis o Re-vinculación)
     * Se usa para establecer la relación [Satélite] <-> [Workspace].
     * @v4.0 Solo gestiona la infraestructura, no toca los datos.
     */
    async anchorCitizenship(workspaceId = null) {
        const { bridge } = this;
        console.log("[ResonanceSync:BranchA] Iniciando Anclaje de Vínculo Celular...");
        
        try {
            const payload = { 
                satellite_name: bridge.contract.satellite_name, 
                requested_workspace: workspaceId,
                force_new: !workspaceId 
            };

            const response = await bridge.execute({
                protocol: 'SYSTEM_RESONANCE_CRYSTALLIZE',
                provider: 'system',
                data: payload
            });

            if (!response || response.metadata?.status === 'ERROR') {
                throw new Error(response?.metadata?.error || "LINKAGE_FAILED");
            }

            // Establecer el vínculo atómico
            bridge.activeWorkspaceId = response.metadata.generated_workspace_id;
            
            // Persistencia Ferroso en Disco
            await this.persistMetadata();
            
            // Notificar estabilidad de vínculo
            window.dispatchEvent(new CustomEvent("indra-resonance-sync", { detail: { mode: 'STABLE' } }));
            
            return bridge.activeWorkspaceId;

        } catch (e) {
            console.error("[ResonanceSync:Anchor] Fallo el vínculo celular:", e);
            throw e;
        }
    }

    /**
     * @dharma Ignición Industrial (Materialización de Silo).
     * El satélite decide voluntariamente dar cuerpo a un esquema en un Silo físico
     * invocando los Motores Naturales de Indra (PINE).
     */
    async materializeSchema(schemaName, options = {}) {
        const { bridge } = this;
        const schema = bridge.contract.schemas.find(s => s.id === schemaName || s.handle?.alias === schemaName);
        
        if (!schema) throw new Error(`SCHEMA_NOT_FOUND: ${schemaName}`);

        console.log(`[ResonanceSync:IndustrialIgnition] Solicitando materialización industrial para: ${schemaName}...`);

        try {
            // AXIOMA DE GÉNESIS: El satélite envía su ADN (Blueprint) al motor de automatización
            const response = await bridge.execute({
                protocol: 'INDUSTRIAL_IGNITE',
                provider: 'automation',
                data: {
                    blueprint: schema,
                    target_provider: options.provider || 'drive',
                    workspace_id: bridge.activeWorkspaceId
                }
            });

            if (response.metadata?.status === 'OK') {
                // Capturamos el resultado del motor natural
                const ticket = response.metadata.ticket;
                const schemaAtom = response.metadata.schema_atom;
                const siloId = schemaAtom.payload?.silo_id;

                if (!siloId) {
                    throw new Error("El motor industrial no devolvió un Silo ID válido.");
                }

                console.log(`[ResonanceSync] Esquema ${schemaName} cristalizado con éxito en [${options.provider || 'drive'}]: ${siloId}`);
                
                // --- REGISTRO DE CIUDADANÍA SOBERANA ---
                bridge.ignitions = bridge.ignitions || {};
                bridge.ignitions[schemaName] = {
                    silo_id: siloId,
                    provider: options.provider || 'drive',
                    bridge_id: schemaAtom.payload?.bridge_id,
                    materialized_at: new Date().toISOString()
                };

                // Actualizar contrato vivo para feedback instantáneo en UI
                schema.metadata = { ...schema.metadata, silo_id: siloId };

                // Persistencia Ferroso (indra_config.js)
                await this.persistMetadata();
                
                return siloId;
            }
            
            throw new Error(response.metadata?.error || "INDUSTRIAL_IGNITION_FAILED");

        } catch (e) {
            console.error(`[ResonanceSync:IndustrialIgnition] Colapso en materialización de ${schemaName}:`, e);
            throw e;
        }
    }

    /**
     * @dharma Resonancia Industrial (Actualización Contextual).
     * Sincroniza la realidad del satélite con el silo físico a través
     * del protocolo industrial consolidado.
     */
    async resonateSchema(schemaName) {
        const { bridge } = this;
        const schema = bridge.contract.schemas.find(s => s.id === schemaName || s.handle?.alias === schemaName);
        const ignition = bridge.ignitions?.[schemaName];

        if (!schema) throw new Error(`SCHEMA_NOT_FOUND: ${schemaName}`);
        if (!ignition) throw new Error(`SCHEMA_NOT_MATERIALIZED: ${schemaName}. Debe materializarse antes de actualizar.`);

        console.log(`[ResonanceSync:IndustrialResonance] Resonando esquema: ${schemaName} con silo: ${ignition.silo_id}...`);

        try {
            // AXIOMA DE ACTUALIZACIÓN: Delegamos la lógica de sync al Core (PINE)
            const response = await bridge.execute({
                protocol: 'INDUSTRIAL_SYNC',
                provider: 'automation',
                data: {
                    schema_id: schema.id,
                    bridge_id: ignition.bridge_id,
                    silo_id: ignition.silo_id,
                    target_provider: ignition.provider,
                    workspace_id: bridge.activeWorkspaceId
                    // Aquí se enviaría el payload de datos si el satélite fuera Master
                }
            });

            if (response.metadata?.status === 'OK') {
                console.log(`[ResonanceSync] Resonancia completada para ${schemaName}.`);
                return response;
            }

            throw new Error(response.metadata?.error || "INDUSTRIAL_SYNC_FAILED");

        } catch (e) {
            console.error(`[ResonanceSync:IndustrialResonance] Colapso en resonancia de ${schemaName}:`, e);
            throw e;
        }
    }

    async persistMetadata() {
        const payload = {
            satellite_name: this.bridge.contract.satellite_name,
            workspace_id: this.bridge.activeWorkspaceId,
            ignitions: this.bridge.ignitions || {} // Guardamos el mapa de materia
        };
        const apiOrigin = window.location.origin;
        try {
            const response = await fetch(`${apiOrigin}/api/indra/metadata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (e) {
            console.warn("[ResonanceSync] No se pudo persistir en disco. Usando Storage secundario.");
            localStorage.setItem('INDRA_SATELLITE_LINK', this.bridge.activeWorkspaceId);
            localStorage.setItem('INDRA_IGNITIONS', JSON.stringify(payload.ignitions));
        }
    }
}
}
