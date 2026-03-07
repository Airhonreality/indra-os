/**
 * =============================================================================
 * UTILIDAD: AlignmentControl.jsx
 * RESPONSABILIDAD: Matriz 3x3 para control de alignItems y justifyContent.
 * =============================================================================
 */

import React from 'react';

export function AlignmentControl({ items, justify, onChange }) {
    // Mapeo simple de una cuadrícula 3x3 a combinaciones Flexbox
    const options = [
        { items: 'flex-start', justify: 'flex-start' },
        { items: 'flex-start', justify: 'center' },
        { items: 'flex-start', justify: 'flex-end' },
        { items: 'center', justify: 'flex-start' },
        { items: 'center', justify: 'center' },
        { items: 'center', justify: 'flex-end' },
        { items: 'flex-end', justify: 'flex-start' },
        { items: 'flex-end', justify: 'center' },
        { items: 'flex-end', justify: 'flex-end' }
    ];

    return (
        <div className="stack--tight">
            <label style={{ fontSize: '9px', opacity: 0.5 }}>ALIGNMENT</label>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2px',
                width: '60px',
                background: 'var(--color-border)',
                padding: '2px',
                borderRadius: 'var(--radius-sm)'
            }}>
                {options.map((opt, i) => {
                    const isActive = items === opt.items && justify === opt.justify;
                    return (
                        <div
                            key={i}
                            onClick={() => onChange({ items: opt.items, justify: opt.justify })}
                            style={{
                                height: '16px',
                                background: isActive ? 'var(--color-accent)' : 'var(--color-bg-void)',
                                cursor: 'pointer',
                                transition: 'background var(--transition-fast)'
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
