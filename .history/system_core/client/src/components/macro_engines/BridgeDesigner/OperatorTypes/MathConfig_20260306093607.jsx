/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/MathConfig.jsx
 * RESPONSABILIDAD: Configuración de operaciones aritméticas.
 * =============================================================================
 */

import React from 'react';
import { MicroSlot } from '../MicroSlot';

export function MathConfig({ config, onUpdate, onOpenSelector }) {

    const updateOp = (opCode) => {
        onUpdate({ ...config, operation: opCode });
    };

    const operations = [
        { code: 'ADD', label: '+' },
        { code: 'SUBTRACT', label: '-' },
        { code: 'MULTIPLY', label: '×' },
        { code: 'DIVIDE', label: '÷' }
    ];

    return (
        <div className="shelf--loose">
            <MicroSlot
                value={config.input_a}
                label={config.input_a_label}
                onOpenSelector={() => onOpenSelector('input_a')}
                placeholder="INPUT_A"
            />

            <div className="shelf--tight glass" style={{ padding: '2px', borderRadius: '4px' }}>
                {operations.map(op => (
                    <button
                        key={op.code}
                        onClick={() => updateOp(op.code)}
                        className={`btn btn--xs ${config.operation === op.code ? 'btn--accent' : 'btn--ghost'}`}
                        style={{ padding: '2px 8px', minWidth: '24px', border: 'none' }}
                    >
                        {op.label}
                    </button>
                ))}
            </div>

            <MicroSlot
                value={config.input_b}
                label={config.input_b_label}
                onOpenSelector={() => onOpenSelector('input_b')}
                placeholder="INPUT_B"
            />
        </div>
    );
}
