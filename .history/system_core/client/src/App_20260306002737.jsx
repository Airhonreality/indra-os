import React from 'react';
import { useAppState } from './state/app_state';
import { CoreConnectionView } from './components/shell/CoreConnectionView';
import './styles/main.css';

/**
 * App Orchestrator
 * Decide qué vista mostrar según el nivel de hidratación del estado.
 */
function App() {
    const { isConnected, activeWorkspaceId } = useAppState();

    // Nivel 0: Sin conexión al Core
    if (!isConnected) {
        return <CoreConnectionView />;
    }

    // Nivel 1: Conectado pero sin Workspace seleccionado
    if (!activeWorkspaceId) {
        return (
            <div className="fill center stack">
                <h1>WORKSPACE SELECTOR</h1>
                <p className="text-hint">NIVEL 1 — PRÓXIMAMENTE</p>
                <button className="btn btn--ghost" onClick={() => window.location.reload()}>
                    REINICIAR SESIÓN
                </button>
            </div>
        );
    }

    // Nivel 2: Workspace activo (Dashboard / Engines)
    return (
        <div className="fill center">
            <h1 style={{ color: 'var(--color-accent)' }}>INDRA OPERACIONAL</h1>
            <p>NIVEL 2 — MOTORES LISTOS</p>
        </div>
    );
}

export default App;
