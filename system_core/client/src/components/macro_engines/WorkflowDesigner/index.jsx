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
import { IndraEngineHood } from '../../utilities/IndraEngineHood';
import { DataProjector } from '../../../services/DataProjector';
import { useWorkspace } from '../../../context/WorkspaceContext';
import './WorkflowDesigner.css';

export function WorkflowDesigner({ atom, onUpdate }) {
    return (
        <WorkflowProvider initialData={atom}>
            <WorkflowLayout onUpdate={onUpdate} />
        </WorkflowProvider>
    );
}

function WorkflowLayout({ onUpdate }) {
    const { updatePinIdentity } = useWorkspace();
    const { workflow, addStation, selectedStationId, setSelectedStationId, setWorkflow } = useWorkflow();
    const { status, traceLogs, currentStepId, runTrace } = useWorkflowExecution(workflow);
    const { integrityMap, isLoading } = useWorkflowHydration(workflow);

    const projection = DataProjector.projectArtifact(workflow);

    const accentColor = workflow?.color || '#00f5d4';
    const dynamicStyles = {
        '--indra-dynamic-accent': accentColor,
        '--indra-dynamic-border': `${accentColor}26`,
        '--indra-dynamic-bg': `${accentColor}08`,
    };

    return (
        <div className="macro-designer-wrapper fill" style={dynamicStyles}>
            {/* ── CANONICAL MACRO HEADER ── */}
            <IndraMacroHeader
                atom={workflow}
                onClose={() => window.history.back()}
                isSaving={status === 'EXECUTING'}
                isLive={workflow.status === 'LIVE'}
                onTitleChange={(newLabel) => {
                    const cleanLabel = newLabel === '' ? 'UNTITLED_WORKFLOW' : newLabel;
                    const newWorkflow = { ...workflow, handle: { ...workflow.handle, label: cleanLabel } };
                    setWorkflow(newWorkflow);
                    updatePinIdentity(workflow.id, workflow.provider, { label: cleanLabel });
                    onUpdate(newWorkflow);
                }}
            />

            <div className="indra-container">
                <div className="indra-header-label">WORKFLOW_ORCHESTRATION_SYSTEM</div>
                <IndraEngineHood
                    leftSlot={
                        <div className="engine-hood__capsule" style={{ gap: 0, padding: '1px' }}>
                            <button
                                className={`btn btn--xs ${workflow.status !== 'LIVE' ? 'active' : ''}`}
                                onClick={() => onUpdate({ ...workflow, status: 'DRAFT' })}
                                style={{ 
                                    fontSize: '8px', padding: '2px 10px', borderRadius: 'var(--indra-ui-radius)', border: 'none', 
                                    background: workflow.status !== 'LIVE' ? 'var(--indra-dynamic-bg)' : 'transparent', 
                                    color: workflow.status !== 'LIVE' ? 'var(--indra-dynamic-accent)' : 'var(--color-text-secondary)',
                                    border: workflow.status !== 'LIVE' ? '1px solid var(--indra-dynamic-accent)' : 'none'
                                }}
                            >DRAFT</button>
                            <button
                                className={`btn btn--xs ${workflow.status === 'LIVE' ? 'active' : ''}`}
                                onClick={() => onUpdate({ ...workflow, status: 'LIVE' })}
                                style={{ 
                                    fontSize: '8px', padding: '2px 10px', borderRadius: 'var(--indra-ui-radius)', border: 'none', 
                                    background: workflow.status === 'LIVE' ? 'rgba(255, 70, 85, 0.1)' : 'transparent', 
                                    color: workflow.status === 'LIVE' ? '#ff4655' : 'var(--color-text-secondary)',
                                    border: workflow.status === 'LIVE' ? '1px solid #ff4655' : 'none'
                                }}
                            >LIVE</button>
                        </div>
                    }
                    rightSlot={
                        <button
                            className="btn btn--xs"
                            onClick={() => onUpdate(workflow)}
                            style={{ 
                                borderRadius: 'var(--indra-ui-radius)', 
                                padding: '2px 12px', 
                                backgroundColor: 'var(--indra-dynamic-bg)',
                                border: '1px solid var(--indra-dynamic-accent)',
                                color: 'var(--indra-dynamic-accent)'
                            }}
                        >
                            <IndraIcon name="SAVE" size="10px" color="var(--indra-dynamic-accent)" />
                            <span style={{ marginLeft: "6px" }}>SAVE_FLIGHT_LOG</span>
                        </button>
                    }
                />
            </div>


            {/* ── VIEWPORT OPERATIVO (3 columnas) ── */}
            <div className="designer-body fill shelf overflow-hidden" style={{ gap: 'var(--indra-ui-gap)' }}>
                {/* Columna Izquierda: Trigger */}
                <div className="indra-container" style={{ width: '260px' }}>
                    <div className="indra-header-label">TRIGGER_INPUT_STATION</div>
                    <WorkflowTrigger />
                </div>

                <div className="indra-container fill stack bg-black-soft relative overflow-hidden" style={{ borderLeft: 'none', borderRight: 'none' }}>
                    <div className="indra-header-label">STATION_SEQUENCE_PIPELINE</div>
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
                        <div className="border-top" style={{ borderColor: 'var(--indra-dynamic-border)' }}>
                            <WorkflowSandbox
                                status={status}
                                traceLogs={traceLogs}
                                runTrace={runTrace}
                            />
                        </div>
                    </main>
                </div>

                {/* Columna Derecha: Inspector */}
                <div className="indra-container" style={{ width: '320px' }}>
                    <div className="indra-header-label">WORKFLOW_PROPERTIES_HUD</div>
                    <WorkflowInspector />
                </div>
            </div>
        </div>
    );
}

