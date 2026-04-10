/**
 * PeristalticQueue.js — v4.65
 * Evolución: Separación de metadatos y persistencia de blobs.
 */
import { openDB } from 'idb';

const DB_NAME = 'indra-multimedia-ingest';
const VERSION = 1;
const META_STORE = 'metadata';
const BLOB_STORE = 'blobs';

class PeristalticQueue {
    constructor() {
        this.dbPromise = openDB(DB_NAME, VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(BLOB_STORE)) db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
            },
        });
    }

    async addMetadata(id, file, metadata = {}) {
        const metaRecord = {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            status: metadata.is_duplicate ? 'COMPLETED' : 'STAGED',
            progress: metadata.is_duplicate ? 1 : 0,
            metadata: { ...metadata, timestamp: Date.now() }
        };
        const db = await this.dbPromise;
        await db.put(META_STORE, metaRecord);
        return metaRecord;
    }

    async persistBlob(id, file) {
        // REGLA DE SEGURIDAD: No persistir en disco local archivos mayores a 200MB 
        // para evitar bloqueos de IO en móviles.
        if (file.size > 200 * 1024 * 1024) {
            console.warn(`[Queue] Archivo ${file.name} es muy grande para IDB. Solo vivirá en RAM.`);
            return;
        }
        try {
            const db = await this.dbPromise;
            await db.put(BLOB_STORE, { id, blob: file });
        } catch (e) {
            console.warn("[Queue] No se pudo persistir Blob en IDB (Quota o IO):", e);
        }
    }

    async updateStatus(id, status, extra = {}) {
        const db = await this.dbPromise;
        const tx = db.transaction(META_STORE, 'readwrite');
        const store = tx.objectStore(META_STORE);
        const item = await store.get(id);
        if (item) {
            await store.put({ ...item, status, ...extra });
        }
        await tx.done;
    }

    async updateProgress(id, progress, byteOffset) {
        const db = await this.dbPromise;
        const tx = db.transaction(META_STORE, 'readwrite');
        const store = tx.objectStore(META_STORE);
        const item = await store.get(id);
        if (item) {
            await store.put({ ...item, progress, byteOffset });
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

    async clearAll() {
        const db = await this.dbPromise;
        const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
        await tx.objectStore(META_STORE).clear();
        await tx.objectStore(BLOB_STORE).clear();
        await tx.done;
    }

    async getAllMetadata() {
        try {
            const db = await this.dbPromise;
            return await db.getAll(META_STORE);
        } catch (e) {
            return [];
        }
    }

    async getFileBlob(id) {
        const db = await this.dbPromise;
        const record = await db.get(BLOB_STORE, id);
        return record ? record.blob : null;
    }
}

export const peristalticQueue = new PeristalticQueue();
