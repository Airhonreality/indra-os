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

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';

export function MicroSlot({ value, label, onActivate, isActive, placeholder = "SELECT_SLOT" }) {
    return (
        <div
            onClick={onActivate}
            className="shelf--tight glass-hover"
            style={{
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'rgba(var(--rgb-accent), 0.2)' : (value ? 'rgba(var(--rgb-accent), 0.1)' : 'var(--color-bg-elevated)'),
                border: isActive ? '1px solid var(--color-accent)' : (value ? '1px solid var(--color-accent)' : '1px solid var(--color-border)'),
                boxShadow: isActive ? '0 0 10px var(--color-accent-dim)' : 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                minWidth: '120px'
            }}
        >
            <IndraIcon
                name={isActive ? 'TARGET' : (value ? 'LOGIC' : 'PLUS')}
                size="10px"
                style={{ opacity: (value || isActive) ? 1 : 0.3, color: (value || isActive) ? 'var(--color-accent)' : 'inherit' }}
            />
            <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                opacity: (value || isActive) ? 1 : 0.5,
                color: (value || isActive) ? 'var(--color-accent)' : 'inherit',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {label || value || placeholder}
            </span>
        </div>
    );
}
