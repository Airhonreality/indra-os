import { OPFSManager } from '../../../../services/video_core/opfs_manager.js';

/**
 * Hook para manejar la ingesta de archivos locales hacia la OPFS.
 * Actúa como puente entre el explorador de archivos del SO y el core de video local.
 */
export function useAssetIngestor(engineActions, currentTime) {
    const opfsRef = new OPFSManager(); // Instancia local para uso temporal antes de pasar al engine

    const ingestLocalFile = async (file) => {
        if (!file) return null;

        try {
            // 1. Generar un local_id único
            const localId = `local_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

            // 2. LEY DE ADUANA - Enviar al Universal Transcoder Pipeline
            console.log(`[AssetIngestor] Enviando archivo ${file.name} a la Aduana de Transcodificación...`);

            const transcodeResult = await new Promise((resolve, reject) => {
                const transcoder = new Worker(new URL('../../../../services/video_core/transcoder_worker.js', import.meta.url), { type: 'module' });

                transcoder.onmessage = (e) => {
                    const { type, resultBlob, metadata, error } = e.data;
                    if (type === 'TRANSCODE_COMPLETE') {
                        transcoder.terminate();
                        resolve({ resultBlob, metadata });
                    } else if (type === 'TRANSCODE_ERROR') {
                        transcoder.terminate();
                        reject(new Error(error));
                    }
                };

                transcoder.postMessage({
                    type: 'INGEST_AND_TRANSCODE',
                    file: file,
                    localId: localId
                });
            });

            console.log(`[AssetIngestor] Aduana superada. Cacheando en OPFS...`, transcodeResult);

            // 3. Cachear en OPFS (El Blob optimizado y su Identity Map)
            const success = await opfsRef.cacheVaultFile(localId, transcodeResult.resultBlob);
            
            if (success && transcodeResult.metadata.identityMap) {
                await opfsRef.cacheIdentityMap(localId, transcodeResult.metadata.identityMap);
            }

            if (success) {
                // 4. Crear el objeto clip para el AST con metadatos reales o simulados
                const newClip = {
                    id: `clip_${Date.now()}`,
                    vault_id: localId,
                    type: 'video',
                    start_at_ms: currentTime || 0,
                    duration_ms: transcodeResult.metadata?.duration_ms || 5000,
                    offset_ms: 0,
                    source: 'LOCAL'
                };

                return newClip;
            } else {
                console.error("[AssetIngestor] Error al cachear archivo en OPFS");
                return null;
            }
        } catch (error) {
            console.error("[AssetIngestor] Error durante la ingesta o Aduana (Transcodificación):", error);
            return null;
        }
    };

    return {
        ingestLocalFile
    };
}
