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

export function Spinner({ size = '24px', color = 'var(--color-accent)', label = null }) {
    return (
        <div className="spinner-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="square"
                style={{ animation: 'indra-spin 0.9s linear infinite', flexShrink: 0 }}
            >
                {/* Arco incompleto — estética Indra */}
                <circle cx="12" cy="12" r="10" strokeOpacity="0.15" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.9" />
            </svg>
            {label && (
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: color,
                    opacity: 0.7,
                }}>
                    {label}
                </span>
            )}
        </div>
    );
}
