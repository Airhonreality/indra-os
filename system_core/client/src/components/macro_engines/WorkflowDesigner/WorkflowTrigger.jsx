
import React, { useState } from 'react';
import { useWorkflow } from './context/WorkflowContext';
import ArtifactSelector from '../../utilities/ArtifactSelector';
import { IndraIcon } from '../../utilities/IndraIcons';

export function WorkflowTrigger() {
    const { workflow, updateTrigger } = useWorkflow();
    const [showSelector, setShowSelector] = useState(false);

    const handleSelectSchema = (schema) => {
        updateTrigger({
            type: 'SCHEMA_SUBMIT',
            source: schema,
            label: schema.handle?.label || schema.id
        });
        setShowSelector(false);
    };

    return (
        <aside className="engine-sidebar trigger-panel">
            <header className="panel-header">
                <IndraIcon name="ATOM" size="14px" />
                <h3>DISPARADOR</h3>
            </header>

            <div className="panel-body stack">
                <div
                    className={`trigger-card ${workflow.trigger?.source ? 'active' : 'empty'}`}
                    onClick={() => setShowSelector(true)}
                >
                    <IndraIcon name="SYNC" className="pulse-icon" />
                    <div className="info">
                        <label>{workflow.trigger?.label || 'VINCULAR_SCHEMA'}</label>
                        <small>{workflow.trigger?.source ? 'Ejecutar al enviar formulario' : 'Click para seleccionar disparador'}</small>
                    </div>
                </div>

                {workflow.trigger?.source && (
                    <div className="trigger-context-preview glass stack--tight">
                        <span className="util-label">INPUT_CONTEXT:</span>
                        {workflow.trigger.source.payload?.fields?.slice(0, 5).map(f => (
                            <div key={f.id} className="shelf--tight" style={{ fontSize: '10px', opacity: 0.6 }}>
                                <IndraIcon name="EDIT" size="10px" />
                                <span>{f.label}</span>
                            </div>
                        ))}
                        {workflow.trigger.source.payload?.fields?.length > 5 && (
                            <span style={{ fontSize: '10px', opacity: 0.3 }}>...</span>
                        )}
                    </div>
                )}
            </div>

            {showSelector && (
                <ArtifactSelector
                    title="SELECCIONAR_DISPARADOR"
                    filter={{ classes: ['DATA_SCHEMA'] }}
                    onSelect={handleSelectSchema}
                    onCancel={() => setShowSelector(false)}
                />
            )}
        </aside>
    );
}
