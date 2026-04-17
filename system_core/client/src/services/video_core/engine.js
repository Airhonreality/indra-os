/**
 * =============================================================================
 * SERVICIO AGNÓSTICO: VideoEngine
 * RESPONSABILIDAD: Motor central de orquestación de video (Axioma de Independencia).
 * Este módulo NO conoce React ni la arquitectura de UI de Indra. Solo procesa
 * JSONs de proyectos (ASTs), coordina workers y gestiona el estado temporal.
 * =============================================================================
 */

import { OPFSManager } from './opfs_manager.js';
import { ParameterAutomator } from './parameter_automator.js';
import { TimeTransformer } from './TimeTransformer.js';

export class VideoEngine {
    constructor() {
        this.project = null;
        this.isPlaying = false;
        this.currentTimeMs = 0;

        // --- SISTEMA DE COMPOSICIÓN (Fase III) ---
        this.pendingFrames = new Map(); // timestamp -> Array de frames de capas

        // Frecuencia de actualización (ej: 30 fps ≈ 33.3ms)
        this.frameDurationMs = 1000 / 30;

        // Referencias a subsistemas
        this.opfsManager = new OPFSManager();
        this.decoderWorker = null;
        this.rendererWorker = null;
        this.initializedVaultIds = new Set();

        // --- SISTEMA DE AUTOMATIZACIÓN (Fase VI) ---
        this.automators = new Map(); // id -> ParameterAutomator (clip o track)
        this.timeTransformers = new Map(); // clipId -> TimeTransformer

        // Callbacks para la UI
        this.onTimeUpdate = () => { };
        this.onStateChange = () => { };

        // --- SISTEMA DE AUDIO (Fase II) ---
        this.audioCtx = null;
        this.audioBufferQueue = []; // Cola de AudioData para el grafo de Web Audio
        this.isAudioStarted = false;

        this.exportWorker = null;
        this.audioWorkletNode = null;

        this._initWorker();
    }

