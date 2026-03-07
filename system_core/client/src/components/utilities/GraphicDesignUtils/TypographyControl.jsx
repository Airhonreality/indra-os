/**
 * =============================================================================
 * UTILIDAD: TypographyControl.jsx
 * RESPONSABILIDAD: Control agnóstico para fuentes, tamaños y colores.
 * =============================================================================
 */

import React from 'react';

const SIZE_OPTIONS = [
    { label: '2XS', value: 'var(--text-2xs)' },
    { label: 'XS', value: 'var(--text-xs)' },
    { label: 'SM', value: 'var(--text-sm)' },
    { label: 'BASE', value: 'var(--text-base)' },
    { label: 'LG', value: 'var(--text-lg)' },
    { label: 'XL', value: 'var(--text-xl)' }
];

export function TypographyControl({ fontSize, color, onChange }) {
    return (
        <div className="stack--tight">
            <label style={{ fontSize: '9px', opacity: 0.5 }}>TYPOGRAPHY</label>
            <div className="shelf--tight">
                <select
                    value={fontSize}
                    onChange={(e) => onChange({ fontSize: e.target.value })}
                    className="util-input--sm fill"
                >
                    {SIZE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <input
                    type="color"
                    value={color?.startsWith('var') ? '#ffffff' : color} // Simplificación para demo
                    onChange={(e) => onChange({ color: e.target.value })}
                    style={{
                        width: '24px',
                        height: '24px',
                        padding: 0,
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)'
                    }}
                />
            </div>
        </div>
    );
}
