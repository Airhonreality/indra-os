import React from 'react';

/**
 * ATOM: StarkBadge
 * DHARMA: Unidad de señalización axiomática.
 */
const StarkBadge = ({ label, color = 'var(--text-dim)', pulse = false, style = {} }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
            <div style={{
                width: '4px', height: '4px', borderRadius: '50%',
                backgroundColor: color,
                boxShadow: pulse ? `0 0 10px ${color}` : 'none',
            }} className={pulse ? 'animate-pulse' : ''}></div>
            <span style={{
                fontSize: '7px',
                fontFamily: 'var(--stark-mono)',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }}>
                {label}
            </span>
        </div>
    );
};

export default StarkBadge;
