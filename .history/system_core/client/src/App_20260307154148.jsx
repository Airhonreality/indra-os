import React from 'react';
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

/**
 * App Orchestrator
 * Decide qué vista mostrar según el nivel de hidratación del estado.
 */
function App() {
    const { isConnected, bootstrap, coreUrl, sessionSecret } = useProtocol();
    const { activeWorkspaceId } = useWorkspace();
    const { activeArtifact, closeArtifact } = useShell();

    React.useEffect(() => {
        bootstrap();
    }, [bootstrap]);

    // NIVEL 0: Sin conexión al Core
    if (!isConnected) {
        return <CoreConnectionView />;
    }

    // NIVEL 1: Core conectado, sin Workspace seleccionado (NEXUS)
    if (!activeWorkspaceId) {
        return <NexusView />;
    }

    // NIVEL 3: Macro Engine Activo (Montaje Dinámico Determinista por Registro + Inyección de Bridge)
    if (activeArtifact) {
        const Engine = registry.get(activeArtifact.class);
        if (Engine) {
            const bridge = new DesignerBridge(
                activeArtifact,
                { close: closeArtifact },
                { url: coreUrl, secret: sessionSecret }
            );
            return <Engine atom={activeArtifact} bridge={bridge} />;
        }

        // Fallback para clases sin motor asignado (Sinceridad Radical)
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'white' }}>
                <IndraIcon name="ATOM" size="64px" style={{ opacity: 0.1, marginBottom: 'var(--space-8)' }} />
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0.5 }}>UNKNOWN_ENGINE_FOR_CLASS: {activeArtifact.class}</h2>
                <button className="btn btn--ghost" onClick={() => closeArtifact()}>CLOSE_VOID</button>
            </div>
        );
    }

    // NIVEL 2: Workspace operacional (Dashboard)
    return <WorkspaceDashboard />;
}

export default App;
