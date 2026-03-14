/**
 * =============================================================================
 * ARTEFACTO: WorkflowDesigner/index.jsx
 * RESPONSABILIDAD: Punto de entrada del motor de flujos.
 * =============================================================================
 */

import React from 'react';
import { WorkflowProvider, useWorkflow } from './context/WorkflowContext';
import './WorkflowDesigner.css'; // Crearemos este archivo

export function WorkflowDesigner({ atom, onUpdate }) {
    return (
        <WorkflowProvider initialData={atom}>
            <WorkflowLayout onUpdate={onUpdate} />
        </WorkflowProvider>
    );
}

function WorkflowLayout({ onUpdate }) {
    const { workflow, addStation } = useWorkflow();

    return (
        <div className="indra-macro-engine workflow-designer">
            {/* Columna Izquierda: Trigger & Context */}
            <aside className="engine-sidebar trigger-panel">
                <header className="panel-header">
                    <h3>DISPARADOR</h3>
                </header>
                <div className="panel-body">
                    <div className="trigger-card active">
                        <span className="icon">⚡</span>
                        <div className="info">
                            <label>Schema Submit</label>
                            <small>Ejecutar al enviar formulario</small>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Columna Central: Pipeline Canvas */}
            <main className="engine-canvas pipeline-viewport">
                <header className="canvas-header">
                    <h2>PIPELINE: {workflow.id}</h2>
                </header>

                <section className="station-stack">
                    {workflow.stations.map((station, index) => (
                        <div key={station.id} className="station-node">
                            <div className="node-index">{index + 1}</div>
                            <div className="node-content">
                                <strong>{station.type}</strong>
                                <code>{station.id}</code>
                            </div>
                        </div>
                    ))}

                    <button className="add-station-btn" onClick={() => addStation('PROTOCOL')}>
                        <span>+</span> AÑADIR ESTACIÓN
                    </button>
                </section>
            </main>

            {/* Columna Derecha: Inspector */}
            <aside className="engine-sidebar inspector-panel">
                <header className="panel-header">
                    <h3>INSPECTOR</h3>
                </header>
                <div className="panel-body">
                    <p className="empty-state">Selecciona una estación para configurar sus protocolos y mapeos.</p>
                </div>
            </aside>
        </div>
    );
}
