/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/ExpressionConfig.jsx
 * RESPONSABILIDAD: Configuración de lógica libre mediante el motor de expresiones.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

export function ExpressionConfig({ config, onUpdate }) {
    return (
        <div className="stack--tight">
            <div className="spread" style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>EXPRESIÓN_LIBRE (JS_PARSER)</span>
                <div className="badge badge--ghost" style={{ fontSize: '8px' }}>CORE_V2</div>
            </div>
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
                    minHeight: '100px',
                    outline: 'none',
                    fontWeight: 'bold',
                    transition: 'all 0.3s'
                }}
                className="indra-input-industrial"
            />
            <div className="shelf--tight" style={{ marginTop: 'var(--space-2)', opacity: 0.3 }}>
                <IndraIcon name="INFO" size="10px" />
                <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>CONTEXTO DISPONIBLE VÍA ALIAS DE FUENTES Y OPS</span>
            </div>

            <style>{`
                .indra-input-industrial:focus {
                    border-color: var(--color-accent) !important;
                    box-shadow: 0 0 15px var(--color-accent-dim) !important;
                    background: var(--color-bg-deep) !important;
                }
            `}</style>
        </div>
    );
}
