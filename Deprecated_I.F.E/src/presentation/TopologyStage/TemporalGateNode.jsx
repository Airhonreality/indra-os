import React, { useState } from 'react';
import { Clock, Calendar, Shuffle, Play, X } from 'lucide-react';
import useCoreStore from '../../core/state/CoreStore';

/**
 * ⏳ TemporalGateNode (Phase H.2)
 * Specialized visual component for Time-based Entry Points.
 * Allows configuring the 'scheduledAt' property for scheduled flows.
 * @component
 */
const TemporalGateNode = ({ id, node, meta, pos, selected, onSelect, onMouseDown, onPortClick }) => {
    const { updateNode, deleteNode } = useCoreStore();
    // Initialize from node payload or default
    const [schedule, setSchedule] = useState(node.scheduledAt || '00 09 * * 1'); // Cron default (Mon 9AM)

    const handleScheduleChange = (val) => {
        setSchedule(val);
    };

    const persistSchedule = () => {
        // H.2: Persist Activation Window to Store
        updateNode(id, { scheduledAt: schedule });
        console.log(`[TemporalGate] Scheduled updated for ${id}: ${schedule}`);
    };

    // Determine mode based on node content/intent
    const isCron = node.methods?.includes('scheduleCron');
    const isOneOff = node.methods?.includes('scheduleOnce');

    return (
        <div
            className="contract-node temporal-gate"
            onClick={(e) => { e.stopPropagation(); onSelect(id); }}
            onMouseDown={onMouseDown}
            style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: '240px',
                background: 'var(--color-bg)',
                border: selected ? `2px solid var(--color-accent)` : `1px solid ${meta.color}`,
                boxShadow: selected ? `0 0 15px ${meta.color}40` : `4px 4px 0px 0px var(--color-surface-dark)`,
                padding: 0,
                cursor: 'move',
                zIndex: selected ? 10 : 2,
                borderRadius: '4px',
                overflow: 'hidden'
            }}
        >
            {/* Header: Temporal Identity */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: meta.color,
                color: 'var(--color-bg)', // Contrast
                padding: '6px 8px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} strokeWidth={3} />
                    <span className="mono-bold" style={{ fontSize: '11px' }}>TEMPORAL_GATE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isCron ? <Shuffle size={12} /> : <Calendar size={12} />}
                    <X
                        size={12}
                        className="hover-bright"
                        style={{ cursor: 'pointer', marginLeft: '4px' }}
                        onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                    />
                </div>
            </header>

            {/* Body: Configuration Surface */}
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--color-surface-soft)',
                    padding: '4px',
                    borderRadius: '4px'
                }}>
                    <span className="mono" style={{ fontSize: '9px', opacity: 0.7 }}>TRIGGER:</span>
                    <code style={{ fontSize: '10px', color: 'var(--color-logic)' }}>
                        {isCron ? 'CRON_EXPRESSION' : 'ISO_TIMESTAMP'}
                    </code>
                </div>

                {/* Interactive Input for Phase H.2 */}
                <input
                    type="text"
                    value={schedule}
                    onChange={(e) => handleScheduleChange(e.target.value)}
                    onBlur={persistSchedule}
                    className="mono-input"
                    placeholder="Enter cron or ISO..."
                    style={{
                        width: '100%',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--border-color)',
                        padding: '6px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                    }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span className="mono" style={{ fontSize: '8px', opacity: 0.5 }}>NEXT_WINDOW: CALCULATING...</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); console.log('FORCE_EXECUTION', id); }}
                        style={{ padding: '2px 6px', fontSize: '9px', background: 'var(--accent-success)', color: 'white', border: 'none' }}
                    >
                        <Play size={10} /> RUN_NOW
                    </button>
                </div>
            </div>

            {/* 📥 Input Port (Always Left) */}
            <div
                className="input-port"
                onClick={(e) => {
                    e.stopPropagation();
                    const method = isCron ? 'scheduleCron' : (isOneOff ? 'scheduleOnce' : 'trigger');
                    onPortClick(e, id, method, false);
                }}
                style={{
                    position: 'absolute',
                    left: '-6px',
                    top: '65px',
                    width: '12px',
                    height: '12px',
                    background: 'var(--color-surface-accent)',
                    borderRadius: '50%',
                    border: '2px solid var(--color-bg)',
                    cursor: 'crosshair',
                    zIndex: 20
                }}
            />

            {/* 📤 Output Port (Always Right) */}
            <div
                className="output-port"
                onClick={(e) => {
                    e.stopPropagation();
                    const method = isCron ? 'scheduleCron' : (isOneOff ? 'scheduleOnce' : 'trigger');
                    onPortClick(e, id, method, true);
                }}
                style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '65px',
                    width: '12px',
                    height: '12px',
                    background: meta.color,
                    borderRadius: '50%',
                    border: '2px solid var(--color-bg)',
                    cursor: 'crosshair',
                    zIndex: 20
                }}
            />
        </div>
    );
};

export default TemporalGateNode;
