/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/FrameBlock.jsx
 * RESPONSABILIDAD: Contenedor estructural Flexbox (AutoLayout).
 * =============================================================================
 */

import React from 'react';

export function FrameBlock({ props, children }) {
    const style = {
        display: 'flex',
        flexDirection: props.direction || 'column',
        gap: props.gap || 'var(--space-2)',
        padding: props.padding || 'var(--space-0)',
        background: props.background || 'transparent',
        // AutoLayout Sizing
        width: props.width === 'fill' ? '100%' : (props.width === 'hug' ? 'fit-content' : props.width),
        height: props.height === 'fill' ? '100%' : (props.height === 'hug' ? 'fit-content' : props.height),
        // Alineación
        alignItems: props.alignItems || 'stretch',
        justifyContent: props.justifyContent || 'flex-start',
        // Bordes
        borderRadius: props.borderRadius || '0px',
        border: props.border || 'none',
        boxSizing: 'border-box',
        overflow: 'hidden' // Blindaje según MDO
    };

    return (
        <div style={style}>
            {children}
        </div>
    );
}
