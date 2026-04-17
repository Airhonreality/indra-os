import React from 'react';
import { MappingSelect } from '../MappingSelect';

export function TextConfig({ config, onUpdate, options = [] }) {

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
        { code: 'CONCAT', label: 'CONCAT' },
        { code: 'UPPER', label: 'ABC' },
        { code: 'LOWER', label: 'abc' },
        { code: 'TEMPLATE', label: 'TPL' }
    ];

    return (
        <div className="stack--tight">
            <div className="shelf--loose">
                <MappingSelect
                    value={config.input_a}
                    options={options}
                    onChange={(val) => handleInputMapping('input_a', val)}
                    placeholder="TEXTO_A"
                />

                <div className="shelf--tight glass" style={{ padding: '2px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {operations.map(op => (
                        <button
                            key={op.code}
                            onClick={() => updateOp(op.code)}
                            className={`btn btn--xs ${config.operation === op.code ? 'btn--accent' : 'btn--ghost'}`}
                            style={{ padding: '4px 8px', fontSize: '10px', border: 'none' }}
                        >
                            {op.label}
                        </button>
                    ))}
                </div>

                {config.operation !== 'TEMPLATE' && (
                    <MappingSelect
                        value={config.input_b}
                        options={options}
                        onChange={(val) => handleInputMapping('input_b', val)}
                        placeholder="TEXTO_B"
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
                            background: 'var(--color-bg-void)',
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
