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
import { useWorkflowHydration } from './useWorkflowHydration';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { DataProjector } from '../../../services/DataProjector';
import './WorkflowDesigner.css';

export function WorkflowDesigner({ atom, onUpdate }) {
    return (
        <WorkflowProvider initialData={atom}>
            <WorkflowLayout onUpdate={onUpdate} />
        </WorkflowProvider>
    );
}

function WorkflowLayout({ onUpdate }) {
    const { workflow, addStation, selectedStationId, setSelectedStationId } = useWorkflow();
    const { status, traceLogs, currentStepId, runTrace } = useWorkflowExecution(workflow);
    const { integrityMap, isLoading } = useWorkflowHydration(workflow);

    const projection = DataProjector.projectArtifact(workflow);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--color-bg-void)', color: 'white' }}>
            {/* ── CANONICAL MACRO HEADER ── */}
            <IndraMacroHeader
                atom={workflow}
                onClose={() => window.history.back()}
                isSaving={status === 'EXECUTING'}
                onUpdateStatus={(newStatus) => onUpdate({ ...workflow, status: newStatus })}
                isLive={workflow.status === 'LIVE'}
                rightSlot={
                    <button
                        className="btn btn--accent btn--sm"
                        onClick={() => onUpdate(workflow)}
                    >
                        SAVE_FLIGHT_LOG
                    </button>
                }
            />

            {/* ── VIEWPORT OPERATIVO (3 columnas) ── */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* Columna Izquierda: Trigger */}
                <WorkflowTrigger />

                <main className="engine-canvas pipeline-viewport stack" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
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
                                    isOrphan={
                                        (station.config?.bridge_id && integrityMap[station.config.bridge_id] === false) ||
                                        (station.config?.schema_id && integrityMap[station.config.schema_id] === false)
                                    }
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
        </div>
    );
}

