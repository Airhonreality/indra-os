import contractRegistry from './USSP_ContractRegistry.json';

/**
 * 🌉 ISK: SPATIAL BRIDGE (v1.0)
 * Centralita de enrutamiento y validación para el protocolo USSP.
 * Valida intenciones de la UI antes de propagarlas al Worker (L1) o al Core (ASP).
 */
export class SpatialBridge {
    constructor(projectionKernel) {
        this.kernel = projectionKernel;
        this.registry = contractRegistry.roles;
        this.persistenceBuffer = null; // Se inyectará en Phase 4
    }

    /**
     * Procesa un paquete USSP entrante.
     * @param {Object} packet - Paquete conforme a la especificación ISK-USSP.
     */
    processMessage(packet) {
        const { payload, integrity } = packet;
        const { target_id, property, value, action } = payload;

        // 1. Obtener el rol del nodo destino desde el Kernel/Pool
        const node = this.kernel.pool.activeNodes.get(target_id);
        if (!node) {
            this._logError('ERR_ENTITY_NOT_FOUND', `Target ${target_id} does not exist in pool.`);
            return false;
        }

        // 2. Validación de Contrato (Validation at the Edge)
        const roleConfig = this.registry[node.type];
        if (!roleConfig) {
            this._logError('ERR_INVALID_ROLE', `Role ${node.type} is not defined in ContractRegistry.`);
            return false;
        }

        const propConfig = roleConfig.properties[property];
        if (!propConfig) {
            this._logError('ERR_INVALID_PROPERTY', `Property ${property} is not valid for role ${node.type}.`);
            return false;
        }

        // 3. Validación de Tipo y Rango
        if (!this._validateValue(value, propConfig)) {
            this._logError('ERR_TYPE_VIOLATION', `Value for ${property} does not match expected type ${propConfig.type} or is out of range.`);
            return false;
        }

        // 4. Enrutamiento HFS (High-Frequency Sync) -> Visual Inmediato
        // Si el kernel tiene un worker, le enviamos el cambio para feedback instantáneo
        if (this.kernel.worker) {
            this.kernel.worker.postMessage({
                action: 'HFS_UPDATE',
                payload: { target_id, property, value }
            });
        }

        // 5. Enrutamiento ASP (Asynchronous Persistence) -> Guardado Diferido
        if (integrity.persistence > 0 && this.persistenceBuffer) {
            this.persistenceBuffer.queueChange(packet);
        }

        return true;
    }

    _validateValue(value, config) {
        const { type, min, max } = config;

        switch (type) {
            case 'f32':
                if (typeof value !== 'number') return false;
                if (min !== undefined && value < min) return false;
                if (max !== undefined && value > max) return false;
                break;
            case 'v2':
                if (!Array.isArray(value) || value.length !== 2) return false;
                if (min && (value[0] < min[0] || value[1] < min[1])) return false;
                break;
            case 'v3':
                if (!Array.isArray(value) || value.length !== 3) return false;
                break;
            case 'v4':
                if (!Array.isArray(value) || value.length !== 4) return false;
                break;
            case 'str':
                if (typeof value !== 'string') return false;
                break;
            case 'bool':
                if (typeof value !== 'boolean') return false;
                break;
        }
        return true;
    }

    _logError(code, message) {
        console.warn(`[ISK-USSP] ${code}: ${message}`);
        // Aquí se podría emitir al canal SYS del protocolo
    }

    setPersistenceBuffer(buffer) {
        this.persistenceBuffer = buffer;
    }
}

export default SpatialBridge;
