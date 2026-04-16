/**
 * =============================================================================
 * MEDIA BRIDGE (Indra Peristaltic Upload Module)
 * =============================================================================
 * Responsabilidad: Delegado del pipeline peristáltico (ADR-036).
 * Axioma: Ningún archivo entra completo a RAM. Fragmentación y resiliencia.
 * =============================================================================
 */

class MediaBridge {
    constructor(bridge) {
        this.bridge = bridge;
        this.CHUNK_SIZE = 2 * 1024 * 1024; // 2MB (ADR-036)
        this.activeUploads = new Map();
    }

    /**
     * UPLOAD (The Peristaltic Handshake)
     * Inicia el proceso de subida dividiendo el archivo en segmentos soberanos.
     */
    async upload(file, metadata = {}, onProgress = null) {
        const fileId = crypto.randomUUID();
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
        
        console.group(`[MediaBridge] Iniciando subida peristáltica: ${file.name}`);
        
        try {
            // STEP 1: INIT (Pre-señalización)
            const initRes = await this.bridge.execute({
                protocol: 'EMERGENCY_INGEST_INIT',
                data: {
                    uploader: metadata.uploader || 'Indra_Satellite',
                    contact: metadata.contact || 'anon',
                    files_manifest: [{
                        file_id: fileId,
                        filename: file.name,
                        total_size: file.size,
                        total_chunks: totalChunks,
                        mime_type: file.type
                    }]
                }
            });

            const sessionId = initRes.items[0].session_id;

            // STEP 2: JITTER DE ARRANQUE (ADR-036 Ley 4)
            const jitter = Math.random() * 5000; 
            await new Promise(r => setTimeout(r, jitter));

            // STEP 3: ENVÍO DE CHUNKS SOBERANOS
            for (let i = 0; i < totalChunks; i++) {
                const start = i * this.CHUNK_SIZE;
                const end = Math.min(start + this.CHUNK_SIZE, file.size);
                const chunkBlob = file.slice(start, end);
                const base64Data = await this._blobToBase64(chunkBlob);

                // AXIOMA: Semáforo de cortesía (1 a la vez heredado de execute del Bridge)
                await this.bridge.execute({
                    protocol: 'EMERGENCY_INGEST_CHUNK',
                    data: {
                        session_id: sessionId,
                        file_id: fileId,
                        chunk_index: i,
                        chunk_total: totalChunks,
                        md5: await this._calculateMD5(chunkBlob), // Idempotencia (ADR-036 Ley 5)
                        data_base64: base64Data
                    }
                }, { maxRetries: 5 }); // Más persistencia para chunks

                if (onProgress) {
                    onProgress({
                        percent: Math.round(((i + 1) / totalChunks) * 100),
                        file: file.name
                    });
                }
            }

            // STEP 4: FINALIZE
            const finalizeRes = await this.bridge.execute({
                protocol: 'EMERGENCY_INGEST_FINALIZE',
                data: { session_id: sessionId, file_id: fileId }
            });

            console.groupEnd();
            return finalizeRes.items[0];

        } catch (error) {
            console.error("[MediaBridge] Fallo en la subida:", error);
            console.groupEnd();
            throw error;
        }
    }

    /**
     * UTILS: Conversión a Base64
     * @private
     */
    async _blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * UTILS: Hash para Idempotencia
     * @private
     */
    async _calculateMD5(blob) {
        // En implementación real usamos una librería o Crypto API
        return "md5_placeholder"; 
    }
}

export default MediaBridge;
