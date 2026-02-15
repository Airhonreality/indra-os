/**
 * INDRA_CORE/2_Services/WebSocketManager.gs
 * DHARMA: Gestor de WebSocket para notificaciones en tiempo real.
 * AXIOMA: "La información debe fluir como el agua, sin fricción."
 * 
 * FEATURES:
 * - Notificaciones push cuando un Cosmos cambia
 * - Broadcast a todos los clientes conectados
 * - Heartbeat para mantener conexiones vivas
 */

function createWebSocketManager({ errorHandler, configurator }) {
    // Estado de conexiones activas
    const activeConnections = new Map();
    const cosmosWatchers = new Map(); // cosmosId -> Set<connectionId>

    /**
     * Registra un cliente para recibir actualizaciones de un Cosmos.
     */
    function subscribe({ connectionId, cosmosId }) {
        try {
            if (!cosmosWatchers.has(cosmosId)) {
                cosmosWatchers.set(cosmosId, new Set());
            }
            
            cosmosWatchers.get(cosmosId).add(connectionId);
            activeConnections.set(connectionId, { cosmosId, lastPing: Date.now() });

            console.log(`[WebSocketManager] Client ${connectionId} subscribed to Cosmos ${cosmosId}`);
            
            return { success: true, message: 'Subscribed successfully' };
        } catch (e) {
            console.error(`[WebSocketManager] Subscribe error: ${e.message}`);
            throw errorHandler.createError('WEBSOCKET_ERROR', e.message);
        }
    }

    /**
     * Desregistra un cliente.
     */
    function unsubscribe({ connectionId }) {
        try {
            const connection = activeConnections.get(connectionId);
            
            if (connection) {
                const { cosmosId } = connection;
                
                if (cosmosWatchers.has(cosmosId)) {
                    cosmosWatchers.get(cosmosId).delete(connectionId);
                    
                    // Limpiar si no hay más watchers
                    if (cosmosWatchers.get(cosmosId).size === 0) {
                        cosmosWatchers.delete(cosmosId);
                    }
                }
                
                activeConnections.delete(connectionId);
                console.log(`[WebSocketManager] Client ${connectionId} unsubscribed`);
            }
            
            return { success: true };
        } catch (e) {
            console.error(`[WebSocketManager] Unsubscribe error: ${e.message}`);
            throw errorHandler.createError('WEBSOCKET_ERROR', e.message);
        }
    }

    /**
     * Notifica a todos los clientes suscritos que un Cosmos cambió.
     */
    function notifyCosmosChange({ cosmosId, updatedData }) {
        try {
            const watchers = cosmosWatchers.get(cosmosId);
            
            if (!watchers || watchers.size === 0) {
                console.log(`[WebSocketManager] No watchers for Cosmos ${cosmosId}`);
                return { notified: 0 };
            }

            let notifiedCount = 0;
            
            watchers.forEach(connectionId => {
                try {
                    // En Google Apps Script, usamos Server-Sent Events (SSE)
                    // o almacenamos notificaciones en PropertiesService para polling
                    const notificationKey = `WS_NOTIFICATION_${connectionId}`;
                    const notification = {
                        type: 'COSMOS_UPDATED',
                        cosmosId: cosmosId,
                        data: updatedData,
                        timestamp: Date.now()
                    };
                    
                    configurator.storeParameter({ 
                        key: notificationKey, 
                        value: JSON.stringify(notification) 
                    });
                    
                    notifiedCount++;
                } catch (e) {
                    console.error(`[WebSocketManager] Failed to notify ${connectionId}: ${e.message}`);
                }
            });

            console.log(`[WebSocketManager] Notified ${notifiedCount} clients about Cosmos ${cosmosId} change`);
            
            return { notified: notifiedCount };
        } catch (e) {
            console.error(`[WebSocketManager] Notify error: ${e.message}`);
            throw errorHandler.createError('WEBSOCKET_ERROR', e.message);
        }
    }

    /**
     * Obtiene notificaciones pendientes para un cliente.
     */
    function getNotifications({ connectionId }) {
        try {
            const notificationKey = `WS_NOTIFICATION_${connectionId}`;
            const notificationData = configurator.retrieveParameter({ key: notificationKey });
            
            if (notificationData) {
                // Limpiar notificación después de leerla
                configurator.deleteParameter({ key: notificationKey });
                
                return {
                    hasNotification: true,
                    notification: JSON.parse(notificationData)
                };
            }
            
            return { hasNotification: false };
        } catch (e) {
            console.error(`[WebSocketManager] Get notifications error: ${e.message}`);
            return { hasNotification: false, error: e.message };
        }
    }

    /**
     * Heartbeat para mantener conexiones vivas.
     */
    function ping({ connectionId }) {
        const connection = activeConnections.get(connectionId);
        
        if (connection) {
            connection.lastPing = Date.now();
            return { alive: true };
        }
        
        return { alive: false };
    }

    /**
     * Limpia conexiones muertas (sin ping en los últimos 5 minutos).
     */
    function cleanupDeadConnections() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutos
        let cleaned = 0;
        
        activeConnections.forEach((connection, connectionId) => {
            if (now - connection.lastPing > timeout) {
                unsubscribe({ connectionId });
                cleaned++;
            }
        });
        
        console.log(`[WebSocketManager] Cleaned ${cleaned} dead connections`);
        return { cleaned };
    }

    return Object.freeze({
        id: 'websocket_manager',
        label: 'WebSocket Manager',
        subscribe,
        unsubscribe,
        notifyCosmosChange,
        getNotifications,
        ping,
        cleanupDeadConnections
    });
}





