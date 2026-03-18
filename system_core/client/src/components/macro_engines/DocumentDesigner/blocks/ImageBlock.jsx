/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/ImageBlock.jsx
 * RESPONSABILIDAD: Nodo multimedia del sistema INDRA.
 * AXIOMA: Determinismo visual ante cambios de marca.
 * =============================================================================
 */

import React from 'react';
import { useAxiomStyles } from '../hooks/useAxiomStyles';
import { assertBlockContract } from '../contracts/assertBlockContract';

export function ImageBlock({ block }) {
    // Fallo ruidoso inmediato si la identidad del bloque no es válida.
    assertBlockContract('ImageBlock', block);

    // HIDRATACIÓN SINCERA (The Figma Model)
    const { propsHidratadas, tieneDeriva } = useAxiomStyles(block.props);
    const p = propsHidratadas;

    const estiloFinal = {
        width: p.width === 'fill' ? '100%' : p.width,
        height: p.height === 'fill' ? '100%' : p.height,
        objectFit: p.objectFit || 'cover',
        borderRadius: p.borderRadius || 'var(--radius-sm)',
        display: 'block',
        position: 'relative'
    };

    if (!p.src) {
        return (
            <div style={{ ...estiloFinal, background: 'var(--color-bg-elevated)', border: '1px dashed var(--color-border)', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>SIN_IMAGEN_DEFINIDA</span>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', display: 'inline-block', width: estiloFinal.width }}>
            {/* HUD de Deriva para multimedia */}
            {tieneDeriva && (
                <div 
                    title="DERIVA_DE_REALIDAD: Esta imagen usa estilos desactualizados."
                    style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', border: '2px solid white', zIndex: 10 }} 
                />
            )}
            <img src={p.src} alt="indra-node" style={estiloFinal} />
        </div>
    );
}

ImageBlock.manifest = {
    displayName: 'MEDIA_ENGINE',
    sections: [
        {
            name: 'ORIGEN',
            fields: [
                { id: 'src', label: 'URL_RECURSO', type: 'vault_artifact' }
            ]
        },
        {
            name: 'DIMENSIONES',
            fields: [
                { id: 'width', label: 'ANCHO', type: 'unit' },
                { id: 'height', label: 'ALTO', type: 'unit' },
                { id: 'objectFit', label: 'AJUSTE', type: 'select', options: ['cover', 'contain', 'fill'] }
            ]
        },
        {
            name: 'ESTILO',
            fields: [
                { id: 'borderRadius', label: 'RADIO_BORDE', type: 'unit' }
            ]
        }
    ]
};
export default ImageBlock;
