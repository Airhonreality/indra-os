import React, { useState } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';

/**
 * NexusView (Nivel 1)
 * Centro de navegación asimétrico: Status sistémico + Selector de Workspaces.
 */
export function NexusView() {
    const setActiveWorkspace = useAppState((s) => s.setActiveWorkspace);
    const coreUrl = useAppState((s) => s.coreUrl);

    const workspaces = useAppState((s) => s.workspaces);
    const services = useAppState((s) => s.services);
    const hydrateManifest = useAppState((s) => s.hydrateManifest);

    React.useEffect(() => {
        hydrateManifest();
    }, [hydrateManifest]);

    return (
        <div className="fill stack" style={{ padding: 'var(--space-8)', gap: 'var(--space-8)' }}>

            {/* ── HEADER DE NAVEGACIÓN ── */}
            <div className="spread">
                <div className="shelf" style={{ gap: 'var(--space-4)' }}>
                    <IndraIcon name="WORKSPACE" size="32px" style={{ color: 'var(--color-accent)' }} />
                    <div className="stack--tight">
                        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', letterSpacing: '0.2em', margin: 0 }}>NEXUS_CONTROL</h2>
                        <span className="text-hint" style={{ fontSize: '9px' }}>CORE_ID: {coreUrl?.split('/').slice(-1)[0].substring(0, 12)}...</span>
                    </div>
                </div>
                <div className="shelf">
                    <button className="btn btn--ghost">
                        <IndraIcon name="SYNC" />
                        REFRESH_PULSE
                    </button>
                </div>
            </div>

            {/* ── LAYOUT ASIMÉTRICO (Grid Split) ── */}
            <div className="grid-split fill">

                {/* COLUMNA A: STATUS SISTÉMICO */}
                <aside className="stack" style={{ gap: 'var(--space-8)' }}>

                    {/* Status de Servicios */}
                    <div className="stack" style={{ gap: 'var(--space-4)' }}>
                        <label className="text-label" style={{ opacity: 0.6 }}>01 // SERVICE_FABRIC</label>
                        <div className="stack--tight">
                            {services.map(svc => (
                                <div key={svc.id} className="shelf split" style={{
                                    padding: 'var(--space-2) 0',
                                    borderBottom: '1px solid var(--color-border)',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>{svc.handle?.label}</span>
                                    <div className="shelf" style={{ gap: 'var(--space-2)' }}>
                                        <div style={{
                                            width: '6px', height: '6px',
                                            borderRadius: '50%',
                                            background: svc.raw?.needs_setup ? 'var(--color-warm)' : 'var(--color-accent)',
                                            boxShadow: svc.raw?.needs_setup ? '0 0 5px var(--color-warm)' : '0 0 5px var(--color-accent)'
                                        }}></div>
                                        <span style={{ fontSize: '9px', opacity: 0.5 }}>{svc.raw?.needs_setup ? 'SETUP' : 'READY'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn--ghost btn--full" style={{ fontSize: '10px', marginTop: 'var(--space-2)' }}>
                            <IndraIcon name="SERVICE" size="12px" />
                            MANAGE_INTEGRATIONS
                        </button>
                    </div>

                    {/* Línea HUD decorativa */}
                    <div className="hud-line" style={{ width: '100%' }}></div>

                    {/* Metadata de Sistema */}
                    <div className="stack--tight">
                        <label className="text-label" style={{ opacity: 0.6 }}>02 // SYSTEM_LOG</label>
                        <div className="text-hint" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.4 }}>
                            [ 00:42:15 ] AUTH_ESTABLISHED<br />
                            [ 00:42:16 ] FETCH_WORKSPACES_SUCCESS<br />
                            [ 00:42:18 ] SERVICE_SYNC_IDLE
                        </div>
                    </div>

                </aside>

                {/* COLUMNA B: WORKSPACE SELECTION */}
                <main className="stack" style={{ gap: 'var(--space-6)' }}>
                    <div className="spread">
                        <label className="text-label">ACTIVE_WORKSPACES</label>
                        <div className="hud-line fill" style={{ margin: '0 var(--space-4)' }}></div>
                    </div>

                    <div className="grid-auto">
                        {workspaces.map(ws => (
                            <div
                                key={ws.id}
                                className="slot-small glass-light stack"
                                style={{
                                    cursor: 'pointer',
                                    borderLeft: '4px solid transparent',
                                    transition: 'all 0.2s ease',
                                    minHeight: '130px',
                                    padding: 'var(--space-4)'
                                }}
                                onClick={() => setActiveWorkspace(ws.id)}
                            >
                                <div className="stack--tight" style={{ gap: '2px' }}>
                                    <div className="shelf" style={{ gap: 'var(--space-2)', marginBottom: '4px' }}>
                                        <div style={{ width: '6px', height: '6px', background: 'var(--color-accent)', borderRadius: '1px', opacity: 0.4 }}></div>
                                        <span className="text-hint" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>NODE_ID_{ws.id.substring(0, 4).toUpperCase()}</span>
                                    </div>

                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '18px',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--color-accent)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {ws.handle?.label || 'UNNAMED_CORE'}
                                    </h3>

                                    <div className="shelf" style={{ gap: 'var(--space-2)', opacity: 0.5, marginTop: 'var(--space-1)' }}>
                                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>[{ws.pins?.length || 0} PINS]</span>
                                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>[{new Date(ws.updated_at).toLocaleDateString()}]</span>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: 'auto',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center'
                                }}>
                                    <div className="btn btn--ghost" style={{
                                        padding: '2px 8px',
                                        fontSize: '8px',
                                        borderColor: 'rgba(var(--color-accent-rgb), 0.1)',
                                        letterSpacing: '0.1em'
                                    }}>
                                        INITIALIZE_SEQUENCES
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Botón de nuevo Workspace */}
                        <div className="slot-small glass-light center stack" style={{
                            border: '1px dashed var(--color-border-strong)',
                            cursor: 'pointer',
                            opacity: 0.4,
                            minHeight: '140px',
                            justifyContent: 'center'
                        }}>
                            <IndraIcon name="PLUS" size="20px" />
                            <span className="text-label" style={{ marginTop: 'var(--space-2)', fontSize: '10px' }}>GENERATE_NEW_WS</span>
                        </div>
                    </div>
                </main>

            </div>

            <style>{`
                .slot-small:hover {
                    border-left-color: var(--color-accent) !important;
                    background: var(--color-accent-dim) !important;
                    transform: translateY(-2px);
                }
                .btn:hover {
                    filter: drop-shadow(0 0 5px var(--color-accent-dim));
                }
            `}</style>
        </div>
    );
}
