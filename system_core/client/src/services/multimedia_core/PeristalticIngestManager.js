/**
 * PeristalticIngestManager.js — PUP v4.57
 *
 * AXIOMA 1: La RAM es la fuente de verdad de la UI. IDB es el respaldo.
 * AXIOMA 2: Un Worker crasheado NO puede contaminar el pipeline de upload.
 * AXIOMA 3: refreshQueue nunca destruye el estado. Solo lo enriquece.
 */
import { peristalticQueue } from './PeristalticQueue';
import { peristalticUploadService } from './PeristalticUploadService';
import { MIEOrchestrator } from './MIEOrchestrator';

class PeristalticIngestManager {
    constructor() {
        this.queue = [];
        this.isRunning = false;
        this.listeners = new Set();
        this.orchestrator = new MIEOrchestrator();
        this.filesVault = new Map();
        this._initialized = false;
    }

    // ─── SUSCRIPCIÓN ────────────────────────────────────────────────────────────
    subscribe(callback) {
        this.listeners.add(callback);
        callback(this._getState()); // Emitir estado actual al suscriptor
        return () => this.listeners.delete(callback);
    }

    _notify() {
        const state = this._getState();
        this.listeners.forEach(cb => cb(state));
    }

    _getState() {
        return { queue: [...this.queue], isRunning: this.isRunning };
    }

    // ─── ACCIONES ───────────────────────────────────────────────────────────────

    async init() {
        // Solo inicializar una vez por sesión del Singleton
        if (this._initialized) {
            this._notify(); // Re-emitir a nuevos suscriptores (re-montaje de React)
            return;
        }
        this._initialized = true;
        await this._syncFromDB();
    }

    /**
     * CIRUGÍA 1: refreshQueue es ahora NO-DESTRUCTIVA.
     * Fusiona los datos de IDB con la RAM. Nunca limpia lo que ya está en pantalla.
     */
    async _syncFromDB() {
        try {
            const persisted = await peristalticQueue.getAllMetadata();
            if (persisted.length === 0) return; // IDB vacía, no cambiar nada

            // Fusión inteligente: Priorizar estados en RAM (más frescos)
            // para items que ya están siendo procesados.
            const ramById = new Map(this.queue.map(q => [q.id, q]));
            const merged = persisted.map(dbItem => {
                const ramItem = ramById.get(dbItem.id);
                // Si el item está en proceso activo en RAM, no sobreescribir con IDB
                const activeStatuses = ['PROCESSING', 'UPLOADING'];
                if (ramItem && activeStatuses.includes(ramItem.status)) {
                    return ramItem;
                }
                return dbItem;
            });

            this.queue = merged.sort((a, b) => (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0));
            this._notify();
        } catch (e) {
            console.error("[Manager] Fallo de sincronización con IDB:", e);
        }
    }

    /**
     * CIRUGÍA 2: addFiles actualiza RAM INMEDIATAMENTE.
     * No espera el round-trip de IDB para mostrar archivos en pantalla.
     * Esto resuelve el bug de "archivos invisibles en móvil".
     */
    async addFiles(files, uploader) {
        for (const file of files) {
            // 1. Registrar en IDB (operación lenta, asíncrona)
            const meta = await peristalticQueue.addFile(file, {
                uploader: uploader.name,
                contact: uploader.contact,
                created_at: new Date(file.lastModified).toISOString().split('T')[0]
            });

            // 2. Actualizar RAM INMEDIATAMENTE (la UI ve el archivo al instante)
            this.filesVault.set(meta.id, file);
            this.queue = [meta, ...this.queue];
            this._notify(); // <- Notificación por cada archivo, no en batch
        }
    }

    async removeFile(id) {
        // RAM primero, IDB después
        this.queue = this.queue.filter(q => q.id !== id);
        this.filesVault.delete(id);
        this._notify();
        await peristalticQueue.removeFile(id).catch(e => console.warn("[Manager] Error borrando de IDB:", e));
    }

