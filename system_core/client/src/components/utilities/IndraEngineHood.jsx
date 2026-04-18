import React from 'react';
import { IndraIcon } from './IndraIcons';
import { useResonance } from '../../hooks/useResonance';

/**
 * IndraEngineHood
 * 
 * Bar containing module-specific actions, positioned below the IndraMacroHeader.
 * @dharma Inyecta la capacidad de "Invocabilidad" automáticamente si detecta un nexo externo.
 * 
 * Props adicionales (v4.0):
 *   isReady    - boolean: (Opcional) Si el motor ha terminado de procesar datos (Previene envíos incompletos).
 *   onConfirm  - function: (Opcional) Override para procesar datos antes de emitir el resultado.
 */
export function IndraEngineHood({
    leftSlot,
    centerSlot,
    rightSlot,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    isReady = true,   // Por defecto el motor está listo
    onConfirm         // Override opcional
}) {
    const { isInvokeMode, emitResult } = useResonance();

    const handleConfirm = () => {
        if (!isReady) return; // Silent block o podrías disparar un toast
        if (onConfirm) {
            onConfirm();
        } else {
            emitResult();
        }
    };

    return (
        <div className="engine-hood">
            <div className="engine-hood__section">
                {/* BOTÓN DE RETORNO UNIVERSAL (Solo en modo Portal) */}
                {isInvokeMode && (
                    <div className="engine-hood__capsule resonance-hud" style={{ marginRight: 'var(--space-2)' }}>
                        <button 
                            className={`btn btn--primary btn--mini ${!isReady ? 'btn--disabled' : 'btn--neon'}`}
                            onClick={handleConfirm}
                            disabled={!isReady}
                            style={{ 
                                padding: '0 12px',
                                gap: '8px',
                                background: isReady 
                                    ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' 
                                    : 'var(--color-bg-tertiary)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: isReady ? 'white' : 'var(--color-text-tertiary)',
                                cursor: isReady ? 'pointer' : 'not-allowed'
                            }}
                            title={isReady ? "Confirmar y volver al aplicación" : "Esperando a que el motor termine de procesar..."}
                        >
                            <IndraIcon name="CHECK" size="14px" color={isReady ? "white" : "var(--color-text-tertiary)"} />
                            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>CONFIRMAR</span>
                        </button>
                    </div>
                )}

                {/* Standard History Controls in the Hood */}
                {(onUndo || onRedo) && (
                    <div className="engine-hood__capsule shelf--tight" style={{ marginRight: 'var(--space-2)' }}>
                        <button 
                            className="btn btn--mini" 
                            onClick={onUndo}
                            disabled={!canUndo} 
                            style={{ 
                                opacity: canUndo ? 0.7 : 0.1,
                                width: '32px',
                                height: '32px'
                            }}
                            title="UNDO (Ctrl+Z)"
                        >
                            <IndraIcon name="UNDO" size="12px" color={canUndo ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} />
                        </button>
                        <button 
                            className="btn btn--mini" 
                            onClick={onRedo}
                            disabled={!canRedo} 
                            style={{ 
                                opacity: canRedo ? 0.7 : 0.1,
                                width: '32px',
                                height: '32px'
                            }}
                            title="REDO (Ctrl+Y)"
                        >
                            <IndraIcon name="REDO" size="12px" color={canRedo ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} />
                        </button>
                    </div>
                )}
                
                {(onUndo || onRedo || isInvokeMode) ? <div className="engine-hood__divider" style={{height: '20px'}} /> : null}

                {leftSlot}
            </div>

            <div className="engine-hood__section">
                {centerSlot}
            </div>

            <div className="engine-hood__section">
                {rightSlot}
            </div>
        </div>
    );
}
