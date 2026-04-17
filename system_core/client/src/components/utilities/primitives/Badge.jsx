/**
 * =============================================================================
 * PRIMITIVA: Badge.jsx
 * RESPONSABILIDAD: Etiqueta de estado/tipo canónica del sistema Indra.
 *
 * AXIOMA (P4): Consistencia visual de estados y tipos.
 * Los resonance-dots y spans de estado inline se consolidan aquí.
 *
 * PROPS:
 *   label   — string: texto de la etiqueta (requerido)
 *   color   — string: color CSS. Default: 'var(--color-text-dim)'
 *   icon    — string | null: nombre de IndraIcon opcional
 *   size    — 'xs' | 'sm' | 'md': escala. Default: 'sm'
 *   variant — 'default' | 'outline' | 'dot': variante visual. Default: 'default'
 * =============================================================================
 */
import React from 'react';
import { IndraIcon } from '../IndraIcons';

const SIZE_MAP = {
    xs: { fontSize: '7px', padding: '1px 4px', iconSize: '8px' },
    sm: { fontSize: '8px', padding: '2px 6px', iconSize: '9px' },
    md: { fontSize: '10px', padding: '3px 8px', iconSize: '11px' },
};

export function Badge({ label, color = 'var(--color-text-dim)', icon = null, size = 'sm', variant = 'default' }) {
    const { fontSize, padding, iconSize } = SIZE_MAP[size] || SIZE_MAP.sm;

    const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontFamily: 'var(--font-mono)',
        fontSize,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        fontWeight: 600,
        borderRadius: '3px',
        flexShrink: 0,
        whiteSpace: 'nowrap',
    };

    const variantStyle = variant === 'outline'
        ? {
            padding,
            border: `1px solid ${color}`,
            color,
            background: `${color}12`,
        }
        : variant === 'dot'
            ? {
                padding: 0,
                background: 'transparent',
                color,
                gap: '5px',
            }
            : {
                padding,
                background: `${color}20`,
                color,
                border: `1px solid ${color}40`,
            };

    return (
        <span style={{ ...baseStyle, ...variantStyle }}>
            {variant === 'dot' && (
                <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                    display: 'inline-block',
                }} />
            )}
            {icon && variant !== 'dot' && (
                <IndraIcon name={icon} size={iconSize} style={{ color }} />
            )}
            {label}
        </span>
    );
}
