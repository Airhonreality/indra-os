/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/ExpressionConfig.jsx
 * RESPONSABILIDAD: Configuración de lógica libre mediante el motor de expresiones.
 * =============================================================================
 */

import React from 'react';

export function ExpressionConfig({ config, onUpdate }) {
    return (
        <div className="stack--tight">
            <span style={{ fontSize: '9px', opacity: 0.4, marginBottom: 'var(--space-2)' }}>
                INDRAPARSER_EXPRESSION (Context available via variable names)
            </span>
            <textarea
                value={config.expression || ''}
                onChange={(e) => onUpdate({ ...config, expression: e.target.value })}
                placeholder="Ej: (precio * cantidad) * (1 + tasa_iva)..."
                style={{
                    width: '100%',
                    background: 'var(--color-bg-void)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-accent)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    padding: 'var(--space-3)',
                    minHeight: '80px',
                    outline: 'none',
                    fontWeight: 'bold'
                }}
            />
        </div>
    );
}
