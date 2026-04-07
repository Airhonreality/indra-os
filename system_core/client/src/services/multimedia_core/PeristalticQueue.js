/**
 * PeristalticQueue.js
 * ORIGEN: Sintonía de Inicio v4.9.
 * RESPONSABILIDAD: Persistencia disociada con Autocierre de Conflictos.
 * AXIOMA: Si la versión de DB choca, forzar apertura nueva.
 */

import { openDB } from 'idb';

const DB_NAME = 'INDRA_VAULT_MASTER_v49'; 
const META_STORE = 'metadata';
const BLOB_STORE = 'blobs';

class PeristalticQueue {
    constructor() {
        this.dbPromise = openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(META_STORE)) {
                    db.createObjectStore(META_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(BLOB_STORE)) {
                    db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
                }
            },
            blocked() {
                console.warn("[IDB] DB bloqueada. Por favor cierra otras pestañas.");
            },
            blocking() {
                console.warn("[IDB] DB bloqueando. Cerrando automáticamente.");
            },
            terminated() {
                console.error("[IDB] DB terminada inesperadamente.");
            }
        });
    }

    async addFile(file, metadata = {}) {
        const db = await this.dbPromise;
        const id = 'indra-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
        
        const metaRecord = {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            status: metadata.is_duplicate ? 'COMPLETED' : 'STAGED',
            progress: metadata.is_duplicate ? 1 : 0,
            metadata: {
                ...metadata,
                timestamp: Date.now()
            }
        };

        const blobRecord = { id, blob: file };

        const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
        await tx.objectStore(META_STORE).put(metaRecord);
        await tx.objectStore(BLOB_STORE).put(blobRecord);
        await tx.done;

        return metaRecord;
    }

    async getAllMetadata() {
        try {
            const db = await this.dbPromise;
            return await db.getAll(META_STORE);
        } catch (e) {
            console.error("[IDB] Error al leer metadata:", e);
            return [];
        }
    }

    async getFileBlob(id) {
        const db = await this.dbPromise;
        const record = await db.get(BLOB_STORE, id);
        return record ? record.blob : null;
    }

    async updateStatus(id, status, updates = {}) {
        const db = await this.dbPromise;
        const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
        const metaStore = tx.objectStore(META_STORE);
        const record = await metaStore.get(id);
        
        if (record) {
            Object.assign(record, { status, ...updates });
            if (updates.blob) {
                await tx.objectStore(BLOB_STORE).put({ id, blob: updates.blob });
                delete record.blob;
            }
            await metaStore.put(record);
        }
        await tx.done;
    }

    async removeFile(id) {
        const db = await this.dbPromise;
        const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
        await tx.objectStore(META_STORE).delete(id);
        await tx.objectStore(BLOB_STORE).delete(id);
        await tx.done;
    }
}

export const peristalticQueue = new PeristalticQueue();
