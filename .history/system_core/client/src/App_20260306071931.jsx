import React from 'react';
import { useAppState } from './state/app_state';
import { CoreConnectionView } from './components/shell/CoreConnectionView';
import { NexusView } from './components/shell/NexusView';
import { IndraIcon } from './components/utilities/IndraIcons';
import './styles/main.css';

/**
 * App Orchestrator
 * Decide qué vista mostrar según el nivel de hidratación del estado.
 */
function App() {
    const { isConnected, activeWorkspaceId, bootstrap } = useAppState();

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

    // NIVEL 2: Workspace operacional (Dashboard / Engines)
    return <WorkspaceDashboard />;
}

export default App;
