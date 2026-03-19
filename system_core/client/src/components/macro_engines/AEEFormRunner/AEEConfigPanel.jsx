/**
 * =============================================================================
 * ARTEFACTO: AEEConfigPanel.jsx
 * RESPONSABILIDAD: Configuración del Ejecutor Operativo (AEE).
 *
 * DHARMA:
 *   - Modo CONFIG: selección de Schema fuente + Bridge ejecutor.
 *   - Modo READY: preview del formulario configurado + generación de link público.
 *   - Un AEE configurado genera un link micelar único que proyecta el formulario
 *     puro sin ningún panel de configuración ni workspace visible.
 *
 * AXIOMA DE DOS MODOS:
 *   [WORKSPACE]  → Editor con configuración visible (este panel).
 *   [LINK PÚBLICO] → Solo el formulario, sin UI de workspace.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useAppState } from '../../../state/app_state';
import { executeDirective } from '../../../services/directive_executor';
import { toastEmitter } from '../../../services/toastEmitter';

/**
 * Selector de átomo por clase — proyecta los pins del workspace activo
 * filtrando por la clase indicada.
 */
function AtomSelector({ label, atomClass, value, onSelect }) {
    const pins = useAppState(s => s.pins);
    const filtered = pins.filter(p => p.class === atomClass);

    return (
        <div className="stack--tight">
            <label style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
            </label>
            <select
                value={value || ''}
                onChange={e => onSelect(e.target.value || null)}
                style={{
                    width: '100%',
                    background: 'var(--color-bg-deep)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: 'var(--space-2) var(--space-3)',
                    cursor: 'pointer'
                }}
            >
                <option value="">-- SELECCIONAR --</option>
                {filtered.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.handle?.label || p.id}
                    </option>
                ))}
            </select>
            {filtered.length === 0 && (
                <span style={{ fontSize: '9px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>
                    No hay {atomClass} en este Workspace.
                </span>
            )}
        </div>
    );
}

