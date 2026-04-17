/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/MathConfig.jsx
 * RESPONSABILIDAD: Configuración de operaciones aritméticas (Agnóstico).
 * AXIOMA: La interfaz se adapta a la aridad del operador, evitando acoplamiento.
 * =============================================================================
 */

import React from 'react';
import { MappingSelect } from '../MappingSelect';

// REGISTRO DE AXIOMAS MATEMÁTICOS (Agnosticismo de Aridad)
const MATH_AXIOMS = {
    'ADD':        { arity: 2, label: '+' },
    'SUBTRACT':   { arity: 2, label: '-' },
    'MULTIPLY':   { arity: 2, label: '×' },
    'DIVIDE':     { arity: 2, label: '÷' },
    'SUMMATION':  { arity: 1, label: '∑' }
};

export function MathConfig({ config, onUpdate, options = [] }) {
    const currentAxiom = MATH_AXIOMS[config.operation] || MATH_AXIOMS['ADD'];

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

    return (
        <div className="stack--tight">
            <div className="shelf--loose" style={{ justifyContent: 'center', alignItems: 'center' }}>
                {/* SLOT: INPUT_A (Siempre Requerido) */}
                <MappingSelect
                    value={config.input_a}
                    options={options}
                    onChange={(val) => handleInputMapping('input_a', val)}
                    placeholder="ENTRADA_A"
                />

                {/* SELECTOR DE OPERACION (Centro de Resonancia) */}
                <div className="shelf--tight glass" style={{ padding: '2px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {Object.keys(MATH_AXIOMS).map(opCode => (
                        <button
                            key={opCode}
                            onClick={() => updateOp(opCode)}
                            className={`btn btn--xs ${config.operation === opCode ? 'btn--accent' : 'btn--ghost'}`}
                            style={{ 
                                padding: '4px 8px', 
                                minWidth: '28px', 
                                border: 'none', 
                                fontSize: '10px',
                                background: config.operation === opCode ? 'var(--color-accent)' : 'transparent' 
                            }}
                        >
                            {MATH_AXIOMS[opCode].label}
                        </button>
                    ))}
                </div>

                {/* SLOT: INPUT_B (Inteligente/Agnostico) */}
                {currentAxiom.arity > 1 ? (
                    <MappingSelect
                        value={config.input_b}
                        options={options}
                        onChange={(val) => handleInputMapping('input_b', val)}
                        placeholder="ENTRADA_B"
                    />
                ) : (
                    <div style={{ padding: '0 10px', opacity: 0.1, pointerEvents: 'none' }}>
                         <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>[UNARIO_REDUCCION]</span>
                    </div>
                )}
            </div>
        </div>
    );
}
