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
    size = '12px'
}) {
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
            className="indra-trigger"
            onMouseDown={requiresHold ? startHold : undefined}
            onMouseUp={requiresHold ? stopHold : undefined}
            onMouseLeave={requiresHold ? stopHold : undefined}
            onClick={handleClick}
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
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                overflow: 'hidden',
                color: isHolding ? activeColor : color
            }}
        >
            {/* Progress Bar Background */}
            {requiresHold && progress > 0 && (
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

            <IndraIcon name={icon} size={size} />

            <style>{`
                .indra-trigger:hover {
                    border-color: ${activeColor};
                    box-shadow: 0 0 10px ${activeColor}33;
                    transform: scale(1.05);
                }
                .indra-trigger:active {
                    transform: scale(0.95);
                }
            `}</style>
        </button>
    );
}
