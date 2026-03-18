/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/TextBlock.jsx
 * RESPONSABILIDAD: Nodo de texto terminal con soporte de interpolación.
 * =============================================================================
 */

import React from 'react';
import { useAxiomStyles } from '../hooks/useAxiomStyles';

export function TextBlock({ props, onUpdate, isSelected }) {
    const textRef = React.useRef(null);
    const [isFocused, setIsFocused] = React.useState(false);
    
    // HIDRATACIÓN SINCERA (The Figma Model)
    const hydratedProps = useAxiomStyles(props);

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
        // AXIOMA DE SINCERIDAD DOCUMENTAL: El contenido del documento no es la UI.
        // Forzamos un color del contexto honesto a menos que el átomo defina uno.
        color: hydratedProps.color || 'var(--honest-text)', 
        opacity: (hydratedProps.content || isFocused) ? 1 : 0.4,
        transition: 'all var(--transition-base)',
        // Fuente honesta
        fontFamily: hydratedProps.fontFamily || 'var(--honest-font-base)',
        fontSize: hydratedProps.fontSize,
        fontWeight: hydratedProps.fontWeight,
    };

    // ... (renderContent stays same)

    // Interpolación: busca {{clave}} y resalta como "píldora"
    const renderContent = () => {
        const content = hydratedProps.content || 'TYPE_SOMETHING...';

        // Regex para capturar {{cualquier_cosa}}
        const parts = content.split(/(\{\{[^{}]+\}\})/g);

        return parts.map((part, i) => {
            if (part.startsWith('{{') && part.endsWith('}}')) {
                const slotKey = part.slice(2, -2);
                return (
                    <span
                        key={i}
                        className="slot-pill"
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

