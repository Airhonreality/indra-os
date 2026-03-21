/**
 * =============================================================================
 * ARTEFACTO: 0_utils/indra_utils.gs
 * RESPONSABILIDAD: Utilidades compartidas para todo el Core Indra.
 * AXIOMA: Las utilidades no tienen estado y son puras.
 * =============================================================================
 */

/**
 * Convierte un texto en un alias (slug) canónico: minúsculas, sin espacios ni especiales.
 * @param {string} text - Texto a procesar.
 * @returns {string} Slug limpio.
 */
function _system_slugify_(text) {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Quitar acentos
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '_')
        .replace(/^-+|-+$/g, '');
}

/**
 * Indica si un ítem es una Señal de Prospección (Probe), no un Átomo.
 * @param {Object} item
 * @returns {boolean}
 */
function _isProbeSignal_(item) {
    return item && item.type === 'PROBE';
}
