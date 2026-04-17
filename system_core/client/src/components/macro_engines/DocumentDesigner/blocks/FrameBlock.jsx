/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/FrameBlock.jsx
 * RESPONSABILIDAD: Contenedor estructural Flexbox (AutoLayout).
 * AXIOMA: Las componentes no leen objetos de persistencia; leen REALIDADES.
 * =============================================================================
 */

import React from 'react';
import { useAxiomStyles } from '../hooks/useAxiomStyles';
import { assertBlockContract } from '../contracts/assertBlockContract';

export function FrameBlock({ block, children }) {
    // El contrato se valida aquí para evitar estados ambiguos aguas abajo.
    assertBlockContract('FrameBlock', block);

    // HIDRATACIÓN SINCERA (The Figma Model)
    const { propsHidratadas, tieneDeriva } = useAxiomStyles(block.props);
    const p = propsHidratadas;

    const estiloFinal = {
        display: 'flex',
        flexDirection: p.direction || 'column',
        gap: p.gap || '10px',
        padding: p.padding || '0px',
        background: p.background || 'transparent',
        // AutoLayout Sizing (Soporte para fill/hug/unit)
        width: p.width === 'fill' ? '100%' : (p.width === 'hug' ? 'fit-content' : p.width),
        height: p.height === 'fill' ? '100%' : (p.height === 'hug' ? 'fit-content' : p.height),
        // Alineación
        alignItems: p.alignItems || 'stretch',
        justifyContent: p.justifyContent || 'flex-start',
        // Estética Soberana
        borderRadius: p.borderRadius || '0px',
        border: p.border || 'none',
        boxShadow: p.boxShadow || 'none',
        minHeight: p.minHeight || '0px',
        boxSizing: 'border-box',
        transition: 'all var(--transition-base)',
        overflow: p.overflow || 'visible',
        position: 'relative'
    };

    const estaVacio = !children || (Array.isArray(children) && children.length === 0);
    const esForma = p.kind === 'SHAPE';

    return (
        <div style={estiloFinal} className="indra-frame-block relative">
            {/* HUD de Deriva: Indicador visual de discrepancia con la marca actual */}
            {tieneDeriva && (
                <div 
                    title="DERIVA_DE_REALIDAD: Este contenedor usa valores de marca obsoletos."
                    style={{ 
                        position: 'absolute', 
                        top: 2, 
                        right: 2, 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        background: 'var(--color-accent)', 
                        zIndex: 10 
                    }} 
                />
            )}
            
            {estaVacio && !esForma ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.1,
                    border: '1px dashed currentColor',
                    minHeight: '40px',
                    width: '100%',
                    padding: '16px'
                }}>
                    <span style={{ fontSize: '8px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>+ CONTENEDOR_VACÍO</span>
                </div>
            ) : children}
        </div>
    );
}

FrameBlock.manifest = {
    displayName: 'FRAME_ENGINE',
    sections: [
        {
            name: 'DISPOSICIÓN',
            fields: [
                { id: 'direction', label: 'DIRECCIÓN', type: 'select', options: ['row', 'column'] },
                { id: 'padding', label: 'ESPACIADO_INTERNO', type: 'unit' },
                { id: 'gap', label: 'ESPACIADO_HIJOS', type: 'unit' },
                { id: 'overflow', label: 'DESBORDAMIENTO', type: 'select', options: ['visible', 'hidden', 'auto'] },
                { id: 'alignItems', label: 'ALINEACIÓN_H', type: 'select', options: ['stretch', 'center', 'flex-start', 'flex-end'] },
                { id: 'justifyContent', label: 'ALINEACIÓN_V', type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between'] }
            ]
        },
        {
            name: 'DIMENSIONES',
            fields: [
                { id: 'width', label: 'ANCHO', type: 'unit' },
                { id: 'height', label: 'ALTO', type: 'unit' },
                { id: 'minHeight', label: 'MIN_ALTO', type: 'unit' }
            ]
        },
        {
            name: 'APARIENCIA',
            fields: [
                { id: 'background', label: 'COLOR_FONDO', type: 'color' },
                { id: 'borderRadius', label: 'RADIO_BORDE', type: 'unit' },
                { id: 'boxShadow', label: 'SOMBRA', type: 'text' }
            ]
        }
    ]
};
export default FrameBlock;
