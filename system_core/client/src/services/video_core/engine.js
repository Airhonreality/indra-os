/**
 * =============================================================================
 * SERVICIO AGNÓSTICO: VideoEngine
 * RESPONSABILIDAD: Motor central de orquestación de video (Axioma de Independencia).
 * Este módulo NO conoce React ni la arquitectura de UI de Indra. Solo procesa
 * JSONs de proyectos (ASTs), coordina workers y gestiona el estado temporal.
 * =============================================================================
 */

import { OPFSManager } from './opfs_manager.js';

export class VideoEngine {
    constructor() {
        this.project = null;
        this.currentTimeMs = 0;
        this.isPlaying = false;

        // Frecuencia de actualización (ej: 30 fps ≈ 33.3ms)
        this.frameDurationMs = 1000 / 30;

        // Referencias a subsistemas
        this.opfsManager = new OPFSManager();
        this.decoderWorker = null;
        this.rendererWorker = null;

        // Callbacks para la UI
        this.onTimeUpdate = () => { };
        this.onStateChange = () => { };

        this._initWorker();
    }

    _initWorker() {
        // Asumiendo que estamos usando Vite, la instanciación de web workers se hace así
        this.decoderWorker = new Worker(new URL('./decoder_worker.js', import.meta.url), { type: 'module' });
        this.rendererWorker = new Worker(new URL('./renderer_worker.js', import.meta.url), { type: 'module' });

        this.decoderWorker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'FRAME_READY') {
                // LEY DE INDEPENDENCIA: El engine no toca el frame, solo lo enruta
                if (this.rendererWorker && data.frame) {
                    this.rendererWorker.postMessage({
                        type: 'RENDER_FRAME',
                        data: { frame: data.frame }
                    }, [data.frame]); // Transferimos la propiedad del VideoFrame (Zero-Copy)
                }
            }
        };
    }

    /**
     * Puente desde la Interfaz de Usuario para conectar el OffscreenCanvas
     */
    initRenderer(canvasElement) {
        if (!canvasElement) return;

        // Transferir el control del canvas DOM al Worker (Axioma: Zero UI Blocking)
        const offscreen = canvasElement.transferControlToOffscreen();
        this.rendererWorker.postMessage({
            type: 'INIT',
            data: { canvas: offscreen }
        }, [offscreen]);

        console.log("[VideoEngine] Control de Canvas transferido al RendererWorker");
    }

    /**
     * Carga o recarga la definición del proyecto.
     * @param {Object} projectPayload - El "payload" del Árbol Estructural (VIDEO_PROJECT).
     */
    hydrateProject(projectPayload) {
        console.log("[VideoEngine] Hidratando proyecto...", projectPayload);
        this.project = projectPayload;

        if (this.project?.settings?.fps) {
            this.frameDurationMs = 1000 / this.project.settings.fps;
        }

        // Aquí se desencadenaría la solicitud de archivos al OPFS Manager
        this._analyzeDependencies();
        this._notifyStateChange();
    }

    /**
     * Analiza qué archivos del Vault se necesitan en la OPFS.
     */
    async _analyzeDependencies() {
        if (!this.project?.timeline?.tracks) return;

        const neededVaultIds = new Set();

        this.project.timeline.tracks.forEach(track => {
            track.clips?.forEach(clip => {
                if (clip.vault_id) {
                    neededVaultIds.add(clip.vault_id);
                }
            });
        });

        console.log(`[VideoEngine] Dependencias requeridas: ${neededVaultIds.size} archivos del Vault`);

        await this.opfsManager.init();

        for (const vaultId of neededVaultIds) {
            const isCached = await this.opfsManager.isCached(vaultId);
            if (!isCached) {
                console.warn(`[VideoEngine] Archivo ${vaultId} no está cacheado en OPFS. Debería descargarse del Vault.`);
                // TODO: Lógica para descargar archivo del Vault e inyectarlo en opfsManager.cacheVaultFile
            } else {
                console.log(`[VideoEngine] Archivo ${vaultId} verificado en caché.`);
                // Pasarle el fileHandle al Worker asumiendo que es el archivo principal por ahora.
                const handle = await this.opfsManager.getFileHandle(vaultId);
                if (handle && this.decoderWorker) {
                    this.decoderWorker.postMessage({
                        type: 'INIT',
                        data: { fileHandle: handle }
                    });
                }
            }
        }
    }

    /**
     * Control de Reproducción: Play
     */
    play() {
        if (!this.project || this.isPlaying) return;
        this.isPlaying = true;
        this._notifyStateChange();
        this._tick();
    }

    /**
     * Control de Reproducción: Pause
     */
    pause() {
        this.isPlaying = false;
        this._notifyStateChange();
    }

    /**
     * Control de Reproducción: Seek
     * Mueve el cabezal de reproducción a un punto específico en milisegundos.
     */
    seek(timeMs) {
        if (!this.project) return;
        const maxTime = this.project.settings?.duration_ms || 0;

        this.currentTimeMs = Math.max(0, Math.min(timeMs, maxTime));
        this.onTimeUpdate(this.currentTimeMs);

        // Pedir al renderizador que dibuje el frame exacto de este tiempo.
        if (this.decoderWorker) {
            this.decoderWorker.postMessage({
                type: 'DECODE_FRAME',
                data: { timeMs: this.currentTimeMs }
            });
        }
    }

    /**
     * Bucle principal de reproducción
     */
    _tick() {
        if (!this.isPlaying) return;

        const maxTime = this.project.settings?.duration_ms || 0;

        if (this.currentTimeMs >= maxTime) {
            this.pause();
            return;
        }

        this.currentTimeMs += this.frameDurationMs;
        this.onTimeUpdate(this.currentTimeMs);

        // Pedir render de este frame
        if (this.decoderWorker) {
            this.decoderWorker.postMessage({
                type: 'DECODE_FRAME',
                data: { timeMs: this.currentTimeMs }
            });
        }

        // Programar siguiente ciclo (requestAnimationFrame asegura sincronía con monitor)
        requestAnimationFrame(() => this._tick());
    }

    /**
     * Establece callbacks para que la UI reaccione a cambios internos (Puente).
     */
    setCallbacks({ onTimeUpdate, onStateChange }) {
        if (onTimeUpdate) this.onTimeUpdate = onTimeUpdate;
        if (onStateChange) this.onStateChange = onStateChange;
    }

    _notifyStateChange() {
        this.onStateChange({
            isPlaying: this.isPlaying,
            isReady: !!this.project,
            duration: this.project?.settings?.duration_ms || 0
        });
    }

    /**
     * Desecha recursos al cerrar (Ley de Limpieza).
     */
    dispose() {
        this.pause();
        this.project = null;
        // Terminar workers, vaciar colas, etc.
    }
}
