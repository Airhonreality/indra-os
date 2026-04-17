import React from 'react';
import { useVideoParams } from '../hooks/useVideoParams';

/**
 * =============================================================================
 * MICRO COMPONENTE: VParamField
 * RESPONSABILIDAD: Campo atómico para la edición de valores del AST.
 * AXIOMA: Mantiene la Sinceridad Visual bloqueando inputs no numéricos si es necesario,
 * pero delegando el commit al Blur.
 * =============================================================================
 */

export function VParamField({ label, valueMs, onChangeMs }) {
    // Conectamos la directiva temporal a la lógica compartida del hook
    const { value, onChange, onBlur } = useVideoParams(valueMs, onChangeMs);

    return (
        <div className="v-param-field stack--tight" style={{ marginBottom: 'var(--space-2)' }}>
            <label className="text-hint font-mono" style={{ fontSize: '10px' }}>
                {label} (HH:MM:SS:FF)
            </label>
            <input
                type="text"
                value={value}
                onChange={onChange}
                onBlur={onBlur} // LEY DE COMPROMISO: Solo mutamos el proyecto al terminar
                className="input input--sm font-mono"
                style={{
                    backgroundColor: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    padding: 'var(--space-1)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            />
        </div>
    );
}