    /**
     * CIRUGÍA 3: El Orchestrator está en una "caja de arena".
     * Si el Worker crashea, el error NUNCA puede salir del bloque try interno
     * y contaminar el pipeline de upload del bloque try externo.
     */
    async processQueue(uploaderData) {
        if (this.isRunning) return;
        this.isRunning = true;
        this._notify();

        const pending = this.queue.filter(q => q.status === 'STAGED' || q.status === 'ERROR');

        for (const item of pending) {
            try {
                let blob = this.filesVault.get(item.id);
                if (!blob) blob = await peristalticQueue.getFileBlob(item.id);
                if (!blob) {
                    console.warn(`[Manager] Blob no encontrado para ${item.id}. Saltando.`);
                    continue;
                }

                // FASE 1: TRANSCODING — Caja de Arena Aislada
                await this._updateItemStatus(item.id, 'PROCESSING');
                let processedBlob = blob;
                let processedName = item.name;

                // Este try/catch está COMPLETAMENTE AISLADO del upload.
                // Si el Worker explota, el error se absorbe aquí y se usa el raw.
                try {
                    const transcodingResult = await new Promise((resolve) => {
                        const orc = this.orchestrator;
                        orc.results = []; orc.jobs.clear(); orc.queue = [];
                        orc.onComplete = (r) => resolve({ ok: true, data: r[0] });
                        // onError captura el evento de error y resuelve (nunca rechaza)
                        orc.onError = (err) => resolve({ ok: false, reason: err?.message || 'Worker error' });
                        orc.enqueue([blob]);
                        orc.start();
                        setTimeout(() => resolve({ ok: false, reason: 'Timeout 15s' }), 15000);
                    });

                    if (transcodingResult.ok && transcodingResult.data?.canonicalBlob) {
                        processedBlob = transcodingResult.data.canonicalBlob;
                        processedName = transcodingResult.data.canonicalName;
                        console.log(`[Manager] Transcodificación OK: ${processedName}`);
                    } else {
                        console.warn(`[Manager] Fallback a RAW: ${transcodingResult.reason}`);
                    }
                } catch (transcodeErr) {
                    // Nunca debería llegar aquí, pero por si acaso
                    console.warn("[Manager] Excepción inesperada en transcoding. Usando RAW.", transcodeErr);
                }

                // FASE 2: UPLOAD — Pipeline Independiente
                await this._updateItemStatus(item.id, 'UPLOADING', {
                    name: processedName,
                    uploadUrl: item.uploadUrl
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
                    item.uploadUrl ? { uploadUrl: item.uploadUrl, byteOffset: item.byteOffset || 0 } : null,
                    (url) => this._persistUploadSession(item.id, url)
                );

                if (uploadResult.status === 'SUCCESS') {
                    await this._updateItemStatus(item.id, 'COMPLETED', { progress: 1 });
                } else {
                    // Mostrar el error REAL al usuario, no "Upload Failed" genérico
                    await this._updateItemStatus(item.id, 'ERROR', { errorMsg: uploadResult.error || 'Fallo de red' });
                }

            } catch (err) {
                console.error("[Manager] Error catastrófico en pipeline:", err);
                await this._updateItemStatus(item.id, 'ERROR', { errorMsg: err.message });
            }
        }

        this.isRunning = false;
        this._notify();
    }

    // ─── HELPERS ────────────────────────────────────────────────────────────────

    async _persistUploadSession(id, uploadUrl) {
        // Guardar URL de sesión en IDB para resume (no bloquea la UI)
        peristalticQueue.updateStatus(id, 'UPLOADING', { uploadUrl }).catch(() => {});
        this.queue = this.queue.map(q => q.id === id ? { ...q, uploadUrl } : q);
    }

    async _updateItemStatus(id, status, extra = {}) {
        // RAM primero, IDB después (no bloqueamos la UI por IDB)
        this.queue = this.queue.map(q => q.id === id ? { ...q, status, ...extra } : q);
        this._notify();
        peristalticQueue.updateStatus(id, status, extra).catch(e =>
            console.warn("[Manager] IDB updateStatus falló (no crítico):", e)
        );
    }

    async _updateItemProgress(id, progress, byteOffset) {
        this.queue = this.queue.map(q => q.id === id ? { ...q, progress, byteOffset } : q);
        this._notify();
        // Persistir offset para resume (sin await para no bloquear)
        peristalticQueue.updateProgress(id, progress, byteOffset).catch(() => {});
    }
}

export const ingestManager = new PeristalticIngestManager();
