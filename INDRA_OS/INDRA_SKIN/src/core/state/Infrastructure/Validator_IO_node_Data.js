/**
 * Validator_IO_node_Data.js
 * DHARMA: Membrana de Integridad de Datos.
 * Axioma: "Sé conservador en lo que envías y liberal en lo que aceptas."
 * 
 * Misión: Validar contratos de respuesta del Core antes de que toquen el Córtex.
 */

class Validator_IO_node_Data {
    static dispatcher = null;

    static setDispatcher(dispatch) {
        this.dispatcher = dispatch;
    }

    static log(type, message, metadata = {}) {
        if (this.dispatcher) {
            this.dispatcher({
                type: 'LOG_ENTRY',
                payload: {
                    source: 'Validator_IO_node_Data',
                    level: type,
                    message,
                    timestamp: new Date().toISOString(),
                    ...metadata
                }
            });
        }
    }

    /**
     * Valida y desempaqueta una respuesta del Core.
     */
    static scrub(response, context = 'UNKNOWN') {
        if (!response) {
            const err = `[Validator_IO_node_Data] FATAL: Null response in ${context}`;
            this.log('FATAL', err);
            throw new Error(err);
        }

        const result = response.result !== undefined ? response.result : response;

        if (response._SIGNAL && response._SIGNAL !== 'PATIENCE_TOKEN' && response._SIGNAL !== 'REALITY_CONFLICT') {
            return response;
        }

        const artifacts = result.artifacts || result.ARTIFACTS;
        const id = result.id || result.ID || result.uuid;

        if (context.includes('mountCosmos')) {
            const missing = [];
            if (!id) missing.push('ID/UUID');
            if (!artifacts) missing.push('ARTIFACTS');

            if (missing.length > 0) {
                const err = `VIOLACIÓN_DE_Soberanía: El contrato de '${context}' carece de campos mandatorios: ${missing.join(', ')}`;
                console.error(`[Validator_IO_node_Data] Contract Violation in ${context}:`, result);
                this.log('FATAL', err, { context, missing });
                throw new Error(err);
            }

            this.log('SUCCESS', `🛡️ Reality '${id}' Certified (Integrity: 100%)`, { context });
        }

        return response;
    }

    /**
     * Valida la compatibilidad entre dos puertos (Synaptic Polarity).
     */
    static validateRelationship(sourceNode, targetNode, rel) {
        if (!sourceNode || !targetNode) return false;

        const sourceCap = sourceNode.CAPABILITIES?.[rel.sourcePort];
        const targetCap = targetNode.CAPABILITIES?.[rel.targetPort];

        if (!sourceCap || !targetCap) {
            this.log('WARNING', `⚠️ Invalid Ports: ${rel.sourcePort} -> ${rel.targetPort}`);
            return false;
        }

        // Regla de Oro: Compatibilidad de Tipos (Tarea 2)
        const isCompatible = sourceCap.type === targetCap.type ||
            sourceCap.type === 'SIGNAL' ||
            targetCap.type === 'SIGNAL';

        if (!isCompatible) {
            const err = `❌ POLARITY ERROR: Cannot connect ${sourceCap.type} to ${targetCap.type}`;
            this.log('FATAL', err, { source: sourceNode.LABEL, target: targetNode.LABEL });
            return false;
        }

        return true;
    }

    /**
     * Valida un lote de comandos.
     */
    static validateBatch(batch) {
        if (!Array.isArray(batch)) {
            const err = "[Validator_IO_node_Data] Invalid Batch: Expected Array.";
            this.log('FATAL', err);
            throw new Error(err);
        }
        return batch;
    }
}

export default Validator_IO_node_Data;
