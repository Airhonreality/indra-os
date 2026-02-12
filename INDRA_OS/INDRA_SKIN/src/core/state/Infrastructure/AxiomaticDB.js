/**
 * AxiomaticDB.js
 * DHARMA: Capa de Persistencia L2 (IndexedDB).
 * Misión: Almacenamiento masivo de realidades y caché de "Materia Oscura".
 * Evita el límite de 5MB de localStorage y no bloquea el hilo principal.
 */

const DB_NAME = 'INDRA_COSMOS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'realities';

class AxiomaticDB {
    constructor() {
        this.db = null;
        this.initPromise = this._init();
    }

    async _init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('[AxiomaticDB] 🏛️ L2 Repository connected.');
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('[AxiomaticDB] 🛑 Failed to open IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async ensureDB() {
        await this.initPromise;
        if (!this.db) throw new Error("Database not initialized");
    }

    /**
     * Guarda un item en el repositorio.
     */
    async setItem(id, data) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ id, data, updatedAt: Date.now() });

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Recupera un item.
     */
    async getItem(id) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Elimina una realidad de la caché L2.
     */
    async deleteCosmos(id) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Limpieza total del repositorio.
     */
    async purge() {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

const instance = new AxiomaticDB();
export default instance;
