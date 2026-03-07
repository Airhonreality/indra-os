import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useShell } from '../../context/ShellContext';
import { IndraIcon } from '../utilities/IndraIcons';
import { useLexicon } from '../../services/lexicon';

/**
 * NexusView (Nivel 1)
 * Centro de navegación asimétrico: Status sistémico + Selector de Workspaces.
 */
export function NexusView() {
    const { coreUrl } = useProtocol();
    const { lang } = useShell();
    const {
        workspaces,
        services,
        setActiveWorkspace,
        hydrateManifest
    } = useWorkspace();

    const t = useLexicon(lang);

    React.useEffect(() => {
        hydrateManifest();
    }, [hydrateManifest]);

    return (
        <div className="fill stack" style={{ padding: 'var(--space-8)', gap: 'var(--space-8)' }}>

            {/* ── HEADER DE NAVEGACIÓN ── */}
            <div className="spread">
                <div className="shelf" style={{ gap: 'var(--space-4)' }}>
                    <div style={{ position: 'relative' }}>
                        <IndraIcon name="WORKSPACE" size="32px" style={{ color: 'var(--color-accent)', filter: 'drop-shadow(0 0 8px var(--color-accent-dim))' }} />
                        <div style={{ position: 'absolute', top: -5, left: -5, width: '10px', height: '10px', borderTop: '2px solid var(--color-accent)', borderLeft: '2px solid var(--color-accent)' }}></div>
                    </div>
                    <div className="stack--tight">
                        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', letterSpacing: '0.2em', margin: 0, color: 'white' }}>{t('hud_nexus_control')}</h2>
                        <span className="text-hint" style={{ fontSize: '9px', opacity: 0.5 }}>{t('id_core')}: {coreUrl?.split('/').slice(-1)[0].substring(0, 12)}...</span>
                    </div>
                </div>
                <div className="shelf">
                    <button className="btn btn--ghost" onClick={() => hydrateManifest()}>
                        <IndraIcon name="SYNC" />
                        {t('action_refresh')}
                    </button>
                </div>
            </div>

            {/* ── LAYOUT ASIMÉTRICO (Grid Split) ── */}
            <div className="grid-split fill" style={{ gridTemplateColumns: '220px 1fr' }}>

                {/* COLUMNA A: STATUS SISTÉMICO */}
                <aside className="stack" style={{ gap: 'var(--space-8)' }}>

                    {/* Status de Servicios */}
                    <div className="stack" style={{ gap: 'var(--space-5)' }}>
                        <div className="shelf--loose">
                            <span style={{ fontSize: '10px', color: 'var(--color-accent)', opacity: 0.5 }}>01 //</span>
                            <label className="text-label" style={{ opacity: 0.8, letterSpacing: '0.1em' }}>{t('hud_service_fabric')}</label>
                        </div>
                        <div className="stack--tight">
                            {services.map(svc => (
                                <div key={svc.id} className="shelf split" style={{
                                    padding: 'var(--space-2) 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)' }}>{svc.handle?.label}</span>
                                    <div className="shelf" style={{ gap: 'var(--space-2)' }}>
                                        <div style={{
                                            width: '5px', height: '5px',
                                            borderRadius: '50%',
                                            background: svc.raw?.needs_setup ? 'var(--color-warm)' : 'var(--color-accent)',
                                            boxShadow: svc.raw?.needs_setup ? '0 0 5px var(--color-warm)' : '0 0 5px var(--color-accent)'
                                        }}></div>
                                        <span style={{ fontSize: '8px', opacity: 0.5, letterSpacing: '0.05em' }}>
                                            {svc.raw?.needs_setup ? t('status_setup') : t('status_ready')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn--ghost btn--full" style={{ fontSize: '9px', marginTop: 'var(--space-2)', borderStyle: 'dashed' }}>
                            <IndraIcon name="SERVICE" size="12px" />
                            {t('action_manage_services')}
                        </button>
                    </div>

                    <div className="hud-line" style={{ width: '100%', opacity: 0.2 }}></div>

                    {/* Metadata de Sistema */}
                    <div className="stack--tight">
                        <label className="text-label" style={{ opacity: 0.6, fontSize: '10px' }}>02 // {t('hud_system_log')}</label>
                        <div className="text-hint" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.3, lineHeight: '1.6' }}>
                            {`[ ${new Date().toLocaleTimeString()} ] SESSION_RESTORED`}<br />
                            {`[ ${new Date().toLocaleTimeString()} ] MANIFEST_SYNC_OK`}<br />
                            {`[ ${new Date().toLocaleTimeString()} ] IDLE_WATCHDOG_ACTIVE`}
                        </div>
                    </div>

                </aside>

                {/* COLUMNA B: WORKSPACE SELECTION */}
                <main className="stack" style={{ gap: 'var(--space-6)' }}>
                    <div className="shelf--loose">
                        <span style={{ fontSize: '10px', color: 'var(--color-accent)', opacity: 0.5 }}>// EXPLORER</span>
                        <label className="text-label" style={{ letterSpacing: '0.2em' }}>{t('hud_active_workspaces')}</label>
                        <div className="hud-line fill" style={{ opacity: 0.3 }}></div>
                    </div>

                    <div className="grid-auto">
                        {workspaces.map(ws => (
                            <div
                                key={ws.id}
                                className="ws-card glass stack"
                                onClick={() => setActiveWorkspace(ws.id)}
                            >
                                {/* Decoración HUD: Esquinas */}
                                <div className="ws-card__deco-tl"></div>
                                <div className="ws-card__deco-br"></div>

                                <div className="spread" style={{ opacity: 0.4 }}>
                                    <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{t('hud_ws_identity')} // {ws.id.substring(0, 6)}</span>
                                    <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>{new Date(ws.updated_at).toLocaleDateString()}</span>
                                </div>

                                <div className="fill center" style={{ padding: 'var(--space-4) 0' }}>
                                    <h3 className="ws-card__title">{ws.handle?.label || 'UNNAMED'}</h3>
                                </div>

                                <div className="spread" style={{ marginTop: 'auto', alignItems: 'flex-end' }}>
                                    <div className="stack--tight">
                                        <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{t('hud_pins')}: {ws.pins?.length || 0}</span>
                                        <div style={{ width: '40px', height: '2px', background: 'var(--color-accent)', opacity: 0.3 }}></div>
                                    </div>

                                    <button className="btn btn--accent btn--mini" style={{ padding: '4px 12px', fontSize: '9px' }}>
                                        {t('action_activate')}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Botón de nuevo Workspace */}
                        <div className="ws-card ws-card--new center stack" style={{ minHeight: '160px' }}>
                            <div className="center" style={{
                                width: '48px', height: '48px',
                                borderRadius: '50%', border: '1px dashed var(--color-border-strong)',
                                color: 'var(--color-border-strong)'
                            }}>
                                <IndraIcon name="PLUS" size="24px" />
                            </div>
                            <span className="text-label" style={{ marginTop: 'var(--space-4)', fontSize: '10px', opacity: 0.5 }}>{t('action_generate_ws')}</span>
                        </div>
                    </div>
                </main>

            </div>

            <style>{`
                .ws-card {
                    position: relative;
                    min-height: 180px;
                    padding: var(--space-5);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(255,255,255,0.05);
                    overflow: hidden;
                    background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%);
                }
                .ws-card:hover {
                    border-color: var(--color-accent-dim);
                    background: rgba(var(--color-accent-rgb), 0.05);
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .ws-card__title {
                    font-family: var(--font-mono);
                    font-size: 28px;
                    color: var(--color-accent);
                    margin: 0;
                    text-shadow: 0 0 15px var(--color-accent-dim);
                    letter-spacing: -0.02em;
                    transition: all 0.3s ease;
                }
                .ws-card:hover .ws-card__title {
                    letter-spacing: 0.05em;
                    color: white;
                }
                .ws-card__deco-tl {
                    position: absolute;
                    top: 0; left: 0;
                    width: 20px; height: 20px;
                    border-top: 1px solid var(--color-accent);
                    border-left: 1px solid var(--color-accent);
                    opacity: 0.3;
                }
                .ws-card__deco-br {
                    position: absolute;
                    bottom: 0; right: 0;
                    width: 20px; height: 20px;
                    border-bottom: 1px solid var(--color-accent);
                    border-right: 1px solid var(--color-accent);
                    opacity: 0.3;
                }
                .ws-card--new {
                    border: 1px dashed var(--color-border-strong);
                    background: transparent;
                }
                .ws-card--new:hover {
                    border-style: solid;
                    border-color: var(--color-accent);
                }
                .btn--mini {
                    border-radius: 0;
                    clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 30%);
                }
            `}</style>
        </div>
    );
}
