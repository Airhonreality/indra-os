/**
 * UsageTracker.js
 * DHARMA: Telemetría de uso para inferir relevancia de datos
 * AXIOMA: "El uso pasado predice el uso futuro"
 */

class UsageTracker {
    constructor() {
        this.metrics = {
            // adapterId -> { itemId -> access_count }
        };
        this.topN = 5; // Mantener top 5 items más accedidos
    }

    /**
     * Registra el acceso a un item.
     * @param {string} adapterId - ID del adapter (ej: 'drive')
     * @param {string} itemId - ID del item (ej: 'folder_abc')
     * @param {string} itemType - Tipo de item (ej: 'folder', 'file', 'email')
     */
    track(adapterId, itemId, itemType = 'unknown') {
        // Inicializar adapter si no existe
        if (!this.metrics[adapterId]) {
            this.metrics[adapterId] = {
                items: {},
                last_accessed: null,
                total_access_count: 0
            };
        }

        // Inicializar item si no existe
        if (!this.metrics[adapterId].items[itemId]) {
            this.metrics[adapterId].items[itemId] = {
                access_count: 0,
                last_accessed: null,
                type: itemType
            };
        }

        // Incrementar contador
        this.metrics[adapterId].items[itemId].access_count++;
        this.metrics[adapterId].items[itemId].last_accessed = new Date().toISOString();
        this.metrics[adapterId].last_accessed = new Date().toISOString();
        this.metrics[adapterId].total_access_count++;

        console.log(`[UsageTracker] 📊 Tracked: ${adapterId}.${itemId} (count: ${this.metrics[adapterId].items[itemId].access_count})`);
    }

    /**
     * Obtiene los items más accedidos de un adapter.
     * @param {string} adapterId - ID del adapter
     * @param {number} limit - Número de items a devolver (default: 5)
     * @returns {Array} Lista de items ordenados por acceso
     */
    getMostAccessed(adapterId, limit = this.topN) {
        if (!this.metrics[adapterId]) {
            return [];
        }

        const items = Object.entries(this.metrics[adapterId].items)
            .map(([itemId, data]) => ({
                itemId,
                ...data
            }))
            .sort((a, b) => b.access_count - a.access_count)
            .slice(0, limit);

        return items;
    }

    /**
     * Obtiene las métricas completas de un adapter.
     * @param {string} adapterId - ID del adapter
     * @returns {Object} Métricas del adapter
     */
    getMetrics(adapterId) {
        if (!this.metrics[adapterId]) {
            return {
                items: {},
                last_accessed: null,
                total_access_count: 0,
                most_accessed: []
            };
        }

        return {
            ...this.metrics[adapterId],
            most_accessed: this.getMostAccessed(adapterId)
        };
    }

    /**
     * Obtiene las métricas de todos los adapters (para guardar en flow_state).
     * @returns {Object} Métricas de todos los adapters
     */
    getAllMetrics() {
        const result = {};

        for (const [adapterId, data] of Object.entries(this.metrics)) {
            result[adapterId] = {
                most_accessed_items: this.getMostAccessed(adapterId).map(item => item.itemId),
                last_accessed: data.last_accessed,
                access_count: data.total_access_count
            };
        }

        return result;
    }

    /**
     * Carga métricas desde flow_state (al montar Cosmos).
     * @param {Object} usageMetrics - Métricas guardadas en flow_state
     */
    loadMetrics(usageMetrics) {
        if (!usageMetrics) return;

        for (const [adapterId, data] of Object.entries(usageMetrics)) {
            if (!this.metrics[adapterId]) {
                this.metrics[adapterId] = {
                    items: {},
                    last_accessed: data.last_accessed,
                    total_access_count: data.access_count || 0
                };
            }

            // Reconstruir items desde most_accessed_items
            if (data.most_accessed_items) {
                data.most_accessed_items.forEach((itemId, index) => {
                    this.metrics[adapterId].items[itemId] = {
                        access_count: this.topN - index, // Inferir count desde posición
                        last_accessed: data.last_accessed,
                        type: 'unknown'
                    };
                });
            }
        }

        console.log('[UsageTracker] 📥 Loaded metrics from flow_state');
    }

    /**
     * Limpia métricas de un adapter.
     * @param {string} adapterId - ID del adapter
     */
    clearAdapter(adapterId) {
        delete this.metrics[adapterId];
        console.log(`[UsageTracker] 🗑️ Cleared metrics for ${adapterId}`);
    }

    /**
     * Limpia todas las métricas.
     */
    clearAll() {
        this.metrics = {};
        console.log('[UsageTracker] 🗑️ Cleared all metrics');
    }

    /**
     * Obtiene estadísticas generales.
     */
    getStats() {
        const adapterCount = Object.keys(this.metrics).length;
        let totalItems = 0;
        let totalAccesses = 0;

        for (const data of Object.values(this.metrics)) {
            totalItems += Object.keys(data.items).length;
            totalAccesses += data.total_access_count;
        }

        return {
            adapterCount,
            totalItems,
            totalAccesses,
            avgAccessesPerItem: totalItems > 0 ? (totalAccesses / totalItems).toFixed(1) : 0
        };
    }
}

// Singleton
const usageTracker = new UsageTracker();
export default usageTracker;



