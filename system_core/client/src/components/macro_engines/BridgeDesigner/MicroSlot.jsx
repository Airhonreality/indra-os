/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/MicroSlot.jsx
 * RESPONSABILIDAD: Signifier visual de una variable alambrada.
 *
 * DHARMA:
 *   - Estética Stark: Representación nítida y técnica.
 *   - Affordance de Acción: Invita a ser clicado para cambiar el slot.
 * =============================================================================
 */

import { IndraIcon } from '../../utilities/IndraIcons';

export function MicroSlot({ value, label, onActivate, isActive, placeholder = "SELECT_SLOT" }) {
    const isWaiting = !isActive && !value;

    return (
        <div
            onClick={onActivate}
            className={`shelf--tight glass-hover ${isActive ? 'pulse-cyan-subtle' : ''}`}
            style={{
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--color-accent)' : (value ? 'rgba(var(--rgb-accent), 0.1)' : 'rgba(255,255,255,0.03)'),
                border: isActive ? '1px solid white' : (value ? '1px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.1)'),
                boxShadow: isActive ? '0 0 15px var(--color-accent)' : 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                minWidth: '120px',
                transform: isActive ? 'scale(1.02)' : 'none'
            }}
        >
            <IndraIcon
                name={isActive ? 'TARGET' : (value ? 'LOGIC' : 'PLUS')}
                size="10px"
                style={{ 
                    opacity: (value || isActive) ? 1 : 0.3, 
                    color: isActive ? 'black' : (value ? 'var(--color-accent)' : 'inherit') 
                }}
            />
            <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: (value || isActive) ? 'bold' : 'normal',
                opacity: (value || isActive) ? 1 : 0.5,
                color: isActive ? 'black' : (value ? 'var(--color-accent)' : 'inherit'),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {label || value || placeholder}
            </span>
        </div>
    );
}
