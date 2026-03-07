/**
 * =============================================================================
 * SERVICIO: UnitTranslator.js
 * RESPONSABILIDAD: Conversión axiomática de unidades físicas a píxeles.
 * BASADO EN: Estándares de la industria (96 DPI).
 * =============================================================================
 */

const DPI = 96;
const MM_TO_PX = DPI / 25.4;
const PT_TO_PX = DPI / 72;

export const UnitTranslator = {
    mmToPx: (mm) => mm * MM_TO_PX,
    ptToPx: (pt) => pt * PT_TO_PX,
    pxToMm: (px) => px / MM_TO_PX,
    pxToPt: (px) => px / PT_TO_PX,

    /**
     * Parsea un string con unidad (ej: "10mm", "12pt") a su valor equivalente en píxeles.
     * @param {string|number} value 
     * @returns {number}
     */
    parseToPx: (value) => {
        if (typeof value === 'number') return value;
        if (!value || typeof value !== 'string') return 0;

        const num = parseFloat(value);
        if (isNaN(num)) return 0;

        const unit = value.replace(/[0-9.]/g, '').toLowerCase().trim();

        switch (unit) {
            case 'mm': return num * MM_TO_PX;
            case 'pt': return num * PT_TO_PX;
            case 'px': return num;
            case 'in': return num * DPI;
            default: return num; // Por defecto px
        }
    }
};
