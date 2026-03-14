
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
            {/* Axiomatic Corner Decos */}
            <div className="card-deco deco-tl" />
            <div className="card-deco deco-br" />

            <div className="node-index">{index + 1}</div>

            <div className="node-content fill">
                <div className="shelf--tight" style={{ marginBottom: '4px' }}>
                    <div className="type-badge">{station.type}</div>
                    <div className="hud-line" style={{ width: '20px', opacity: 0.2 }} />
                </div>
                <strong style={{ fontSize: '14px', letterSpacing: '0.02em' }}>
                    {station.config?.label || station.id}
                </strong>
                <p className="font-mono" style={{ fontSize: '9px', opacity: 0.4, textTransform: 'uppercase' }}>
                    {station.type === 'ROUTER' ? 'LOGIC_BIFURCATION' :
                        station.type === 'MAP' ? 'CONTEXT_PRUNING' :
                            'PROTOCOL_EXECUTION'}
                </p>
            </div>

            {/* Side HUD for swappers and actions */}
            <div className="station-hud stack--tight">
                <div className="swapper-group stack--tight">
                    <button
                        className="hud-btn swapper"
                        disabled={isFirst}
                        onClick={(e) => { e.stopPropagation(); moveStation(index, 'up'); }}
                        title="MOVE_UP"
                    >
                        <IndraIcon name="ARROW_UP" size="8px" />
                    </button>
                    <button
                        className="hud-btn swapper"
                        disabled={isLast}
                        onClick={(e) => { e.stopPropagation(); moveStation(index, 'down'); }}
                        title="MOVE_DOWN"
                    >
                        <IndraIcon name="ARROW_DOWN" size="8px" />
                    </button>
                </div>

                <div className="hud-divider" />

                <button
                    className="hud-btn danger"
                    title="DELETE_NODE"
                    onClick={(e) => { e.stopPropagation(); removeStation(station.id); }}
                >
                    <IndraIcon name="CLOSE" size="12px" />
                </button>
            </div>
        </div>
    );
}
