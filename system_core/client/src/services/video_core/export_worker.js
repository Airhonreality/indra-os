/**
 * =============================================================================
 * ExportWorker (Web Worker)
 * RESPONSABILIDAD: Motor de Renderizado Determínistico con Datos Reales.
 * AXIOMA: Salida Sincera. Exportación Bit-Perfect.
 * =============================================================================
 */

import * as Mp4Muxer from 'mp4-muxer';
import { ParameterAutomator } from './parameter_automator.js';
import { TimeTransformer } from './TimeTransformer.js';

let muxer = null;
let videoEncoder = null;
let audioEncoder = null;
let canvas = null;
let ctx = null;

// Gestor de decodificadores para el export (Axioma de Eficiencia)
class ExportDecoder {
    constructor(vaultId, fileHandle, identityMap) {
        this.vaultId = vaultId;
        this.fileHandle = fileHandle;
        this.identityMap = identityMap;
        this.decoder = null;
        this.isChunkRequested = false;
        this.lastDecodedFrame = null;
    }

    async init() {
        this.decoder = new VideoDecoder({
            output: (frame) => {
                if (this.lastDecodedFrame) this.lastDecodedFrame.close();
                this.lastDecodedFrame = frame;
            },
            error: (e) => console.error(`[ExportDecoder] Error en ${this.vaultId}:`, e)
        });

        this.decoder.configure({
            codec: 'avc1.42E01E', // Codec de compatibilidad amplia
            optimizeForLatency: false
        });
    }

    async getFrameAt(timeMs) {
        if (!this.decoder) await this.init();

        // Calcular el sample (mismo algoritmo que en decoder_worker)
        const samples = this.identityMap.samples;
        let bestSample = samples[0];
        for (const s of samples) {
            if (s.cts <= timeMs) bestSample = s;
            else break;
        }

        // Leer el archivo y decodificar
        const file = await this.fileHandle.getFile();
        const chunk = new EncodedVideoChunk({
            type: bestSample.type === 'key' ? 'key' : 'delta',
            timestamp: bestSample.cts * 1000,
            duration: bestSample.duration * 1000,
            data: await file.slice(bestSample.pos, bestSample.pos + bestSample.size).arrayBuffer()
        });

        this.decoder.decode(chunk);
        await this.decoder.flush();

        return this.lastDecodedFrame;
    }

    close() {
        if (this.decoder) this.decoder.close();
        if (this.lastDecodedFrame) this.lastDecodedFrame.close();
    }
}

const decoders = new Map(); // vaultId -> ExportDecoder

self.onmessage = async (e) => {
    const { type, data } = e.data;
    if (type === 'START_EXPORT') {
        const { project, vaultInfo } = data;
        
        // Inicializar decodificadores
        for (const info of vaultInfo) {
            decoders.set(info.vaultId, new ExportDecoder(info.vaultId, info.fileHandle, info.identityMap));
        }

        await startExport(project);
    }
};

async function startExport(project) {
    console.log("[ExportWorker] Iniciando motor de renderizado industrial...");

    const fps = project.settings?.fps || 30;
    const width = project.settings?.width || 1920;
    const height = project.settings?.height || 1080;
    const durationMs = project.settings?.duration_ms || 0;
    const frameDurationMs = 1000 / fps;

    muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width, height },
        audio: { codec: 'aac', numberOfChannels: 1, sampleRate: 44100 },
        fastStart: 'in-memory'
    });

    videoEncoder = new VideoEncoder({
        output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
        error: (e) => console.error("[ExportEncoder] Error:", e)
    });

    videoEncoder.configure({
        codec: 'avc1.4d002a',
        width, height,
        bitrate: 10_000_000,
        framerate: fps
    });

    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d');

    // Inicializar Automatizadores y Transformadores de exportación
    const automators = new Map();
    const timeTransformers = new Map();

    project.timeline.lanes.forEach(lane => {
        lane.clips.forEach(clip => {
            ['opacity', 'position_x', 'scale'].forEach(p => {
                if (clip.automation?.[p]) {
                    const am = new ParameterAutomator();
                    am.deserialize(clip.automation[p]);
                    automators.set(`${clip.id}_${p}`, am);
                }
            });

            // Motor de Tiempo Determínistico
            const tt = new TimeTransformer();
            if (clip.automation?.speed) {
                tt.setKeyframes(clip.automation.speed);
            }
            timeTransformers.set(clip.id, tt);
        });
    });

    // Bucle de Renderizado Determínistico
    for (let timeMs = 0; timeMs < durationMs; timeMs += frameDurationMs) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        for (const lane of project.timeline.lanes) {
            const clip = lane.clips.find(c => timeMs >= c.start_at_ms && timeMs < (c.start_at_ms + c.duration_ms));
            if (!clip) continue;

            const decoder = decoders.get(clip.vault_id);
            if (!decoder) continue;

            const elapsedMs = timeMs - clip.start_at_ms;
            const transformedElapsed = timeTransformers.get(clip.id)?.getTransformedTime(elapsedMs) ?? elapsedMs;
            const localTimeMs = transformedElapsed + (clip.offset_ms || 0);
            const frame = await decoder.getFrameAt(localTimeMs);

            if (frame) {
                // Aplicar Automatizaciones reales
                const opacity = automators.get(`${clip.id}_opacity`)?.getValueAt(localTimeMs) ?? 1.0;
                const posX = automators.get(`${clip.id}_position_x`)?.getValueAt(localTimeMs) ?? 0;
                const scale = automators.get(`${clip.id}_scale`)?.getValueAt(localTimeMs) ?? 1.0;

                ctx.globalAlpha = opacity;
                ctx.save();
                ctx.translate(width / 2 + posX, height / 2);
                ctx.scale(scale, scale);
                ctx.drawImage(frame, -width / 2, -height / 2, width, height);
                ctx.restore();
            }
        }

        const encodedFrame = new VideoFrame(canvas, { timestamp: timeMs * 1000 });
        videoEncoder.encode(encodedFrame, { keyFrame: (timeMs % 2000 === 0) });
        encodedFrame.close();

        if (Math.floor(timeMs) % 1000 === 0) {
            self.postMessage({ type: 'PROGRESS', progress: timeMs / durationMs });
        }
    }

    await videoEncoder.flush();
    muxer.finalize();
    
    // Cleanup
    decoders.forEach(d => d.close());

    self.postMessage({ 
        type: 'EXPORT_COMPLETE', 
        blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }) 
    });
}
