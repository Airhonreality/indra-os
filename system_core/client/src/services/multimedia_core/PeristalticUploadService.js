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
     */
    async upload(blob, fileName, uploaderData, onProgress = () => {}, createdAt = null, resumeData = null, onSessionReady = () => {}, onHandshake = () => {}, bridge = null) {
        let uploadUrl = resumeData?.uploadUrl || null;
        let bytesSent = resumeData?.byteOffset || 0;
        const totalSize = blob.size;

        try {
            // 1. INIT Handshake
            if (!uploadUrl) {
                const directive = {
                    protocol: 'EMERGENCY_INGEST', 
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
                    const response = await bridge.request({ ...directive, provider: 'system' });
                    initResult = response;
                } else {
                    const response = await fetch(CORE_URL, {
                        method: 'POST',
                        mode: 'cors',
                        body: JSON.stringify(directive)
                    });
                    initResult = await response.json();
                }

                console.log("[PUP] Init Result:", JSON.stringify(initResult));

                // Extracción flexible: Soportar ambos formatos (camelCase y snake_case)
                const meta = initResult.metadata || initResult;
                uploadUrl = meta.upload_url || meta.uploadUrl;
                const fileId = meta.file_id || meta.fileId;

                if (!uploadUrl || uploadUrl === 'null' || uploadUrl === 'undefined') {
                    console.error("[PUP] Fallo al resolver URL de subida. Result:", initResult);
                    throw new Error("URL de subida inválida proporcionada por el Gateway");
                }
                
                onSessionReady({ uploadUrl, fileId });
                // El Manager activará el Handshake después de la fase MIE
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

            return { status: 'SUCCESS', fileId: finalFileInfo?.id || 'unknown' };

        } catch (e) {
            console.error("[PUP Upload] Error Crítico:", e);
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
                    data: { mode: 'VERIFY_SEMANTIC', ...fileInfo }
                })
            });
            const data = await res.json();
            return data.metadata?.status === 'FOUND' || data.metadata?.status === 'OK';
        } catch (e) { return false; }
    }
}

export const peristalticUploadService = new PeristalticUploadService();
