
import React, { useState } from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { SlotSelector } from '../../utilities/SlotSelector';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraMicroHeader } from '../../utilities/IndraMicroHeader';

export function WorkflowInspector() {
    const { workflow, selectedStationId, setSelectedStationId, updateStation } = useWorkflow();
    const [showSlotSelector, setShowSlotSelector] = useState(false);
    const [activeParam, setActiveParam] = useState(null);

    const station = workflow.stations.find(s => s.id === selectedStationId);

    if (!station) {
        return (
            <aside className="engine-sidebar inspector-panel">
                <header className="panel-header">
                    <IndraIcon name="LOGIC" size="14px" />
                    <h3>00 // CONTEXT_ROOT</h3>
                </header>
                <div className="panel-body center stack">
                    <div className="empty-blueprint">
                        <IndraIcon name="FLOW" size="40px" style={{ opacity: 0.1 }} />
                    </div>
                    <p className="empty-state font-mono" style={{ fontSize: '10px' }}>SELECT_NODE_FOR_INSPECTION</p>
                </div>
            </aside>
        );
    }

    // Construir contextStack para el SlotSelector
    const buildContextStack = () => {
        const stack = { sources: {}, ops: {} };
        if (workflow.trigger?.source) {
            stack.sources[workflow.trigger.source.handle?.alias || 'trigger'] = {
                fields: workflow.trigger.source.payload?.fields || []
            };
        }

        const currentIndex = workflow.stations.findIndex(s => s.id === selectedStationId);
        workflow.stations.slice(0, currentIndex).forEach(s => {
            // Si es un protocolo, el output suele ser la entidad procesada
            stack.ops[s.config?.label || s.id] = {
                type: 'ATOM',
                fields: [] // Aquí se podrían inyectar los campos dinámicos del protocolo si se conocieran
            };
        });
        return stack;
    };

    const togglePruning = (path) => {
        const currentPruning = station.config?.pruning || [];
        const newPruning = currentPruning.includes(path)
            ? currentPruning.filter(p => p !== path)
            : [...currentPruning, path];

        updateStation(station.id, { config: { ...station.config, pruning: newPruning } });
    };

    const handleMappingSelect = (slot) => {
        const newMapping = {
            ...station.mapping,
            [activeParam]: {
                path: slot.path,
                label: slot.label,
                icon: slot.icon,
                group: slot.group
            }
        };
        updateStation(station.id, { mapping: newMapping });
        setShowSlotSelector(false);
        setActiveParam(null);
    };

    const renderMappingRow = (paramId, label) => {
        const mapping = station.mapping?.[paramId];
        return (
            <div className="grid-split mapping-row">
                <div className="stack--tight">
                    <span className="text-label" style={{ fontSize: '9px' }}>{label}</span>
                </div>
                <button
                    className={`slot-target-breadcrumb ${mapping ? 'bound' : ''}`}
                    onClick={() => { setActiveParam(paramId); setShowSlotSelector(true); }}
                >
                    {mapping ? (
                        <div className="shelf--tight">
                            <IndraIcon name={mapping.icon} size="8px" />
                            <span className="origin-tag">{mapping.group.split(':')[1].trim()}</span>
                            <span className="field-tag">{mapping.label}</span>
                        </div>
                    ) : (
                        'BIND_VARIABLE_SLOT'
                    )}
                </button>
            </div>
        );
    };

    return (
        <aside className="engine-sidebar inspector-panel">
            <IndraMicroHeader
                label={station.id.replace('step_', 'STEP_')}
                icon={station.type}
                metadata="NODE_INSPECTION"
                onExecute={() => setSelectedStationId(null)}
                executeLabel="CLOSE"
            />

            <div className="panel-body stack">
                <section className="grid-split">
                    <div className="stack--tight">
                        <label className="text-label">01 // IDENTITY</label>
                        <p className="text-hint" style={{ fontSize: '9px' }}>Nombre amigable del nodo.</p>
                    </div>
                    <div className="slot-small glass-light">
                        <input
                            className="input-base font-mono"
                            type="text"
                            style={{ fontSize: '11px' }}
                            value={station.config?.label || ''}
                            onChange={(e) => updateStation(station.id, { config: { ...station.config, label: e.target.value } })}
                        />
                    </div>
                </section>

                <div className="hud-line" style={{ margin: 'var(--space-6) 0', opacity: 0.1 }} />

                {station.type === 'PROTOCOL' && (
                    <section className="stack">
                        <label className="text-label" style={{ marginBottom: 'var(--space-4)' }}>02 // DATA_MAPPING</label>
                        <div className="stack--tight">
                            {renderMappingRow('message_body', 'MESSAGE_BODY')}
                            {renderMappingRow('recipient', 'RECIPIENT_ID')}
                        </div>
                    </section>
                )}

                {station.type === 'MAP' && (
                    <section className="stack">
                        <label className="text-label" style={{ marginBottom: 'var(--space-4)' }}>02 // CONTEXT_PRUNING</label>
                        <div className="stack--tight pruning-container glass-void">
                            {Object.entries(buildContextStack().sources).map(([alias, schema]) => (
                                <div key={alias} className="shelf--tight pruning-item glass-hover" onClick={() => togglePruning(`${alias}.*`)}>
                                    <input type="checkbox" checked={station.config?.pruning?.includes(`${alias}.*`)} readOnly />
                                    <IndraIcon name="SCHEMA" size="10px" style={{ opacity: 0.4 }} />
                                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{alias}.*</span>
                                </div>
                            ))}
                            {Object.entries(buildContextStack().ops).map(([alias, op]) => (
                                <div key={alias} className="shelf--tight pruning-item glass-hover" onClick={() => togglePruning(`${alias}.*`)}>
                                    <input type="checkbox" checked={station.config?.pruning?.includes(`${alias}.*`)} readOnly />
                                    <IndraIcon name="SERVICE" size="10px" style={{ opacity: 0.4 }} />
                                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{alias}.*</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-hint" style={{ fontSize: '9px', marginTop: '4px' }}>Solo los datos seleccionados pasarán al siguiente nodo.</p>
                    </section>
                )}


                {station.type === 'ROUTER' && (
                    <section className="stack">
                        <label className="text-label" style={{ marginBottom: 'var(--space-4)' }}>02 // ROUTING_LOGIC</label>
                        <div className="stack--tight logic-builder glass-void">
                            <div className="shelf--tight" style={{ gap: '4px' }}>
                                <span className="font-mono" style={{ fontSize: '10px', opacity: 0.5 }}>IF:</span>
                                <button className="slot-target-breadcrumb" style={{ flex: 1, fontSize: '9px' }}>SELECT_VAR</button>
                            </div>
                            <div className="shelf--tight" style={{ gap: '4px', marginTop: '4px' }}>
                                <select className="input-base font-mono" style={{ width: '50px', fontSize: '9px' }}>
                                    <option>==</option>
                                    <option>!=</option>
                                </select>
                                <input className="input-base font-mono" placeholder="VALUE" style={{ flex: 1, fontSize: '11px' }} />
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {showSlotSelector && (
                <SlotSelector
                    contextStack={buildContextStack()}
                    onSelect={handleMappingSelect}
                    onCancel={() => setShowSlotSelector(false)}
                />
            )}
        </aside>
    );
}
