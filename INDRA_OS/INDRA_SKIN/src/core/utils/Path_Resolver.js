/**
 * Path_Resolver.js
 * AXIOMA: Navegación de la Esencia (V13.0)
 * 
 * Utilidad agnóstica para extraer valores de objetos complejos usando paths semánticos.
 * Soporta operadores lógicos básicos (||) para redundancia de contratos.
 */

const Axiom_PathResolver = {
    /**
     * Resuelve un path en un objeto.
     * @param {Object} obj - El objeto a navegar.
     * @param {string} path - El path (ej: "metadata.id", "results || items").
     * @returns {any} El valor encontrado o undefined.
     */
    resolve: function (obj, path) {
        if (!obj || !path) return undefined;

        // Soporte para OR lógico (ej: "results || items")
        if (path.includes('||')) {
            const paths = path.split('||').map(p => p.trim());
            for (const p of paths) {
                const val = this._getDeepValue(obj, p);
                if (val !== undefined && val !== null) {
                    // Si es un array vacío, seguimos buscando si es un OR
                    if (Array.isArray(val) && val.length === 0) continue;
                    return val;
                }
            }
            return undefined;
        }

        return this._getDeepValue(obj, path);
    },

    /**
     * Navegación recursiva profunda.
     * @private
     */
    _getDeepValue: function (obj, path) {
        if (path === "") return obj;

        return path.split('.').reduce((acc, part) => {
            if (acc === undefined || acc === null) return acc;

            // Soporte para índices de array (ej: "items[0]")
            const arrayMatch = part.match(/(.+)\[(\d+)\]/);
            if (arrayMatch) {
                const property = arrayMatch[1];
                const index = parseInt(arrayMatch[2], 10);
                return acc[property] ? acc[property][index] : undefined;
            }

            return acc[part];
        }, obj);
    }
};

export default Axiom_PathResolver;

