/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/TextBlock.jsx
 * RESPONSABILIDAD: Nodo de texto terminal con soporte de interpolación.
 * =============================================================================
 */

import React from 'react';

export function TextBlock({ props }) {
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

    // Interpolación simple: busca {{clave}} y resalta si no hay datos (Fase 3)
    const renderContent = () => {
        const content = props.content || 'TYPE_SOMETHING...';
        // En Fase 3 esto se conectará con el contexto real de data_hydration
        return content;
    };

    return (
        <p style={style} title={props.content}>
            {renderContent()}
        </p>
    );
}
