import React from 'react';

/**
 * ATOM: AxiomButton
 * DHARMA: Unidad de ejecución axiomática.
 */
const AxiomButton = ({ label, onClick, isIgnited, style = {}, variant = 'primary' }) => {
    return (
        <button
            onClick={onClick}
            className={`axiom-atom-btn axiom-atom-btn-${variant}`}
            style={{
                padding: '8px 4px',
                fontSize: '8px',
                borderRadius: 'var(--axiom-border-radius)',
                backgroundColor: isIgnited ? 'rgba(var(--omd-accent-rgb), 0.1)' : 'transparent',
                color: isIgnited ? 'var(--omd-accent)' : 'var(--text-dim)',
                border: `1px solid ${isIgnited ? 'var(--omd-accent)' : 'var(--border-color)'}`,
                textAlign: 'center',
                width: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ...style
            }}
        >
            {label.replace(/_/g, ' ')}
        </button>
    );
};

export default AxiomButton;



