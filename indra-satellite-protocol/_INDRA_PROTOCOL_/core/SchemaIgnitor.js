/**
 * =============================================================================
 * SCHEMA IGNITOR (v1.0)
 * =============================================================================
 * Responsabilidad: Detección de "Drift" y materialización de infraestructura.
 * Axioma: Si el ADN existe en el código, la Materia debe existir en el Core.
 * =============================================================================
 */

class SchemaIgnitor {
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * DETECCIÓN DE DERIVA (Drift Detection)
     * Compara los esquemas declarados en la UI vs los existentes en Indra.
     */
    async checkDrift(idealSchemas) {
        console.group("[SchemaIgnitor] Iniciando auditoría de ADN...");
        
        try {
            // 1. Obtener la realidad del Core
            const response = await this.bridge.execute({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: 'schemas'
            });

            const remoteAtoms = response.items || [];
            const results = {
                synced: [],
                missing_remote: [], // Esquemas en código que no están en Indra
                drifted: []         // Esquemas que están pero tienen campos diferentes
            };

            // 2. Mapeo de comparación
            idealSchemas.forEach(ideal => {
                const alias = ideal.handle?.alias;
                const match = remoteAtoms.find(r => r.handle?.alias === alias);

                if (!match) {
                    results.missing_remote.push(ideal);
                    console.warn(`[Drift] Esquema '${alias}' no encontrado en el Core.`);
                } else {
                    // Verificar si hubo cambios en los campos (ADR-032)
                    if (this._isDrifted(ideal, match)) {
                        results.drifted.push({ ideal, remote: match });
                        console.warn(`[Drift] El esquema '${alias}' ha mutado.`);
                    } else {
                        results.synced.push(match);
                    }
                }
            });

            console.groupEnd();
            return results;
        } catch (error) {
            console.error("[SchemaIgnitor] Fallo en la auditoría:", error);
            console.groupEnd();
            throw error;
        }
    }

    /**
     * IGNICIÓN (Materialización Física)
     * Crea el esquema en Indra y, opcionalmente, ignita el silo (Sheet/Notion).
     */
    async ignite(schema, targetProvider = 'drive', maxAttempts = 10) {
        console.group(`[SchemaIgnitor] Ignitando: ${schema.handle.alias}`);
        
        try {
            // STEP 0: VERIFICACIÓN DE ESTADO (Schema Lock)
            const checkRes = await this.bridge.execute({
                provider: 'system', protocol: 'ATOM_READ',
                context_id: 'schemas'
            });
            const existing = checkRes.items.find(r => r.handle?.alias === schema.handle?.alias);

            if (existing && existing.payload?.status === 'LIVE') {
                this.bridge.logger.info("[SchemaIgnitor] La materia ya es LIVE. Abortando ignición.");
                return existing;
            }

            if (existing && existing.payload?.status === 'IGNITING') {
                this.bridge.logger.warn("[SchemaIgnitor] Ignición en curso detectada. Esperando...");
                return this._waitForIgnition(existing.id, maxAttempts);
            }

            // STEP 1: Crear o recuperar el ADN
            let schemaAtom = existing;
            if (!schemaAtom) {
                const createRes = await this.bridge.execute({
                    provider: 'system', protocol: 'ATOM_CREATE',
                    data: { ...schema, payload: { ...schema.payload, status: 'IGNITING' } }
                });
                schemaAtom = createRes.items[0];
            }

            // STEP 2: Ignición física
            const igniteRes = await this.bridge.execute({
                provider: 'system',
                protocol: 'SYSTEM_SCHEMA_IGNITE',
                context_id: schemaAtom.id,
                data: { target_provider: targetProvider }
            });

            console.groupEnd();
            return igniteRes;
        } catch (error) {
            console.error("[SchemaIgnitor] Fallo en la ignición:", error);
            console.groupEnd();
            throw error;
        }
    }

    /**
     * ESPERA DE RES RESONANCIA (Polling)
     * @private
     */
    async _waitForIgnition(schemaId, maxAttempts) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 5000)); // Esperar 5s
            const res = await this.bridge.execute({
                provider: 'system', protocol: 'ATOM_READ',
                context_id: schemaId
            });
            const atom = res.items[0];
            if (atom.payload?.status === 'LIVE') return atom;
        }
        throw new Error("IGNITION_TIMEOUT");
    }

    /**
     * COMPARADOR DE ADN
     * @private
     */
    _isDrifted(ideal, remote) {
        const idealFields = ideal.payload?.fields || [];
        const remoteFields = remote.payload?.fields || [];

        if (idealFields.length !== remoteFields.length) return true;

        // Comparación simple de aliaces/ids para detectar cambios estructurales
        for (let i = 0; i < idealFields.length; i++) {
            if (idealFields[i].alias !== remoteFields[i].alias) return true;
            if (idealFields[i].type !== remoteFields[i].type) return true;
        }

        return false;
    }
}

export default SchemaIgnitor;
