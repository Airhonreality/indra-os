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
    const { isConnected, activeWorkspaceId } = useAppState();

    // NIVEL 0: Sin conexión al Core
    if (!isConnected) {
        return <CoreConnectionView />;
    }

    // NIVEL 1: Core conectado, sin Workspace seleccionado (NEXUS)
    if (!activeWorkspaceId) {
        return <NexusView />;
    }

    // NIVEL 2: Workspace operacional (Dashboard / Engines)
    return (
        <div className="fill center stack" style={{ padding: 'var(--space-12)', gap: 'var(--space-6)' }}>
            <IndraIcon name="ATOM" size="120px" style={{
                color: 'var(--color-accent)',
                filter: 'drop-shadow(0 0 30px var(--color-accent-glow))'
            }} />
            <div className="stack--tight center">
                <h1 style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.4em', margin: 0 }}>WORKSPACE_OPERATIONAL</h1>
                <span className="text-hint">Nivel de Hidratación: 2 // El Núcleo está respondiendo</span>
            </div>
            <button className="btn btn--danger" onClick={() => window.location.reload()} style={{ marginTop: 'var(--space-6)' }}>
                TERMINATE_SESSION
            </button>
        </div>
    );
}

export default App;
