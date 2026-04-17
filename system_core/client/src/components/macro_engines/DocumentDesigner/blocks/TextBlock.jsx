import React from 'react';
/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/TextBlock.jsx
 * RESPONSABILIDAD: Nodo de texto terminal con soporte de interpolación.
 * AXIOMA: Las componentes no leen objetos de persistencia; leen REALIDADES.
 * =============================================================================
 */

import { useAxiomStyles } from '../hooks/useAxiomStyles';
import { assertBlockContract } from '../contracts/assertBlockContract';

export function TextBlock({ block, updateNode, isSelected }) {
    // Garantiza que el bloque de texto siempre recibe entidad válida.
    assertBlockContract('TextBlock', block);

    if (typeof updateNode !== 'function') {
        throw new Error('[TextBlock] Contrato inválido: `updateNode` debe ser función.');
    }

    const textRef = React.useRef(null);
    const [isFocused, setIsFocused] = React.useState(false);
    
    // HIDRATACIÓN SINCERA (The Figma Model)
    // Extraemos las propiedades hidratadas (resueltas) y la señal de deriva.
    const { propsHidratadas, tieneDeriva } = useAxiomStyles(block.props);
    const { content = '', ...estiloPropio } = propsHidratadas;

    // Procesar slots de interpolación {{campo}} -> <span class="slot-pill">campo</span>
    const procesarSlots = (texto) => {
        if (!texto) return '';
        return texto.replace(/\{\{([^{}]+)\}\}/g, '<span class="slot-pill">$1</span>');
    };

    const estiloFinal = {
        // Valores base del sistema honesto
        color: estiloPropio.color || 'var(--honest-text)',
        fontFamily: estiloPropio.fontFamily || 'var(--honest-font-base)',
        fontSize: estiloPropio.fontSize || '11pt',
        fontWeight: estiloPropio.fontWeight || '400',
        textAlign: estiloPropio.textAlign || 'left',
        
        // Comportamiento de edición
        outline: 'none',
        minHeight: '1.2em',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        position: 'relative',
        opacity: (content || isFocused) ? 1 : 0.4,
        transition: 'opacity 0.2s ease'
    };

    return (
        <div className="indra-text-block-wrapper relative fill-width" style={{ position: 'relative' }}>
            {/* HUD de Deriva: Indicador visual de discrepancia con la marca actual */}
            {tieneDeriva && (
                <div 
                    className="reality-drift-indicator"
                    title="DERIVA_DE_REALIDAD: Este bloque usa valores guardados que difieren de la marca actual."
                    style={{ 
                        position: 'absolute', 
                        top: -6, 
                        right: -6, 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        background: 'var(--color-accent)', 
                        border: '2px solid white', 
                        zIndex: 10,
                        boxShadow: '0 0 10px var(--color-accent)'
                    }} 
                />
            )}

            <div
                ref={textRef}
                className={`indra-text-block ${isSelected ? 'selected' : ''}`}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    setIsFocused(false);
                    // LEY DE SINCERIDAD: Guardamos tal cual, el renderer se encarga de los slots.
                    updateNode(block.id, { 
                        props: { 
                            ...block.props, 
                            content: e.target.innerHTML 
                        } 
                    });
                }}
                dangerouslySetInnerHTML={{ __html: isFocused ? content : procesarSlots(content) }}
                style={estiloFinal}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.blur();
                    }
                }}
            />
        </div>
    );
}

TextBlock.manifest = {
    displayName: 'TEXT_ENGINE',
    sections: [
        {
            name: 'CONTENIDO',
            fields: [
                { id: 'content', label: 'TEXTO', type: 'text', multiLine: true }
            ]
        },
        {
            name: 'TIPOGRAFÍA',
            fields: [
                { id: 'fontSize', label: 'TAMAÑO', type: 'unit', defaultUnit: 'pt' },
                { id: 'color', label: 'COLOR', type: 'color' },
                { id: 'fontFamily', label: 'FUENTE', type: 'text' },
                { id: 'textAlign', label: 'ALINEACIÓN', type: 'select', options: ['left', 'center', 'right', 'justify'] }
            ]
        }
    ]
};

export default TextBlock;
