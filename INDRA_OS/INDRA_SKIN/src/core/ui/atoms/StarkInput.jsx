import React from 'react';

/**
 * ATOM: StarkInput
 * DHARMA: Unidad de entrada de datos axiomática.
 */
const StarkInput = ({ label, value, onChange, placeholder, style = {} }) => {
    return (
        <div className="stack-v" style={{ gap: '4px', width: '100%', ...style }}>
            {label && (
                <label style={{
                    fontSize: '7px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--stark-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {label}
                </label>
            )}
            <input
                type="text"
                className="stark-atom-input"
                placeholder={placeholder}
                value={value}
                defaultValue={!onChange ? value : undefined}
                onChange={onChange}
                style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    fontSize: '9px',
                    width: '100%'
                }}
            />
        </div>
    );
};

export default StarkInput;
