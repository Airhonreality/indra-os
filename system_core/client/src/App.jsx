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
            <Engine atom={activeArtifact} bridge={bridge} />
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
    const closeServiceManager = useAppState(s => s.closeServiceManager);

    useEffect(() => {
        if (isConnected) bootstrap();
    }, [isConnected, bootstrap]);

    // NIVEL 0: Sin conexión al Core
    if (!isConnected) {
        return <CoreConnectionView />;
    }

    // NIVEL 0.5: Materializando materia (Transición de nivel)
    if (isMaterializing) {
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'var(--color-accent)' }}>
                <div className="indra-pulse-loader" />
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: 'var(--space-8)', letterSpacing: '2px', opacity: 0.8 }}>MATERIALIZING_CONTENT...</h2>
            </div>
        );
    }

    // NIVEL 1: Core conectado, sin Workspace seleccionado (NEXUS)
    if (!activeWorkspaceId) {
        return (
            <>
                <NexusView />
                {isServiceManagerOpen && <ServiceManager />}
            </>
        );
    }

    // NIVEL 3: Macro Engine Activo
    if (activeArtifact) {
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
                {isServiceManagerOpen && <ServiceManager />}
            </>
        );
    }

    // NIVEL 2: Workspace operacional (Dashboard)
    return (
        <>
            <WorkspaceDashboard />
            {isServiceManagerOpen && <ServiceManager />}
        </>
    );
}

/**
 * App (Entry Point)
 * Proveedor de servicios transversales (Toast, etc.)
 */
export default function App() {
    return (
        <ToastProvider>
            <IndraAppContent />
        </ToastProvider>
    );
}
