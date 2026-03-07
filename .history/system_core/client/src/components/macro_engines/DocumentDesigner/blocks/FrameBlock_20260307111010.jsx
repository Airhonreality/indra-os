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

    const isEmpty = !children || (Array.isArray(children) && children.length === 0) || (children === false);

    return (
        <div style={style}>
            {isEmpty ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.1,
                    border: '1px dashed currentColor',
                    minHeight: '40px',
                    width: '100%',
                    padding: 'var(--space-2)'
                }}>
                    <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>+ EMPTY_FRAME</span>
                </div>
            ) : children}
        </div>
    );
}

FrameBlock.manifest = {
    displayName: 'FRAME_ENGINE',
    sections: [
        {
            name: 'LAYOUT',
            fields: [
                { id: 'direction', label: 'DIRECTION', type: 'select', options: ['row', 'column'] },
                { id: 'padding', label: 'PADDING', type: 'unit' },
                { id: 'gap', label: 'GAP', type: 'unit' },
                { id: 'alignItems', label: 'ALIGN_ITEMS', type: 'select', options: ['stretch', 'center', 'flex-start', 'flex-end'] },
                { id: 'justifyContent', label: 'JUSTIFY', type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between'] }
            ]
        },
        {
            name: 'DIMENSIONS',
            fields: [
                { id: 'width', label: 'WIDTH', type: 'unit' },
                { id: 'height', label: 'HEIGHT', type: 'unit' },
                { id: 'minHeight', label: 'MIN_HEIGHT', type: 'unit' }
            ]
        },
        {
            name: 'APPEARANCE',
            fields: [
                { id: 'background', label: 'BG_COLOR', type: 'color' },
                { id: 'borderRadius', label: 'RADIUS', type: 'unit' },
                { id: 'boxShadow', label: 'SHADOW', type: 'text' }
            ]
        }
    ]
};

