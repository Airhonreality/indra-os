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
 * Realiza un merge profundo de dos objetos.
 * Protege la estructura original.
 */
function _indra_deepMerge_(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], _indra_deepMerge_(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}
