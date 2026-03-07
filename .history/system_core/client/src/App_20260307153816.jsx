import React from 'react';
import { useAppState } from './state/app_state';
import { CoreConnectionView } from './components/shell/CoreConnectionView';
import { NexusView } from './components/shell/NexusView';
import { WorkspaceDashboard } from './components/dashboard/WorkspaceDashboard';
import { IndraIcon } from './components/utilities/IndraIcons';
import { registry } from './services/EngineRegistry';
import './services/EngineBoot';

/**
 * App Orchestrator
 * Decide qué vista mostrar según el nivel de hidratación del estado.
 */
function App() {
    const { isConnected, bootstrap } = useProtocol();
    const { activeWorkspaceId } = useWorkspace();
    const { activeArtifact } = useShell();

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

    // NIVEL 3: Macro Engine Activo (Montaje Dinámico Determinista por Registro)
    if (activeArtifact) {
        const Engine = registry.get(activeArtifact.class);
        if (Engine) return <Engine atom={activeArtifact} />;

        // Fallback para clases sin motor asignado (Sinceridad Radical)
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'white' }}>
                <IndraIcon name="ATOM" size="64px" style={{ opacity: 0.1, marginBottom: 'var(--space-8)' }} />
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0.5 }}>UNKNOWN_ENGINE_FOR_CLASS: {activeArtifact.class}</h2>
                <button className="btn btn--ghost" onClick={() => useAppState.getState().closeArtifact()}>CLOSE_VOID</button>
            </div>
        );
    }

    // NIVEL 2: Workspace operacional (Dashboard)
    return <WorkspaceDashboard />;
}

export default App;
