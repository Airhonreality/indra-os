/**
 * =============================================================================
 * DecoderWorker (Web Worker)
 * RESPONSABILIDAD: Leer archivos desde OPFS (síncronamente) y decodificarlos
 * con `VideoDecoder` (WebCodecs API) sin bloquear la UI principal.
 * Este worker debe usarse con `createSyncAccessHandle` para max performance.
 * =============================================================================
 */

import MP4Box from 'mp4box';

let fileHandle = null;
let syncAccessHandle = null;
let decoder = null;
let mp4boxfile = null;
let isConfigured = false;
let videoTrack = null;

const initDecoder = () => {
    decoder = new VideoDecoder({
        output: (frame) => {
            self.postMessage({
                type: 'FRAME_READY',
                data: {
                    timestamp: frame.timestamp,
                    frame: frame
                }
            }, [frame]);
        },
        error: (e) => {
            console.error("[DecoderWorker] WebCodecs Error:", e);
        }
    });
};

const setupDemuxer = async () => {
    mp4boxfile = MP4Box.createFile();

    mp4boxfile.onReady = (info) => {
        console.log("[DecoderWorker] MP4 Headers leídos. Info:", info);
        videoTrack = info.videoTracks[0];

        if (videoTrack) {
            // LEY AXIOMÁTICA: Configurar WebCodecs con el codec exacto del demuxer
            decoder.configure({
                codec: videoTrack.codec,
                codedWidth: videoTrack.video.width,
                codedHeight: videoTrack.video.height,
                description: _createAvcDecoderConfigurationRecord(videoTrack)
            });
            isConfigured = true;

            // Le decimos al mp4box que extraiga los "samples" (frames) de esta pista
            mp4boxfile.setExtractionOptions(videoTrack.id);
            // mp4boxfile.start(); // NO HACEMOS START AUTOMÁTICO. Se controla vía seek.
        }
    };

    mp4boxfile.onSamples = (id, user, samples) => {
        // Ignoramos la extracción masiva en el editor para favorecer el seeking bajo demanda.
        // Pero guardamos la referencia para el decoder.decode posterior.
    };

    // Leemos el inicio del archivo OPFS para alimentar el Demuxer
    const fileSize = await syncAccessHandle.getSize();
    // Leemos hasta 5MB inicialmente para atrapar el moov box (cabeceras)
    // En produccion se haría un DataStream circular, pero esto valida la FASE 3
    const bytesToRead = Math.min(fileSize, 5 * 1024 * 1024);
    const buffer = new ArrayBuffer(bytesToRead);

    syncAccessHandle.read(buffer, { at: 0 });

    // Inyectamos el ArrayBuffer a mp4box para que dispare onReady
    buffer.fileStart = 0;
    mp4boxfile.appendBuffer(buffer);
};

// Helper interno para AVC (H.264) Codec Config 
const _createAvcDecoderConfigurationRecord = (track) => {
    // MP4Box js provee el Uint8Array descriptivo para decoders
    // necesario para H264 (NAL units)
    for (const box of track.mdia.minf.stbl.stsd.entries) {
        if (box.avcC) {
            const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN);
            box.avcC.write(stream);
            return new Uint8Array(stream.buffer, 8); // Skip the box header
        }
    }
    return null;
};

self.onmessage = async (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'INIT':
            console.log("[DecoderWorker] Inicializando decodificador con OPFS Handle");
            fileHandle = data.fileHandle;
            try {
                syncAccessHandle = await fileHandle.createSyncAccessHandle();
                initDecoder();
                await setupDemuxer();
                console.log(`[DecoderWorker] Acceso síncrono y Demuxer listos.`);
            } catch (error) {
                console.error("[DecoderWorker] Error inicialización:", error);
            }
            break;

        case 'DECODE_FRAME':
            if (!decoder || !isConfigured) return;
            const { timeMs } = data;

            // LEY DE PRECISIÓN: Localizar el sample más cercano al tiempo solicitado
            // MP4Box genera una tabla de tiempos indexada.
            const seekTimeS = timeMs / 1000;

            // Buscamos el sample en la pista de video
            const sampleInfo = mp4boxfile.getSampleByTime(videoTrack.id, seekTimeS);

            if (sampleInfo) {
                // Leemos los bytes del sample desde OPFS síncronamente
                const buffer = new ArrayBuffer(sampleInfo.size);
                syncAccessHandle.read(buffer, { at: sampleInfo.offset });

                const chunk = new EncodedVideoChunk({
                    type: sampleInfo.is_sync ? 'key' : 'delta',
                    timestamp: (1e6 * sampleInfo.cts) / sampleInfo.timescale,
                    duration: (1e6 * sampleInfo.duration) / sampleInfo.timescale,
                    data: buffer
                });

                decoder.decode(chunk);
            }
            break;

        case 'TERMINATE':
            if (syncAccessHandle) syncAccessHandle.close();
            if (decoder) {
                decoder.close();
                decoder = null;
            }
            self.close();
            break;
    }
};
