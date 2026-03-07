/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/ImageBlock.jsx
 * RESPONSABILIDAD: Nodo multimedia.
 * =============================================================================
 */

import React from 'react';

export function ImageBlock({ props }) {
    const style = {
        width: props.width === 'fill' ? '100%' : props.width,
        height: props.height === 'fill' ? '100%' : props.height,
        objectFit: props.objectFit || 'cover',
        borderRadius: props.borderRadius || 'var(--radius-sm)',
        display: 'block'
    };

    if (!props.src) {
        return (
            <div style={{ ...style, background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>IMAGE_NOT_DEFINED</span>
            </div>
        );
    }

    return (
        <img src={props.src} alt="document-node" style={style} />
    );
}
