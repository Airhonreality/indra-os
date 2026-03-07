/**
 * =============================================================================
 * SERVICIO: CapabilityBridge.js
 * RESPONSABILIDAD: Define la interfaz de comunicación entre la Shell y los Motores.
 * BASADO EN: Axioma de Independencia (Sovereignty).
 * =============================================================================
 */

import { executeDirective } from './directive_executor';

export class DesignerBridge {
    constructor(atom, shellActions, protocolData) {
        this.atom = atom;
        this.shell = shellActions; // { close: fn }
        this.protocol = protocolData; // { url, secret }
    }

    /**
     * Persistir cambios en el Core.
     */
    async save(data) {
        return await executeDirective({
            protocol: 'ATOM_UPDATE',
            context_id: this.atom.id,
            data: data
        }, this.protocol.url, this.protocol.secret);
    }

    /**
     * Cerrar el motor y volver al dashboard.
     */
    close() {
        this.shell.close();
    }

    /**
     * Solicitar recursos adicionales al Core.
     */
    async request(directive) {
        return await executeDirective(directive, this.protocol.url, this.protocol.secret);
    }
}
