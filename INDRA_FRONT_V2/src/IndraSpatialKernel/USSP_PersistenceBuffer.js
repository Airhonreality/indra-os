import CoreBridge from '../bridge/CoreBridge';

/**
 * 📥 ISK: USSP PERSISTENCE BUFFER (v1.0)
 * Gestor de persistencia asíncrona para el protocolo USSP.
 * Implementa Debounce y Batching para optimizar la escritura en el Core.
 */
export class USSP_PersistenceBuffer {
    constructor(debounceTime = 300) {
        this.debounceTime = debounceTime;
        this.queue = new Map(); // target_id.property -> lastPacket
        this.timer = null;
        this.isProcessing = false;
    }

    /**
     * Encola un cambio para su persistencia futura.
     * @param {Object} packet - Paquete USSP validado.
     */
    queueChange(packet) {
        const { target_id, property } = packet.payload;
        const key = `${target_id}.${property}`;

        // Sobreescribimos cualquier cambio pendiente para la misma propiedad (LIFO)
        this.queue.set(key, packet);

        this._resetTimer();
    }

    _resetTimer() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this._flush(), this.debounceTime);
    }

    async _flush() {
        if (this.queue.size === 0 || this.isProcessing) return;

        this.isProcessing = true;
        const changes = Array.from(this.queue.values());
        this.queue.clear();

        try {
            console.log(`[ISK-USSP] Persisting ${changes.length} changes to Core...`);

            // Enviamos un lote de cambios al VectorAdapter del Core
            const response = await CoreBridge.callCore('projection', 'commitSpatialChanges', {
                changes: changes.map(p => p.payload)
            });

            if (response.status === 'success') {
                console.log(`[ISK-USSP] Persistence successful: ${response.summary}`);
            } else {
                this._handleFailure(changes);
            }
        } catch (error) {
            console.error("[ISK-USSP] Persistence error:", error);
            this._handleFailure(changes);
        } finally {
            this.isProcessing = false;
        }
    }

    _handleFailure(changes) {
        console.warn(`[ISK-USSP] Persistence failed for ${changes.length} items. Moving to RetryQueue (LocalStorage).`);
        // Implementación de fallback a LocalStorage
        const currentRetry = JSON.parse(localStorage.getItem('USSP_RETRY_QUEUE') || '[]');
        localStorage.setItem('USSP_RETRY_QUEUE', JSON.stringify([...currentRetry, ...changes]));
    }
}

export default USSP_PersistenceBuffer;
