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

    const accentColor = atom?.color || '#00f5d4';
    const dynamicStyles = {
        '--indra-dynamic-accent': accentColor,
        '--indra-dynamic-border': `${accentColor}26`,
        '--indra-dynamic-bg': `${accentColor}08`,
    };

    return (
        <div className="macro-designer-wrapper fill" style={dynamicStyles}>
            <IndraMacroHeader
                atom={atom}
                onClose={() => window.parent.postMessage({ type: 'CLOSE_MACRO' }, '*')} // AEE often runs in isolation, fallback closing logic
                isSaving={status === 'EXECUTING'}
                rightSlot={
                    <div className="shelf--tight">
                        {status !== 'IDLE' && (
                            <button 
                                className="btn btn--ghost btn--xs" 
                                onClick={reset}
                                style={{ borderRadius: 'var(--indra-ui-radius)' }}
                            >
                                <IndraIcon name="SYNC" size="12px" />
                                <span style={{ fontSize: '9px' }}>RESET_SESSION</span>
                            </button>
                        )}
                    </div>
                }
            />

            <div className="designer-body fill center relative overflow-hidden">
                <div className="indra-container" style={{ width: '100%', maxWidth: '800px', height: 'fit-content', maxHeight: '100%' }}>
                    <div className="indra-header-label">EXECUTION_ENGINE_PROJECTION</div>
                    <main className="fill overflow-auto" style={{ padding: 'var(--space-8)' }}>
                        {status !== 'SUCCESS' && status !== 'ERROR' && status !== 'EXECUTING' ? (
                            <FormRunner
                                schema={atom}
                                formData={formData}
                                onFieldChange={updateField}
                                onExecute={executeLogic}
                                status={status}
                            />
                        ) : (
                            <ResultPanel
                                result={result}
                                status={status}
                                error={error}
                                onReset={reset}
                            />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
