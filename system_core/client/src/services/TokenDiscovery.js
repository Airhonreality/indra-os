/**
 * =============================================================================
 * SERVICIO: TokenDiscovery.js
 * RESPONSABILIDAD: El "Arqueólogo de Diseño".
 * Escanea el archivo CSS de tokens, extrae metadatas de comentarios industriales
 * y genera el AST necesario para hidratar el Style Engine dinámicamente.
 * =============================================================================
 */

export const TokenDiscovery = {
    /**
     * Extrae y mapea los tokens desde design_tokens.css
     */
    async discover() {
        try {
            // En Indra, cargamos el CSS como texto para parsear sus comentarios
            // Nota: En producción esto podría venir de una ruta estática pre-procesada
            const response = await fetch('/src/styles/design_tokens.css');
            const cssText = await response.text();
            
            return this.parse(cssText);
        } catch (err) {
            console.error('[TokenDiscovery] Fallo al escudriñar tokens:', err);
            return [];
        }
    },

    /**
     * Regex Engine para capturar bloque de comentario + variable
     */
    parse(text) {
        const groups = {};
        
        // Regex para capturar: /* @group: ...; @icon: ...; @type: ... */ --variable: valor;
        const regex = /\/\*\s*@group:\s*([^;]+);(?:\s*@icon:\s*([^;]+);)?\s*@type:\s*([^;]+);\s*@label:\s*([^;]+);(?:\s*@min:\s*([^;]+);)?(?:\s*@max:\s*([^;]+);)?(?:\s*@unit:\s*([^;]+);)?\s*@desc:\s*([^*]+)\s*\*\/\s*(--[^:]+):\s*([^;]+);/g;
        
        let match;
        while ((match = regex.exec(text)) !== null) {
            const [
                _, 
                groupName, 
                icon,
                type, 
                label, 
                min, 
                max, 
                unit, 
                desc, 
                key, 
                defaultValue
            ] = match;

            if (!groups[groupName]) {
                groups[groupName] = {
                    id: groupName.toLowerCase().replace(/\s+/g, '_'),
                    title: groupName.toUpperCase(),
                    icon: icon ? icon.trim() : 'LAYERS',
                    desc: `Módulo de control para ${groupName}`,
                    params: []
                };
            }

            groups[groupName].params.push({
                key: key.trim(),
                label: label.trim(),
                desc: desc.trim(),
                type: type.trim(),
                min: min ? parseInt(min) : undefined,
                max: max ? parseInt(max) : undefined,
                unit: unit ? unit.trim() : '',
                defaultValue: defaultValue.trim()
            });
        }

        return Object.values(groups);
    }
};
