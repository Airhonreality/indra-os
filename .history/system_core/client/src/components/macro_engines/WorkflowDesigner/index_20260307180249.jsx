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
    const { workflow, addStation, removeStation, selectedStationId, setSelectedStationId, updateStation } = useWorkflow();

    const selectedStation = workflow.stations.find(s => s.id === selectedStationId);

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
                        <div
                            key={station.id}
                            className={`station-node type-${station.type.toLowerCase()} ${selectedStationId === station.id ? 'selected' : ''}`}
                            onClick={() => setSelectedStationId(station.id)}
                        >
                            <div className="node-index">{index + 1}</div>
                            <div className="node-content">
                                <div className="type-badge">{station.type}</div>
                                <strong>{station.config?.label || station.id}</strong>
                                <p>{station.type === 'ROUTER' ? 'Decision Logic' : station.type === 'MAP' ? 'Context Pruning' : 'Protocol Instruction'}</p>
                            </div>
                            <div className="node-actions">
                                <button className="icon-btn" title="Configurar">⚙️</button>
                                <button className="icon-btn danger" title="Eliminar" onClick={(e) => { e.stopPropagation(); removeStation(station.id); }}>×</button>
                            </div>
                        </div>
                    ))}

                    <div className="add-station-group">
                        <button className="add-station-btn" onClick={() => addStation('PROTOCOL')}>+ PROTOCOL</button>
                        <button className="add-station-btn" onClick={() => addStation('ROUTER')}>+ ROUTER</button>
                        <button className="add-station-btn" onClick={() => addStation('MAP')}>+ MAP</button>
                    </div>
                </section>
            </main>

            {/* Columna Derecha: Inspector */}
            <aside className="engine-sidebar inspector-panel">
                <header className="panel-header">
                    <h3>INSPECTOR: {selectedStation ? selectedStation.id : 'CONTEXTO'}</h3>
                </header>
                <div className="panel-body">
                    {selectedStation ? (
                        <div className="inspector-form">
                            <div className="form-group">
                                <label>Etiqueta</label>
                                <input
                                    type="text"
                                    value={selectedStation.config?.label || ''}
                                    onChange={(e) => updateStation(selectedStation.id, { config: { ...selectedStation.config, label: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Provider Protocol</label>
                                <select disabled>
                                    <option>{selectedStation.type === 'PROTOCOL' ? 'MESSAGE_SEND' : 'LOGIC_EVAL'}</option>
                                </select>
                            </div>
                            <button className="btn btn--ghost" style={{ width: '100%', marginTop: 'var(--space-4)' }} onClick={() => setSelectedStationId(null)}>
                                CERRAR
                            </button>
                        </div>
                    ) : (
                        <p className="empty-state">Selecciona una estación para configurar sus protocolos y mapeos.</p>
                    )}
                </div>
            </aside>
        </div>
    );
}
