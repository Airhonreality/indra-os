import React from 'react';

/**
 * StatusLed: Pequeño indicador LED para estados binarios (Activo/Inactivo).
 * Sigue los axiomas de diseño industrial de Indra.
 */
export function StatusLed({ active, color = 'var(--color-accent)', size = '6px' }) {
    return (
        <div 
            style={{ 
                width: size, 
                height: size, 
                borderRadius: '50%', 
                background: active ? color : 'var(--color-text-tertiary)',
                boxShadow: active ? `0 0 8px ${color}88` : 'none',
                opacity: active ? 1 : 0.3,
                transition: 'all var(--transition-base)',
                flexShrink: 0
            }}
            title={active ? 'STATUS_ACTIVE' : 'STATUS_IDLE'}
        />
    );
}
