/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/TextBlock.jsx
 * RESPONSABILIDAD: Nodo de texto terminal con soporte de interpolación.
 * =============================================================================
 */

import React from 'react';

export function TextBlock({ props, onUpdate }) {
    // Por ahora, render básico. La interpolación de {{slots}} se implementará en Fase 3.
    const style = {
        color: props.color || 'var(--color-text-primary)',
        fontSize: props.fontSize || 'var(--text-base)',
        fontFamily: props.fontFamily || 'var(--font-sans)',
        lineHeight: '1.5',
        margin: 0,
        // Blindaje MDO
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: props.multiLine ? 'pre-wrap' : 'nowrap'
    };

    // Interpolación: busca {{clave}} y resalta como "píldora"
    const renderContent = () => {
        const content = props.content || 'TYPE_SOMETHING...';

        // Regex para capturar {{cualquier_cosa}}
        const parts = content.split(/(\{\{[^{}]+\}\})/g);

        return parts.map((part, i) => {
            if (part.startsWith('{{') && part.endsWith('}}')) {
                const slotKey = part.slice(2, -2);
                return (
                    <span
                        key={i}
                        style={{
                            background: 'var(--color-accent-dim)',
                            color: 'var(--color-accent)',
                            padding: '0 4px',
                            borderRadius: '3px',
                            border: '1px solid var(--color-accent-glow)',
                            fontSize: '0.9em',
                            fontFamily: 'var(--font-mono)',
                            margin: '0 2px'
                        }}
                    >
                        {slotKey}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div
            style={style}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ content: e.target.innerText })}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !props.multiLine) {
                    e.preventDefault();
                    e.target.blur();
                }
            }}
        >
            {renderContent()}
        </div>
    );
}
