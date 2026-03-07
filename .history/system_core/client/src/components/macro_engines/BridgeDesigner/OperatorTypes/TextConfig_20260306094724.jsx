/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/TextConfig.jsx
 * RESPONSABILIDAD: Configuración de transformaciones de texto y plantillas.
 * =============================================================================
 */

import React from 'react';
import { MicroSlot } from '../MicroSlot';

export function TextConfig({ config, onUpdate, onOpenSelector }) {

    const updateOp = (opCode) => {
        onUpdate({ ...config, operation: opCode });
    };

    const operations = [
        { code: 'CONCAT', label: 'CONCAT' },
        { code: 'UPPER', label: 'ABC' },
        { code: 'LOWER', label: 'abc' },
        { code: 'TEMPLATE', label: 'TPL' }
    ];

    return (
        <div className="stack--tight">
            <div className="shelf--loose">
                <MicroSlot
                    value={config.input_a}
                    label={config.input_a_label}
                    onOpenSelector={() => onOpenSelector('input_a')}
                    placeholder="TEXT_A"
                />

                <div className="shelf--tight glass" style={{ padding: '2px', borderRadius: '4px' }}>
                    {operations.map(op => (
                        <button
                            key={op.code}
                            onClick={() => updateOp(op.code)}
                            className={`btn btn--xs ${config.operation === op.code ? 'btn--accent' : 'btn--ghost'}`}
                            style={{ padding: '2px 8px', fontSize: '9px', border: 'none' }}
                        >
                            {op.label}
                        </button>
                    ))}
                </div>

                {config.operation !== 'TEMPLATE' && (
                    <MicroSlot
                        value={config.input_b}
                        label={config.input_b_label}
                        onOpenSelector={() => onOpenSelector('input_b')}
                        placeholder="TEXT_B"
                    />
                )}
            </div>

            {config.operation === 'TEMPLATE' && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                    <textarea
                        value={config.template || ''}
                        onChange={(e) => onUpdate({ ...config, template: e.target.value })}
                        placeholder="Ej: Hola {{input_a}}, bienvenido a {{input_b}}..."
                        style={{
                            width: '100%',
                            background: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'white',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            padding: 'var(--space-2)',
                            minHeight: '60px',
                            outline: 'none'
                        }}
                    />
                </div>
            )}
        </div>
    );
}
