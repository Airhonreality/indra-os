/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/TextBlock.jsx
 * RESPONSABILIDAD: Nodo de texto terminal con soporte de interpolación.
 * =============================================================================
 */

import React from 'react';

export function TextBlock({ props, onUpdate, isSelected }) {
    const textRef = React.useRef(null);
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
        if (isSelected && textRef.current && !isFocused) {
            // textRef.current.focus(); // Opcional: auto-focus al seleccionar
        }
    }, [isSelected]);

    const style = {
        color: props.color || 'var(--color-text-primary)',
        fontSize: props.fontSize || 'var(--text-base)',
        fontFamily: props.fontFamily || 'var(--font-sans)',
        minWidth: '50px',
        minHeight: '1em',
        outline: 'none',
        lineHeight: '1.5',
        margin: 0,
        // Blindaje MDO
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: props.multiLine ? 'pre-wrap' : 'nowrap',
        opacity: (props.content || isFocused) ? 1 : 0.3
    };

    // ... (renderContent stays same)

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

TextBlock.manifest = {
    displayName: 'TEXT_ENGINE',
    sections: [
        {
            name: 'CONTENT',
            fields: [
                { id: 'content', label: 'CONTENT', type: 'text', multiLine: true }
            ]
        },
        {
            name: 'TYPOGRAPHY',
            fields: [
                { id: 'fontSize', label: 'SIZE', type: 'unit', defaultUnit: 'pt' },
                { id: 'color', label: 'COLOR', type: 'color' },
                { id: 'fontFamily', label: 'FAMILY', type: 'text' },
                { id: 'multiLine', label: 'MULTI_LINE', type: 'boolean' }
            ]
        }
    ]
};
export default TextBlock;

