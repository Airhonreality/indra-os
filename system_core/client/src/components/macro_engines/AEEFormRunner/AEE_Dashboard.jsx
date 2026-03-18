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
import { IndraIcon } from '../../utilities/IndraIcons';
import { executeDirective } from '../../../services/directive_executor';
import { useAppState } from '../../../state/app_state';
import './AEEFormRunner.css';

export function AEEDashboard({ atom }) {
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);
    const {
        formData,
        updateField,
        result,
        status,
        error,
        executeLogic,
        reset
    } = useAEESession(atom);
    const [driftState, setDriftState] = React.useState({ status: 'IDLE', message: null, details: null });

    React.useEffect(() => {
        const checkDrift = async () => {
            if (!atom?.id || atom?.class !== 'DATA_SCHEMA') return;

            setDriftState({ status: 'CHECKING', message: 'Verificando evolución del origen...', details: null });
            try {
                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'INDUCTION_DRIFT_CHECK',
                    context_id: atom.id
                }, coreUrl, sessionSecret);

                if (result.metadata?.status !== 'OK') {
                    throw new Error(result.metadata?.error || 'DRIFT_CHECK_FAILED');
                }

                if (result.metadata?.drift_detected) {
                    setDriftState({
                        status: 'DRIFT',
                        message: 'Detectada evolución en el origen. Revisa y actualiza el esquema antes de operar.',
                        details: result.metadata
                    });
                    return;
                }

                setDriftState({ status: 'OK', message: null, details: result.metadata });
            } catch (err) {
                setDriftState({
                    status: 'ERROR',
                    message: `No se pudo verificar deriva: ${err.message}`,
                    details: null
                });
            }
        };

        checkDrift();
    }, [atom?.id, atom?.class, coreUrl, sessionSecret]);

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
                    {(driftState.status === 'DRIFT' || driftState.status === 'ERROR' || driftState.status === 'CHECKING') && (
                        <div style={{
                            margin: 'var(--space-4) var(--space-8) 0',
                            padding: 'var(--space-3)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            background: driftState.status === 'DRIFT' ? 'rgba(255, 191, 0, 0.08)' : 'rgba(255, 255, 255, 0.03)'
                        }}>
                            <div className="shelf--tight">
                                <IndraIcon name={driftState.status === 'DRIFT' ? 'WARN' : 'SYNC'} size="12px" />
                                <span style={{ fontSize: '10px' }}>{driftState.message}</span>
                            </div>
                            {driftState.status === 'DRIFT' && driftState.details && (
                                <span style={{ fontSize: '9px', opacity: 0.7 }}>
                                    Nuevos campos: {(driftState.details.added_fields || []).length} | Campos removidos: {(driftState.details.removed_fields || []).length}
                                </span>
                            )}
                        </div>
                    )}
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
