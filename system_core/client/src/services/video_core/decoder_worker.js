/**
 * =============================================================================
 * DecoderWorker (Web Worker)
 * RESPONSABILIDAD: Motor de Transmutación Pura (Axioma de Información Cero Mantenimiento).
 * AXIOMA: Este Worker NO parcea MP4s. Solo recibe información cruda (Offsets, Sizes)
 * pre-calculados por la Aduana (Identity Map) y extrae los bytes para WebCodecs.
 * =============================================================================
 */

// Mapa de recursos: vaultId -> { syncAccessHandle, identityMap, isConfigured, description }
const resources = new Map();
let videoDecoder = null;
let audioDecoder = null;

// Colas de metadatos para asociar la salida asíncrona de WebCodecs con su track/contexto
// timestamp -> [{ trackId, renderParams }]
const videoMetadataQueue = new Map();
const audioMetadataQueue = new Map();

const initDecoders = () => {
    if (!videoDecoder) {
        videoDecoder = new VideoDecoder({
            output: (frame) => {
                if (videoDecoder.discardUntilTimestamp !== undefined && frame.timestamp < videoDecoder.discardUntilTimestamp) {
                    frame.close();
                    return;
                }
                
                const metaList = videoMetadataQueue.get(frame.timestamp) || [];
                const meta = metaList.shift();
                if (metaList.length === 0) videoMetadataQueue.delete(frame.timestamp);

                self.postMessage({
                    type: 'FRAME_READY', 
                    data: { 
                        timestamp: frame.timestamp, 
                        frame: frame, 
                        renderParams: meta?.renderParams || {},
                        trackId: meta?.trackId
                    }
                }, [frame]);
            },
            error: (e) => console.error("[DecoderWorker] VideoDecoder Error:", e)
        });
    }

    if (!audioDecoder) {
        audioDecoder = new AudioDecoder({
            output: (data) => {
                // El audio es más continuo, pero también podemos filtrar si hay un seek violento
                if (audioDecoder.discardUntilTimestamp !== undefined && data.timestamp < audioDecoder.discardUntilTimestamp) {
                    data.close();
                    return;
                }

                const metaList = audioMetadataQueue.get(data.timestamp) || [];
                const meta = metaList.shift();
                if (metaList.length === 0) audioMetadataQueue.delete(data.timestamp);

                self.postMessage({
                    type: 'AUDIO_READY',
                    data: {
                        audioData: data,
                        trackId: meta?.trackId
                    }
                }, [data]);
            },
            error: (e) => console.error("[DecoderWorker] AudioDecoder Error:", e)
        });
    }
};

const setupResource = async (vaultId, fileHandle, identityMap) => {
    if (resources.has(vaultId)) return resources.get(vaultId);

    console.log(`[DecoderWorker] Configurando nuevo recurso ultra-rápido: ${vaultId}`);
    const syncAccessHandle = await fileHandle.createSyncAccessHandle();
    
    // Reconstruir el buffer de configuración (avcC) si existe
    let description = null;
    if (identityMap && identityMap.descriptionArray) {
        description = new Uint8Array(identityMap.descriptionArray);
    }
    
    let resourceData = { 
        syncAccessHandle, 
        identityMap, 
        isConfigured: !!identityMap,
        description,
        lastDecodedIndex: -1
    };

    resources.set(vaultId, resourceData);
    return resourceData;
};

