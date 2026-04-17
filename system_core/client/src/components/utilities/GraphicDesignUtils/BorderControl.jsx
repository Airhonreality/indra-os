/**
 * =============================================================================
 * UTILIDAD: BorderControl.jsx
 * RESPONSABILIDAD: Control agnóstico para bordes (grosor, estilo, radio).
 * =============================================================================
 */

import React from 'react';

const RADIUS_OPTIONS = [
    { label: 'None', value: '0px' },
    { label: 'XS (2px)', value: 'var(--radius-xs)' },
    { label: 'SM (4px)', value: 'var(--radius-sm)' },
    { label: 'MD (8px)', value: 'var(--radius-md)' },
    { label: 'LG (12px)', value: 'var(--radius-lg)' },
    { label: 'Pill', value: 'var(--radius-pill)' }
];

export function BorderControl({ radius, border, onChange }) {
    return (
        <div className="stack--tight">
            <label style={{ fontSize: '9px', opacity: 0.5 }}>BORDERS & RADIUS</label>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div className="stack--tight">
                    <label style={{ fontSize: '8px', opacity: 0.4 }}>RADIUS</label>
                    <select
                        value={radius}
                        onChange={(e) => onChange({ borderRadius: e.target.value })}
                        className="util-input--sm"
                    >
                        {RADIUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div className="stack--tight">
                    <label style={{ fontSize: '8px', opacity: 0.4 }}>STYLE</label>
                    <select
                        value={border === 'none' ? 'none' : 'solid'}
                        onChange={(e) => onChange({ border: e.target.value === 'none' ? 'none' : '1px solid var(--color-border)' })}
                        className="util-input--sm"
                    >
                        <option value="none">NONE</option>
                        <option value="solid">SOLID LINE</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
