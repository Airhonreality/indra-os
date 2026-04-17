import React, { useState, useEffect } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useShell } from '../../context/ShellContext';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useLexicon } from '../../services/lexicon';
import { DataProjector } from '../../services/DataProjector';
import { useAppState } from '../../state/app_state';
import './NexusView.css';

import { IndraMacroHeader } from '../utilities/IndraMacroHeader';
import { KeychainManager } from './KeychainManager';

/**
 * =============================================================================
 * INDRA NEXUS VIEW (POST-AUTHENTICATION ZONE)
 * =============================================================================
 * AVISO ARQUITECTÓNICO: Este componente vive en el Espacio Seguro.
 * NUNCA importar lógica de aquí hacia la LandingView.
 * La Landing es pre-auth; el Nexus es post-auth. Mantener este muro de Berlín.
 * =============================================================================
 */
export function NexusView() {
    const { coreUrl } = useProtocol();
    const { lang } = useShell();
    const openServiceManager = useAppState(s => s.openServiceManager);
    
    // Virtual Atom para el Header Canónico
    const nexusAtom = {
        id: 'nexus',
        class: 'WORKSPACE',
        handle: { label: 'CONTROL_NEXUS' }
    };
    const {
        workspaces,
        services,
        setActiveWorkspace,
        deleteWorkspace,
        createWorkspace,
        hydrateManifest
    } = useWorkspace();

    const [isCreating, setIsCreating] = useState(false);
    const [showKeychain, setShowKeychain] = useState(false);

    const t = useLexicon(lang);

    useEffect(() => {
        hydrateManifest();
    }, [hydrateManifest]);

    // ── PROYECCIONES AXIOMÁTICAS ──
    const projectedServices = services.map(s => DataProjector.projectService(s)).filter(s => s !== null);
    const projectedWorkspaces = workspaces.map(w => DataProjector.projectWorkspace(w)).filter(w => w !== null);

    return (
        <div className="fill stack nexus-view">

            {/* ── HEADER DE NAVEGACIÓN ── */}
            {/* ── HEADER CANÓNICO INDRA ── */}
            <IndraMacroHeader 
                atom={nexusAtom}
                rightSlot={
                    <div className="shelf--tight">
                        <button className="btn btn--ghost btn--mini" onClick={() => hydrateManifest()}>
                            <IndraIcon name="SYNC" size="12px" />
                            <span style={{ marginLeft: '6px', fontSize: '9px' }}>{t('action_refresh')}</span>
                        </button>
                        <button 
                            className="btn btn--ghost btn--mini" 
                            style={{ color: 'var(--color-warm)', border: '1px solid rgba(255, 100, 100, 0.2)' }}
                            onClick={() => {
                                if (window.confirm('¿Deseas cerrar la sesión activa y desconectar el satélite?')) {
                                    useAppState.getState().disconnect();
                                }
                            }}
                        >
                            <span style={{ marginRight: '6px' }}>🚪</span>
                            <span style={{ fontSize: '9px' }}>{t('action_logout') || 'CERRAR_SESIÓN'}</span>
                        </button>
                    </div>
                }
            />

            {/* ── LAYOUT ASIMÉTRICO (Grid Split) ── */}
            <div className="grid-split fill" style={{ gridTemplateColumns: '220px 1fr' }}>

                {/* COLUMNA A: STATUS SISTÉMICO */}
                <aside className="stack" style={{ gap: 'var(--space-8)' }}>

                    {/* Monitoreo del Núcleo (Core Status) */}
                    <div className="stack" style={{ gap: 'var(--space-4)' }}>
                        <div className="shelf--loose">
                            <span className="util-label">01 //</span>
                            <label className="text-label" style={{ opacity: 0.8 }}>IDENTIDAD_CORE</label>
                        </div>
                        <div className="glass-light stack--tight" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div className="shelf">
                                <span className="text-label" style={{ color: 'var(--color-accent)', fontSize: '11px' }}>
                                    {useAppState.getState().coreRegistry.find(c => c.url === coreUrl)?.alias || 'CORE_ACTIVO'}
                                </span>
                                <div className="service-dot breathing-pulse" style={{ background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }}></div>
                            </div>
                            <span className="text-hint truncate" style={{ fontSize: '9px', opacity: 0.5 }}>{useAppState.getState().coreId}</span>
                            
                            <button 
                                className="btn btn--ghost btn--mini btn--full" 
                                style={{ marginTop: 'var(--space-3)', fontSize: '9px' }}
                                onClick={() => {
                                    // Cambiamos de núcleo sin cerrar sesión total si hay varios
                                    useAppState.getState().resetConnectionState();
                                }}
                            >
                                <IndraIcon name="LINK" size="10px" />
                                CONMUTAR_NÚCLEO
                            </button>
                            <button 
                                className="btn btn--ghost btn--mini btn--full" 
                                style={{ marginTop: 'var(--space-2)', fontSize: '9px', border: '1px solid rgba(66, 133, 244, 0.3)' }}
                                onClick={() => setShowKeychain(true)}
                            >
                                <span style={{ marginRight: '6px' }}>🔑</span>
                                GESTIÓN DE LLAVES
                            </button>
                        </div>
                    </div>

                    {/* Lista de Conectores Activos */}
                    <div className="stack" style={{ gap: 'var(--space-5)' }}>
                        <div className="shelf--loose">
                            <span className="util-label">02 //</span>
                            <label className="text-label" style={{ opacity: 0.8 }}>CONECTORES ACTIVOS</label>
                        </div>
                        <div className="stack--tight">
                            {projectedServices.map(svc => (
                                <div key={svc.id} className="shelf service-status-row">
                                    <span className="text-hint" style={{ color: 'white', opacity: 0.7 }}>{svc.label}</span>
                                    <div className="shelf--tight">
                                        <div className="service-dot breathing-pulse" style={{
                                            background: svc.isReady ? 'var(--color-success)' : 'var(--color-warm)',
                                            boxShadow: svc.isReady ? '0 0 10px var(--color-success)' : '0 0 10px var(--color-warm)',
                                            opacity: svc.isReady ? 1 : 0.6
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
                            onClick={() => openServiceManager()}
                        >
                            <IndraIcon name="SERVICE" size="12px" />
                            GESTOR DE CONECTORES
                        </button>
                    </div>

                    <div className="hud-line fill opacity-20"></div>

                    {/* Metadata de Sistema */}
                    <div className="stack--tight">
                        <label className="text-label opacity-60">02 // {t('hud_system_log')}</label>
                        <div className="system-log-area terminal-inset" style={{ padding: 'var(--space-3)', height: '100px', overflowY: 'auto', fontSize: '10px', color: 'var(--color-accent)', opacity: 0.8 }}>
                            {`[ ${new Date().toLocaleTimeString()} ] SESSION_RESTORED`}<br />
                            {`[ ${new Date().toLocaleTimeString()} ] MANIFEST_SYNC_OK`}<br />
                            {`[ ${new Date().toLocaleTimeString()} ] IDLE_WATCHDOG_ACTIVE`}
                        </div>
                    </div>

                </aside>

                {/* COLUMNA B: WORKSPACE SELECTION */}
                <main className="stack" style={{ gap: 'var(--space-6)' }}>
                    <div className="shelf--loose">
                        <span className="util-label">// {t('ui_explorer')}</span>
                        <label className="text-label" style={{ letterSpacing: '0.2em' }}>{t('ui_hud_active_workspaces')}</label>
                        <div className="hud-line fill opacity-30"></div>
                    </div>

                    <div className="grid-auto">
                        {projectedWorkspaces.map(ws => (
                            <div
                                key={ws.id}
                                className="ws-card glass resonance-glow--agency stack"
                                onClick={() => setActiveWorkspace(ws.id)}
                                style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
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

                                    <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                                        <IndraActionTrigger
                                            variant="destructive"
                                            label={t('action_delete_ws')}
                                            onClick={() => deleteWorkspace(ws.id)}
                                            size="10px"
                                        />
                                        <button
                                            className="btn btn--accent btn--mini"
                                            style={{ padding: '4px 12px', fontSize: '9px' }}
                                            onClick={(e) => { e.stopPropagation(); setActiveWorkspace(ws.id); }}
                                        >
                                            {t('action_activate')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Botón de nuevo Workspace o Spinner de Materialización */}
                        {isCreating ? (
                            <div className="ws-card center stack" style={{ minHeight: '160px', border: '1px solid var(--color-accent)', background: 'rgba(0, 255, 200, 0.05)' }}>
                                <div className="ast-resonance--syncing" style={{ fontSize: '24px', marginBottom: 'var(--space-4)' }}>
                                    <IndraIcon name="SYNC" size="32px" />
                                </div>
                                <span className="text-label" style={{ color: 'var(--color-accent)', letterSpacing: '0.2em' }}>
                                    {t('status_materializing')}
                                </span>
                            </div>
                        ) : (
                            <div 
                                className="ws-card ws-card--new center stack ripple" 
                                style={{ minHeight: '160px', cursor: 'pointer' }}
                                onClick={async () => {
                                    setIsCreating(true);
                                    try {
                                        const newWS = await createWorkspace();
                                        if (newWS) setActiveWorkspace(newWS.id);
                                    } catch (err) {
                                        // app_state already toasted the error
                                    } finally {
                                        setIsCreating(false);
                                    }
                                }}
                            >
                                <div className="center" style={{
                                    width: '48px', height: '48px',
                                    borderRadius: '50%', border: '1px dashed var(--color-border-strong)',
                                    color: 'var(--color-border-strong)'
                                }}>
                                    <IndraIcon name="PLUS" size="24px" />
                                </div>
                                <span className="text-label opacity-50" style={{ marginTop: 'var(--space-4)', fontSize: '10px' }}>{t('action_generate_ws')}</span>
                            </div>
                        )}
                    </div>
                </main>

            </div>

            {/* OVERLAY: GESTIÓN DE LLAVES (KEYCHAIN) */}
            {showKeychain && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 5000,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '40px'
                }}>
                    <div className="glass stack" style={{ 
                        width: '100%', maxWidth: '900px', maxHeight: '90vh', 
                        overflowY: 'auto', position: 'relative', border: '1px solid var(--color-accent)',
                        boxShadow: '0 0 50px rgba(0, 255, 200, 0.2)'
                    }}>
                        <div className="shelf" style={{ padding: 'var(--space-4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <label className="text-label" style={{ opacity: 0.8 }}>GESTIÓN DE LLAVES // ACCESO SATELLITE</label>
                            <button 
                                className="btn btn--mini btn--ghost" 
                                style={{ marginLeft: 'auto' }}
                                onClick={() => setShowKeychain(false)}
                            >
                                <span style={{ marginRight: '6px' }}>✕</span> CERRAR
                            </button>
                        </div>
                        <div style={{ padding: 'var(--space-4)' }}>
                            <KeychainManager />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
