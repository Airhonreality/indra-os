import React, { useEffect } from 'react';
import { useProtocol } from './context/ProtocolContext';
import { useWorkspace } from './context/WorkspaceContext';
import { useShell } from './context/ShellContext';
import { CoreConnectionView } from './components/shell/CoreConnectionView';
import { NexusView } from './components/shell/NexusView';
import { WorkspaceDashboard } from './components/dashboard/WorkspaceDashboard';
import { IndraIcon } from './components/utilities/IndraIcons';
import { registry } from './services/EngineRegistry';
import './services/EngineBoot';
import { DesignerBridge } from './services/CapabilityBridge';
import { ToastProvider } from './components/utilities/primitives/ToastNotification';
import { useAppState } from './state/app_state';
import { ServiceManager } from './components/shell/ServiceManager/ServiceManager';
import { DiagnosticHub } from './components/macro_engines/DiagnosticHub';
import { LandingView } from './components/shell/Landing/LandingView';
import { NeuralSplitter } from './context/NeuralSplitter';
import { Spinner } from './components/utilities/primitives/Spinner';
import { useLexicon } from './services/lexicon';
import { SacredField } from './components/utilities/SacredField';
import { ManifestResolver } from './components/shell/ManifestResolver';
import './styles/ui_invoke.css';

/**
 * EngineViewport
 * Componente dedicado a la renderización del Nivel 3 (Macro Engine).
 * Encapsula sus propios hooks para evitar violar las reglas de React en el orquestador.
 */
