import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * DatePickerWidget: Adaptativo según el entorno.
 * Asegura salida ISO (YYYY-MM-DD) para el LogicBridge.
 */
export function DatePickerWidget({ field, value, onChange, disabled }) {
    const isMobile = window.innerWidth <= 768;
    const config = field.config || {};

    const handleChange = (e) => {
        onChange(field.alias, e.target.value);
    };

    return (
        <div className="form-item stack--tight">
            <label className="util-label" style={{ fontSize: '10px', opacity: 0.7 }}>{field.label}</label>
            
            <div className="input-wrapper shelf--tight" style={{ position: 'relative' }}>
                <input
                    className="input-base"
                    type="date"
                    value={value || ''}
                    onChange={handleChange}
                    disabled={disabled}
                    min={config.min_date}
                    max={config.max_date}
                    style={{ 
                        width: '100%',
                        paddingRight: '32px' 
                    }}
                />
                <div style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    opacity: 0.5 
                }}>
                    <IndraIcon name="CALENDAR" size="12px" />
                </div>
            </div>

            <style>{`
                input[type="date"]::-webkit-calendar-picker-indicator {
                    opacity: 0;
                    position: absolute;
                    right: 0;
                    width: 30px;
                    height: 100%;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
