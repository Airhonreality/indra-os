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
     * Persistir cambios en el Core (ATOM_UPDATE).
     */
    async save(data) {
        return await this.request({
            protocol: 'ATOM_UPDATE',
            context_id: this.atom.id,
            data: data
        });
    }

    /**
     * Leer estado actual desde el Core (ATOM_READ).
     */
    async read() {
        return await this.request({
            protocol: 'ATOM_READ',
            context_id: this.atom.id
        });
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
