/**
 * =============================================================================
 * ARTEFACTO: AEE_Dashboard.jsx
 * RESPONSABILIDAD: Orquestador del AEE (Agnostic Execution Engine).
 *
 * AXIOMA DE DOS MODOS:
 *   [CONFIG]  → Selección de Schema + Bridge + generación de link público.
 *   [EXECUTE] → Formulario puro proyectado desde el Schema, ejecutado por el Bridge.
 *
 * Un AEE sin configurar muestra el panel CONFIG.
 * Un AEE configurado muestra el formulario, con atajos de acceso al CONFIG.
 * =============================================================================
 */

import React from 'react';
import { useAEESession } from './useAEESession';
import { FormRunner } from './FormRunner';
import { ResultPanel } from './ResultPanel';
import { AEEConfigPanel } from './AEEConfigPanel';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraIcon } from '../../utilities/IndraIcons';
import { executeDirective } from '../../../services/directive_executor';
import { useAppState } from '../../../state/app_state';
import './AEEFormRunner.css';

export function AEEDashboard({ atom, bridge }) {
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);

    // ── MODO ACTIVO: 'CONFIG' | 'EXECUTE' ──
    const isConfigured = !!(atom?.payload?.schema_id && atom?.payload?.bridge_id);
    const [mode, setMode] = React.useState(isConfigured ? 'EXECUTE' : 'CONFIG');
    const [localAtom, setLocalAtom] = React.useState(atom);

    // Sincronizar si el atom exterior cambia (ej: tras guardar configuración)
    React.useEffect(() => {
        setLocalAtom(atom);
        const nowConfigured = !!(atom?.payload?.schema_id && atom?.payload?.bridge_id);
        if (nowConfigured && mode === 'CONFIG') setMode('EXECUTE');
    }, [atom]);

    const {
        effectiveSchema,
        isLoadingSchema,
        formData,
        updateField,
        result,
        status,
        error,
        executeLogic,
        reset
    } = useAEESession(localAtom);

    const [driftState, setDriftState] = React.useState({ status: 'IDLE', message: null, details: null });

    React.useEffect(() => {
        const checkDrift = async () => {
            if (!localAtom?.id || localAtom?.class !== 'DATA_SCHEMA') return;
            setDriftState({ status: 'CHECKING', message: 'Verificando evolución del origen...', details: null });
            try {
                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'INDUCTION_DRIFT_CHECK',
                    context_id: localAtom.id
                }, coreUrl, sessionSecret);

                if (result.metadata?.status !== 'OK') throw new Error(result.metadata?.error || 'DRIFT_CHECK_FAILED');
                if (result.metadata?.drift_detected) {
                    setDriftState({ status: 'DRIFT', message: 'Detectada evolución en el origen. Revisa el esquema.', details: result.metadata });
                    return;
                }
                setDriftState({ status: 'OK', message: null, details: result.metadata });
            } catch (err) {
                setDriftState({ status: 'ERROR', message: `No se pudo verificar deriva: ${err.message}`, details: null });
            }
        };
        checkDrift();
    }, [localAtom?.id, coreUrl, sessionSecret]);

    const accentColor = localAtom?.color || '#00f5d4';
    const dynamicStyles = {
        '--indra-dynamic-accent': accentColor,
        '--indra-dynamic-border': `${accentColor}26`,
        '--indra-dynamic-bg': `${accentColor}08`,
    };

    return (
        <div className="macro-designer-wrapper fill" style={dynamicStyles}>
            <IndraMacroHeader
                atom={localAtom}
                onClose={() => bridge?.close?.() || window.parent.postMessage({ type: 'CLOSE_MACRO' }, '*')}
                isSaving={status === 'EXECUTING'}
                rightSlot={
                    <div className="shelf--tight">
                        {/* Toggle CONFIG / EXECUTE */}
                        {isConfigured && (
                            <button
                                className={`btn btn--xs ${mode === 'CONFIG' ? 'btn--accent' : 'btn--ghost'}`}
                                onClick={() => setMode(m => m === 'CONFIG' ? 'EXECUTE' : 'CONFIG')}
                                style={{ fontSize: '9px', letterSpacing: '0.05em' }}
                                title={mode === 'CONFIG' ? 'Ver formulario' : 'Ver configuración'}
                            >
                                <IndraIcon name={mode === 'CONFIG' ? 'PLAY' : 'SETTINGS'} size="12px" />
                                <span>{mode === 'CONFIG' ? 'VER_FORM' : 'CONFIGURAR'}</span>
                            </button>
                        )}

                        {/* Reset de sesión (solo en modo EXECUTE con estado) */}
                        {mode === 'EXECUTE' && status !== 'IDLE' && (
                            <button
                                className="btn btn--ghost btn--xs"
                                onClick={reset}
                                style={{ fontSize: '9px' }}
                            >
                                <IndraIcon name="SYNC" size="12px" />
                                <span>RESET</span>
                            </button>
                        )}
                    </div>
                }
            />

            <div className="designer-body fill center relative overflow-hidden" style={{ padding: 'var(--space-8)' }}>

                {/* ── MODO CONFIG ── */}
                {mode === 'CONFIG' && (
                    <AEEConfigPanel
                        atom={localAtom}
                        onConfigSaved={({ schemaId, bridgeId }) => {
                            // Actualizar atom local con el payload persistido
                            setLocalAtom(prev => ({
                                ...prev,
                                payload: {
                                    ...prev.payload,
                                    schema_id: schemaId,
                                    bridge_id: bridgeId
                                }
                            }));
                            setMode('EXECUTE');
                        }}
                    />
                )}

                {/* ── MODO EXECUTE ── */}
                {mode === 'EXECUTE' && (
                    <div className="indra-container" style={{ width: '100%', maxWidth: '800px', height: 'fit-content', maxHeight: '100%' }}>
                        <div className="indra-header-label">EXECUTION_ENGINE_PROJECTION</div>

                        {/* Alerta de Drift */}
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
                                        Nuevos campos: {(driftState.details.added_fields || []).length} | Removidos: {(driftState.details.removed_fields || []).length}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Sin configuración → prompt para ir a config */}
                        {!isConfigured && (
                            <div className="fill center stack--tight" style={{ padding: 'var(--space-12)', opacity: 0.5 }}>
                                <IndraIcon name="SETTINGS" size="32px" />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>EJECUTOR_SIN_CONFIGURAR</span>
                                <button
                                    className="btn btn--accent btn--xs"
                                    onClick={() => setMode('CONFIG')}
                                >
                                    CONFIGURAR AHORA
                                </button>
                            </div>
                        )}

                        {isConfigured && isLoadingSchema && (
                            <div className="fill center stack--tight" style={{ padding: 'var(--space-12)', opacity: 0.6 }}>
                                <IndraIcon name="SYNC" size="24px" className="spin" style={{ color: 'var(--color-accent)' }} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>HIDRATANDO_SCHEMA…</span>
                            </div>
                        )}

                        {/* Formulario o resultado */}
                        {isConfigured && !isLoadingSchema && (
                            <main className="fill overflow-auto" style={{ padding: 'var(--space-8)' }}>
                                {status !== 'SUCCESS' && status !== 'ERROR' && status !== 'EXECUTING' ? (
                                    <FormRunner
                                        schema={effectiveSchema || localAtom}
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
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
