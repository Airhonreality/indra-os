/**
 * CosmosStatePersister.js
 * DHARMA: Guardado diferido inteligente de Cosmos con reintentos controlados
 * AXIOMA: "Guardar cuando haya calma, reintentar con exponential backoff"
 */

import contextClient from '../kernel/ContextClient';

class CosmosStatePersister {
    constructor() {
        this.saveTimer = null;
        this.pendingChanges = false;
        this.currentCosmos = null;
        this.debounceDelay = 1500; // 1.5 segundos de inactividad (Axioma: Respuesta Ágil)
        this.retryCount = 0;
        this.maxRetries = 5;
        this.baseRetryDelay = 2000; // 2 segundos
        this.isSaving = false;
        this.lastSaveTime = null;
        this.saveStatus = 'idle'; // 'idle', 'pending', 'saving', 'error'
    }

    /**
     * Marca que hay cambios pendientes de guardar.
     * @param {Object} cosmos - Cosmos actualizado
     */
    markDirty(cosmos) {
        this.currentCosmos = cosmos;
        this.pendingChanges = true;
        this.saveStatus = 'pending';

        // Resetear timer de debounce
        clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(() => {
            this.flush();
        }, this.debounceDelay);

        console.log('[CosmosStatePersister] 📝 Changes marked dirty, will save in 3s...');

        // Notificar cambio de estado
        this._notifyStatusChange();
    }

    /**
     * Fuerza el guardado inmediato (sin esperar debounce).
     */
    async forceSave() {
        clearTimeout(this.saveTimer);
        await this.flush();
    }

    /**
     * Guarda los cambios pendientes al backend.
     */
    async flush() {
        if (!this.pendingChanges || !this.currentCosmos) {
            console.log('[CosmosStatePersister] No pending changes to save');
            return;
        }

        if (this.isSaving) {
            console.log('[CosmosStatePersister] Already saving, skipping...');
            return;
        }

        this.isSaving = true;
        this.saveStatus = 'saving';
        this._notifyStatusChange();

        try {
            console.log('[CosmosStatePersister] 💾 Saving Cosmos...');

            const startTime = Date.now();

            // Llamada al backend
            await contextClient.saveCosmos(this.currentCosmos);

            const duration = Date.now() - startTime;

            // Éxito
            this.pendingChanges = false;
            this.retryCount = 0;
            this.lastSaveTime = new Date();
            this.saveStatus = 'idle';
            this.isSaving = false;

            console.log(`[CosmosStatePersister] ✅ Saved successfully in ${duration}ms`);

            this._notifyStatusChange();

        } catch (error) {
            console.error('[CosmosStatePersister] ❌ Save failed:', error);

            this.isSaving = false;

            // Reintentar con exponential backoff
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                const delay = this.baseRetryDelay * Math.pow(2, this.retryCount - 1);

                console.log(`[CosmosStatePersister] 🔄 Retry ${this.retryCount}/${this.maxRetries} in ${delay}ms...`);

                this.saveStatus = 'pending';
                this._notifyStatusChange();

                setTimeout(() => this.flush(), delay);

            } else {
                // Máximo de reintentos alcanzado
                console.error('[CosmosStatePersister] 🛑 Max retries reached. Saving to fallback queue...');

                this.saveStatus = 'error';
                this._notifyStatusChange();

                // Guardar en fallback (Sheet queue o localStorage)
                await this._saveToFallback();
            }
        }
    }

    /**
     * Guarda en fallback cuando todos los reintentos fallan.
     * @private
     */
    async _saveToFallback() {
        try {
            // Opción 1: Guardar en localStorage como backup
            const backupKey = `COSMOS_BACKUP_${this.currentCosmos.id}_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(this.currentCosmos));

            console.log('[CosmosStatePersister] 💾 Saved to localStorage backup');

            // Opción 2: Intentar guardar en Sheet queue (si está disponible)
            // TODO: Implementar cuando tengamos Sheet queue

            // Notificar al usuario
            this._notifyUser('error', 'No se pudo guardar. Cambios guardados localmente.');

        } catch (error) {
            console.error('[CosmosStatePersister] Failed to save to fallback:', error);
            this._notifyUser('critical', 'Error crítico al guardar. Por favor, no cierre la aplicación.');
        }
    }

    /**
     * Notifica cambio de estado a listeners.
     * @private
     */
    _notifyStatusChange() {
        window.dispatchEvent(new CustomEvent('cosmos-save-status', {
            detail: {
                status: this.saveStatus,
                pendingChanges: this.pendingChanges,
                lastSaveTime: this.lastSaveTime,
                retryCount: this.retryCount
            }
        }));
    }

    /**
     * Notifica al usuario con un mensaje.
     * @private
     */
    _notifyUser(level, message) {
        window.dispatchEvent(new CustomEvent('cosmos-notification', {
            detail: { level, message }
        }));
    }

    /**
     * Obtiene el estado actual del persister.
     */
    getStatus() {
        return {
            status: this.saveStatus,
            pendingChanges: this.pendingChanges,
            lastSaveTime: this.lastSaveTime,
            retryCount: this.retryCount,
            isSaving: this.isSaving
        };
    }

    /**
     * Limpia el estado (útil al desmontar Cosmos).
     */
    reset() {
        clearTimeout(this.saveTimer);
        this.pendingChanges = false;
        this.currentCosmos = null;
        this.retryCount = 0;
        this.isSaving = false;
        this.saveStatus = 'idle';

        console.log('[CosmosStatePersister] Reset');
    }
}

// Singleton
const cosmosStatePersister = new CosmosStatePersister();

// Guardar antes de cerrar la ventana (Axioma: No molestar si ya falló y se notificó)
window.addEventListener('beforeunload', (event) => {
    const isError = cosmosStatePersister.saveStatus === 'error';

    if (cosmosStatePersister.pendingChanges && !isError) {
        // En navegadores modernos chrome requiere preventDefault y establecer un string (que no se muestra)
        event.preventDefault();
        event.returnValue = '';

        // Intentar último guardado rápido
        cosmosStatePersister.forceSave();

        // El mensaje ya no suele personalizarse en navegadores modernos, pero lo dejamos por compatibilidad
        return 'Sincronización en curso. Se recomienda esperar unos segundos.';
    }
});

export default cosmosStatePersister;
