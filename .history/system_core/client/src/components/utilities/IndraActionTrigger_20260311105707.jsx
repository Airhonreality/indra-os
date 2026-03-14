/**
 * =============================================================================
 * ARTEFACTO: components/utilities/IndraActionTrigger.jsx
 * RESPONSABILIDAD: El Gatillo de Comandos con Seguridad Temporal.
 *
 * DHARMA:
 *   - Seguridad Stark: Evita ejecuciones accidentales mediante delay (1.5s).
 *   - Feedback de Carga: Muestra visualmente el progreso del "hold".
 * 
 * AXIOMAS:
 *   - Si `requiresHold` es true, el callback solo se dispara tras el timeout.
 *   - La estética debe ser nítida, sin desenfoques que dificulten la lectura.
 * =============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { IndraIcon } from './IndraIcons';

export function IndraActionTrigger({
    icon,
    label,
    onClick,
    requiresHold = false,
    holdTime = 1500,
    color = 'var(--color-text-secondary)',
    activeColor = 'var(--color-accent)',
    size = '12px',
    loading = false,
    variant = 'default' // 'default' | 'destructive'
}) {
    const isDestructive = variant === 'destructive';
    const effectiveColor = isDestructive ? 'var(--color-danger)' : color;
    const effectiveActiveColor = isDestructive ? 'var(--color-danger)' : activeColor;
    const effectiveIcon = isDestructive ? 'DELETE' : icon;
    const effectiveRequiresHold = isDestructive ? true : requiresHold;

    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    const startHold = (e) => {
        e.stopPropagation();
        if (!requiresHold) return;

        setIsHolding(true);
        startTimeRef.current = Date.now();

        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / holdTime) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                clearInterval(timerRef.current);
                trigger();
            }
        }, 16); // ~60fps
    };

    const stopHold = (e) => {
        e.stopPropagation();
        setIsHolding(false);
        setProgress(0);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const trigger = () => {
        setIsHolding(false);
        setProgress(0);
        if (onClick) onClick();
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (!requiresHold) trigger();
    };

    return (
        <button
            className={`indra-trigger ${loading ? 'indra-trigger--loading' : ''}`}
            onMouseDown={requiresHold && !loading ? startHold : undefined}
            onMouseUp={requiresHold && !loading ? stopHold : undefined}
            onMouseLeave={requiresHold && !loading ? stopHold : undefined}
            onClick={!loading ? handleClick : undefined}
            disabled={loading}
            title={label}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                padding: 0,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: isHolding ? 'var(--color-bg-hover)' : 'transparent',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all var(--transition-fast)',
                overflow: 'hidden',
                color: (isHolding || loading) ? activeColor : color,
                opacity: loading ? 0.8 : 1
            }}
        >
            {/* Progress Bar Background (Hold) */}
            {requiresHold && progress > 0 && !loading && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '2px',
                    width: `${progress}%`,
                    background: activeColor,
                    transition: 'width 16ms linear',
                    boxShadow: `0 0 10px ${activeColor}`
                }} />
            )}

            {loading ? (
                <div className="mini-spinner" style={{
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${activeColor}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'indra-spin 0.6s linear infinite'
                }} />
            ) : (
                <IndraIcon name={icon} size={size} />
            )}

            <style>{`
                @keyframes indra-spin {
                    to { transform: rotate(360deg); }
                }
                .indra-trigger:hover:not(:disabled) {
                    border-color: ${activeColor};
                    box-shadow: 0 0 10px ${activeColor}33;
                    transform: scale(1.05);
                }
                .indra-trigger:active:not(:disabled) {
                    transform: scale(0.95);
                }
                .indra-trigger--loading {
                    border-color: ${activeColor}66 !important;
                }
            `}</style>
        </button>
    );
}
