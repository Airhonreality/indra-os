/**
 * PeristalticUploadService.js
 * ORIGEN: Sincronía Diamante v4.0.
 * RESPONSABILIDAD: Subida quirúrgica de archivos individuales con reporte de estado.
 */

const CORE_URL = "https://script.google.com/macros/s/AKfycbyhEucpkr6GtpMqQ0LnenhP4SIUXOUJ2M4ycFIVGLBmUuxWYL6hXRTUOBESiC6LlpfA/exec";
const CHUNK_SIZE_BASE = 1 * 1024 * 1024; 

class PeristalticUploadService {
    /**
     * Sube un bloque de datos (Blob) al repositorio Indra.
     * @param {Blob} blob - El archivo transcodificado.
     * @param {String} fileName - Nombre canónico.
     * @param {Object} uploaderData - {name, contact}
     * @param {Function} onProgress - Callback de %
     * @param {String} createdAt - Fecha ISO (YYYY-MM-DD) de creación real del archivo.
     */
    async upload(blob, fileName, uploaderData, onProgress = () => {}, createdAt = null, resumeData = null, onSessionReady = () => {}, onHandshake = () => {}, bridge = null) {
        let uploadUrl = resumeData?.uploadUrl || null;
        let bytesSent = resumeData?.byteOffset || 0;
        const totalSize = blob.size;

        try {
            // 1. INIT Handshake (Solo si no tenemos una sesión previa)
            if (!uploadUrl) {
                const directive = {
                    protocol: 'EMERGENCY_INGEST', // Mantener compatibilidad de protocolo interna
                    data: {
                        mode: 'INIT',
                        filename: fileName,
                        mimeType: blob.type,
                        created_at: createdAt,
                        ...uploaderData
                    }
                };

                let initResult;
                if (bridge) {
                    // MODO NATIVO / SATELLITE
                    const response = await bridge.request({ ...directive, provider: 'system' });
                    initResult = response;
                } else {
                    // MODO EMERGENCY (FALLBACK)
                    const response = await fetch(CORE_URL, {
                        method: 'POST',
                        mode: 'cors',
                        body: JSON.stringify(directive)
                    });
                    initResult = await response.json();
                }
                
                // NOTIFICAR SESIÓN (Resiliencia e ID de archivo)
                const fileId = initResult.metadata.file_id;
                onSessionReady({ uploadUrl, fileId });
                
                // NOTIFICACIÓN DE VICTORIA ANTICIPADA (Axioma de Barichara)
                onHandshake({ uploadUrl, fileId });
            }

            // 2. TRANSFERENCIA POR FRAGMENTOS
            let finalFileInfo = null;
            while (bytesSent < totalSize) {
                const chunkEnd = Math.min(bytesSent + CHUNK_SIZE_BASE, totalSize);
                const chunk = blob.slice(bytesSent, chunkEnd);
                
                let success = false;
                let attempt = 0;
                while (attempt < 5 && !success) {
                    try {
                        const res = await fetch(uploadUrl, {
                            method: 'PUT',
                            headers: {
                                'Content-Range': `bytes ${bytesSent}-${chunkEnd - 1}/${totalSize}`,
                                'Content-Type': blob.type
                            },
                            body: chunk
                        });
                        
                        if (res.status === 308) {
                            bytesSent = chunkEnd;
                            success = true;
                        } else if (res.ok) {
                            finalFileInfo = await res.json();
                            bytesSent = chunkEnd;
                            success = true;
                        } else { throw new Error("Retry"); }
                    } catch (e) {
                        attempt++;
                        await new Promise(r => setTimeout(r, Math.pow(1.5, attempt) * 1000));
                    }
                }
                if (!success) throw new Error("Fallo de red tras reintentos");
                onProgress(bytesSent / totalSize);
            }

            // Si llegamos aquí y subimos todos los bytes, es ÉXITO para el usuario.
            // Axioma de Barichara: Los bytes mandan sobre el registro.
            return { 
                status: 'SUCCESS', 
                fileId: finalFileInfo?.id || 'unknown',
                message: "Subida Completa"
            };

        } catch (e) {
            console.error("[PUP Upload] Error Crítico:", e);
            // Solo lanzamos error si realmente no pudimos completar la subida de bytes
            return { status: 'ERROR', error: e.message };
        }
    }

    async verify(fileInfo) {
        if (!fileInfo || !fileInfo.filename) return false;
        try {
            const res = await fetch(CORE_URL, {
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify({
                    protocol: 'EMERGENCY_INGEST',
                    data: {
                        mode: 'VERIFY_SEMANTIC',
                        filename: fileInfo.filename,
                        uploader: fileInfo.uploader,
                        created_at: fileInfo.created_at
                    }
                })
            });
            const data = await res.json();
            return data.metadata?.status === 'FOUND' || data.metadata?.status === 'OK';
        } catch (e) {
            return false;
        }
    }
}

export const peristalticUploadService = new PeristalticUploadService();
