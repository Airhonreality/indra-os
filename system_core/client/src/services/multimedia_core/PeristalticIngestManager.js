/**
 * PeristalticIngestManager.js — v4.74
 * DIAGNÓSTICO DE ALTA PRECISIÓN: Captura de etapa y motivo de muerte.
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
        return { queue: [...this.queue], isRunning: this.isRunning };
    }

    async init() {
        if (this._initialized) {
            this._notify();
            return;
        }
        this._initialized = true;
        await this._syncFromDB();
    }

    async _syncFromDB() {
        try {
            const persisted = await peristalticQueue.getAllMetadata();
            this.queue = persisted.sort((a, b) => (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0));
            this._notify();
        } catch (e) {
            console.error("[Manager] Fallo de sincronización:", e);
        }
    }

    _generateFingerprint(file) {
        // Generar una huella de identidad única y determinista
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `indra-id-${safeName}-${file.size}-${file.lastModified}`;
    }

    async addFiles(files, uploader) {
        let addedCount = 0;
        let relinkedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            const fingerprintId = this._generateFingerprint(file);
            const existingItem = this.queue.find(q => q.id === fingerprintId);
            
            if (existingItem) {
                if (existingItem.status === 'COMPLETED') {
                    console.log(`[Manifest] Archivo ${file.name} ya existe y está COMPLETED. Ignorando.`);
                    skippedCount++;
                    continue;
                }
                
                // Si existe y no está completado, lo re-vinculamos (Resurrección Silenciosa)
                console.log(`[Manifest] Re-vinculando archivo existente: ${file.name}`);
                await this.relinkFile(fingerprintId, file);
                relinkedCount++;
                continue;
            }

            // Extracción de Fecha Real (Axioma: Clasificación Cronológica Original)
            const realDate = new Date(file.lastModified).toISOString().split('T')[0];

            // Si NO existe, es un archivo nuevo
            const id = fingerprintId;
            this.filesVault.set(id, { blob: file, bridge: uploader?.bridge });
            const optimisticMeta = {
                id,
                name: file.name,
                type: file.type,
                size: file.size,
                status: 'STAGED',
                progress: 0,
                errorMsg: null,
                metadata: { 
                    ...uploader, 
                    created_at: realDate, // Fecha de captura real
                    timestamp: Date.now() 
                }
            };
            this.queue = [optimisticMeta, ...this.queue];
            this._notify();
            peristalticQueue.addMetadata(id, file, uploader).then(() => {
                peristalticQueue.persistBlob(id, file);
            });
            addedCount++;
        }
        console.log(`[Manifest] Análisis de Selección: ${addedCount} Nuevos | ${relinkedCount} Restaurados | ${skippedCount} Ignorados (Ya en nube)`);
    }

    async removeFile(id) {
        this.queue = this.queue.filter(q => q.id !== id);
        this.filesVault.delete(id);
        this._notify();
        await peristalticQueue.removeFile(id);
    }

    async resetSession() {
        console.log("[Manager] Iniciando protocolo de Tierra Quemada...");
        this.isRunning = false; 
        this.queue = [];
        this.filesVault.clear();
        
        try {
            await peristalticQueue.clearAll();
            localStorage.clear(); // Limpieza absoluta de metadatos de usuario
            sessionStorage.clear();
        } catch (e) {
            console.error("[Manager] Error en limpieza física:", e);
        }

        this._notify();
        
        // El acto purista final: Recarga de página para limpiar RAM y workers
        setTimeout(() => {
            window.location.reload();
        }, 150);
    }

    async processQueue(uploaderData) {
        if (this.isRunning) return;
        this.isRunning = true;
        this._notify();

        while (true) {
            const pending = this.queue.filter(q => q.status === 'STAGED' || q.status === 'ERROR_AUTO_RETRY');
            if (pending.length === 0) break;

            for (const item of pending) {
                let currentStep = "INIT";
                try {
                    currentStep = "READ_DISK";
                    const vaultData = this.filesVault.get(item.id);
                    let blob = vaultData?.blob || vaultData; // Fallback para compatibilidad
                    if (!blob || !(blob instanceof Blob)) blob = await peristalticQueue.getFileBlob(item.id);
                    if (!blob) {
                        await this._updateItemStatus(item.id, 'ERROR', { errorMsg: '[I/O] El archivo ya no es legible en el disco (Purga OS)' });
                        continue;
                    }

                    // FASE 1: TRANSCODING
                    currentStep = "TRANSCODE";
                    await this._updateItemStatus(item.id, 'PROCESSING');
                    let processedBlob = blob;
                    let processedName = item.name;

                    if (blob.type.includes('video') || blob.type.includes('audio')) {
                        try {
                            const transcodingResult = await new Promise((resolve) => {
                                const orc = this.orchestrator;
                                orc.results = []; orc.jobs.clear(); orc.queue = [];
                                orc.onComplete = (r) => resolve({ ok: true, data: r[0] });
                                orc.onError = (err) => resolve({ ok: false, reason: err?.message });
                                orc.enqueue([blob]);
                                orc.start();
                                setTimeout(() => resolve({ ok: false, reason: 'Timeout 10m' }), 600000);
                            });

                            if (transcodingResult.ok && transcodingResult.data?.canonicalBlob) {
                                processedBlob = transcodingResult.data.canonicalBlob;
                                processedName = transcodingResult.data.canonicalName;
                            } else if (!transcodingResult.ok) {
                                throw new Error(transcodingResult.reason || 'Fallo desconocido en Worker');
                            }
                        } catch (e) { 
                            console.warn("[Manager] Fallback a Original por error en Transcode.", e); 
                        }
                    }

                    // FASE 2: UPLOAD (Un Solo Disparo - Evita Duplicados)
                    currentStep = "UPLOAD";
                    await this._updateItemStatus(item.id, 'UPLOADING', { name: processedName, uploadUrl: item.uploadUrl });

                    // Obtener bridge desde el vaultData ya extraído arriba
                    const bridge = vaultData?.bridge || null;

                    const uploadResult = await peristalticUploadService.upload(
                        processedBlob,
                        processedName,
                        item.metadata, // Usamos la metadata del ítem en lugar del argumento global
                        (p) => this._updateItemProgress(item.id, p, Math.round(p * processedBlob.size)),
                        item.metadata?.created_at,
                        item.uploadUrl ? { uploadUrl: item.uploadUrl, byteOffset: item.byteOffset || 0 } : null,
                        ({ uploadUrl, fileId }) => this._updateItemStatus(item.id, 'UPLOADING', { uploadUrl, fileId }),
                        ({ uploadUrl, fileId }) => {
                            console.log(`[Manager] Handshake OK: ${item.name}. Marcando Éxito Anticipado.`);
                            this._updateItemStatus(item.id, 'COMPLETED', { uploadUrl, fileId, progress: 1 });
                        },
                        bridge
                    );

                    if (uploadResult.status === 'SUCCESS') {
                        await this._updateItemStatus(item.id, 'COMPLETED', { progress: 1 });
                    } else {
                        // --- PRUEBA DE VERDAD DE LOS BYTES (AXIOMA OPTIMISTA) ---
                        const currentItem = this.queue.find(q => q.id === id);
                        const bytesRemaining = currentItem ? (processedBlob.size - (currentItem.byteOffset || 0)) : processedBlob.size;
                        const isFullySent = bytesRemaining < 2048; 
                        
                        if (isFullySent) {
                            console.log(`[Manager] ÉXITO OPTIMISTA: ${item.name} enviado.`);
                            await this._updateItemStatus(item.id, 'COMPLETED', { progress: 1 });
                        } else {
                            // En modo Montechico, NO reintentamos automáticamente para no duplicar.
                            throw new Error(uploadResult.error || "Falla de red (Requiere Reintento Manual)");
                        }
                    }

                } catch (err) {
                    const cleanMsg = err.message?.substring(0, 100);
                    // AXIOMA DE BARICHARA: Si ya es COMPLETED (por handshake), no retrocedemos a ERROR.
                    const checkAgain = this.queue.find(q => q.id === item.id);
                    if (checkAgain?.status !== 'COMPLETED') {
                        await this._updateItemStatus(item.id, 'ERROR', { errorMsg: `[${currentStep}] ${cleanMsg}` });
                    } else {
                        console.warn(`[Manager] Error tardío en red ignorado por Éxito Anticipado: ${item.name}`);
                    }
                }
            }
            await this._syncFromDB();
        }

        this.isRunning = false;
        this._notify();
    }

    async relinkFile(id, newFile) {
        // Restaurar el puntero físico en la bóveda de RAM
        const existingBridge = this.filesVault.get(id)?.bridge;
        this.filesVault.set(id, { blob: newFile, bridge: existingBridge });
        
        // Persistir en disco si es < 200MB (para redundancia futura)
        peristalticQueue.persistBlob(id, newFile);

        // Resetear estado a STAGED y limpiar error de I/O
        await this._updateItemStatus(id, 'STAGED', { errorMsg: null });
        
        // Opcional: Podríamos llamar a processQueue aquí, pero dejaremos 
        // que el usuario lo haga con el botón general de reintento/inicio tras vincular todos.
        console.log(`[Manager] Archivo ${id} re-vinculado exitosamente.`);
    }

    async retryFile(id) {
        await this._updateItemStatus(id, 'STAGED', { errorMsg: null, uploadUrl: null, byteOffset: 0, progress: 0 });
    }

    async _updateItemStatus(id, status, extra = {}) {
        this.queue = this.queue.map(q => q.id === id ? { ...q, status, ...extra } : q);
        this._notify();
        await peristalticQueue.updateStatus(id, status, extra);
    }

    async _updateItemProgress(id, progress, byteOffset) {
        this.queue = this.queue.map(q => q.id === id ? { ...q, progress, byteOffset } : q);
        this._notify();
        await peristalticQueue.updateProgress(id, progress, byteOffset);
    }
}

export const ingestManager = new PeristalticIngestManager();
