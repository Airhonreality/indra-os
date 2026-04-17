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
 * REALIZA UNA FUSIÓN PROFUNDA DE OBJETOS (ADR-004).
 * @param {Object} target - El objeto base que recibirá los cambios.
 * @param {Object} source - El objeto que trae las actualizaciones.
 * @returns {Object} El objeto target modificado.
 */
function _indra_deepMerge_(target, source) {
  if (!source) return target;
  Object.keys(source).forEach(key => {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      _indra_deepMerge_(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  });
  return target;
}

/**
 * Indica si un ítem es una Señal de Prospección (Probe), no un Átomo.
 * @param {Object} item
 * @returns {boolean}
 */
function _isProbeSignal_(item) {
    return item && item.type === 'PROBE';
}
