/**
 * 🔌 SynapticDispatcher.js
 * DHARMA: Motor de Propagación de Señales (v10.9)
 * AXIOMA: "La información no es estática, es un pulso."
 */
import adapter from '../Sovereign_Adapter.js';

class SynapticDispatcher {
    constructor() {
        this.activePulses = new Set();
        this.dispatchFunction = null; // Se inyectará desde AxiomaticStore
        this._maxTTL = 10;
        this.pulseRegistry = new Map(); // ID de Relación -> boolean (isActive)
    }

    setDispatcher(dispatch) {
        this.dispatchFunction = dispatch;
    }

    /**
     * Propaga una señal a través de la red sináptica.
     * @param {Object} context - { state, execute }
     * @param {string} sourceNodeId - Nodo que originó la señal
     * @param {any} data - Carga útil de la señal
     * @param {number} ttl - Time To Live (Loop-Breaker)
     * @param {Set} visitedNodes - Nodos ya visitados en esta cadena (Loop-Breaker)
     */
    async propagate(context, sourceNodeId, data, ttl = 10, visitedNodes = new Set(), sourceCapability = null) {
        const { state, execute } = context;
        if (ttl <= 0) {
            console.warn(`[SynapticDispatcher] 🛡️ TTL EXPIRED for ${sourceNodeId}. Signal auto-terminated.`);
            return;
        }

        if (visitedNodes.has(sourceNodeId)) {
            console.warn(`[SynapticDispatcher] 🛡️ LOOP DETECTED at ${sourceNodeId}. Breaking circuit.`);
            return;
        }

        visitedNodes.add(sourceNodeId);

        // 1. Identificar Relaciones Salientes (Strict Port Matching)
        const outgoingRelationships = state.phenotype.relationships?.filter(
            rel => rel.source === sourceNodeId && !rel._isDeleted && (
                !sourceCapability || rel.sourcePort === sourceCapability
            )
        ) || [];

        if (outgoingRelationships.length === 0) return;

        // 2. Transmisión de Energía (Entropía Cero)
        for (const rel of outgoingRelationships) {
            const targetNode = state.phenotype.artifacts[rel.target];
            if (!targetNode || targetNode._isDeleted) continue;

            const targetPort = rel.targetPort;
            const targetCap = targetNode.CAPABILITIES?.[targetPort];

            if (targetPort) {
                this._triggerPulse(rel.id);
                console.log(`[SynapticDispatcher] 🌊 Reifying Flow: ${sourceNodeId} [${rel.sourcePort}] >> ${targetNode.id} [${targetPort}]`);

                // AXIOMA: No hay transmutación. La carga útil viaja íntegra.
                let cargo = data;

                if (targetCap?.type === 'SIGNAL') {
                    cargo = null; // Las señales puras no llevan carga por definición de contrato.
                }

                if (this.dispatchFunction) {
                    this.dispatchFunction({
                        type: 'LOG_ENTRY',
                        payload: {
                            time: new Date().toLocaleTimeString(),
                            msg: `🌊 Sinapsis: ${sourceNodeId} >> ${targetNode.LABEL} (${targetCap?.type || 'CONTRACT'})`,
                            type: 'SUCCESS'
                        }
                    });
                }

                // Ejecución Determinista
                setTimeout(() => {
                    execute('EXECUTE_NODE_ACTION', {
                        nodeId: targetNode.id,
                        capability: targetPort,
                        payload: cargo,
                        _ttl: ttl - 1,
                        _visited: new Set(visitedNodes)
                    });
                }, 50);
            }

            // Limpieza del pulso visual
            setTimeout(() => this._clearPulse(rel.id), 800);
        }
    }

    _triggerPulse(relId) {
        this.pulseRegistry.set(relId, true);
        if (this.dispatchFunction) {
            this.dispatchFunction({ type: 'PULSE_START', payload: relId });
        }
    }

    _clearPulse(relId) {
        this.pulseRegistry.delete(relId);
        if (this.dispatchFunction) {
            this.dispatchFunction({ type: 'PULSE_END', payload: relId });
        }
    }

    isPulseActive(relId) {
        return this.pulseRegistry.has(relId);
    }
}

export const synapticDispatcher = new SynapticDispatcher();
export default synapticDispatcher;




