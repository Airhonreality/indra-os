/**
 * CompressionManager.js
 * DHARMA: Gestión de compresión/descompresión de datos para localStorage
 * AXIOMA: "Comprimir antes de guardar, descomprimir al leer"
 */

import pako from 'pako';

class CompressionManager {
    /**
     * Comprime un objeto JavaScript a string base64.
     * @param {Object} data - Objeto a comprimir
     * @returns {string} String base64 comprimido
     */
    compress(data) {
        try {
            const jsonString = JSON.stringify(data);
            const compressed = pako.deflate(jsonString, { level: 6 }); // Nivel 6 = balance velocidad/tamaño
            const base64 = btoa(String.fromCharCode.apply(null, compressed));

            const originalSize = jsonString.length;
            const compressedSize = base64.length;
            const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

            console.log(`[CompressionManager] Compressed: ${originalSize} → ${compressedSize} bytes (${ratio}% reduction)`);

            return base64;
        } catch (error) {
            console.error('[CompressionManager] Compression failed:', error);
            throw new Error(`Compression failed: ${error.message}`);
        }
    }

    /**
     * Descomprime un string base64 a objeto JavaScript.
     * @param {string} compressedData - String base64 comprimido
     * @returns {Object} Objeto descomprimido
     */
    decompress(compressedData) {
        try {
            const binaryString = atob(compressedData);
            const bytes = new Uint8Array(binaryString.length);

            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const decompressed = pako.inflate(bytes, { to: 'string' });
            const data = JSON.parse(decompressed);

            console.log(`[CompressionManager] Decompressed: ${compressedData.length} → ${decompressed.length} bytes`);

            return data;
        } catch (error) {
            console.error('[CompressionManager] Decompression failed:', error);
            throw new Error(`Decompression failed: ${error.message}`);
        }
    }

    /**
     * Guarda datos comprimidos en localStorage.
     * @param {string} key - Clave de localStorage
     * @param {Object} data - Datos a guardar
     */
    saveToStorage(key, data) {
        try {
            const compressed = this.compress(data);
            localStorage.setItem(key, compressed);
            console.log(`[CompressionManager] Saved to localStorage: ${key}`);
        } catch (error) {
            console.error(`[CompressionManager] Failed to save ${key}:`, error);

            // Fallback: Intentar guardar sin comprimir si el error es de espacio
            if (error.name === 'QuotaExceededError') {
                console.warn('[CompressionManager] Quota exceeded, attempting cleanup...');
                this._cleanup();
                // Reintentar
                const compressed = this.compress(data);
                localStorage.setItem(key, compressed);
            } else {
                throw error;
            }
        }
    }

    /**
     * Carga datos comprimidos desde localStorage.
     * @param {string} key - Clave de localStorage
     * @returns {Object|null} Datos descomprimidos o null si no existe
     */
    loadFromStorage(key) {
        try {
            const compressed = localStorage.getItem(key);

            if (!compressed) {
                console.log(`[CompressionManager] No data found for key: ${key}`);
                return null;
            }

            const data = this.decompress(compressed);
            console.log(`[CompressionManager] Loaded from localStorage: ${key}`);

            return data;
        } catch (error) {
            console.error(`[CompressionManager] Failed to load ${key}:`, error);

            // Si falla la descompresión, eliminar dato corrupto
            console.warn(`[CompressionManager] Removing corrupted data: ${key}`);
            localStorage.removeItem(key);

            return null;
        }
    }

    /**
     * Limpia datos antiguos de localStorage para liberar espacio.
     * @private
     */
    _cleanup() {
        const keysToRemove = [];

        // Buscar claves que empiecen con prefijos conocidos
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Eliminar backups viejos (más de 7 días)
            if (key.startsWith('COSMOS_BACKUP_')) {
                const timestamp = key.split('_').pop();
                const age = Date.now() - parseInt(timestamp);
                const sevenDays = 7 * 24 * 60 * 60 * 1000;

                if (age > sevenDays) {
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`[CompressionManager] Cleaned up: ${key}`);
        });

        console.log(`[CompressionManager] Cleanup complete. Removed ${keysToRemove.length} items.`);
    }

    /**
     * Obtiene estadísticas de uso de localStorage.
     * @returns {Object} Estadísticas
     */
    getStorageStats() {
        let totalSize = 0;
        const items = {};

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = value.length;

            items[key] = size;
            totalSize += size;
        }

        // Límite típico de localStorage: 5-10 MB (5,242,880 bytes)
        const limit = 5 * 1024 * 1024;
        const usagePercent = ((totalSize / limit) * 100).toFixed(1);

        return {
            totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            itemCount: localStorage.length,
            usagePercent,
            items
        };
    }
}

// Singleton
const compressionManager = new CompressionManager();
export default compressionManager;