function EngineViewport({ activeArtifact, closeArtifact, coreUrl, sessionSecret, lang, registerSync, finishSync }) {
    const Engine = registry.get(activeArtifact.class);
    const isSyncing = !!useAppState(s => s.pendingSyncs[activeArtifact.id]);
    
    // El puente se instancia una vez por ciclo de vida del EngineView
    const bridge = React.useMemo(() => new DesignerBridge(
        activeArtifact,
        { 
            close: closeArtifact,
            onSyncStart: (id) => registerSync(id),
            onSyncEnd: (id) => finishSync(id)
        },
        { url: coreUrl, secret: sessionSecret, lang: lang || 'es' }
    ), [activeArtifact, closeArtifact, coreUrl, sessionSecret, lang, registerSync, finishSync]);

    if (!Engine) {
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'white' }}>
                <IndraIcon name="ATOM" size="64px" style={{ opacity: 0.1, marginBottom: 'var(--space-8)' }} />
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0.5 }}>UNKNOWN_ENGINE_FOR_CLASS: {activeArtifact.class}</h2>
                <button className="btn btn--ghost" onClick={() => closeArtifact()}>CLOSE_VOID</button>
            </div>
        );
    }

    return (
        <div 
            data-resonance={isSyncing ? "active" : "idle"}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: 100 }}
        >
            {/* BOTÓN DE ESCAPE PARA INVITADOS (MICELLAR EXIT) */}
            {sessionSecret === 'PUBLIC_GRANT' && (
                <button 
                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '20px',
                        zIndex: 2000,
                        background: 'var(--color-danger)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(255,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <IndraIcon name="CLOSE" size="10px" />
                    ABANDONAR PROYECCIÓN
                </button>
            )}

            {/* LÍNEA DE RESONANCIA GLOBAL (Top Bar) */}
            {isSyncing && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'var(--indra-dynamic-accent, var(--color-accent))',
                    zIndex: 1000,
                    boxShadow: '0 0 10px var(--indra-dynamic-accent)',
                    animation: 'indra-scan-line 1.5s infinite linear'
                }} />
            )}

            {/* VELO DE MATERIALIZACIÓN (Transmisión de Datos) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'var(--color-bg-void)',
                opacity: isSyncing ? 0.3 : 0,
                pointerEvents: isSyncing ? 'all' : 'none',
                transition: 'opacity 0.4s ease',
                zIndex: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {isSyncing && (
                    <div className="center stack--tight" style={{ color: 'var(--indra-dynamic-accent)' }}>
                        <IndraIcon name="SYNC" size="32px" className="spin" />
                        <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.2em', marginTop: '12px' }}>GUARDANDO_EN_CORE</span>
                    </div>
                )}
            </div>

            <Engine key={activeArtifact.id} atom={activeArtifact} bridge={bridge} />
        </div>
    );
}

/**
 * InvokePortal
 * Componente que proyecta un motor React sobre el satélite.
 */
function InvokePortal({ activeArtifact, closeArtifact, coreUrl, sessionSecret, lang, registerSync, finishSync }) {
    if (!activeArtifact?._invoke_id) return null;

    return (
        <div className="indra-invoke-overlay">
            <div className="indra-invoke-portal">
                <div className="indra-invoke-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IndraIcon name="RESONANCE" size="14px" />
                        <span style={{ marginLeft: '10px' }}>INVOKE_PORTAL :: {activeArtifact.class}</span>
                    </div>
                    <button className="indra-invoke-close" onClick={() => closeArtifact()}>
                        <IndraIcon name="CLOSE" size="12px" />
                        SALIR_DEL_PORTAL
                    </button>
                </div>
                <div className="indra-invoke-content">
                    <EngineViewport 
                        activeArtifact={activeArtifact}
                        closeArtifact={closeArtifact}
                        coreUrl={coreUrl}
                        sessionSecret={sessionSecret}
                        lang={lang}
                        registerSync={registerSync}
                        finishSync={finishSync}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * IndraAppContent
 * Punto de entrada operacional del orquestador.
 */
function IndraAppContent() {
    const { isConnected, bootstrap, coreUrl, sessionSecret } = useProtocol();
    const { activeWorkspaceId } = useWorkspace();
    const { activeArtifact, closeArtifact, lang } = useShell();
    const isMaterializing = useAppState(s => s.isMaterializing);
    const registerSync = useAppState(s => s.registerSync);
    const finishSync = useAppState(s => s.finishSync);
    
    // Global Infra Manager
    const isServiceManagerOpen = useAppState(s => s.isServiceManagerOpen);
    const isDiagnosticHubOpen = useAppState(s => s.isDiagnosticHubOpen);
    const closeDiagnosticHub = useAppState(s => s.closeDiagnosticHub);

    const isDocsOpen = useAppState(s => s.isDocsOpen);

    useEffect(() => {
        bootstrap();
    }, [bootstrap]);

    // NIVEL -1: Web de INDRA / Documentación (Incluso estando conectado)
    if (isDocsOpen || !isConnected) {
        return <LandingView />;
    }

    // NIVEL 0.5: Materializando materia (Transición de nivel)
    if (isMaterializing) {
        const t = useLexicon(lang || 'es');
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'var(--color-accent)' }}>
                <Spinner size="120px" variant="rich" label={t('status_materializing')} />
            </div>
        );
    }

    // Helper para renderizar overlays globales
    const renderOverlays = () => (
        <>
            {isServiceManagerOpen && <ServiceManager />}
            {activeArtifact?._invoke_id && (
                <InvokePortal 
                    activeArtifact={activeArtifact}
                    closeArtifact={closeArtifact}
                    coreUrl={coreUrl}
                    sessionSecret={sessionSecret}
                    lang={lang}
                    registerSync={registerSync}
                    finishSync={finishSync}
                />
            )}
            {isDiagnosticHubOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000 }}>
                    <div 
                        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2001 }}
                        onClick={closeDiagnosticHub}
                    >
                        <button className="btn btn--danger btn--mini" style={{ padding: '8px' }}>
                            <IndraIcon name="CLOSE" size="14px" />
                            <span style={{ marginLeft: '6px', fontSize: '9px' }}>CERRAR_CABINA</span>
                        </button>
                    </div>
                    <DiagnosticHub />
                </div>
            )}
        </>
    );

    // NIVEL 1: Core conectado, sin Workspace seleccionado (NEXUS)
    if (!activeWorkspaceId) {
        if (sessionSecret === 'PUBLIC_GRANT') return <LandingView />;

        return (
            <>
                <NexusView />
                {renderOverlays()}
            </>
        );
    }

    // NIVEL 3: Macro Engine Activo (Excepto si es invocado por un satélite)
    if (activeArtifact && !activeArtifact._invoke_id) {
        return (
            <>
                <EngineViewport 
                    activeArtifact={activeArtifact}
                    closeArtifact={closeArtifact}
                    coreUrl={coreUrl}
                    sessionSecret={sessionSecret}
                    lang={lang}
                    registerSync={registerSync}
                    finishSync={finishSync}
                />
                {renderOverlays()}
            </>
        );
    }

    // NIVEL 2: Workspace operacional (Dashboard)
    return (
        <>
            <WorkspaceDashboard />
            {renderOverlays()}
        </>
    );
}




export default function App() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasMicelarParams = urlParams.has('u') && urlParams.has('id');

    return (
        <NeuralSplitter>
            <ToastProvider>
                <SacredField>
                    {hasMicelarParams ? <ManifestResolver /> : <IndraAppContent />}
                </SacredField>
            </ToastProvider>
        </NeuralSplitter>
    );
}
