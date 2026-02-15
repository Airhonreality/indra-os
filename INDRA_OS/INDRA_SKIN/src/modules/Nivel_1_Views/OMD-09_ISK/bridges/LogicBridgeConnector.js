/**
 * modules/isk/bridges/LogicBridgeConnector.js
 * 
 * DHARMA: Puente Bidireccional entre UI Inspector y USSP Protocol.
 * 
 * MISIÓN:
 * - Cuando el usuario mueve un slider → USSP_Dispatcher
 * - Cuando el Core actualiza un valor → Inspector UI
 */

export class LogicBridgeConnector {
    constructor() {
        this.listeners = new Map();
        this.coreEndpoint = '/api/indra/invoke'; // MCP endpoint
        this.pendingChanges = new Map(); // Buffer para batch updates
        this.flushTimeout = null;
    }

    /**
     * Metadata para INDRACore alignment
     */
    static metadata = {
        archetype: 'BRIDGE',
        semantic_intent: 'STREAM',
        description: 'Bidirectional bridge between UI Inspector and USSP Protocol'
    };

    /**
     * UI → Core: Enviar cambio de propiedad al USSP
     * @param {string} targetId - ID del nodo espacial
     * @param {string} property - Propiedad USSP (ej: 'u_radius')
     * @param {*} value - Nuevo valor
     */
    sendToCore(targetId, property, value) {
        // Agregar al buffer
        const key = `${targetId}.${property}`;
        this.pendingChanges.set(key, { target_id: targetId, property, value });

        // Debounce: Flush después de 300ms de inactividad
        clearTimeout(this.flushTimeout);
        this.flushTimeout = setTimeout(() => this.flush(), 300);
    }

    /**
     * Flush: Enviar cambios acumulados al Core vía USSP
     */
    async flush() {
        if (this.pendingChanges.size === 0) return;

        const changes = Array.from(this.pendingChanges.values());
        this.pendingChanges.clear();

        try {
            const response = await fetch(this.coreEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    executor: 'spatial',
                    method: 'commitSpatialChanges',
                    payload: {
                        context_id: 'current_context', // TODO: Dynamic context
                        changes
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Core rejected changes: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('[LogicBridge] ✅ Changes committed to Core:', result);
        } catch (error) {
            console.error('[LogicBridge] ❌ Failed to commit changes:', error);
            // Re-emit para retry o notificación al usuario
            this.emit('sync-error', { changes, error });
        }
    }

    /**
     * Core → UI: Recibir actualización desde el Core
     * @param {string} targetId - ID del nodo
     * @param {string} property - Propiedad actualizada
     * @param {*} value - Nuevo valor
     */
    receiveFromCore(targetId, property, value) {
        const key = `${targetId}.${property}`;
        this.emit('property-updated', { targetId, property, value });
    }

    /**
     * Suscribirse a cambios de propiedades
     * @param {string} event - Nombre del evento ('property-updated', 'sync-error')
     * @param {Function} callback - Callback a ejecutar
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Emitir evento a listeners
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(cb => cb(data));
    }

    /**
     * Polling: Sincronizar estado desde el Core (fallback si no hay WebSockets)
     * @param {string} contextId - ID del contexto espacial
     */
    async syncFromCore(contextId) {
        try {
            const response = await fetch(this.coreEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    executor: 'spatial',
                    method: 'getProjectedScene',
                    payload: {
                        context_id: contextId,
                        dimension_mode: '2D'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to sync from Core: ${response.statusText}`);
            }

            const scene = await response.json();

            // Emitir actualizaciones para cada nodo
            scene.nodes.forEach(node => {
                Object.entries(node.position).forEach(([prop, value]) => {
                    this.receiveFromCore(node.id, `u_${prop}`, value);
                });
                if (node.visual_modeling) {
                    Object.entries(node.visual_modeling).forEach(([prop, value]) => {
                        this.receiveFromCore(node.id, `u_${prop}`, value);
                    });
                }
            });

            console.log('[LogicBridge] ✅ Synced from Core:', scene.nodes.length, 'nodes');
        } catch (error) {
            console.error('[LogicBridge] ❌ Sync failed:', error);
        }
    }
}

// Singleton instance
export const logicBridge = new LogicBridgeConnector();