self.onmessage = async (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'INIT': {
            if (data.fileHandle && data.vaultId) {
                try {
                    await setupResource(data.vaultId, data.fileHandle, data.identityMap);
                } catch (err) {
                    console.error("[DecoderWorker] INIT Error:", err);
                }
            }
            initDecoders();
            break;
        }

        case 'DECODE_FRAME': {
            if (!videoDecoder) initDecoders();
            const { timeMs, vaultId, decodeAudio } = data;
            
            const res = resources.get(vaultId);
            if (!res || !res.isConfigured || !res.identityMap) break;

            const map = res.identityMap;
            
            // --- DECIDIR SI DECODIFICAMOS AUDIO ---
            if (decodeAudio && map.audio) {
                decodeAudioSamples(res, timeMs, data.trackId);
            }

            // --- DECODIFICACIÓN DE VIDEO (Existente) ---
            const targetTimeUnits = (timeMs / 1000) * map.timescale;
            
            // --- Búsqueda Binaria Matemática O(log n) ---
            let low = 0;
            let high = map.samples.length - 1;
            let sampleIndex = 0;
            
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const s = map.samples[mid];
                
                // Si el target cae dentro del frame actual
                if (targetTimeUnits >= s.cts && targetTimeUnits < (s.cts + s.duration)) {
                    sampleIndex = mid;
                    break;
                } else if (s.cts > targetTimeUnits) {
                    high = mid - 1;
                } else {
                    low = mid + 1;
                    sampleIndex = mid; // Fallback al anterior más cercano
                }
            }

            // 1. AXIOMA DE INFORMACIÓN: No reprocesar el mismo frame físico si ya está decodificado.
            // Para mantener fluidez de UI cuando requestAnimationFrame se dispara sin que el tiempo haya avanzado lo suficiente al siguiente frame.
            if (sampleIndex === res.lastDecodedIndex && videoDecoder.state === 'configured') {
                break; 
            }

            // 2. Determinar si es reproducción continua o un salto (Seek)
            const distanceFrames = sampleIndex - res.lastDecodedIndex;
            const isBackward = distanceFrames < 0;
            const isLongJump = distanceFrames > 15; // Salto grande (p.ej > 0.5s); vale la pena retroceder a I-Frame.
            const isSeek = isBackward || isLongJump || res.lastDecodedIndex === -1;

            let startIndex = isSeek ? sampleIndex : Math.max(0, res.lastDecodedIndex + 1);

            if (isSeek) {
                // Retroceder hasta el KEYFRAME estricto anterior (is_sync)
                while (startIndex > 0 && !map.samples[startIndex].is_sync) {
                    startIndex--;
                }
            }

            try {
                const config = {
                    codec: map.codec,
                    codedWidth: map.width,
                    codedHeight: map.height,
                    description: res.description
                };
                
                let needsConfig = videoDecoder.state === 'unconfigured';
                if (!needsConfig && JSON.stringify(videoDecoder.lastConfig) !== JSON.stringify(config)) {
                    needsConfig = true;
                }

                if (needsConfig) {
                    videoDecoder.configure(config);
                    videoDecoder.lastConfig = config;
                    // Obligatorio que empiece en I-Frame tras configure()
                    while (startIndex > 0 && !map.samples[startIndex].is_sync) {
                        startIndex--;
                    }
                }

                // 3. Establecer la marca para que el Pipeline asíncrono dropee los frames antiguos
                if (isSeek) {
                    const tsMicrosec = Math.floor((1e6 * map.samples[sampleIndex].cts) / map.timescale);
                    videoDecoder.discardUntilTimestamp = tsMicrosec;
                }

                // 4. Inyección a WebCodecs. (Si es Playback = Delta 1) (Si es Seek = Burst desde I-Frame)
                for (let i = startIndex; i <= sampleIndex; i++) {
                    const s = map.samples[i];
                    if (!s) continue;

                    const buffer = new ArrayBuffer(s.size);
                    res.syncAccessHandle.read(buffer, { at: s.offset });

                    const chunkTS = Math.floor((1e6 * s.cts) / map.timescale);
                    const chunkDur = Math.floor((1e6 * s.duration) / map.timescale);

                    const chunk = new EncodedVideoChunk({
                        type: s.is_sync ? 'key' : 'delta',
                        timestamp: chunkTS,
                        duration: chunkDur,
                        data: buffer
                    });

                    if (i === sampleIndex) {
                        const list = videoMetadataQueue.get(chunkTS) || [];
                        list.push({ trackId: data.trackId, renderParams: data.renderParams });
                        videoMetadataQueue.set(chunkTS, list);
                    }

                    videoDecoder.decode(chunk);
                }

                res.lastDecodedIndex = sampleIndex;
            } catch (err) {
                console.warn("[DecoderWorker] Video Decode Warning:", err.message);
            }
            break;
        }

        case 'TERMINATE': {
            for (const r of resources.values()) {
                r.syncAccessHandle.close();
            }
            resources.clear();
            if (videoDecoder) {
                videoDecoder.close();
                videoDecoder = null;
            }
            if (audioDecoder) {
                audioDecoder.close();
                audioDecoder = null;
            }
            self.close();
            break;
        }
    }
};

/**
 * Lógica de decodificación de Audio de alto rendimiento.
 */
function decodeAudioSamples(res, timeMs, trackId) {
    const aMap = res.identityMap.audio;
    if (!aMap) return;

    // Configurar si es necesario
    const config = {
        codec: aMap.codec,
        numberOfChannels: aMap.channels,
        sampleRate: aMap.sampleRate
    };

    if (audioDecoder.state === 'unconfigured' || JSON.stringify(audioDecoder.lastConfig) !== JSON.stringify(config)) {
        audioDecoder.configure(config);
        audioDecoder.lastConfig = config;
    }

    const targetTimeUnits = (timeMs / 1000) * aMap.timescale;
    
    // Búsqueda del sample de audio
    let low = 0;
    let high = aMap.samples.length - 1;
    let idx = 0;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const s = aMap.samples[mid];
        if (targetTimeUnits >= s.cts && targetTimeUnits < (s.cts + s.duration)) {
            idx = mid;
            break;
        } else if (s.cts > targetTimeUnits) high = mid - 1;
        else { low = mid + 1; idx = mid; }
    }

    // El audio necesita un buffer mayor para evitar micro-cortes. 
    // Decodificamos el sample actual y unos cuantos más si están cerca.
    const lookAhead = 10; 
    const endIdx = Math.min(idx + lookAhead, aMap.samples.length - 1);

    for (let i = idx; i <= endIdx; i++) {
        const s = aMap.samples[i];
        if (!s || s.isDecoding) continue; // Evitar spam
        
        const buffer = new ArrayBuffer(s.size);
        res.syncAccessHandle.read(buffer, { at: s.offset });

        const chunkTS = Math.floor((1e6 * s.cts) / aMap.timescale);
        const chunk = new EncodedAudioChunk({
            type: 'key', // En AAC casi todo es key para el decoder
            timestamp: chunkTS,
            duration: Math.floor((1e6 * s.duration) / aMap.timescale),
            data: buffer
        });

        s.isDecoding = true; // Evitar re-decodificar mientras está en proceso

        // Registrar trackId para esta muestra
        const list = audioMetadataQueue.get(chunkTS) || [];
        list.push({ trackId });
        audioMetadataQueue.set(chunkTS, list);

        audioDecoder.decode(chunk);
    }
}
