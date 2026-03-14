/**
 * =============================================================================
 * ARTEFACTO: WorkflowDesigner/index.jsx
 * RESPONSABILIDAD: Punto de entrada del motor de flujos.
 * =============================================================================
 */

import React from 'react';
import { WorkflowProvider, useWorkflow } from './context/WorkflowContext';
import { WorkflowTrigger } from './WorkflowTrigger';
import { StationCard } from './StationCard';
import { WorkflowInspector } from './WorkflowInspector';
import { WorkflowSandbox } from './WorkflowSandbox';
import { useWorkflowExecution } from './useWorkflowExecution';
import './WorkflowDesigner.css';

export function WorkflowDesigner({ atom, onUpdate }) {
    return (
        <WorkflowProvider initialData={atom}>
            <WorkflowLayout onUpdate={onUpdate} />
        </WorkflowProvider>
    );
}

import { DataProjector } from '../../../services/DataProjector';

function WorkflowLayout({ onUpdate }) {
    const { workflow, addStation, selectedStationId, setSelectedStationId } = useWorkflow();
    const { status, traceLogs, currentStepId, runTrace } = useWorkflowExecution(workflow);

    const projection = DataProjector.projectArtifact(workflow);

    return (
        <div className="indra-macro-engine workflow-designer">
            {/* Columna Izquierda: Trigger */}
            <WorkflowTrigger />

            {/* Columna Central: Pipeline */}
            <main className="engine-canvas pipeline-viewport stack">
                <header className="canvas-header spread">
                    <div className="stack--tight">
                        <span className="util-label">WORKFLOW_PIPELINE</span>
                        <h2>{projection.title}</h2>
                    </div>
                    <div className="shelf--tight">
                        <button className="btn btn--ghost btn--sm" style={{ marginRight: '8px' }} onClick={() => onUpdate(workflow)}>SAVE_FLIGHT_LOG</button>
                    </div>
                </header>

                <div className="pipeline-scroll fill">
                    <section className="station-stack">
                        {workflow.stations.map((station, index) => (
                            <StationCard
                                key={station.id}
                                index={index}
                                station={station}
                                isSelected={selectedStationId === station.id}
                                isExecuting={currentStepId === station.id}
                                onSelect={() => setSelectedStationId(station.id)}
                            />
                        ))}

                        <div className="flow-line-connector" />

                        <div className="add-station-group shelf--tight center">
                            <button className="add-btn protocol" onClick={() => addStation('PROTOCOL')}>+ PROTOCOL</button>
                            <button className="add-btn router" onClick={() => addStation('ROUTER')}>+ ROUTER</button>
                            <button className="add-btn map" onClick={() => addStation('MAP')}>+ MAP</button>
                        </div>
                    </section>
                </div>

                {/* Sandbox de Prueba (Bottom) */}
                <WorkflowSandbox
                    status={status}
                    traceLogs={traceLogs}
                    runTrace={runTrace}
                />
            </main>

            {/* Columna Derecha: Inspector */}
            <WorkflowInspector />
        </div>
    );
}

