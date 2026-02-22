/**
 * CAPA 2: ENGINES
 * CosmosSync.js
 * DHARMA: Servicio de sincronización reactiva de Cosmos.
 * AXIOMA: "Un Cosmos es una entidad viva que puede cambiar en cualquier momento."
 * 
 * FEATURES:
 * - WebSocket para notificaciones push en tiempo real
 * - Fallback automático a polling si WebSocket falla
 * - Polling inteligente con backoff exponencial
 * - Detección de cambios granular (solo actualiza lo que cambió)
 * - Caché inteligente para cargas instantáneas
 * - Indicador de estado de sincronización
 */

import cosmosCache from './CosmosCache.js';

class CosmosSync {
    constructor() {
        this.activeCosmosId = null;
        this.pollingInterval = null;
        this.wsCheckInterval = null;
        this.syncCallback = null;
        this.lastSync = null;
        this.syncStatus = 'idle'; // idle | syncing | error | websocket
        this.pollIntervalMs = 5000; // 5 segundos por defecto
        this.maxPollIntervalMs = 60000; // Máximo 1 minuto
        this.errorCount = 0;
        this.connectionId = null; // Para WebSocket
        this.useWebSocket = false; // AXIOMA: Apps Script no soporta WebSocket nativo
        this.lastSyncedCosmos = null;
        this.isStopped = false; // AXIOMA: Flag para prevenir race conditions
    }

    /**
     * Inicia la sincronización de un Cosmos.
     * @param {string} cosmosId - ID del Cosmos a sincronizar
     * @param {Function} onUpdate - Callback cuando hay cambios
     */
    async start(cosmosId, onUpdate) {
        console.log(`[CosmosSync] 🔄 Starting sync for Cosmos: ${cosmosId}`);

        // AXIOMA: Asignar callback PRIMERO, antes de cualquier operación
        this.activeCosmosId = cosmosId;
        this.syncCallback = onUpdate;
        this.errorCount = 0;
        this.pollIntervalMs = 5000;
        this.isStopped = false; // Resetear flag

        // Validar que el callback sea una función
        if (typeof this.syncCallback !== 'function') {
            console.error('[CosmosSync] ❌ Invalid callback provided to start()');
            return;
        }

        // Sincronización inicial
        await this._syncNow();

        // Intentar WebSocket primero
        if (this.useWebSocket) {
            const wsSuccess = await this._tryWebSocket();

            if (wsSuccess) {
                console.log('[CosmosSync] ✅ WebSocket mode activated');
                this.syncStatus = 'websocket';
                // Iniciar check periódico de notificaciones
                this._startWebSocketCheck();
                return;
            } else {
                console.log('[CosmosSync] ⚠️ WebSocket unavailable (expected in Google Apps Script)');
                console.log('[CosmosSync] 🔄 Falling back to polling mode...');
            }
        }

        // Fallback a polling
        this._startPolling();
    }

    /**
     * Detiene la sincronización.
     */
    async stop() {
        console.log('[CosmosSync] ⏸️ Stopping sync');

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.wsCheckInterval) {
            clearInterval(this.wsCheckInterval);
            this.wsCheckInterval = null;
        }

        // Desuscribirse del WebSocket
        if (this.connectionId) {
            await this._unsubscribeWebSocket();
        }

