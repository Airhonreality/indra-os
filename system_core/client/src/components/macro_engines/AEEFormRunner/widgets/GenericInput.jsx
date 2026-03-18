import React from 'react';

/**
 * GenericInput: Maneja tipos básicos (Text, Number, Long Text).
 */
export function GenericInput({ field, value, onChange, disabled }) {
    const isNumber = field.type === 'NUMBER';
    const isLongText = field.type === 'LONG_TEXT';
    
    // Configuración de validación desde el schema
    const config = field.config || {};
    
    const handleChange = (e) => {
        let val = e.target.value;
        if (isNumber) {
            val = val === '' ? null : Number(val);
        }
        onChange(field.alias, val);
    };

    if (isLongText) {
        return (
            <div className="form-item stack--tight">
                <label className="util-label" style={{ fontSize: '10px', opacity: 0.7 }}>{field.label}</label>
                <textarea
                    className="input-base"
                    rows={config.rows || "3"}
                    placeholder={config.placeholder || "..."}
                    value={value || ''}
                    onChange={handleChange}
                    disabled={disabled}
                    style={{ resize: 'vertical' }}
                />
            </div>
        );
    }

    return (
        <div className="form-item stack--tight">
            <label className="util-label" style={{ fontSize: '10px', opacity: 0.7 }}>{field.label}</label>
            <input
                className="input-base"
                type={isNumber ? 'number' : 'text'}
                placeholder={config.placeholder || "..."}
                value={value || ''}
                onChange={handleChange}
                disabled={disabled}
                min={config.min_value}
                max={config.max_value}
                step={config.step}
            />
        </div>
    );
}
