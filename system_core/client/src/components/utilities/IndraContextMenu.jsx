/**
 * =============================================================================
 * ARTEFACTO: components/utilities/IndraContextMenu.jsx
 * RESPONSABILIDAD: Menú contextual global y estandarizado.
 * DHARMA:
 *   - Proyección efímera y precisa.
 *   - Estética Glassmorphism / Industrial.
 * =============================================================================
 */

import React, { useEffect, useRef } from 'react';
import { IndraIcon } from './IndraIcons';

export function IndraContextMenu({ menu, onClose }) {
    if (!menu) return null;

    const { x, y, options } = menu;
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Ajuste de posición si sale de la pantalla
    const adjustedX = Math.min(x, window.innerWidth - 200);
    const adjustedY = Math.min(y, window.innerHeight - (options.length * 30));

    return (
        <div 
            ref={menuRef}
            className="indra-context-menu glass stack--tight"
            style={{
                position: 'fixed',
                left: `${adjustedX}px`,
                top: `${adjustedY}px`,
                zIndex: 10000,
                minWidth: '180px',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                animation: 'indra-fade-in 0.1s ease-out'
            }}
        >
            {options.map((opt, idx) => {
                if (opt.type === 'SEPARATOR') {
                    return <div key={idx} style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0', opacity: 0.3 }} />;
                }

                return (
                    <button
                        key={idx}
                        className="btn btn--xs btn--ghost shelf--tight"
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            padding: '6px 8px',
                            gap: '10px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            opacity: opt.disabled ? 0.3 : 1,
                            cursor: opt.disabled ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => {
                            if (!opt.disabled) {
                                opt.action();
                                onClose();
                            }
                        }}
                    >
                        <IndraIcon name={opt.icon || 'DOT'} size="12px" color={opt.color || 'white'} />
                        <span style={{ 
                            fontSize: '10px', 
                            fontFamily: 'var(--font-mono)', 
                            letterSpacing: '0.02em',
                            color: opt.color || 'var(--color-text-primary)'
                        }}>
                            {opt.label.toUpperCase()}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
