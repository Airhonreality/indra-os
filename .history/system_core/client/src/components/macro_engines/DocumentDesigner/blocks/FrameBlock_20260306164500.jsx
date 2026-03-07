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
        // Bordes y Sombra
        borderRadius: props.borderRadius || '0px',
        border: props.border || 'none',
        boxShadow: props.boxShadow || 'none',
        minHeight: props.minHeight || '0px',
        boxSizing: 'border-box',
        transition: 'all var(--transition-base)',
        overflow: 'hidden' // Blindaje según MDO
    };

    return (
        <div style={style}>
            {children.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.1,
                    border: '2px dashed currentColor',
                    minHeight: '100px',
                    margin: 'var(--space-4)'
                }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>EMPTY_FRAME_ADD_BLOCKS</span>
                </div>
            ) : children}
        </div>
    );
}
