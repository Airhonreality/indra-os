/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/IteratorBlock.jsx
 * RESPONSABILIDAD: Multiplicador de layouts basado en datos tabulares.
 * =============================================================================
 */

import React from 'react';

export function IteratorBlock({ props, children }) {
    // En la Fase 3 se implementará la lógica real de repetición.
    // Por ahora se comporta como un Frame con una etiqueta visual.
    const style = {
        border: '1px solid var(--color-cold)',
        background: 'rgba(var(--color-cold-rgb), 0.05)',
        display: 'flex',
        flexDirection: props.direction || 'column',
        gap: props.gap || 'var(--space-2)',
        padding: 'var(--space-2)',
        position: 'relative',
        minHeight: '40px'
    };

    return (
        <div style={style}>
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                fontSize: '7px',
                padding: '2px 4px',
                background: 'var(--color-cold)',
                color: 'white',
                fontFamily: 'var(--font-mono)'
            }}>
                ITERATOR: {props.source || 'UNBOUND'}
            </div>
            {children}
        </div>
    );
}
export default IteratorBlock;
