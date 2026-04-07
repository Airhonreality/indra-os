import { peristalticQueue } from './PeristalticQueue';
import { peristalticUploadService } from './PeristalticUploadService';
import { MIEOrchestrator } from './MIEOrchestrator';

class PeristalticIngestManager {
    constructor() {
        this.queue = [];
        this.isRunning = false;
        this.listeners = new Set();
        this.orchestrator = new MIEOrchestrator();
        this.filesVault = new Map(); // RAM storage for Blobs while session is active
    }

    // --- SUSCRIPCIÓN ---
    subscribe(callback) {
        this.listeners.add(callback);
        callback(this._getState());
        return () => this.listeners.delete(callback);
    }

    _notify() {
        const state = this._getState();
        this.listeners.forEach(cb => cb(state));
    }

    _getState() {
        return {
            queue: this.queue,
            isRunning: this.isRunning
        };
    }

    // --- ACCIONES ---
    async init() {
        await this.refreshQueue();
    }

    async refreshQueue() {
        const persisted = await peristalticQueue.getAllMetadata();
        this.queue = persisted.sort((a,b) => (b.metadata.timestamp || 0) - (a.metadata.timestamp || 0));
        this._notify();
    }

    async addFiles(files, uploader) {
        for (const file of files) {
            // Un id atómico desde el nacimiento
            const meta = await peristalticQueue.addFile(file, {
                uploader: uploader.name,
                contact: uploader.contact,
                created_at: new Date(file.lastModified).toISOString().split('T')[0]
            });
            this.filesVault.set(meta.id, file);
        }
        await this.refreshQueue();
    }

    async removeFile(id) {
        await peristalticQueue.removeFile(id);
        this.filesVault.delete(id);
        await this.refreshQueue();
    }

    async processQueue(uploaderData) {
        if (this.isRunning) return;
        this.isRunning = true;
        this._notify();

        const pending = this.queue.filter(q => q.status === 'STAGED' || q.status === 'ERROR');

        for (const item of pending) {
            try {
                let blob = this.filesVault.get(item.id);
                if (!blob) blob = await peristalticQueue.getFileBlob(item.id);
                if (!blob) continue;

                // 1. TRANSCODING
                await this._updateItemStatus(item.id, 'PROCESSING');
                
                let processedBlob = blob;
                let processedName = item.name;

                try {
                    const result = await Promise.race([
                        new Promise((resolve) => {
                            this.orchestrator.results = [];
                            this.orchestrator.jobs.clear();
                            this.orchestrator.queue = [];
                            this.orchestrator.onComplete = (r) => resolve(r[0]);
                            this.orchestrator.onError = () => resolve(null);
                            this.orchestrator.enqueue([blob]);
                            this.orchestrator.start();
                        }),
                        new Promise((resolve) => setTimeout(() => resolve(null), 15000))
                    ]);

                    if (result && result.canonicalBlob) {
                        processedBlob = result.canonicalBlob;
                        processedName = result.canonicalName;
                    }
                } catch (e) { console.warn("Fallback to RAW"); }

                // 2. UPLOAD (Con soporte de RESUME real)
                await this._updateItemStatus(item.id, 'UPLOADING', { 
                    name: processedName,
                    uploadUrl: item.uploadUrl // Si existía, se pasa
                });

                const uploadResult = await peristalticUploadService.upload(
                    processedBlob, 
                    processedName, 
                    uploaderData,
                    (p) => {
                        const bytes = Math.round(p * processedBlob.size);
                        this._updateItemProgress(item.id, p, bytes);
                    },
                    item.metadata?.created_at,
                    item.uploadUrl ? { uploadUrl: item.uploadUrl, byteOffset: item.byteOffset } : null,
                    (url) => this._updateItemStatus(item.id, 'UPLOADING', { uploadUrl: url }) // Persistencia inmediata
                );

                if (uploadResult.status === 'SUCCESS') {
                    await this._updateItemStatus(item.id, 'COMPLETED', { progress: 1, byteOffset: processedBlob.size });
                } else {
                    throw new Error("Upload Failed");
                }

            } catch (err) {
                console.error("Critical Pipe Error:", err);
                await this._updateItemStatus(item.id, 'ERROR');
            }
        }

        this.isRunning = false;
        this._notify();
    }

    // --- HELPERS DE ESTADO ---
    async _updateItemStatus(id, status, extra = {}) {
        await peristalticQueue.updateStatus(id, status, extra);
        this.queue = this.queue.map(q => q.id === id ? { ...q, status, ...extra } : q);
        this._notify();
    }

    async _updateItemProgress(id, progress, byteOffset) {
        // Persistimos en DB para soportar Resume
        await peristalticQueue.updateProgress(id, progress, byteOffset);
        this.queue = this.queue.map(q => q.id === id ? { ...q, progress, byteOffset } : q);
        this._notify();
    }
}

export const ingestManager = new PeristalticIngestManager();
