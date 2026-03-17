/**
 * =============================================================================
 * AudioProcessorWorklet (AudioWorkletProcessor)
 * RESPONSABILIDAD: Procesamiento de audio con soporte de Paneo y TSM.
 * AXIOMA: Reproducción Sincera y Espacial.
 * =============================================================================
 */

class AudioProcessorWorklet extends AudioWorkletProcessor {
    constructor() {
        super();
        this.tracks = new Map(); // trackId -> track state
        
        this.port.onmessage = (e) => {
            if (e.data.type === 'PUSH_BUFFER') {
                const { trackId, samples, volume, pan, speed } = e.data;
                
                if (!this.tracks.has(trackId)) {
                    this.tracks.set(trackId, { 
                        buffer: new Float32Array(48000 * 2), // Buffer circular de 2 segundos (48kHz)
                        writePtr: 0,
                        readPtr: 0,
                        available: 0,
                        volume: 1.0, 
                        pan: 0.0,
                        speed: 1.0
                    });
                }
                
                const t = this.tracks.get(trackId);
                // Copiar al buffer circular
                for (let i = 0; i < samples.length; i++) {
                    t.buffer[t.writePtr] = samples[i];
                    t.writePtr = (t.writePtr + 1) % t.buffer.length;
                }
                t.available += samples.length;
                t.volume = volume ?? t.volume;
                t.pan = pan ?? t.pan;
                t.speed = speed ?? t.speed;
            }
        };
    }

    /**
     * LEY DE PANORAMA
     */
    applyPanning(sample, pan, channel) {
        const p = (pan + 1) / 2;
        return channel === 0 ? sample * Math.cos(p * Math.PI / 2) : sample * Math.sin(p * Math.PI / 2);
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || output.length === 0) return true;

        const numChannels = output.length;
        const numSamples = output[0].length;

        // SINCERIDAD: Limpiar solo los canales existentes
        for (let ch = 0; ch < numChannels; ch++) {
            output[ch].fill(0);
        }

        for (const [trackId, t] of this.tracks) {
            // Verificar si hay suficientes muestras para la velocidad actual
            if (t.available < numSamples * t.speed) continue;

            const gain = t.volume;
            const pan = t.pan;
            const speed = t.speed;

            for (let i = 0; i < numSamples; i++) {
                // RESAMPLING LINEAL (Base para TSM industrial)
                const floorIdx = Math.floor(t.readPtr);
                const fract = t.readPtr - floorIdx;
                const nextIdx = (floorIdx + 1) % t.buffer.length;
                
                const s1 = t.buffer[floorIdx];
                const s2 = t.buffer[nextIdx];
                const s = (s1 + (s2 - s1) * fract) * gain;

                // DISTRIBUCIÓN ESPACIAL (Axioma de Panorámica)
                for (let ch = 0; ch < numChannels; ch++) {
                    output[ch][i] += this.applyPanning(s, pan, ch % 2);
                }

                // Avanzar puntero de lectura proporcional a la velocidad
                t.readPtr = (t.readPtr + speed) % t.buffer.length;
                t.available -= speed;
            }
            
            // Mantener el puntero en enteros para el siguiente frame
            t.readPtr = Math.floor(t.readPtr);
            t.available = Math.max(0, t.available);
        }

        // Limitador Maestro (Hard Clipping Preventer)
        for (let ch = 0; ch < numChannels; ch++) {
            for (let i = 0; i < numSamples; i++) {
                output[ch][i] = Math.max(-1, Math.min(1, output[ch][i]));
            }
        }

        return true;
    }
}

registerProcessor('audio-processor-worklet', AudioProcessorWorklet);