        this.activeCosmosId = null;
        this.syncCallback = null;
        this.syncStatus = 'idle';
        this.connectionId = null;
        this.isStopped = true; // AXIOMA: Marcar como detenido
    }

    /**
     * Fuerza una sincronización inmediata.
     */
    async forceSync() {
        console.log('[CosmosSync] ⚡ Force sync requested');
        await this._syncNow();
    }

    /**
     * Obtiene el estado actual de sincronización.
     */
    getStatus() {
        return {
            status: this.syncStatus,
            lastSync: this.lastSync,
            cosmosId: this.activeCosmosId,
            pollInterval: this.pollIntervalMs,
            mode: this.connectionId ? 'websocket' : 'polling'
        };
    }

    /**
     * Intenta establecer conexión WebSocket.
     * @private
     */
    async _tryWebSocket() {
        try {
            const { default: adapter } = await import('../core/Sovereign_Adapter.js');

            // Generar ID de conexión único
            this.connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Suscribirse al Cosmos
            const result = await adapter.call('websocket', 'subscribe', {
                connectionId: this.connectionId,
                cosmosId: this.activeCosmosId
            });

            if (result && result.success) {
                console.log('[CosmosSync] 🔌 WebSocket subscribed:', this.connectionId);
                return true;
            }

            this.connectionId = null;
            return false;
        } catch (error) {
            // AXIOMA: WebSocket no está disponible en Google Apps Script (esperado)
            if (error.message?.includes('EXPOSURE_BLOCK') || error.message?.includes('prohibido')) {
                console.log('[CosmosSync] ℹ️ WebSocket not supported in this environment (using polling)');
            } else {
                console.warn('[CosmosSync] ⚠️ WebSocket connection failed:', error.message);
            }
            this.connectionId = null;
            return false;
        }
    }

    /**
     * Desuscribirse del WebSocket.
     * @private
     */
    async _unsubscribeWebSocket() {
        try {
            const { default: adapter } = await import('../core/Sovereign_Adapter.js');

            await adapter.call('websocket', 'unsubscribe', {
                connectionId: this.connectionId
            });

            console.log('[CosmosSync] 🔌 WebSocket unsubscribed');
        } catch (error) {
            console.error('[CosmosSync] WebSocket unsubscribe error:', error);
        }
    }

    /**
     * Inicia el check periódico de notificaciones WebSocket.
     * @private
     */
    _startWebSocketCheck() {
        if (this.wsCheckInterval) {
            clearInterval(this.wsCheckInterval);
        }

        // Check cada 2 segundos (más rápido que polling)
        this.wsCheckInterval = setInterval(async () => {
            await this._checkWebSocketNotifications();
        }, 2000);
    }

    /**
     * Verifica si hay notificaciones pendientes del WebSocket.
     * @private
     */
    async _checkWebSocketNotifications() {
        try {
            const { default: adapter } = await import('../core/Sovereign_Adapter.js');

            const result = await adapter.call('websocket', 'getNotifications', {
                connectionId: this.connectionId
            });

            if (result && result.hasNotification) {
                const notification = result.notification;

                if (notification.type === 'COSMOS_UPDATED' && notification.cosmosId === this.activeCosmosId) {
                    console.log('[CosmosSync] 📬 WebSocket notification received');

                    // Sincronizar inmediatamente
                    await this._syncNow();
                }
            }

            // Enviar ping para mantener conexión viva
            await adapter.call('websocket', 'ping', {
                connectionId: this.connectionId
            });

        } catch (error) {
            console.error('[CosmosSync] WebSocket check error:', error);

            // Si falla WebSocket, volver a polling
            console.warn('[CosmosSync] ⚠️ WebSocket failed, switching to polling');
            this.syncStatus = 'idle';
            this.connectionId = null;

            if (this.wsCheckInterval) {
                clearInterval(this.wsCheckInterval);
                this.wsCheckInterval = null;
            }

            this._startPolling();
        }
    }

    /**
     * Inicia el polling periódico.
     * @private
     */
    _startPolling() {
        // AXIOMA: No iniciar si fue detenido
        if (this.isStopped) {
            console.log('[CosmosSync] ⏸️ Polling cancelled (sync was stopped)');
            return;
        }

        // AXIOMA: Defensive check - No iniciar polling sin callback
        if (!this.syncCallback || typeof this.syncCallback !== 'function') {
            console.error('[CosmosSync] ❌ Cannot start polling: syncCallback is not defined');
            return;
        }

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        console.log(`[CosmosSync] 🔄 Starting polling (interval: ${this.pollIntervalMs}ms)`);

        this.pollingInterval = setInterval(() => {
            this._syncNow();
        }, this.pollIntervalMs);
    }

    /**
     * Ejecuta una sincronización ahora.
     * @private
     */
    async _syncNow() {
        // AXIOMA: No sincronizar si fue detenido
        if (this.isStopped) {
            return;
        }

        if (!this.activeCosmosId || !this.syncCallback) {
            return;
        }

        this.syncStatus = this.connectionId ? 'websocket' : 'syncing';

        try {
            // Importar dinámicamente para evitar dependencias circulares
            const { contextClient } = await import('../core/kernel/ContextClient.js');

            // Intentar caché primero (solo en carga inicial)
            if (!this.lastSyncedCosmos) {
                const cachedCosmos = cosmosCache.get(this.activeCosmosId);
                if (cachedCosmos) {
                    console.log('[CosmosSync] ⚡ Using cached Cosmos');
                    this.lastSyncedCosmos = cachedCosmos;
                    // AXIOMA: Defensive check
                    if (typeof this.syncCallback === 'function') {
                        this.syncCallback(cachedCosmos);
                    }
                }
            }

            const updatedCosmos = await contextClient.mountCosmos(this.activeCosmosId);

            // AXIOMA: Verificar si se detuvo durante el await (Critical Fix)
            if (this.isStopped) {
                return;
            }

            // Detectar cambios (comparación superficial)
            const hasChanges = this._detectChanges(updatedCosmos);

            if (hasChanges) {
                console.log('[CosmosSync] 📦 Changes detected, updating...');

                // Actualizar caché
                cosmosCache.set(this.activeCosmosId, updatedCosmos);

                // AXIOMA: Defensive check
                if (typeof this.syncCallback === 'function') {
                    this.syncCallback(updatedCosmos);
                } else {
                    console.error('[CosmosSync] ❌ syncCallback is not a function!');
                }
            } else {
                console.log('[CosmosSync] ✅ No changes detected');
            }

            this.lastSync = new Date();
            this.syncStatus = this.connectionId ? 'websocket' : 'idle';
            this.errorCount = 0;

            // Resetear intervalo a normal si había errores
            if (this.pollIntervalMs > 5000) {
                this.pollIntervalMs = 5000;
                this._startPolling();
            }

        } catch (error) {
            console.error('[CosmosSync] ❌ Sync error:', error);
            this.syncStatus = 'error';
            this.errorCount++;

            // Backoff exponencial en caso de errores
            this._applyBackoff();
        }
    }

    /**
     * Detecta si hubo cambios en el Cosmos.
     * @private
     */
    _detectChanges(newCosmos) {
        if (!this.lastSyncedCosmos) {
            this.lastSyncedCosmos = newCosmos;
            return true;
        }

        // Comparación simple por JSON stringify
        const oldHash = JSON.stringify(this.lastSyncedCosmos);
        const newHash = JSON.stringify(newCosmos);

        const hasChanges = oldHash !== newHash;

        if (hasChanges) {
            this.lastSyncedCosmos = newCosmos;
        }

        return hasChanges;
    }

    /**
     * Aplica backoff exponencial en caso de errores.
     * @private
     */
    _applyBackoff() {
        // AXIOMA: No aplicar backoff si fue detenido
        if (this.isStopped) {
            return;
        }

        // Incrementar intervalo exponencialmente
        this.pollIntervalMs = Math.min(
            this.pollIntervalMs * 2,
            this.maxPollIntervalMs
        );

        console.warn(`[CosmosSync] ⚠️ Backoff applied. New interval: ${this.pollIntervalMs}ms`);

        // Reiniciar polling con nuevo intervalo
        this._startPolling();
    }
}

// Singleton instance
export const cosmosSync = new CosmosSync();
export default cosmosSync;




