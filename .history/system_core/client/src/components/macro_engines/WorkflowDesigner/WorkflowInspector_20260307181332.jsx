
import React, { useState } from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { SlotSelector } from '../../utilities/SlotSelector';
import { IndraIcon } from '../../utilities/IndraIcons';

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
                    <h3>INSPECTOR</h3>
                </header>
                <div className="panel-body center">
                    <p className="empty-state">Selecciona una estación para configurar sus protocolos y mapeos.</p>
                </div>
            </aside>
        );
    }

    // Construir contextStack para el SlotSelector
    // Debe incluir el trigger y todas las estaciones ANTERIORES a la seleccionada
    const buildContextStack = () => {
        const stack = { sources: {}, ops: {} };

        // Agregar Trigger
        if (workflow.trigger?.source) {
            stack.sources[workflow.trigger.source.handle?.alias || 'trigger'] = {
                fields: workflow.trigger.source.payload?.fields || []
            };
        }

        // Agregar estaciones anteriores
        const currentIndex = workflow.stations.findIndex(s => s.id === selectedStationId);
        workflow.stations.slice(0, currentIndex).forEach(s => {
            stack.ops[s.config?.label || s.id] = { type: 'VAL' };
        });

        return stack;
    };

    const handleMappingSelect = (slot) => {
        const newMapping = { ...station.mapping, [activeParam]: slot.path };
        updateStation(station.id, { mapping: newMapping });
        setShowSlotSelector(false);
        setActiveParam(null);
    };

    return (
        <aside className="engine-sidebar inspector-panel">
            <header className="panel-header spread">
                <div className="shelf--tight font-mono">
                    <IndraIcon name={station.type} size="14px" />
                    <span>{station.type}: {station.id}</span>
                </div>
                <button onClick={() => setSelectedStationId(null)} className="btn--xs btn--ghost">
                    <IndraIcon name="CLOSE" />
                </button>
            </header>

            <div className="panel-body stack">
                <section className="config-section stack--tight">
                    <label className="util-label">ETIQUETA_NODO</label>
                    <input
                        className="util-input--sm"
                        type="text"
                        value={station.config?.label || ''}
                        onChange={(e) => updateStation(station.id, { config: { ...station.config, label: e.target.value } })}
                    />
                </section>

                <div className="divider" style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />

                {station.type === 'PROTOCOL' && (
                    <section className="mapping-section stack--tight">
                        <label className="util-label">MAPPING_INPUTS</label>
                        <div className="stack--tight">
                            <div className="shelf--tight mapping-row glass-subtle">
                                <span className="param-name fill">message_body</span>
                                <button
                                    className={`slot-target ${station.mapping?.message_body ? 'bound' : ''}`}
                                    onClick={() => { setActiveParam('message_body'); setShowSlotSelector(true); }}
                                >
                                    {station.mapping?.message_body || 'VINCULAR_SLOT'}
                                </button>
                            </div>
                            <div className="shelf--tight mapping-row glass-subtle">
                                <span className="param-name fill">recipient</span>
                                <button
                                    className={`slot-target ${station.mapping?.recipient ? 'bound' : ''}`}
                                    onClick={() => { setActiveParam('recipient'); setShowSlotSelector(true); }}
                                >
                                    {station.mapping?.recipient || 'VINCULAR_SLOT'}
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {station.type === 'MAP' && (
                    <section className="pruning-section stack--tight">
                        <label className="util-label">CONTEXT_PRUNING</label>
                        <p className="util-hint">Selecciona qué variables pasan al siguiente nivel.</p>
                        <div className="stack--tight pruning-list">
                            {Object.keys(buildContextStack().sources).map(src => (
                                <div key={src} className="shelf--tight glass-hover-row" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{src}.*</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {station.type === 'ROUTER' && (
                    <section className="router-section stack--tight">
                        <label className="util-label">BIFURCATION_LOGIC</label>
                        <div className="stack--tight glass-subtle" style={{ padding: 'var(--space-3)' }}>
                            <span className="util-hint">IF_CONDITION:</span>
                            <div className="shelf--tight" style={{ marginTop: 'var(--space-2)' }}>
                                <button className="btn--xs btn--ghost">SELECT_VAR</button>
                                <select className="util-input--sm" style={{ width: '60px' }}>
                                    <option>==</option>
                                    <option>!=</option>
                                </select>
                                <input className="util-input--sm" placeholder="VAL" style={{ width: '80px' }} />
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

            <style>{`
                .mapping-row {
                    padding: var(--space-2) var(--space-3);
                    border-radius: var(--radius-sm);
                    font-size: 11px;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .mapping-row:hover { border-color: var(--color-border-active); }
                .param-name { color: var(--color-text-secondary); font-family: var(--font-mono); }
                .slot-target {
                    background: var(--color-bg-void);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-tertiary);
                    font-size: 10px;
                    padding: 2px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    max-width: 150px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-family: var(--font-mono);
                }
                .slot-target.bound {
                    color: var(--color-accent);
                    border-color: var(--color-accent-dim);
                    background: var(--color-accent-dim);
                }
                .slot-target:hover { border-color: var(--color-accent); }
            `}</style>
        </aside>
    );
}