export function AEEConfigPanel({ atom, onConfigSaved }) {
    const { coreUrl, sessionSecret, updateArtifact } = useAppState();

    const [schemaId, setSchemaId] = React.useState(atom?.payload?.schema_id || null);
    const [executorId, setExecutorId] = React.useState(atom?.payload?.executor_id || atom?.payload?.bridge_id || null);
    const [executorType, setExecutorType] = React.useState(atom?.payload?.executor_type || 'BRIDGE');
    const [isSaving, setIsSaving] = React.useState(false);
    const [shareUrl, setShareUrl] = React.useState(null);
    const [isGeneratingLink, setIsGeneratingLink] = React.useState(false);

    const pins = useAppState(s => s.pins);
    const selectedSchema = pins.find(p => p.id === schemaId);
    const selectedExecutor = pins.find(p => p.id === executorId);

    const isConfigured = !!schemaId && !!executorId;
    const isDirty = schemaId !== (atom?.payload?.schema_id || null)
        || executorId !== (atom?.payload?.executor_id || atom?.payload?.bridge_id || null)
        || executorType !== (atom?.payload?.executor_type || 'BRIDGE');

    const handleSave = async () => {
        if (!isConfigured) return;
        setIsSaving(true);
        try {
            await updateArtifact(atom.id, atom.provider, {
                payload: {
                    ...atom.payload,
                    schema_id: schemaId,
                    executor_id: executorId,
                    executor_type: executorType,
                    // Compat legacy
                    bridge_id: executorType === 'BRIDGE' ? executorId : null,
                }
            });
            toastEmitter.success('Configuración guardada');
            onConfigSaved?.({ schemaId, executorId, executorType });
        } catch (err) {
            toastEmitter.error('Error al guardar configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateLink = async () => {
        if (!isConfigured || isDirty) {
            toastEmitter.warning('Guarda la configuración antes de publicar.');
            return;
        }
        setIsGeneratingLink(true);
        setShareUrl(null);
        try {
            const res = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_SHARE_CREATE',
                data: {
                    artifact_id: atom.id,
                    artifact_class: atom.class,
                    auth_mode: 'public'
                }
            }, coreUrl, sessionSecret);

            if (res.metadata?.status === 'OK' && res.items?.[0]) {
                const ticketId = res.items[0].ticket_id;
                const url = `${window.location.origin}${window.location.pathname}?u=${encodeURIComponent(coreUrl)}&id=${ticketId}`;
                setShareUrl(url);
                await navigator.clipboard.writeText(url);
                toastEmitter.success('¡Link copiado al portapapeles!');
            } else {
                throw new Error(res.metadata?.error || 'SHARE_CREATE_FAILED');
            }
        } catch (err) {
            toastEmitter.error(`Error al generar link: ${err.message}`);
        } finally {
            setIsGeneratingLink(false);
        }
    };

    return (
        <div className="stack" style={{ gap: 'var(--space-6)', maxWidth: '560px', width: '100%' }}>

            {/* ── HEADER ── */}
            <div className="stack--tight">
                <div className="shelf--tight">
                    <IndraIcon name="PLAY" size="14px" style={{ color: 'var(--color-success)' }} />
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.15em' }}>
                        AEE // CONFIGURACIÓN DEL EJECUTOR
                    </span>
                </div>
                <p style={{ fontSize: '11px', opacity: 0.5, lineHeight: '1.5' }}>
                    Vincula un <strong>Esquema</strong> (define los campos del formulario) y un <strong>Bridge</strong> (define la lógica de ejecución). Una vez configurado, genera un link público que proyecta solo el formulario.
                </p>
            </div>

            {/* ── SELECCIÓN DE SCHEMA ── */}
            <div className="indra-container stack" style={{ gap: 'var(--space-3)' }}>
                <div className="indra-header-label" style={{ color: 'var(--color-warm)' }}>
                    <IndraIcon name="SCHEMA" size="10px" /> FUENTE DE DATOS (SCHEMA)
                </div>
                <AtomSelector
                    label="Esquema de datos que define los campos del formulario"
                    atomClass="DATA_SCHEMA"
                    value={schemaId}
                    onSelect={setSchemaId}
                />
                {selectedSchema && (
                    <div className="shelf--tight" style={{ opacity: 0.6 }}>
                        <IndraIcon name="CHECK" size="10px" style={{ color: 'var(--color-success)' }} />
                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                            {selectedSchema.handle?.label} vinculado
                        </span>
                    </div>
                )}
            </div>

            {/* ── SELECCIÓN DE EJECUTOR ── */}
            <div className="indra-container stack" style={{ gap: 'var(--space-3)' }}>
                <div className="indra-header-label" style={{ color: 'var(--color-accent)' }}>
                    <IndraIcon name="PLAY" size="10px" /> LÓGICA DE EJECUCIÓN (EXECUTOR)
                </div>

                {/* Toggle Bridge / Workflow */}
                <div className="shelf--tight" style={{ gap: 'var(--space-2)' }}>
                    {[{ type: 'BRIDGE', label: 'Bridge', desc: 'Transformación en memoria', color: 'var(--color-cold)' },
                      { type: 'WORKFLOW', label: 'Workflow', desc: 'Secuencia con efectos externos', color: 'var(--color-success)' }
                    ].map(opt => (
                        <button
                            key={opt.type}
                            className={`btn btn--xs ${executorType === opt.type ? 'btn--accent' : 'btn--ghost'}`}
                            onClick={() => { setExecutorType(opt.type); setExecutorId(null); }}
                            style={{ fontSize: '9px', borderColor: executorType === opt.type ? opt.color : undefined, color: executorType === opt.type ? opt.color : undefined }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <p style={{ fontSize: '9px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>
                    {executorType === 'BRIDGE' ? 'Transformación pura en memoria. No tiene efectos externos.' : 'Secuencia orquestada. Puede escribir en Drive, enviar emails, generar PDFs.'}
                </p>

                <AtomSelector
                    label={`${executorType === 'BRIDGE' ? 'Bridge' : 'Workflow'} que se ejecutará al enviar el formulario`}
                    atomClass={executorType}
                    value={executorId}
                    onSelect={setExecutorId}
                />
                {selectedExecutor && (
                    <div className="shelf--tight" style={{ opacity: 0.6 }}>
                        <IndraIcon name="CHECK" size="10px" style={{ color: 'var(--color-success)' }} />
                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                            {selectedExecutor.handle?.label} vinculado ({executorType})
                        </span>
                    </div>
                )}
            </div>

            {/* ── ACCIONES ── */}
            <div className="shelf" style={{ gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button
                    className="btn btn--accent"
                    onClick={handleSave}
                    disabled={!isConfigured || isSaving || !isDirty}
                    style={{ fontSize: '10px', letterSpacing: '0.1em' }}
                >
                    {isSaving
                        ? <><IndraIcon name="SYNC" size="12px" className="spin" /> GUARDANDO…</>
                        : <><IndraIcon name="CHECK" size="12px" /> GUARDAR CONFIGURACIÓN</>
                    }
                </button>
            </div>

            {/* ── PUBLICAR LINK ── */}
            {isConfigured && !isDirty && (
                <div className="indra-container stack" style={{ gap: 'var(--space-4)', borderColor: 'var(--color-success)', background: 'rgba(0, 255, 128, 0.03)' }}>
                    <div className="indra-header-label" style={{ color: 'var(--color-success)' }}>
                        <IndraIcon name="LINK" size="10px" /> PUBLICAR FORMULARIO
                    </div>
                    <p style={{ fontSize: '10px', opacity: 0.6, lineHeight: '1.5' }}>
                        Genera un link público que abre el formulario puro — sin workspace, sin configuración. Cualquier persona con el link puede llenarlo y ejecutar el flujo.
                    </p>

                    <button
                        className="btn btn--accent"
                        onClick={handleGenerateLink}
                        disabled={isGeneratingLink}
                        style={{ fontSize: '10px', letterSpacing: '0.1em', borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'rgba(0, 255, 128, 0.08)' }}
                    >
                        {isGeneratingLink
                            ? <><IndraIcon name="SYNC" size="12px" className="spin" /> GENERANDO LINK…</>
                            : <><IndraIcon name="LINK" size="12px" /> GENERAR Y COPIAR LINK PÚBLICO</>
                        }
                    </button>

                    {shareUrl && (
                        <div className="stack--tight" style={{ background: 'var(--color-bg-void)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-success)' }}>
                            <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>LINK ACTIVO:</span>
                            <div className="shelf--tight">
                                <span style={{
                                    fontSize: '9px',
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--color-success)',
                                    wordBreak: 'break-all',
                                    flex: 1
                                }}>{shareUrl}</span>
                                <button
                                    className="btn btn--ghost btn--xs"
                                    onClick={() => { navigator.clipboard.writeText(shareUrl); toastEmitter.success('Copiado'); }}
                                    title="Copiar URL"
                                >
                                    <IndraIcon name="COPY" size="10px" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isConfigured && isDirty && (
                <div className="shelf--tight" style={{ opacity: 0.5 }}>
                    <IndraIcon name="WARN" size="10px" />
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                        Guarda la configuración para poder publicar.
                    </span>
                </div>
            )}
        </div>
    );
}
