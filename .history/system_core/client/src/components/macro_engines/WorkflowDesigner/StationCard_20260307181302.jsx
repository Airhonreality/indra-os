
import React from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { IndraIcon } from '../../utilities/IndraIcons';

export function StationCard({ station, index, isSelected, onSelect }) {
    const { moveStation, removeStation, workflow } = useWorkflow();
    const isFirst = index === 0;
    const isLast = index === workflow.stations.length - 1;

    return (
        <div
            className={`station-node type-${station.type.toLowerCase()} ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <div className="node-index">{index + 1}</div>

            <div className="node-content">
                <div className="type-badge">{station.type}</div>
                <strong>{station.config?.label || station.id}</strong>
                <p>
                    {station.type === 'ROUTER' ? 'Decision Logic' :
                        station.type === 'MAP' ? 'Context Pruning' :
                            'Protocol Instruction'}
                </p>
            </div>

            <div className="node-actions shelf--tight">
                {/* Intercambiadores de posición (Arrows) */}
                <div className="stack--tight position-swappers">
                    <button
                        className="swapper-btn"
                        disabled={isFirst}
                        onClick={(e) => { e.stopPropagation(); moveStation(index, 'up'); }}
                    >
                        <IndraIcon name="ARROW_UP" size="10px" />
                    </button>
                    <button
                        className="swapper-btn"
                        disabled={isLast}
                        onClick={(e) => { e.stopPropagation(); moveStation(index, 'down'); }}
                    >
                        <IndraIcon name="ARROW_DOWN" size="10px" />
                    </button>
                </div>

                <div className="vertical-divider" style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 var(--space-2)' }} />

                <button className="icon-btn danger" title="Eliminar" onClick={(e) => { e.stopPropagation(); removeStation(station.id); }}>
                    <IndraIcon name="CLOSE" size="14px" />
                </button>
            </div>
        </div>
    );
}
