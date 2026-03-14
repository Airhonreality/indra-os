/**
 * =============================================================================
 * ARTEFACTO: ResultPanel.jsx
 * RESPONSABILIDAD: Proyectar el resultado de la ejecución lógica (AEE).
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';

export function ResultPanel({ result, status, error, onReset }) {
    if (status === 'EXECUTING') {
        return (
            <div className="aee-result glass stack center">
                <IndraIcon name="SYNC" size="60px" style={{ animation: 'spin 2s linear infinite', color: 'var(--color-accent)' }} />
                <h2 className="util-label pulse-cyan">EXECUTING_LOGIC...</h2>
            </div>
        );
    }

    if (status === 'ERROR' || error) {
        return (
            <div className="aee-result glass stack center">
                <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)' }}>
                    <IndraIcon name="ERROR" size="80px" />
                </div>
                <h3 className="util-label">FATAL_LOGIC_ERROR</h3>
                <p className="text-hint" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    {error || 'El CORE rechazó la directiva o el Bridge reportó un fallo crítico.'}
                </p>
                <button className="btn btn--ghost" style={{ marginTop: 'var(--space-6)' }} onClick={onReset}>
                    DISMISS_AND_RETRY
                </button>
            </div>
        );
    }

    return (
        <div className="aee-result glass stack center">
            <div style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>
                <IndraIcon name="OK" size="80px" />
            </div>
            <h3 className="util-label">RESONANCE_SUCCESS</h3>
            <div className="glass-void stack--tight" style={{ width: '100%', maxWidth: '500px', padding: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                <pre className="font-mono text-hint" style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
            <button className="btn btn--accent" style={{ marginTop: 'var(--space-6)' }} onClick={onReset}>
                FINISH_SESSION
            </button>
        </div>
    );
}
