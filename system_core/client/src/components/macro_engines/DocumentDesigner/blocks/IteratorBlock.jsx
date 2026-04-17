/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/IteratorBlock.jsx
 * RESPONSABILIDAD: Multiplicador de layouts basado en datos tabulares.
 * AXIOMA: Reproducción sincera de la materia estructural.
 * =============================================================================
 */

import React from 'react';
import { useAxiomStyles } from '../hooks/useAxiomStyles';
import { assertBlockContract } from '../contracts/assertBlockContract';

export function IteratorBlock({ block, children }) {
    // Validación contractual explícita para impedir render sobre AST corrupto.
    assertBlockContract('IteratorBlock', block);

    // HIDRATACIÓN SINCERA
    const { propsHidratadas, tieneDeriva } = useAxiomStyles(block.props);
    const p = propsHidratadas;

    const estiloFinal = {
        border: '1px solid var(--color-cold)',
        background: 'rgba(var(--color-cold-rgb), 0.05)',
        display: 'flex',
        flexDirection: p.direction || 'column',
        gap: p.gap || 'var(--space-2)',
        padding: 'var(--space-2)',
        position: 'relative',
        minHeight: '40px'
    };

    return (
        <div style={estiloFinal} className="indra-iterator-block relative">
            {tieneDeriva && (
                <div 
                    title="DERIVA_DE_REALIDAD: Este iterador usa estilos de marca antiguos."
                    style={{ position: 'absolute', top: -4, right: 30, width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', zIndex: 10 }} 
                />
            )}
            
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                fontSize: '8px',
                padding: '2px 6px',
                background: 'var(--color-cold)',
                color: 'white',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase'
            }}>
                ITERADOR: {p.source || 'SIN_VÍNCULO'}
            </div>
            {children}
        </div>
    );
}

IteratorBlock.manifest = {
    displayName: 'ITERATOR_ENGINE',
    sections: [
        {
            name: 'VÍNCULO_DATOS',
            fields: [
                { id: 'source', label: 'ORIGEN_DATOS', type: 'text' }
            ]
        },
        {
            name: 'REPETICIÓN',
            fields: [
                { id: 'direction', label: 'DIRECCIÓN', type: 'select', options: ['row', 'column'] },
                { id: 'gap', label: 'ESPACIADO', type: 'unit' }
            ]
        }
    ]
};

export default IteratorBlock;
