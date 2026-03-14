import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useShell } from '../../context/ShellContext';
import { IndraIcon } from '../utilities/IndraIcons';
import { useLexicon } from '../../services/lexicon';
import { DataProjector } from '../../services/DataProjector';
import { ServiceManager } from './ServiceManager/ServiceManager';
import './NexusView.css';

/**
 * NexusView (Nivel 1)
 * Centro de navegación asimétrico: Status sistémico + Selector de Workspaces.
 */
export function NexusView() {
    const { coreUrl } = useProtocol();
    const { lang } = useShell();
    const [isServiceManagerOpen, setIsServiceManagerOpen] = useState(false);
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

    // ── PROYECCIONES AXIOMÁTICAS ──
    const projectedServices = services.map(s => DataProjector.projectService(s)).filter(s => s !== null);
    const projectedWorkspaces = workspaces.map(w => DataProjector.projectWorkspace(w)).filter(w => w !== null);

    return (
        <div className="fill stack nexus-view">

            {/* ── HEADER DE NAVEGACIÓN ── */}
            <div className="spread nexus-header">
                <div className="shelf--loose">
                    <div className="nexus-logo">
                        <IndraIcon name="WORKSPACE" size="32px" style={{ color: 'var(--color-accent)', filter: 'drop-shadow(0 0 8px var(--color-accent-dim))' }} />
                        <div className="nexus-logo__accent"></div>
                    </div>
                    <div className="stack--tight">
                        <h2 className="nexus-title">{t('hud_nexus_control')}</h2>
                        <span className="text-hint" style={{ opacity: 0.5 }}>{t('id_core')}: {coreUrl?.split('/').slice(-1)[0].substring(0, 12)}...</span>
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
                            <span className="util-label">01 //</span>
                            <label className="text-label" style={{ opacity: 0.8 }}>{t('hud_service_fabric')}</label>
                        </div>
                        <div className="stack--tight">
                            {projectedServices.map(svc => (
                                <div key={svc.id} className="shelf service-status-row">
                                    <span className="text-hint" style={{ color: 'white', opacity: 0.7 }}>{svc.label}</span>
                                    <div className="shelf--tight">
                                        <div className="service-dot" style={{
                                            background: svc.isReady ? 'var(--color-accent)' : 'var(--color-warm)',
                                            boxShadow: svc.isReady ? '0 0 5px var(--color-accent)' : '0 0 5px var(--color-warm)'
                                        }}></div>
                                        <span className="text-hint" style={{ fontSize: '8px', opacity: 0.5 }}>
                                            {t(svc.statusLabel.toLowerCase())}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            className="btn btn--ghost btn--full"
                            style={{ fontSize: '9px', marginTop: 'var(--space-2)', borderStyle: 'dashed' }}
                            onClick={() => setIsServiceManagerOpen(true)}
                        >
                            <IndraIcon name="SERVICE" size="12px" />
                            {t('action_manage_services')}
                        </button>
                    </div>

                    <div className="hud-line fill opacity-20"></div>

                    {/* Metadata de Sistema */}
                    <div className="stack--tight">
                        <label className="text-label opacity-60">02 // {t('hud_system_log')}</label>
                        <div className="system-log-area">
                            {`[ ${new Date().toLocaleTimeString()} ] SESSION_RESTORED`}<br />
                            {`[ ${new Date().toLocaleTimeString()} ] MANIFEST_SYNC_OK`}<br />
                            {`[ ${new Date().toLocaleTimeString()} ] IDLE_WATCHDOG_ACTIVE`}
                        </div>
                    </div>

                </aside>

                {/* COLUMNA B: WORKSPACE SELECTION */}
                <main className="stack" style={{ gap: 'var(--space-6)' }}>
                    <div className="shelf--loose">
                        <span className="util-label">// EXPLORER</span>
                        <label className="text-label" style={{ letterSpacing: '0.2em' }}>{t('hud_active_workspaces')}</label>
                        <div className="hud-line fill opacity-30"></div>
                    </div>

                    <div className="grid-auto">
                        {projectedWorkspaces.map(ws => (
                            <div
                                key={ws.id}
                                className="ws-card glass stack"
                                onClick={() => setActiveWorkspace(ws.id)}
                            >
                                {/* Decoración HUD: Esquinas */}
                                <div className="ws-card__deco-tl"></div>
                                <div className="ws-card__deco-br"></div>

                                <div className="spread opacity-40">
                                    <span className="text-hint font-mono" style={{ fontSize: '8px' }}>{t('hud_ws_identity')} // {ws.subtitle}</span>
                                    <span className="text-hint font-mono" style={{ fontSize: '8px' }}>{new Date(ws.updatedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="fill center" style={{ padding: 'var(--space-4) 0' }}>
                                    <h3 className="ws-card__title">{ws.title}</h3>
                                </div>

                                <div className="spread" style={{ marginTop: 'auto', alignItems: 'flex-end' }}>
                                    <div className="stack--tight">
                                        <span className="text-hint font-mono" style={{ fontSize: '9px', opacity: 0.5 }}>{t('hud_pins')}: {ws.pinCount}</span>
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
                            <span className="text-label opacity-50" style={{ marginTop: 'var(--space-4)', fontSize: '10px' }}>{t('action_generate_ws')}</span>
                        </div>
                    </div>
                </main>

            </div>

            {/* Renderizado Condicional del ServiceManager */}
            {isServiceManagerOpen && (
                <ServiceManager onClose={() => setIsServiceManagerOpen(false)} />
            )}
        </div>
    );
}
