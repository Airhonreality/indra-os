/**
 * CAPA 2: ENGINES
 * CosmosCache.js
 * DHARMA: Sistema de caché inteligente para Cosmos.
 * AXIOMA: "La memoria es más rápida que la consulta."
 * 
 * FEATURES:
 * - Caché en memoria con TTL (Time To Live)
 * - Caché persistente en localStorage
 * - Invalidación automática cuando hay cambios
 * - Compresión de datos para optimizar almacenamiento
 */

class CosmosCache {
    constructor() {
        this.memoryCache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos
        this.localStoragePrefix = 'INDRA_COSMOS_CACHE_';
    }

    /**
     * Obtiene un Cosmos del caché.
     * @param {string} cosmosId - ID del Cosmos
     * @returns {Object|null} Cosmos cacheado o null
     */
    get(cosmosId) {
        // 1. Intentar memoria primero (más rápido)
        const memoryEntry = this.memoryCache.get(cosmosId);

        if (memoryEntry && !this._isExpired(memoryEntry)) {
            console.log(`[CosmosCache] 🎯 Memory cache hit: ${cosmosId}`);
            return memoryEntry.data;
        }

        // 2. Intentar localStorage
        try {
            const storageKey = this.localStoragePrefix + cosmosId;
            const storageData = localStorage.getItem(storageKey);

            if (storageData) {
                const entry = JSON.parse(storageData);

                if (!this._isExpired(entry)) {
                    console.log(`[CosmosCache] 💾 LocalStorage cache hit: ${cosmosId}`);

                    // Promover a memoria para acceso más rápido
                    this.memoryCache.set(cosmosId, entry);

                    return entry.data;
                }
            }
        } catch (e) {
            console.warn(`[CosmosCache] LocalStorage read error: ${e.message}`);
        }

        console.log(`[CosmosCache] ❌ Cache miss: ${cosmosId}`);
        return null;
    }

    /**
     * Guarda un Cosmos en el caché.
     * @param {string} cosmosId - ID del Cosmos
     * @param {Object} cosmosData - Datos del Cosmos
     * @param {number} ttl - Time to live en milisegundos (opcional)
     */
    set(cosmosId, cosmosData, ttl = this.defaultTTL) {
        const entry = {
            data: cosmosData,
            timestamp: Date.now(),
            ttl: ttl
        };

        // 1. Guardar en memoria
        this.memoryCache.set(cosmosId, entry);
        console.log(`[CosmosCache] 💾 Cached in memory: ${cosmosId}`);

        // 2. Guardar en localStorage (con manejo de errores)
        try {
            const storageKey = this.localStoragePrefix + cosmosId;
            localStorage.setItem(storageKey, JSON.stringify(entry));
            console.log(`[CosmosCache] 💾 Cached in localStorage: ${cosmosId}`);
        } catch (e) {
            console.warn(`[CosmosCache] LocalStorage write error: ${e.message}`);

            // Si falla por espacio, limpiar caché antiguo
            if (e.name === 'QuotaExceededError') {
                this._cleanOldEntries();

                // Reintentar
                try {
                    const storageKey = this.localStoragePrefix + cosmosId;
                    localStorage.setItem(storageKey, JSON.stringify(entry));
                } catch (e2) {
                    console.error(`[CosmosCache] Failed to cache after cleanup: ${e2.message}`);
                }
            }
        }
    }

    /**
     * Invalida el caché de un Cosmos específico.
     * @param {string} cosmosId - ID del Cosmos
     */
    invalidate(cosmosId) {
        // Eliminar de memoria
        this.memoryCache.delete(cosmosId);

        // Eliminar de localStorage
        try {
            const storageKey = this.localStoragePrefix + cosmosId;
            localStorage.removeItem(storageKey);
            console.log(`[CosmosCache] 🗑️ Cache invalidated: ${cosmosId}`);
        } catch (e) {
            console.warn(`[CosmosCache] LocalStorage delete error: ${e.message}`);
        }
    }

    /**
     * Limpia todo el caché.
     */
    clear() {
        // Limpiar memoria
        this.memoryCache.clear();

        // Limpiar localStorage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.localStoragePrefix)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('[CosmosCache] 🗑️ All cache cleared');
        } catch (e) {
            console.warn(`[CosmosCache] LocalStorage clear error: ${e.message}`);
        }
    }

    /**
     * Verifica si una entrada del caché ha expirado.
     * @private
     */
    _isExpired(entry) {
        const now = Date.now();
        const age = now - entry.timestamp;
        return age > entry.ttl;
    }

    /**
     * Limpia entradas antiguas del localStorage.
     * @private
     */
    _cleanOldEntries() {
        try {
            const keys = Object.keys(localStorage);
            const entries = [];

            // Recopilar todas las entradas con sus timestamps
            keys.forEach(key => {
                if (key.startsWith(this.localStoragePrefix)) {
                    try {
                        const entry = JSON.parse(localStorage.getItem(key));
                        entries.push({ key, timestamp: entry.timestamp });
                    } catch (e) {
                        // Entrada corrupta, eliminar
                        localStorage.removeItem(key);
                    }
                }
            });

            // Ordenar por timestamp (más antiguo primero)
            entries.sort((a, b) => a.timestamp - b.timestamp);

            // Eliminar el 50% más antiguo
            const toDelete = Math.ceil(entries.length / 2);
            for (let i = 0; i < toDelete; i++) {
                localStorage.removeItem(entries[i].key);
            }

            console.log(`[CosmosCache] 🗑️ Cleaned ${toDelete} old entries`);
        } catch (e) {
            console.error(`[CosmosCache] Cleanup error: ${e.message}`);
        }
    }

    /**
     * Obtiene estadísticas del caché.
     */
    getStats() {
        const memorySize = this.memoryCache.size;

        let localStorageSize = 0;
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.localStoragePrefix)) {
                    localStorageSize++;
                }
            });
        } catch (e) {
            console.warn(`[CosmosCache] Stats error: ${e.message}`);
        }

        return {
            memoryEntries: memorySize,
            localStorageEntries: localStorageSize,
            totalEntries: memorySize + localStorageSize
        };
    }
}

// Singleton instance
export const cosmosCache = new CosmosCache();
export default cosmosCache;