    _initWorker() {
        // Asumiendo que estamos usando Vite, la instanciación de web workers se hace así
        this.decoderWorker = new Worker(new URL('./decoder_worker.js', import.meta.url), { type: 'module' });
        this.rendererWorker = new Worker(new URL('./renderer_worker.js', import.meta.url), { type: 'module' });

        this.decoderWorker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'FRAME_READY') {
                this._handleVideoFrame(data);
            } else if (type === 'AUDIO_READY') {
                this._handleAudioData(data.audioData, data.trackId);
            }
        };
    }

    /**
     * Puente desde la Interfaz de Usuario para conectar el OffscreenCanvas
     */
    initRenderer(canvasElement) {
        if (!canvasElement) return;

        // Transferir el control del canvas DOM al Worker (Axioma: Zero UI Blocking)
        let offscreen;
        if (canvasElement.transferControlToOffscreen) {
            offscreen = canvasElement.transferControlToOffscreen();
            this.rendererWorker.postMessage({
                type: 'INIT',
                data: { canvas: offscreen }
            }, [offscreen]);
            console.log("[VideoEngine] Control de Canvas transferido al RendererWorker");
            this.canvasInitialized = true;
        } else {
            console.warn("[VideoEngine] transferControlToOffscreen no soportado en este browser.");
        }
    }

    hydrateProject(projectPayload) {
        const migrated = this._migrateAST(projectPayload);
        console.log("[VideoEngine] Hidratando proyecto v" + (migrated.version || 1), migrated);
        this.project = migrated;

        if (this.project?.settings?.fps) {
            this.frameDurationMs = 1000 / this.project.settings.fps;
        }

        // Inicializar automadores y transformadores de tiempo (Axioma de Fluidez)
        this.automators.clear();
        this.timeTransformers.clear();

        this.project.timeline?.lanes?.forEach(lane => {
            lane.clips?.forEach(clip => {
                const params = ['opacity', 'volume', 'pan', 'speed', 'position_x', 'position_y', 'scale'];
                params.forEach(p => {
                    if (clip.automation?.[p]) {
                        const automator = new ParameterAutomator();
                        automator.deserialize(clip.automation[p]);
                        this.automators.set(clip.id + '_' + p, automator);
                        
                        // Si es el parámetro de velocidad, inicializar el TimeTransformer
                        if (p === 'speed') {
                            const transformer = new TimeTransformer();
                            transformer.setKeyframes(clip.automation[p]);
                            this.timeTransformers.set(clip.id, transformer);
                        }
                    }
                });
            });
        });

        // Asegurar que cada clip tenga al menos un TimeTransformer básico si no tiene keyframes de velocidad
        this.project.timeline?.lanes?.forEach(lane => {
            lane.clips?.forEach(clip => {
                if (!this.timeTransformers.has(clip.id)) {
                    this.timeTransformers.set(clip.id, new TimeTransformer());
                }
            });
        });

        // Aquí se desencadenaría la solicitud de archivos al OPFS Manager
        this._analyzeDependencies();
        this._notifyStateChange();
    }

    /**
     * LEY DE ADUANA: Migración de datos heredados al canon actual.
     */
    _migrateAST(payload) {
        if (!payload) return { version: 3, timeline: { lanes: [] }, settings: { duration_ms: 0, fps: 30 } };
        
        const migrated = JSON.parse(JSON.stringify(payload));
        if (!migrated.version) migrated.version = 1;

        // Migración v1/v2 -> v3: Transmutación a Lanes Agnósticos
        if (migrated.version < 3) {
             const legacyTracks = migrated.timeline?.tracks || [];
             migrated.timeline.lanes = legacyTracks.map(t => ({
                 id: t.id,
                 activeDimension: t.type === 'audio' ? 'sound' : 'visual',
                 clips: t.clips || []
             }));
             delete migrated.timeline.tracks;
             migrated.version = 3;
        }
        
        return migrated;
    }

    /**
     * Analiza qué archivos del Vault se necesitan en la OPFS.
     */
    async _analyzeDependencies() {
        if (!this.project?.timeline?.lanes) return;

        const neededVaultIds = new Set();

        this.project.timeline.lanes.forEach(lane => {
            lane.clips?.forEach(clip => {
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
                console.warn(`[VideoEngine] Archivo ${vaultId} no está cacheado en OPFS.`);
            } else {
                // Solo inicializar en el worker si no se ha hecho antes para este vaultId
                if (!this.initializedVaultIds.has(vaultId)) {
                    const handle = await this.opfsManager.getFileHandle(vaultId);
                    const identityMap = await this.opfsManager.getIdentityMap(vaultId);

                    if (handle && this.decoderWorker) {
                        this.decoderWorker.postMessage({
                            type: 'INIT',
                            data: { 
                                fileHandle: handle,
                                vaultId: vaultId,
                                identityMap: identityMap
                            }
                        });
                        this.initializedVaultIds.add(vaultId);
                        console.log(`[VideoEngine] Recurso ${vaultId} enviado al DecoderWorker con IdentityMap.`);
                    }
                }
            }
        }
    }

    /**
     * Control de Reproducción: Play
     */
    async play() {
        if (!this.project || this.isPlaying) return;
        
        // El AudioContext requiere interacción (Policy)
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            try {
                await this.audioCtx.audioWorklet.addModule(new URL('./audio_worklet.js', import.meta.url));
                this.audioWorkletNode = new AudioWorkletNode(this.audioCtx, 'audio-processor-worklet');
                this.audioWorkletNode.connect(this.audioCtx.destination);
                console.log("[VideoEngine] AudioWorklet inicializado.");
            } catch (err) {
                console.error("[VideoEngine] Fallo al cargar AudioWorklet, cayendo a modo legado:", err);
            }
        }
        
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        this.isPlaying = true;
        this._lastRealTime = performance.now();
        this._notifyStateChange();
        this._tick();
    }

    /**
     * Control de Reproducción: Pause
     */
    pause() {
        this.isPlaying = false;
        this._lastRealTime = null;
        this._notifyStateChange();
    }

    /**
     * Control de Reproducción: Seek
     */
    seek(timeMs) {
        if (!this.project) return;
        const maxTime = this.project.settings?.duration_ms || 0;

        this.currentTimeMs = Math.max(0, Math.min(timeMs, maxTime));
        this.onTimeUpdate(this.currentTimeMs);

        this._requestFrameForTime(this.currentTimeMs);
    }

    _requestFrameForTime(timeMs) {
            if (!this.project || !this.decoderWorker) return;

            // LEY DE SINCERIDAD Y RENDIMIENTO: No hacer peticiones al Worker si el tiempo no ha avanzado 
            // lo suficiente como para cruzar el umbral del siguiente Frame (Evitar spamming del Main Thread).
            const isPlaying = this.isPlaying;
            if (isPlaying && this._lastRequestedTime !== undefined) {
                 const frameDurMs = this.frameDurationMs || 33.3;
                 if (Math.abs(timeMs - this._lastRequestedTime) < frameDurMs * 0.9) return;
            }
            this._lastRequestedTime = timeMs;

            // LEY DE SINCERIDAD: Identificar todos los clips activos en los LANES
            const activeClips = [];
            this.project.timeline?.lanes?.forEach(lane => {
                const clip = lane.clips?.find(c => 
                    timeMs >= c.start_at_ms && timeMs <= (c.start_at_ms + c.duration_ms)
                );
                if (clip) {
                    activeClips.push({ clip, laneId: lane.id });
                }
            });

            if (activeClips.length > 0) {
                 const frameId = Math.floor(timeMs);
                 if (!this.pendingFrames.has(frameId)) {
                     this.pendingFrames.set(frameId, { 
                         expected: activeClips.length, // Cada lane activo es una capa potencial
                         received: [] 
                     });
                 }

                activeClips.forEach(({ clip, laneId }) => {
                    const localTimelineMs = (timeMs - clip.start_at_ms) + (clip.offset_ms || 0);

                    // LEY DE TIEMPO NO LINEAL: Transformar TimelineTime en MediaTime
                    const transformer = this.timeTransformers.get(clip.id);
                    let localMediaTimeMs = transformer ? transformer.getMediaTimeAt(localTimelineMs) : localTimelineMs;

                    // APLICAR REVERSE (Axioma de Inversión)
                    const isReverse = this.automators.get(clip.id + '_reverse')?.getValueAt(localTimelineMs) > 0.5;
                    localMediaTimeMs = transformer.applyReverse(localMediaTimeMs, isReverse, clip.duration_ms);

                    // Calcular valores de automatización al vuelo (High Frequency)
                    const opacity = this.automators.get(clip.id + '_opacity')?.getValueAt(localTimelineMs) ?? 1.0;
                    const posX = this.automators.get(clip.id + '_position_x')?.getValueAt(localTimelineMs) ?? 0;
                    const scale = this.automators.get(clip.id + '_scale')?.getValueAt(localTimelineMs) ?? 1.0;

                    this.decoderWorker.postMessage({
                        type: 'DECODE_FRAME',
                        data: { 
                            timeMs: localMediaTimeMs, // Ahora es el tiempo real del medio
                            vaultId: clip.vault_id,
                            decodeAudio: true, 
                            trackId: laneId,
                            renderParams: {
                                opacity,
                                position_x: posX,
                                scale
                            }
                        }
                    });
                });
            }
        }

    /**
     * Bucle principal de reproducción
     */
    _tick() {
        if (!this.isPlaying) return;

        const now = performance.now();
        const delta = now - (this._lastRealTime || now);
        this._lastRealTime = now;

        const maxTime = this.project.settings?.duration_ms || 0;

        if (this.currentTimeMs >= maxTime) {
            this.pause();
            return;
        }

        // LEY DE SINCERIDAD: Avanzar la aguja basado en el hardware master-clock, compensando latencia.
        const latenciaAudio = (this.audioCtx?.outputLatency || 0) * 1000;
        this.currentTimeMs += delta;

        // El tiempo visual que solicitamos al decodificador debe estar adelantado 
        // a la latencia de salida para que el impacto visual coincida con el auditivo.
        const tiempoVisualBusqueda = this.currentTimeMs + latenciaAudio;

        if (this.currentTimeMs > maxTime) {
            this.currentTimeMs = maxTime;
        }

        this.onTimeUpdate(this.currentTimeMs);
        this._requestFrameForTime(tiempoVisualBusqueda);

        // Programar siguiente ciclo sincronizado al monitor
        requestAnimationFrame(() => this._tick());
    }

    /**
     * Motor de Exportación Determínistica (Fase V)
     */
    async exportVideo() {
        return new Promise((resolve, reject) => {
            (async () => {
                if (!this.project) return reject("No hay proyecto cargado");

                console.log("[VideoEngine] Lanzando motor de exportación...");
                this.exportWorker = new Worker(new URL('./export_worker.js', import.meta.url), { type: 'module' });

                this.exportWorker.onmessage = (e) => {
                    const { type, blob, progress, error } = e.data;
                    if (type === 'EXPORT_COMPLETE') {
                        console.log("[VideoEngine] Exportación finalizada exitosamente.");
                        this.exportWorker.terminate();
                        resolve(blob);
                    } else if (type === 'PROGRESS') {
                        console.log(`[VideoEngine] Progreso de Exportación: ${(progress * 100).toFixed(1)}%`);
                    } else if (type === 'ERROR') {
                        reject(error);
                        this.exportWorker.terminate();
                    }
                };

                try {
                    // Recolectar handles de archivos (AXIOMA DE PREPARACIÓN)
                    const vaultInfoPromises = Array.from(this.initializedVaultIds).map(async vid => {
                        const handle = await this.opfsManager.getFileHandle(vid);
                        return {
                            vaultId: vid,
                            fileHandle: handle,
                            identityMap: this._identities?.get(vid)
                        };
                    });

                    const vaultInfo = await Promise.all(vaultInfoPromises);

                    this.exportWorker.postMessage({
                        type: 'START_EXPORT',
                        data: {
                            project: this.project,
                            vaultInfo: vaultInfo
                        }
                    });
                } catch (err) {
                    reject(err);
                }
            })();
        });
    }

    /**
     * Sincroniza frames de diferentes capas antes de enviar al Renderer
     */
    _handleVideoFrame(data) {
        if (!this.rendererWorker) {
            data.frame.close();
            return;
        }

        // Encontrar a qué "Compositor Frame" pertenece este timestamp
        // Dado que el decoder puede tener ligeras derivas de TS decodificado, buscamos el slot pendiente
        const tsMs = data.timestamp / 1000;
        let bestFrameId = null;
        for (const frameId of this.pendingFrames.keys()) {
            if (Math.abs(frameId - tsMs) < 20) { // Tolerancia de 20ms
                bestFrameId = frameId;
                break;
            }
        }

        if (bestFrameId !== null) {
            const slot = this.pendingFrames.get(bestFrameId);
            slot.received.push({ 
                frame: data.frame,
                renderParams: data.renderParams // Trasmitir parámetros de renderizado (automatización)
            });

            if (slot.received.length >= slot.expected) {
                // ¡Todas las capas listas! Enviar composición
                const framesToTransfer = slot.received.map(r => r.frame);
                this.rendererWorker.postMessage({
                    type: 'RENDER_FRAME',
                    data: { frames: slot.received }
                }, framesToTransfer);
                
                this.pendingFrames.delete(bestFrameId);
                
                // Limpieza de slots antiguos (Blindaje Anti-Fugas VRAM)
                // Usamos una ventana de 15 frames para evitar acumulación excesiva.
                for (const oldId of this.pendingFrames.keys()) {
                    if (oldId < bestFrameId - 15) {
                        const oldSlot = this.pendingFrames.get(oldId);
                        oldSlot.received.forEach(r => r.frame.close());
                        this.pendingFrames.delete(oldId);
                    }
                }
            }
        } else {
            // Frame huérfano o de pre-decodificación, enviar directo como capa única
            this.rendererWorker.postMessage({
                type: 'RENDER_FRAME',
                data: { 
                    frames: [{ 
                        frame: data.frame,
                        renderParams: data.renderParams
                    }] 
                }
            }, [data.frame]);
        }
    }

    /**
     * Procesa datos de audio recibidos del Decoder
     */
    _handleAudioData(audioData, trackId) {
        if (this.audioWorkletNode && this.isPlaying) {
             const buffer = new Float32Array(audioData.numberOfFrames);
             audioData.copyTo(buffer, { planeIndex: 0 }); // Copiar canal L (mono)
             
             // Calcular volumen y pan actual para esta pista buscando el clip activo
             const lane = this.project?.timeline?.lanes.find(l => l.id === trackId);
             const clip = lane?.clips.find(c => this.currentTimeMs >= c.start_at_ms && this.currentTimeMs <= (c.start_at_ms + c.duration_ms));
             const localTimeMs = clip ? (this.currentTimeMs - clip.start_at_ms) + (clip.offset_ms || 0) : 0;
             
             const volume = clip ? (this.automators.get(clip.id + '_volume')?.getValueAt(localTimeMs) ?? 1.0) : 1.0;
             const pan = clip ? (this.automators.get(clip.id + '_pan')?.getValueAt(localTimeMs) ?? 0) : 0;
             const speed = clip ? (this.automators.get(clip.id + '_speed')?.getValueAt(localTimeMs) ?? 1.0) : 1.0;

             this.audioWorkletNode.port.postMessage({
                 type: 'PUSH_BUFFER',
                 trackId: trackId,
                 samples: buffer,
                 volume: volume,
                 pan: pan,
                 speed: speed
             });

             audioData.close();
        } else {
            audioData.close();
        }
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
            duration: this.project?.settings?.duration_ms || 0,
            project: this.project
        });
    }

    /**
     * Desecha recursos al cerrar (Ley de Limpieza).
     */
    dispose() {
        this.pause();
        this.project = null;
        if (this.audioCtx) this.audioCtx.close();
        if (this.decoderWorker) this.decoderWorker.terminate();
        if (this.rendererWorker) this.rendererWorker.terminate();
    }
}
