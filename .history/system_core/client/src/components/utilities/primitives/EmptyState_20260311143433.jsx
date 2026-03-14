/**
 * =============================================================================
 * PRIMITIVA: EmptyState.jsx
 * RESPONSABILIDAD: Pantalla estándar de estado vacío para cualquier panel.
 *
 * AXIOMA (P4): Consistencia en la comunicación de ausencia de datos.
 * Ningún motor escribe su propia pantalla vacía inline.
 *
 * PROPS:
 *   icon        — string: nombre de IndraIcon. Default: 'ATOM'
 *   title       — string: título principal (requerido)
 *   description — string | null: descripción secundaria
 *   action      — { label: string, onClick: fn } | null: CTA opcional
 *   size        — 'sm' | 'md' | 'lg': escala del componente. Default: 'md'
 * =============================================================================
 */
import React from 'react';
import { IndraIcon } from '../IndraIcons';

export function EmptyState({ icon = 'ATOM', title, description = null, action = null, size = 'md' }) {
    const iconSize = size === 'sm' ? '28px' : size === 'lg' ? '56px' : '40px';
    const titleSize = size === 'sm' ? '10px' : size === 'lg' ? '14px' : '11px';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            opacity: 0.5,
            width: '100%',
            height: '100%',
        }}>
            <IndraIcon
                name={icon}
                size={iconSize}
                style={{ color: 'var(--color-accent)', opacity: 0.4 }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: titleSize,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                    fontWeight: 600,
                }}>
                    {title}
                </span>
                {description && (
                    <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text-dim)',
                        maxWidth: '220px',
                        lineHeight: 1.5,
                    }}>
                        {description}
                    </span>
                )}
            </div>

            {action && (
                <button
                    className="btn btn--ghost btn--sm"
                    onClick={action.onClick}
                    style={{ fontSize: '9px', letterSpacing: '0.08em', opacity: 1 }}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
