/**
 * 🔌 SynapticDispatcher.js
 * DHARMA: Motor de Propagación de Señales (v10.9)
 * AXIOMA: "La información no es estática, es un pulso."
 */
import adapter from '../Sovereign_Adapter';

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

        // 1. Identificar Relaciones Salientes
        // AXIOMA DE FILTRADO: Solo propagamos por el puerto que disparó, o por columnas si es un row-select.
        const outgoingRelationships = state.phenotype.relationships?.filter(
            rel => rel.source === sourceNodeId && !rel._isDeleted && (
                !sourceCapability ||
                rel.sourcePort === sourceCapability ||
                (sourceCapability === 'onRowSelect' && rel.sourcePort?.startsWith('col:'))
            )
        ) || [];

        if (outgoingRelationships.length === 0) return;

        // 2. Transmisión de Energía
        for (const rel of outgoingRelationships) {
            const targetNode = state.phenotype.artifacts.find(n => n.id === rel.target && !n._isDeleted);
            if (!targetNode) continue;

            // AXIOMA: Visualización de Pulso (Tarea 4)
            this._triggerPulse(rel.id);

            // AXIOMA: Determinismo de Puerto (Tarea 1)
            const targetPort = rel.targetPort;
            const capability = Object.entries(targetNode.CAPABILITIES || {}).find(([id, cap]) =>
                id === targetPort || cap.io === 'INPUT' || cap.io === 'WRITE' || cap.io === 'TRIGGER'
            )?.[0];

            if (capability) {
                console.log(`[SynapticDispatcher] 🌊 Flowing: ${sourceNodeId} [${rel.sourcePort}] >> ${targetNode.id} [${targetPort}]`);

                // Tarea 1: Transmutación de Datos (Data Normalization)
                let transmutedData = data;
                const sourceNode = state.phenotype.artifacts.find(n => n.id === sourceNodeId);
                const sourceCap = sourceNode?.CAPABILITIES?.[rel.sourcePort];
                const targetCap = targetNode.CAPABILITIES?.[targetPort] || targetNode.CAPABILITIES?.[capability];

                // AXIOMA: Extracción de Columnas (Deep Data Mining)
                if (rel.sourcePort?.startsWith('col:') && typeof data === 'object' && data !== null) {
                    const fieldName = rel.sourcePort.replace('col:', '');
                    transmutedData = data[fieldName] !== undefined ? data[fieldName] : data;
                    console.log(`[SynapticDispatcher] 💎 Extracted [${fieldName}] from row payload.`);
                }

                if (sourceCap?.type === 'BLOB' && targetCap?.type === 'DATAFRAME') {
                    // Transmutación: De Archivo a Texto (ID o Nombre)
                    transmutedData = data?.name || data?.id || String(data);
                } else if (targetCap?.type === 'SIGNAL') {
                    transmutedData = null; // Las señales puras no llevan carga
                }

                if (this.dispatchFunction) {
                    this.dispatchFunction({
                        type: 'LOG_ENTRY',
                        payload: {
                            time: new Date().toLocaleTimeString(),
                            msg: `🌊 Sinapsis: ${sourceNodeId} >> ${targetNode.LABEL} (${targetCap?.type || 'SIGNAL'})`,
                            type: 'SUCCESS'
                        }
                    });
                }

                // Ejecutar en el nodo destino (Recursión de Red)
                // Usamos execute de forma asíncrona para no bloquear el hilo
                setTimeout(() => {
                    execute('EXECUTE_NODE_ACTION', {
                        nodeId: targetNode.id,
                        capability,
                        payload: transmutedData,
                        _ttl: ttl - 1,
                        _visited: new Set(visitedNodes)
                    });
                }, 100);
            }

            // Limpieza del pulso visual
            setTimeout(() => this._clearPulse(rel.id), 1000);
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



