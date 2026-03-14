
import React from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { IndraIcon } from '../../utilities/IndraIcons';

export function StationCard({ station, index, isSelected, isExecuting, onSelect }) {
    const { moveStation, removeStation, workflow } = useWorkflow();
    const isFirst = index === 0;
    const isLast = index === workflow.stations.length - 1;

    // Charming Cabling Check
    const isCabled = () => {
        if (station.type === 'PROTOCOL') {
            return station.mapping?.message_body && station.mapping?.recipient;
        }
        if (station.type === 'MAP') {
            return station.config?.pruning?.length > 0;
        }
        return true; // Routers y otros por defecto
    };

    return (
        <div
            className={`station-node type-${station.type.toLowerCase()} ${isSelected ? 'selected' : ''} ${isExecuting ? 'executing' : ''} ${isCabled() ? 'cabled' : 'uncabled'}`}
            onClick={onSelect}
        >
            {/* Axiomatic Corner Decos */}
            <div className="card-deco deco-tl" />
            <div className="card-deco deco-br" />

            <div className="node-index">{index + 1}</div>

            <div className="node-content fill">
                <div className="shelf--tight" style={{ marginBottom: '4px' }}>
                    <div className="type-badge">{station.type}</div>
                    {isCabled() ? (
                        <div className="cabling-status cabled shelf--tight">
                            <IndraIcon name="LINK" size="8px" />
                            <span style={{ fontSize: '7px' }}>CABLED</span>
                        </div>
                    ) : (
                        <div className="cabling-status uncabled shelf--tight">
                            <IndraIcon name="WARNING" size="8px" />
                            <span style={{ fontSize: '7px' }}>UNCABLED</span>
                        </div>
                    )}
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
