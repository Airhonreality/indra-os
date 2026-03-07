import React from 'react';
import { useAppState } from './state/app_state';
import { CoreConnectionView } from './components/shell/CoreConnectionView';
import { NexusView } from './components/shell/NexusView';
import { WorkspaceDashboard } from './components/dashboard/WorkspaceDashboard';
import { IndraIcon } from './components/utilities/IndraIcons';
import './styles/main.css';

import { SchemaDesigner } from './components/macro_engines/SchemaDesigner';

/**
 * App Orchestrator
 * Decide qué vista mostrar según el nivel de hidratación del estado.
 */
function App() {
    const { isConnected, activeWorkspaceId, activeArtifact, bootstrap } = useAppState();

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

    // NIVEL 3: Macro Engine Activo (Prioridad sobre Dashboard)
    if (activeArtifact) {
        if (activeArtifact.class === 'DATA_SCHEMA') {
            return <SchemaDesigner atom={activeArtifact} />;
        }
        // ... otros motores
    }

    // NIVEL 2: Workspace operacional (Dashboard)
    return <WorkspaceDashboard />;
}

export default App;
