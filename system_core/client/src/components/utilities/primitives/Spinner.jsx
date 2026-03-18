/**
 * =============================================================================
 * PRIMITIVA: Spinner.jsx
 * RESPONSABILIDAD: Indicador de carga canónico del sistema Indra.
 *
 * AXIOMA (P4): Un solo origen para todo feedback de carga.
 * Ningún motor crea su propio spinner. Todos consumen éste.
 *
 * PROPS:
 *   size    — string: tamaño del spinner. Default: '24px'
 *   color   — string: color CSS. Default: 'var(--color-accent)'
 *   label   — string | null: texto opcional debajo del spinner
 * =============================================================================
 */
import React from 'react';
import { FractalLogo } from '../../shell/Landing/FractalLogo';

export function Spinner({ size = '24px', color = 'var(--color-accent)', label = null, variant = 'pixel' }) {
    // AXIOMA: Si el componente es lo suficientemente grande, usamos el Logo Sagrado por defecto.
    const isRich = variant === 'rich' || parseInt(size) >= 48;

    return (
        <div className="spinner-root" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '16px' 
        }}>
            <div style={{ 
                width: size, 
                height: size, 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {isRich ? (
                    <div style={{ width: '100%', height: '100%', transform: 'scale(1.2)' }}>
                        <FractalLogo active={true} />
                    </div>
                ) : (
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="square"
                        style={{ animation: 'indra-spin 0.9s linear infinite', flexShrink: 0 }}
                    >
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.15" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.9" />
                    </svg>
                )}
            </div>
            
            {label && (
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: isRich ? 'var(--color-text-primary)' : color,
                    opacity: 0.6,
                    textAlign: 'center'
                }}>
                    {label}
                </span>
            )}
        </div>
    );
}
