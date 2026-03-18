/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/PageBlock.jsx
 * RESPONSABILIDAD: Representación ontológica de una página física.
 * =============================================================================
 */

import React from 'react';

export function PageBlock({ props, children, isSelected }) {
    const style = {
        width: props.width || '210mm',
        minHeight: props.minHeight || '297mm',
        background: props.background || '#ffffff',
        padding: props.padding || '20mm',
        display: 'flex',
        flexDirection: props.direction || 'column',
        gap: props.gap || '10px',
        color: props.color || '#000000',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        position: 'relative',
        margin: '20px auto',
        boxSizing: 'border-box',
        overflow: props.overflow || 'visible'
    };

    return (
        <div
            className={`page-block ${isSelected ? 'selected' : ''}`}
            style={style}
        >
            {children}

            {/* Page Label Indicator */}
            <div style={{
                position: 'absolute',
                top: '-20px',
                left: '0',
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--honest-accent)',
                opacity: 0.6,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }}>
                DOCUMENT_PAGE
            </div>
        </div>
    );
}

PageBlock.manifest = {
    type: 'PAGE',
    sections: [
        {
            name: 'PAGE_GEOMETRY',
            fields: [
                { id: 'width', label: 'WIDTH', type: 'unit' },
                { id: 'minHeight', label: 'MIN_HEIGHT', type: 'unit' },
                { id: 'background', label: 'BG_COLOR', type: 'color' },
                { id: 'overflow', label: 'OVERFLOW', type: 'select', options: ['visible', 'hidden', 'auto'] }
            ]
        },
        {
            name: 'PAGE_LAYOUT',
            fields: [
                { id: 'direction', label: 'DIRECTION', type: 'select', options: ['row', 'column'] },
                { id: 'padding', label: 'PADDING', type: 'unit' },
                { id: 'gap', label: 'GAP', type: 'unit' }
            ]
        }
    ]
};
export default PageBlock;
