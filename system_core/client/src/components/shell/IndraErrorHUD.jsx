import React, { useEffect } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';
import './IndraErrorHUD.css';

/**
 * IndraErrorHUD
 * El Centinela de Errores Atómicos. Proyecta fallos del Core con estética HUD.
 */
export const IndraErrorHUD = () => {
    const activeError = useAppState(s => s.activeError);
    const clearError = useAppState(s => s.clearError);

    // Auto-escucha de eventos globales (Dharma Conduit)
    useEffect(() => {
        const handler = (event) => {
            const errorAtom = event.detail;
            if (errorAtom && errorAtom.class === 'INDRA_ERROR') {
                useAppState.getState().raiseError(errorAtom);
            }
        };

        window.addEventListener('indra-error-atom', handler);
        return () => window.removeEventListener('indra-error-atom', handler);
    }, []);

    if (!activeError) return null;

    const { code, message, severity, recovery_hint } = activeError.payload;

    return (
        <div className="indra-error-hud-overlay" onClick={clearError}>
            <div 
                className="indra-error-card" 
                data-severity={severity}
                onClick={e => e.stopPropagation()}
            >
                <div className="indra-error-header">
                    <div className="indra-error-icon-container">
                        <IndraIcon 
                            name="ERROR" 
                            size="24px" 
                            color={severity === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-warning)'} 
                        />
                    </div>
                    <div className="indra-error-info">
                        <div className="indra-error-code">{code}</div>
                        <div className="indra-error-msg">{message}</div>
                    </div>
                </div>

                <div className="indra-error-body">
                    <div className="indra-error-hint-box">
                        <div className="indra-error-hint-label">Sugerencia de Recuperación</div>
                        <div className="indra-error-hint-text">
                            {recovery_hint || "Contacta al soporte técnico de Indra OS."}
                        </div>
                    </div>
                </div>

                <div className="indra-error-actions">
                    <button className="btn btn--ghost" onClick={clearError}>
                        DESCARTAR
                    </button>
                    <button 
                        className="btn btn--primary" 
                        onClick={() => window.location.reload()}
                        style={{ background: severity === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-accent)' }}
                    >
                        {severity === 'CRITICAL' ? 'REINICIAR NÚCLEO' : 'REINTENTAR'}
                    </button>
                </div>
            </div>
        </div>
    );
};
