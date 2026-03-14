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
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
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

    <div className="indra-macro-engine aee-dashboard stack" style={{ height: '100vh', width: '100vw', background: 'var(--color-bg-void)', overflow: 'hidden' }}>
        <IndraMacroHeader
            atom={atom}
            onClose={() => bridge.close()}
            isSaving={status === 'EXECUTING'}
        />
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

    </div>
    );
}
