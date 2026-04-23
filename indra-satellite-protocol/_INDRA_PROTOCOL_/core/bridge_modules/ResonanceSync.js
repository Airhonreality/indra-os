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
        if (!workspaceId) throw new Error("No hay un Workspace activo seleccionado.");

        console.log(`[Sincerity:Anchor] Iniciando Protocolo Cooperativo para '${schemaLabel}'...`);

        try {
            // PASO 1: Persistencia del Átomo (Blueprint / Plano)
            console.log(`[Sincerity:Anchor] Pasos 1/2: Registrando Átomo de Clase ${schemaClass} en ${preferredProvider}...`);
            const createResponse = await bridge.execute({
                protocol: 'ATOM_CREATE',
                provider: preferredProvider,
                workspace_id: workspaceId,
                data: {
                    class: schemaClass,
                    name: schemaLabel,
                    handle: { 
                        alias: schema.handle?.alias || schema.id || schemaName, 
                        label: schemaLabel 
                    },
                    payload: {
                        fields: payloadFields,
                        source: 'SATELLITE_SYNC'
                    }
                }
            });

            if (createResponse.metadata?.status !== 'OK' || !createResponse.items?.[0]) {
                throw new Error(createResponse.metadata?.error || "Falla en registro de Átomo Base.");
            }

            const atomId = createResponse.items[0].id;
            console.log(`[Sincerity:Anchor] Pasos 2/2: Ignitando Infraestructura Tabular para ID: ${atomId}...`);

            // PASO 2: Ignición de Infraestructura (Delegación a Protocolo Especializado)
            const igniteResponse = await bridge.execute({
                protocol: 'SYSTEM_SCHEMA_IGNITE',
                provider: 'system',
                context_id: atomId,
                data: { 
                    target_provider: 'sheets', // Las tablas se materializan siempre en el motor de Sheets
                    workspace_id: workspaceId 
                }
            });

            if (igniteResponse.metadata?.status === 'OK') {
            const siloItem = igniteResponse.items?.[0];
            
            // PASO 3: ANCLAJE DE VISIBILIDAD (SYSTEM_PIN) - AXIOMA v7.8
            // Registramos el Pin para que el Dashboard React lo reconozca en sus columnas.
            console.log(`[Sincerity:Anchor] Paso 3/3: Anclando visibilidad en el Dashboard...`);
            await bridge.execute({
                protocol: 'SYSTEM_PIN',
                provider: 'system',
                workspace_id: workspaceId,
                data: { 
                    atom: {
                        id: atomId,
                        class: schemaClass,
                        handle: { alias: schema.handle?.alias, label: schemaLabel }
                    }
                }
            });

            // CAPTURA DE EVIDENCIA FINAL (Sincronía de Doble Vínculo)
            schema.metadata = {
                drive_id: siloItem?.id || atomId, // ID de la tabla física
                atom_id: atomId,                 // ID del esquema lógico
                synced_at: new Date().toLocaleString(),
                workspace_id: workspaceId
            };

            // PERSISTENCIA LOCAL
            bridge.ignitions = bridge.ignitions || {};
            bridge.ignitions[schemaName] = schema.metadata;
            localStorage.setItem('INDRA_IGNITIONS', JSON.stringify(bridge.ignitions));
            
            console.log(`🚀 [Sincerity:Complete] Realidad materializada y anclada: ${schemaLabel} -> Silo:${siloItem?.id}`);
            return igniteResponse;
        }

            throw new Error(igniteResponse.metadata?.error || "CORE_REJECTED_IGNITION");

        } catch (e) {
            console.error(`[Sincerity:Anchor] Error en anclaje cooperativo de ${schemaName}:`, e);
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
                        fields: this._extractFields(schema)
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

    /**
     * DESCUBRIMIENTO DE ESQUEMAS REMOTOS (DRIVE SCAN)
     * Recupera todos los DATA_SCHEMA cristalizados en el Core para el Workspace activo.
     */
    async discoverRemoteSchemas() {
        const { bridge } = this;
        const workspaceId = bridge.activeWorkspaceId;
        if (!workspaceId) return [];

        console.log(`🔍 [ResonanceSync:Discovery] Escaneando esquemas remotos en Workspace: ${workspaceId}`);

        try {
            // AXIOMA: Usamos la palabra mágica 'schemas' para listar por clase DATA_SCHEMA
            const response = await bridge.execute({
                protocol: 'ATOM_READ',
                provider: 'system',
                context_id: 'schemas' 
            });

            const remoteSchemas = response.items || [];
            console.log(`🛰️ [ResonanceSync:Discovery] Se encontraron ${remoteSchemas.length} esquemas en el Core.`);
            return remoteSchemas;
        } catch (e) {
            console.warn("[ResonanceSync:Discovery] Error al leer esquemas remotos:", e);
            return [];
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

    /**
     * EXTRACTORES DE DATOS (PATH SOLVERS)
     * Resuelven la ubicación del ADN sin importar el formato del archivo local.
     */
    _extractFields(schema) {
        return schema.payload?.fields      // Contrato estándar (v6.0+)
            || schema.fields               // Contrato legacy
            || schema.raw?.fields          // Contrato raw
            || [];
    }

    _extractLabel(schema) {
        return schema.name                     // Campo name en raíz (Contrato tradicional)
            || schema.label                    // Campo label legacy
            || schema.handle?.label            // Campo handle.label
            || schema.handle?.alias            // Alias del handle
            || schema.id;                      // ID técnico como último recurso
    }
}
