/**
 * =============================================================================
 * SERVICIO: CapabilityBridge.js
 * RESPONSABILIDAD: Define la interfaz de comunicación entre la Shell y los Motores.
 * BASADO EN: Axioma de Independencia (Sovereignty).
 * =============================================================================
 */

import { executeDirective } from './directive_executor';
import { DataProjector } from './DataProjector';

export class DesignerBridge {
    constructor(atom, shellActions, protocolData) {
        this.atom = atom;
        this.shell = shellActions; // { close: fn }
        this.protocol = protocolData; // { url, secret, lang }
    }

    /**
     * Persistir cambios en el Core (ATOM_UPDATE).
     */
    async save(data) {
        // ADR-001: Purgar identidad inmutable antes de cruzar la frontera del ATOM_UPDATE
        const { id, class: atomClass, ...mutableData } = data;
        const contextId = this.atom.id;

        if (this.shell.onSyncStart) this.shell.onSyncStart(contextId);
        
        try {
            return await this.request({
                protocol: 'ATOM_UPDATE',
                context_id: contextId,
                data: { ...mutableData, strategy: 'OVERWRITE' }
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
     * Ejecutar una directiva arbitraria contra el Core.
     */
    async request(directive) {
        return await executeDirective(
            { provider: 'system', ...directive },
            this.protocol.url,
            this.protocol.secret
        );
    }
}
