/**
 * PeristalticUploadService.js
 * ORIGEN: Sincronía Diamante v4.1 (Agnosticismo Total)
 * RESPONSABILIDAD: Negociar y ejecutar transferencias masivas usando protocolos canónicos.
 */

import { IngestBridge } from '../IngestBridge';

class PeristalticUploadService {
    /**
     * Sube un bloque de datos usando el estándar ADR-025 (Transfer Handshake).
     */
    async upload(blob, fileName, uploaderData, onProgress = () => {}, createdAt = null, resumeData = null, onSessionReady = () => {}, onHandshake = () => {}) {
        let uploadUrl = resumeData?.uploadUrl || null;
        let bytesSent = resumeData?.byteOffset || 0;
        const totalSize = blob.size;

        try {
            // 1. NEGOCIACIÓN DE TRANSFERENCIA (ATOM_CREATE + TRANSFER INTENT)
            if (!uploadUrl) {
                console.log("[PUP] Solicitando Handshake Canónico para:", fileName);
                
                const directive = {
                    provider: 'drive',
                    protocol: 'ATOM_CREATE',
                    context_id: uploaderData.target_folder_id || 'ROOT',
                    data: {
                        name: fileName,
                        handle: { label: fileName },
                        class: 'DOCUMENT',
                        intent: 'TRANSFER',
                        mime_type: blob.type,
                        uploader: uploaderData.uploader || uploaderData.name || 'anonimo',
                        created_at: createdAt
                    }
                };

                const activeBridge = IngestBridge.getBridge();

                if (!activeBridge) {
                    throw new Error("Bridge no disponible. El estandard Indra requiere Bridge para Negociación.");
                }

                let response = await activeBridge.request(directive);

                console.log("[PUP] Respuesta del Provider:", JSON.stringify(response));

                const meta = response.metadata || {};
                
                if (meta.status === 'HANDSHAKE_READY') {
                    uploadUrl = meta.upload_url;
                    console.log("[PUP] Handshake EXITOSO. Iniciando transferencia directa a Google.");
                } else {
                    console.error("[PUP] El Provider no aceptó la negociación de transferencia.");
                    throw new Error(meta.error || "Fallo en la negociación del Silo.");
                }
                
                onSessionReady({ uploadUrl, fileId: meta.file_id || 'pending' });
                onHandshake({ uploadUrl, fileId: meta.file_id || 'pending' }); 
            }

            // 2. TRANSFERENCIA DIRECTA (Soberanía del Frontend)
            while (bytesSent < totalSize) {
                const chunkEnd = Math.min(bytesSent + (1024 * 1024), totalSize);
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
                            bytesSent = chunkEnd;
                            success = true;
                        } else { throw new Error("Retry"); }
                    } catch (e) {
                        attempt++;
                        await new Promise(r => setTimeout(r, Math.min(5000, 1000 * Math.pow(1.5, attempt))));
                    }
                }
                if (!success) throw new Error("Fallo de red persistente.");
                onProgress(bytesSent / totalSize);
            }

            return { status: 'SUCCESS' };

        } catch (e) {
            console.error("[PUP] Error Crítico de Transferencia:", e);
            return { status: 'ERROR', error: e.message };
        }
    }
}

export const peristalticUploadService = new PeristalticUploadService();
