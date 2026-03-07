/**
 * =============================================================================
 * UTILIDAD: SpacingControl.jsx
 * RESPONSABILIDAD: Control agnóstico para Padding, Margins y Gaps.
 * =============================================================================
 */

import React from 'react';

const SPACING_OPTIONS = [
    { label: 'None', value: 'var(--space-0)' },
    { label: 'XS (4px)', value: 'var(--space-1)' },
    { label: 'SM (8px)', value: 'var(--space-2)' },
    { label: 'MD (12px)', value: 'var(--space-3)' },
    { label: 'LG (16px)', value: 'var(--space-4)' },
    { label: 'XL (24px)', value: 'var(--space-6)' }
];

export function SpacingControl({ label, value, onChange }) {
    return (
        <div className="stack--tight">
            <label style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase' }}>{label}</label>
            <div className="shelf--tight">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="util-input--sm fill"
                    style={{ background: 'var(--color-bg-void)', border: '1px solid var(--color-border)' }}
                >
                    {SPACING_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    <option value="custom">Custom...</option>
                </select>
                {/* Si es custom, mostraría un input numérico, por simplificar ahora permitimos manual en el select o un input aparte */}
            </div>
        </div>
    );
}
