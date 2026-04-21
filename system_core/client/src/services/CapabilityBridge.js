/**
 * =============================================================================
 * SERVICIO: CapabilityBridge.js
 * RESPONSABILIDAD: Define la interfaz de comunicación entre la Shell y los Motores.
 * BASADO EN: Axioma de Independencia (Sovereignty).
 * =============================================================================
 */

import { executeDirective } from './directive_executor';
import { DataProjector } from './DataProjector';
import { MetaComposer } from './MetaComposer';
import { AgnosticVault } from '../../public/indra-satellite-protocol/src/score/logic/AgnosticVault.js';

export class DesignerBridge {
    constructor(atom, shellActions, protocolData, existingVault = null) {
        this.atom = atom;
        this.shell = shellActions; // { close: fn }
        this.protocol = protocolData; // { url, secret, lang }
        
        // --- SOBERANÍA REACTIVA COMPARTIDA ---
        this.vault = existingVault || new AgnosticVault(this);
    }

    /**
     * Persistir cambios en el Core (ATOM_UPDATE).
     * AXIOMA DE FRONTERA SOBERANA: El motor solo gestiona Materia (Payload).
     * El Bridge inyecta la Identidad (Handle) desde la Verdad Global.
     */
    async save(data) {
        const contextId = this.atom.id;

        // AXIOMA DE LINAJE Y AUDITORÍA: Inyectamos metadatos de sistema antes del guardado.
        // Si data es solo el payload, lo envolvemos para el compositor.
        const atomToCompose = (data && data.payload) ? data : { ...this.atom, payload: data };
        const composedAtom = MetaComposer.compose(atomToCompose);
        
        // 1. Aislamiento de Materia: Extraer el payload cristalizado
        const cleanPayload = composedAtom.payload;
        
        // 2. Notificación de sincronía (Nivel 2/3)
        if (this.shell.onSyncStart) this.shell.onSyncStart(contextId);
        
        try {
            // AXIOMA: Construcción Determinista. El motor pierde el voto sobre su ID y Clase.
            return await this.request({
                provider: this.atom.provider || 'system',
                protocol: 'ATOM_UPDATE',
                context_id: contextId,
                data: { 
                    payload: cleanPayload, 
                    _meta:   composedAtom._meta, // Persistencia de metadatos de sistema
                    strategy: 'OVERWRITE' 
                }
            });
        } finally {
            if (this.shell.onSyncEnd) this.shell.onSyncEnd(contextId);
        }
    }

    /**
     * Leer estado actual desde el Core (ATOM_READ).
     * ADR-008: El Bridge proyecta automáticamente el átomo salvo que se pida crudo (raw:true).
     */
    async read(options = {}) {
        const result = await this.request({
            provider: this.atom.provider || 'system',
            protocol: 'ATOM_READ',
            context_id: this.atom.id
        });

        if (result.items && result.items[0]) {
            const atom = result.items[0];

            // Si se pide Raw (p.ej en un Designer), devolvemos el átomo sin proyectar
            if (options.raw) return atom;

            // Si el átomo es un esquema o tiene campos, lo proyectamos para uso en UI
            if (atom.class === 'DATA_SCHEMA' || atom.payload?.fields) {
                return DataProjector.projectSchema(atom);
            }
            return atom;
        }

        return null;
    }

    /**
     * Cerrar el motor y volver al dashboard.
     */
    close() {
        if (this.shell.close) this.shell.close();
    }

    /**
     * @dharma Punto de entrada universal para Directivas.
     * Alias de compatibilidad con IndraBridge (Protocolo Semilla).
     */
    async execute(uqo, options = {}) {
        return await this.request(uqo, options);
    }

    /**
     * Ejecutar una directiva arbitraria contra el Core.
     * AXIOMA DE FALLO RUIDOSO: Si no hay proveedor, el puente se niega a cruzar.
     */
    async request(directive, options = {}) {
        if (!directive.provider) {
            throw new Error(`[Bridge:IdentityViolation] El UQO debe declarar un proveedor.`);
        }

        try {
            const response = await executeDirective(
                directive, 
                this.protocol.url,
                this.protocol.secret
            );

            // RESONANCIA REACTIVA INTELIGENTE
            if (options.vaultKey && this.vault && response.metadata?.status === 'OK') {
                // Si la estrategia es SCHEMA, guardamos los metadatos. Si es DATA (default), los items.
                const dataToCommit = options.vaultStrategy === 'SCHEMA' 
                    ? response.metadata.schema?.fields 
                    : response.items;

                if (dataToCommit) {
                    this.vault.commit(options.vaultKey, dataToCommit);
                }
            }

            return response;
        } catch (error) {
            console.error(`[Bridge:PulseFailure] Error en directiva ${directive.protocol}:`, error);
            // Devolver objeto de error estandarizado para no romper la UI
            return { 
                items: [], 
                metadata: { status: 'ERROR', error: error.message, code: 'BRIDGE_EXECUTION_FAILED' } 
            };
        }
    }
}
