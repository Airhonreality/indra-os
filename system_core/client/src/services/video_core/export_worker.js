/**
 * =============================================================================
 * ExportWorker (Web Worker)
 * RESPONSABILIDAD: Renderizado Off-screen final y Multiplexación. (Phase 7)
 * AXIOMA DE INDEPENDENCIA: Corre completamente desligado de la UI. 
 * Re-hidrata el proyecto, solicita decodificación completa, codifica a H264 
 * usando WebCodecs (VideoEncoder) y muxa a un contenedor webm/mp4 usando Mediabunny.
 * =============================================================================
 */

self.onmessage = async (e) => {
    const { type, project, settings } = e.data;

    if (type === 'START_EXPORT') {
        console.log(`[ExportWorker] Iniciando Pipeline de Exportación:`, settings);

        try {
            // LEY AXIOMÁTICA: La exportación es un replay silencioso (Headless).
            // En un sistema completo, aquí instanciamos:
            // 1. DecoderWorker (headless)
            // 2. OffscreenCanvas (para re-dibujar capas y componer)
            // 3. VideoEncoder (WebCodecs) para comprimir el Canvas.
            // 4. Muxer (Mediabunny / mp4box) para empaquetar en un Blob final.

            // Simulación del progreso para la UI
            let progress = 0;
            const duration = project?.settings?.duration_ms || 10000;

            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 10) + 5;
                if (progress >= 100) {
                    clearInterval(interval);
                    self.postMessage({
                        type: 'EXPORT_PROGRESS',
                        progress: 100
                    });

                    // Fake Blob para la respuesta
                    const dummyBlob = new Blob(["INDRA_VIDEO_DUMMY_BLOB"], { type: 'video/mp4' });

                    self.postMessage({
                        type: 'EXPORT_COMPLETE',
                        resultBlob: dummyBlob
                    });
                } else {
                    self.postMessage({
                        type: 'EXPORT_PROGRESS',
                        progress: Math.min(progress, 99)
                    });
                }
            }, 500);

        } catch (error) {
            console.error(`[ExportWorker] Fallo en Exportación:`, error);
            self.postMessage({
                type: 'EXPORT_ERROR',
                error: error.message
            });
        }
    }
};
