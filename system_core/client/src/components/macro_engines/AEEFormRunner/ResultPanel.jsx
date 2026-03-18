/**
 * =============================================================================
 * ARTEFACTO: ResultPanel.jsx
 * RESPONSABILIDAD: Proyectar el resultado de la ejecución lógica (AEE).
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { Spinner } from '../../utilities/primitives';

import { useLexicon } from '../../../services/lexicon';

export function ResultPanel({ result, status, error, onReset }) {
    const t = useLexicon();

    if (status === 'EXECUTING') {
        return (
            <div className="aee-result glass stack center">
                <Spinner size="60px" color="var(--color-accent)" label={t('status_executing_logic')} />
            </div>
        );
    }

    if (status === 'ERROR' || error) {
        return (
            <div className="aee-result glass stack center">
                <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)' }}>
                    <IndraIcon name="ERROR" size="80px" />
                </div>
                <h3 className="util-label">{t('error_fatal_logic')}</h3>
                <p className="text-hint" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    {error || t('error_core_rejection')}
                </p>
                <button className="btn btn--ghost" style={{ marginTop: 'var(--space-6)' }} onClick={onReset}>
                    {t('action_retry')}
                </button>
            </div>
        );
    }

    // --- PROYECCIÓN INTELIGENTE DEL RESULTADO ---
    const isSuccess = status === 'SUCCESS' || !!result;
    
    // Si el resultado tiene una propiedad de mensaje legible, la priorizamos
    const humanMessage = result?.message || result?.msg || result?.notificacion;
    const hasData = result && Object.keys(result).length > 0;

    return (
        <div className="aee-result glass stack center">
            <div style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>
                <IndraIcon name="OK" size="80px" />
            </div>
            <h3 className="util-label">{t('status_resonance_success')}</h3>
            
            <div className="result-projection stack center" style={{ marginTop: 'var(--space-4)', width: '100%', maxWidth: '500px' }}>
                {humanMessage && (
                    <p className="human-feedback" style={{ fontSize: '14px', textAlign: 'center', color: 'white', fontWeight: '500' }}>
                        {humanMessage}
                    </p>
                )}

                {hasData && (
                    <div className="glass-void stack--tight" style={{ width: '100%', padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                        <header className="shelf--between" style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}>
                            <span className="util-label" style={{ fontSize: '8px' }}>DETALLES_OPERATIVOS</span>
                            <IndraIcon name="SCHEMA" size="10px" />
                        </header>
                        <pre className="font-mono text-hint" style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            <button className="btn btn--accent" style={{ marginTop: 'var(--space-6)' }} onClick={onReset}>
                {t('action_finish_session')}
            </button>
        </div>
    );
}
