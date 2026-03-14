/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/ImageBlock.jsx
 * RESPONSABILIDAD: Nodo multimedia.
 * =============================================================================
 */

import React from 'react';

export default function ImageBlock({ props }) {
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

ImageBlock.manifest = {
    displayName: 'MEDIA_ENGINE',
    sections: [
        {
            name: 'SOURCE',
            fields: [
                { id: 'src', label: 'URL', type: 'text' }
            ]
        },
        {
            name: 'DIMENSIONS',
            fields: [
                { id: 'width', label: 'WIDTH', type: 'unit' },
                { id: 'height', label: 'HEIGHT', type: 'unit' },
                { id: 'objectFit', label: 'FIT', type: 'select', options: ['cover', 'contain', 'fill'] }
            ]
        },
        {
            name: 'STYLE',
            fields: [
                { id: 'borderRadius', label: 'RADIUS', type: 'unit' }
            ]
        }
    ]
};

