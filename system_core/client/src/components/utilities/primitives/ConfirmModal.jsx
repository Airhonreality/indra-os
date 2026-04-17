/**
 * =============================================================================
 * PRIMITIVA: ConfirmModal.jsx
 * RESPONSABILIDAD: Modal de confirmación canónico para acciones críticas.
 *
 * AXIOMA: Las acciones destructivas necesitan un punto de confirmación
 * explícito cuando hold-to-confirm no es suficiente (ej: confirmaciones
 * con contexto textual que el usuario necesita leer antes de decidir).
 *
 * PROPS:
 *   isOpen      — boolean: controla visibilidad
 *   title       — string: título del modal
 *   message     — string: descripción de la acción
 *   confirmLabel — string: texto del botón confirm. Default: 'CONFIRMAR'
 *   cancelLabel  — string: texto del botón cancel. Default: 'CANCELAR'
 *   onConfirm   — fn(): se llama al confirmar
 *   onCancel    — fn(): se llama al cancelar o cerrar
 *   danger      — boolean: si true, botón confirm en rojo. Default: false
 * =============================================================================
 */
import React, { useEffect, useCallback } from 'react';

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'CONFIRMAR',
    cancelLabel = 'CANCELAR',
    onConfirm,
    onCancel,
    danger = false,
}) {
    // Cerrar con Escape
    const handleKey = useCallback((e) => {
        if (!isOpen) return;
        if (e.key === 'Escape') onCancel?.();
        if (e.key === 'Enter') onConfirm?.();
    }, [isOpen, onCancel, onConfirm]);

    useEffect(() => {
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [handleKey]);

    if (!isOpen) return null;

    const confirmColor = danger ? 'var(--color-danger)' : 'var(--color-accent)';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(6px)',
                animation: 'indra-toast-in 0.15s ease-out',
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    background: 'rgba(8, 8, 16, 0.98)',
                    border: `1px solid ${confirmColor}30`,
                    borderTop: `2px solid ${confirmColor}`,
                    borderRadius: '6px',
                    padding: 'var(--space-8)',
                    minWidth: '320px',
                    maxWidth: '480px',
                    boxShadow: `0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px ${confirmColor}10`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-6)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Título */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <h3 style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: danger ? 'var(--color-danger)' : 'var(--color-text)',
                        margin: 0,
                        textTransform: 'uppercase',
                    }}>
                        {title}
                    </h3>
                    {message && (
                        <p style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: 'var(--color-text-dim)',
                            lineHeight: 1.6,
                            margin: 0,
                            letterSpacing: '0.03em',
                        }}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={onCancel}
                        autoFocus={!danger}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className="btn btn--sm"
                        style={{
                            background: `${confirmColor}20`,
                            border: `1px solid ${confirmColor}60`,
                            color: confirmColor,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            letterSpacing: '0.08em',
                            fontWeight: 700,
                        }}
                        onClick={onConfirm}
                        autoFocus={danger}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
