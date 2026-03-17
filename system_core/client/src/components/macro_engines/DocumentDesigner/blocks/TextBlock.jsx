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

    // Mapeo de Presets a Variables Globales (Axioma A6)
    // Cada preset se asocia a un set de variables CSS que el StyleEngine puede manipular
    const presetBaseStyle = props.textPreset ? {
        fontSize: `var(--indra-dd-${props.textPreset}-size, inherit)`,
        fontWeight: `var(--indra-dd-${props.textPreset}-weight, inherit)`,
        lineHeight: `var(--indra-dd-${props.textPreset}-leading, 1.5)`,
        letterSpacing: `var(--indra-dd-${props.textPreset}-tracking, normal)`,
        textTransform: `var(--indra-dd-${props.textPreset}-case, none)`,
        fontFamily: `var(--indra-dd-${props.textPreset}-font, var(--font-sans))`,
        color: `var(--indra-dd-${props.textPreset}-color, var(--color-text-primary))`
    } : {};

    const style = {
        ...presetBaseStyle,
        // Overrides locales (Soberanía del Usuario)
        color: props.color || presetBaseStyle.color,
        fontSize: props.fontSize || presetBaseStyle.fontSize,
        fontFamily: props.fontFamily || presetBaseStyle.fontFamily,
        fontWeight: props.fontWeight || presetBaseStyle.fontWeight,
        lineHeight: props.lineHeight || presetBaseStyle.lineHeight,
        letterSpacing: props.letterSpacing || presetBaseStyle.letterSpacing,
        textTransform: props.textTransform || presetBaseStyle.textTransform,
        textAlign: props.textAlign || 'left',
        
        // Geometría y Posición
        marginTop: props.marginTop || '0px',
        marginBottom: props.marginBottom || '0px',
        paddingLeft: props.paddingLeft || '0px',
        
        minWidth: '50px',
        minHeight: '1em',
        outline: 'none',
        margin: `${props.marginTop || 0} 0 ${props.marginBottom || 0} 0`,
        paddingLeft: props.paddingLeft || 0,

        // Blindaje MDO (Optimizado para Sinceridad)
        overflow: 'visible',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: props.color || (props.textPreset ? presetBaseStyle.color : '#000000'),
        opacity: (props.content || isFocused) ? 1 : 0.3,
        transition: 'all var(--transition-base)'
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
            ref={textRef}
            style={style}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
                setIsFocused(false);
                // Extraemos texto limpio para evitar contaminación por slots de interpolación
                const cleanText = e.currentTarget.innerText;
                onUpdate({ content: cleanText });
            }}
            onKeyDown={(e) => {
                // Ctrl+Enter o Enter en modo single-line dispara el guardado local
                if (e.key === 'Enter' && (!props.multiLine || e.ctrlKey)) {
                    e.preventDefault();
                    e.currentTarget.blur();
                }
            }}
        >
            {isFocused ? (props.content || '') : renderContent()}
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

