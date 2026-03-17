/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/MathConfig.jsx
 * RESPONSABILIDAD: Configuración de operaciones aritméticas.
 * =============================================================================
 */

import React from 'react';
import { MappingSelect } from '../MappingSelect';

export function MathConfig({ config, onUpdate, options = [] }) {

    const updateOp = (opCode) => {
        onUpdate({ ...config, operation: opCode });
    };

    const handleInputMapping = (key, value) => {
        const option = options.find(opt => opt.value === value);
        onUpdate({
            ...config,
            [key]: value,
            [key + '_label']: option?.label || value
        });
    };

    const operations = [
        { code: 'ADD', label: '+' },
        { code: 'SUBTRACT', label: '-' },
        { code: 'MULTIPLY', label: '×' },
        { code: 'DIVIDE', label: '÷' }
    ];

    return (
        <div className="stack--tight">
            <div className="shelf--loose">
                <MappingSelect
                    value={config.input_a}
                    options={options}
                    onChange={(val) => handleInputMapping('input_a', val)}
                    placeholder="ENTRADA_A"
                />

                <div className="shelf--tight glass" style={{ padding: '2px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {operations.map(op => (
                        <button
                            key={op.code}
                            onClick={() => updateOp(op.code)}
                            className={`btn btn--xs ${config.operation === op.code ? 'btn--accent' : 'btn--ghost'}`}
                            style={{ padding: '4px 8px', minWidth: '28px', border: 'none', fontSize: '10px' }}
                        >
                            {op.label}
                        </button>
                    ))}
                </div>

                <MappingSelect
                    value={config.input_b}
                    options={options}
                    onChange={(val) => handleInputMapping('input_b', val)}
                    placeholder="ENTRADA_B"
                />
            </div>
        </div>
    );
}
