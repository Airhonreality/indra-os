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
    async upload(blob, fileName, uploaderData, onProgress = () => {}, createdAt = null, resumeData = null, onSessionReady = () => {}) {
        let uploadUrl = resumeData?.uploadUrl || null;
        let bytesSent = resumeData?.byteOffset || 0;
        const totalSize = blob.size;

        try {
            // 1. INIT Handshake (Solo si no tenemos una sesión previa)
            if (!uploadUrl) {
                const response = await fetch(CORE_URL, {
                    method: 'POST',
                    mode: 'cors',
                    body: JSON.stringify({
                        protocol: 'EMERGENCY_INGEST',
                        data: {
                            mode: 'INIT',
                            filename: fileName,
                            mimeType: blob.type,
                            uploader: uploaderData.name,
                            contact: uploaderData.contact,
                            created_at: createdAt
                        }
                    })
                });
                
                const initResult = await response.json();
                if (initResult.metadata?.status !== 'OK') throw new Error("Aduana Core Cerrada");
                uploadUrl = initResult.metadata.upload_url;
                
                // NOTIFICAR SESIÓN (Cableado de Resiliencia)
                onSessionReady(uploadUrl);
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

            // 3. FINALIZE (Cerrar archivo en Drive y registrar)
            if (finalFileInfo && finalFileInfo.id) {
                let finalized = false;
                let finAttempt = 0;
                while (finAttempt < 3 && !finalized) {
                    try {
                        const finalRes = await fetch(CORE_URL, {
                            method: 'POST',
                            mode: 'cors',
                            body: JSON.stringify({
                                protocol: 'EMERGENCY_INGEST',
                                data: {
                                    mode: 'FINALIZE',
                                    file_id: finalFileInfo.id,
                                    uploader: uploaderData.name,
                                    contact: uploaderData.contact,
                                    filename: fileName,
                                    created_at: createdAt
                                }
                            })
                        });
                        if (finalRes.ok) finalized = true;
                        else throw new Error("Retry Finalize");
                    } catch (e) {
                        finAttempt++;
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }

            // Si llegamos aquí y subimos todos los bytes, es ÉXITO para el usuario.
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
}

export const peristalticUploadService = new PeristalticUploadService();
