/**
 * =============================================================================
 * MIEOrchestrator: Director de la Aduana
 * ORIGEN: Necesidad de ingesta masiva desde AEE FormRunner y Satellite HUD.
 * RESOLUCIÓN: Orquestación multihilo de Workers especializados (Pool dinámico).
 * AXIOMA: Zero UI Coupling. Solo flujos de datos.
 * CUMPLIMIENTO SUH: Diseñado para ser invocado desde el HUD inyectado.
 * =============================================================================
 */

import { createMIEConfig } from './mie_config.js';

// --- UTILIDADES DE ADUANA DE MEMORIA (Persistencia Local) ---
const STORAGE_KEY = 'indra_mie_upload_history';

/**
 * Genera un fingerprint único de archivo basado en metadatos (Peso Cero).
 * No lee el contenido del archivo para ahorrar batería y recursos en móviles.
 */
export const getFileFingerprint = (file) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
};

/**
 * Recupera el historial de subidas desde el localStorage.
 */
export const getUploadHistory = () => {
    try {
        const history = localStorage.getItem(STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    } catch { return []; }
};

/**
 * Registra un fingerprint en el historial local una vez completada la subida.
 */
export const markAsUploaded = (fingerprint) => {
    try {
        const history = getUploadHistory();
        if (!history.includes(fingerprint)) {
            history.push(fingerprint);
            // Mantenemos un cache de 1000 registros para no saturar el localStorage
            if (history.length > 1000) history.shift(); 
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
    } catch (e) {
        console.warn("[MIEOrchestrator] Fallo al persistir en local storage", e);
    }
};

export class MIEOrchestrator {
    constructor({ onProgress, onComplete, onError } = {}) {
        this.onProgress = onProgress || (() => {});
        this.onComplete = onComplete || (() => {});
        this.onError = onError || (() => {});

        this.queue = [];
        this.results = [];
        this.jobs = new Map(); // id -> JobState
        this.activeWorkersCount = 0;
        this.maxWorkers = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);

        this.isProcessing = false;
        this.isDisposed = false;
    }

    /**
     * Encola archivos para su procesamiento.
     * @param {File[]} files 
     * @param {Object} config - MIEConfig (opcional)
     */
    enqueue(files, config = null) {
        if (this.isDisposed) return;

        const mieConfig = config || createMIEConfig('BALANCED');
        
        files.forEach(file => {
            const id = Math.random().toString(36).substring(2, 11);
            const type = this._detectType(file);
            const fingerprint = getFileFingerprint(file);
            
            const job = {
                id,
                file,
                fingerprint,
                type,
                config: mieConfig,
                status: 'PENDING',
                progress: 0,
                result: null,
                error: null,
                timestamp: Date.now()
            };

            this.queue.push(job);
            this.jobs.set(id, job);
        });

        this._notifyProgress();
    }

    start() {
        if (this.isProcessing || this.isDisposed) return;
        this.isProcessing = true;
        this._processNext();
    }

    async _processNext() {
        if (this.isDisposed || this.queue.length === 0 || this.activeWorkersCount >= this.maxWorkers) {
            if (this.queue.length === 0 && this.activeWorkersCount === 0 && this.isProcessing) {
                this.isProcessing = false;
                this.onComplete(this.results);
            }
            return;
        }

        const job = this.queue.shift();
        if (!job) return;

        job.status = 'PROCESSING';
        this.activeWorkersCount++;
        this._notifyProgress();

        try {
            await this._runJob(job);
        } catch (err) {
            console.error(`[MIEOrchestrator] Error en Job ${job.id}:`, err);
            job.status = 'ERROR';
            job.error = err.message;
        } finally {
            this.activeWorkersCount--;
            this._processNext();
        }
    }

    async _runJob(job) {
        return new Promise((resolve, reject) => {
            let workerUrl;
            
            if (job.type === 'video') {
                workerUrl = new URL('./video_ingest_worker.js', import.meta.url);
            } else if (job.type === 'audio') {
                workerUrl = new URL('./audio_ingest_worker.js', import.meta.url);
            } else if (job.type === 'image') {
                workerUrl = new URL('./image_ingest_worker.js', import.meta.url);
            } else {
                return reject(new Error(`Tipo de archivo no soportado: ${job.file.type}`));
            }

            const worker = new Worker(workerUrl, { type: 'module' });

            worker.onmessage = (e) => {
                const { type, data, error, progress } = e.data;

                if (type === 'PROGRESS') {
                    job.progress = progress;
                    this._notifyProgress();
                } else if (type === 'DONE') {
                    job.status = 'DONE';
                    job.progress = 1;
                    job.result = data;
                    this.results.push(data);
                    
                    // --- REFUERZO DE ADUANA DE MEMORIA ---
                    // Registramos en local storage para que el dispositivo no lo vuelva a procesar
                    markAsUploaded(job.fingerprint);
                    
                    worker.terminate();
                    this._notifyProgress();
                    resolve();
                } else if (type === 'ERROR') {
                    worker.terminate();
                    reject(new Error(error));
                }
            };

            worker.onerror = (err) => {
                worker.terminate();
                reject(err);
            };

            worker.postMessage({
                type: 'INGEST',
                file: job.file,
                config: job.config,
                id: job.id
            });
        });
    }

    _detectType(file) {
        const mime = file.type;
        if (mime.startsWith('video/')) return 'video';
        if (mime.startsWith('audio/')) return 'audio';
        if (mime.startsWith('image/')) return 'image';
        
        // Extensión fallback
        const ext = file.name.split('.').pop().toLowerCase();
        const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'];
        const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
        const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'svg'];

        if (videoExts.includes(ext)) return 'video';
        if (audioExts.includes(ext)) return 'audio';
        if (imageExts.includes(ext)) return 'image';
        
        return 'unknown';
    }

    _notifyProgress() {
        const totalJobs = this.jobs.size;
        const completedJobs = Array.from(this.jobs.values()).filter(j => j.status === 'DONE' || j.status === 'ERROR').length;
        
        // Calcular porcentaje global basado en el progreso de cada job
        let cumulativeProgress = 0;
        this.jobs.forEach(j => cumulativeProgress += j.progress);
        const globalPercent = totalJobs > 0 ? (cumulativeProgress / totalJobs) : 0;

        this.onProgress({
            activeJobs: this.activeWorkersCount,
            totalJobs,
            completedJobs,
            globalPercent,
            jobs: Array.from(this.jobs.values())
        });
    }

    dispose() {
        this.isDisposed = true;
        this.queue = [];
        this.jobs.clear();
        // Nota: Los workers activos deberían terminarse idealmente guardando sus Refs
    }
}
