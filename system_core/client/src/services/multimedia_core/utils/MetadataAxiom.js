/**
 * =============================================================================
 * MetadataAxiom.js
 * RESPONSABILIDAD: Cirugía binaria para la preservación de la soberanía del dato.
 * AXIOMA: La metadata original es sagrada y debe sobrevivir a la transcodificación.
 * =============================================================================
 */

export const MetadataAxiom = {
    
    /**
     * Extrae e inyecta el segmento APP1 (EXIF/XMP) de un JPEG original en uno nuevo.
     * @param {Blob} originalBlob - El archivo virgen con metadata.
     * @param {Blob} targetBlob - El archivo procesado (resized/re-encoded).
     * @returns {Promise<Blob>} - Nuevo Blob con la metadata inyectada.
     */
    async stitchJpegMetadata(originalBlob, targetBlob) {
        if (originalBlob.type !== 'image/jpeg' || targetBlob.type !== 'image/jpeg') {
            return targetBlob; // No aplicable si no es JPEG
        }

        const originalBuffer = await originalBlob.arrayBuffer();
        const targetBuffer = await targetBlob.arrayBuffer();

        const exifSegment = this._extractJpegApp1(originalBuffer);
        if (!exifSegment) return targetBlob;

        return this._injectJpegApp1(targetBuffer, exifSegment, targetBlob.type);
    },

    /**
     * Extrae el segmento APP1 (0xFFE1) de un buffer JPEG.
     */
    _extractJpegApp1(buffer) {
        const view = new DataView(buffer);
        if (view.getUint16(0) !== 0xFFD8) return null; // No es JPEG

        let offset = 2;
        while (offset < view.byteLength) {
            const marker = view.getUint16(offset);
            const length = view.getUint16(offset + 2);

            if (marker === 0xFFE1) { // Segmento APP1 (EXIF/XMP)
                return buffer.slice(offset, offset + 2 + length);
            }
            
            if (marker === 0xFFDA) break; // Inicio de datos de imagen SOS
            offset += 2 + length;
        }
        return null;
    },

    /**
     * Inyecta un segmento APP1 en un buffer JPEG justo después del SOI.
     */
    _injectJpegApp1(targetBuffer, app1Segment, mimeType) {
        const newBuffer = new Uint8Array(targetBuffer.byteLength + app1Segment.byteLength);
        
        // 1. Copiar SOI (Start of Image) - 2 bytes
        newBuffer.set(new Uint8Array(targetBuffer.slice(0, 2)), 0);
        
        // 2. Inyectar APP1 original
        newBuffer.set(new Uint8Array(app1Segment), 2);
        
        // 3. Copiar el resto del archivo original (desde el byte 2 en adelante)
        newBuffer.set(new Uint8Array(targetBuffer.slice(2)), 2 + app1Segment.byteLength);
        
        return new Blob([newBuffer], { type: mimeType });
    },

    /**
     * Intenta extraer el bloque de metadatos de usuario (udta) de un video MP4.
     * Este es un proceso experimental basado en la jerarquia de cajas ISO.
     * @param {Blob} videoBlob - Video original.
     * @returns {Promise<ArrayBuffer|null>}
     */
    async extractVideoMetadataBox(videoBlob) {
        // Para implementaciones futuras con mp4box.js en el worker.
        // Por ahora capturamos la "intención" de soberanía.
        return null; 
    }
};
