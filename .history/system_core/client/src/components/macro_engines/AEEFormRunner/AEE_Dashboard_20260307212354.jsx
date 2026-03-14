/**
 * =============================================================================
 * ARTEFACTO: AEE_Dashboard.jsx
 * RESPONSABILIDAD: Orquestador del AEE (Agnostic Execution Engine).
 * =============================================================================
 */

import React from 'react';
import { useAEESession } from './useAEESession';
import { FormRunner } from './FormRunner';
import { ResultPanel } from './ResultPanel';
import './AEEFormRunner.css';

export function AEEDashboard({ atom }) {
    const {
        formData,
        updateField,
        result,
        status,
        error,
        executeLogic,
        reset
    } = useAEESession(atom);

    return (
        <div className="indra-macro-engine aee-dashboard stack--loose">
            {/* Si no hay resultado todavía, mostramos el Formulario */}
            {status !== 'SUCCESS' && status !== 'ERROR' && status !== 'EXECUTING' ? (
                <main className="aee-viewport center fill">
                    <FormRunner
                        schema={atom}
                        formData={formData}
                        onFieldChange={updateField}
                        onExecute={executeLogic}
                        status={status}
                    />
                </main>
            ) : (
                <main className="aee-viewport center fill">
                    <ResultPanel
                        result={result}
                        status={status}
                        error={error}
                        onReset={reset}
                    />
                </main>
            )}

            <footer className="aee-hud spread slot-small">
                <div className="status-info shelf--tight">
                    <div className={`led ${status === 'EXECUTING' ? 'pulse-cyan' : status === 'ERROR' ? 'led-danger' : 'pulse-cyan'}`}></div>
                    <span className="util-label">{status}_MODE</span>
                </div>
                <div className="session-info shelf--tight">
                    <span className="util-hint">{atom.id}</span>
                </div>
            </footer>
        </div>
    );
}
