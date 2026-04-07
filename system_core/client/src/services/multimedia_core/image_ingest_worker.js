/**
 * =============================================================================
 * image_ingest_worker.js
 * RESPONSABILIDAD: Aduana de Imágenes.
 * AXIOMA: Compresión local ultra-rápida (WebP) sin bloquear UI.
 * =============================================================================
 */

self.onmessage = async (e) => {
    const { type, file, config, id } = e.data;

    if (type === 'INGEST') {
        try {
            // 1. Decodificación nativa (sin bloquear main thread)
            const bitmap = await createImageBitmap(file);
            
            // 2. Cálculos de REDIMENSIONADO (Mantener Aspect Ratio)
            const maxDim = config.image.max_dimension;
            let width = bitmap.width;
            let height = bitmap.height;

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = (height / width) * maxDim;
                    width = maxDim;
                } else {
                    width = (width / height) * maxDim;
                    height = maxDim;
                }
            }

            // 3. Renderizado en OffscreenCanvas
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            // LEY DE CALIDAD: Usar interpolación de alta calidad
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(bitmap, 0, 0, width, height);

            // 4. Conversión a Blobs Canónicos (WebP por defecto)
            const format = `image/${config.image.format || 'webp'}`;
            const quality = config.image.quality || 0.8;
            
            const resultBlob = await canvas.convertToBlob({ 
                type: format, 
                quality: quality 
            });

            // 5. Metadatos Sinceros
            const result = {
                fileId: id,
                originalName: file.name,
                canonicalName: file.name.replace(/\.[^/.]+$/, "") + "." + (config.image.format || 'webp'),
                canonicalBlob: resultBlob,
                mimeType: format,
                metadata: {
                    originalSize: file.size,
                    finalSize: resultBlob.size,
                    compressionRatio: Number((resultBlob.size / file.size).toFixed(3)),
                    width: Math.round(width),
                    height: Math.round(height),
                    preset: config.id
                }
            };

            // Liberar memoria
            bitmap.close();

            self.postMessage({ type: 'DONE', data: result });

        } catch (err) {
            console.error("[MIE ImageWorker] Error:", err);
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    }
};
