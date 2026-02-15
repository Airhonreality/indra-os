/**
 * 🎨 COLOR CORE
 * Utilidades para la manipulación cromática soberana.
 */

import standards from '../laws/graphic_standards.json';

export const ColorCore = {
    /** Retorna una paleta por nombre */
    getPalette: (name = 'vibrant') => {
        return standards.standards.palettes[name] || standards.standards.palettes.vibrant;
    },

    /** Genera un estilo de Glassmorphism basado en las leyes */
    getGlassStyle: (opacity = 0.1) => {
        if (!standards.standards.effects.is_glassmorphism_enabled) return {};
        return {
            backgroundColor: `rgba(255, 255, 255, ${opacity})`,
            backdropFilter: `blur(${standards.standards.effects.default_blur})`,
            border: `1px solid rgba(255, 255, 255, ${standards.standards.effects.border_opacity})`
        };
    },

    /** Helper para hex to rgba */
    hexToRgba: (hex, alpha = 1) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

/**
 * 🖋️ TYPO CORE
 * Gestión de escalas y pesos visuales.
 */
export const TypoCore = {
    getFontSize: (size = 'md') => standards.standards.typography.scales[size] || '16px',
    getFontFamily: (index = 0) => standards.standards.typography.families[index],
    getWeight: (index = 1) => standards.standards.typography.weights[index]
};



