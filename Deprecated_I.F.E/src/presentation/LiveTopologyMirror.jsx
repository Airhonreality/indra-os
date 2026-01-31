import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, RefreshCw, Trash2, Zap } from 'lucide-react';
import { useCoreStore } from '../core/state/CoreStore';
import ScenarioService from '../core/integrity/ScenarioService';

/**
 * 🪞 LiveTopologyMirror: The Logical Reflection (V2)
 * Synchronizes the visual canvas with its underlying JSON Manifest.
 * Logic: Store -> Editor (Sync) | Editor -> Store (Injection)
 */
const LiveTopologyMirror = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [jsonText, setJsonText] = useState('{}');
    const [isEditing, setIsEditing] = useState(false);
    const { nodes, flows, addLog, clearTopology } = useCoreStore();
    const editorRef = useRef(null);

    // Sync from Store -> Editor (ONLY if not actively editing)
    useEffect(() => {
        if (isEditing) return;

        const scenario = {
            name: "LIVE_CANVAS_SYNC",
            nodes,
            connections: flows?.connections || []
        };
        setJsonText(JSON.stringify(scenario, null, 2));
    }, [nodes, flows, isEditing]);

    const handleApplyChanges = () => {
        try {
            // Support for "Empty" injection = Clear
            const trimmed = jsonText.trim();
            if (!trimmed || trimmed === '{}') {
                handleReset();
                return;
            }

            const scenario = JSON.parse(trimmed);
            ScenarioService.injectScenario(scenario);
            addLog('success', 'TOPOLOGY_MIRROR >> Logic Injected. Canvas Re-hydrated.');
            setIsEditing(false); // Resume sync
        } catch (e) {
            addLog('error', `TOPOLOGY_MIRROR_FAILURE >> ${e.message}`);
        }
    };

    const handleReset = () => {
        if (window.confirm("⚠️ Clear Workspace? This will destroy all nodes and connections.")) {
            clearTopology();
            setJsonText(JSON.stringify({ name: "EMPTY_WORKSPACE", nodes: {}, connections: [] }, null, 2));
            addLog('warn', 'TOPOLOGY_MIRROR >> Workspace Reset.');
        }
    };

    return (
        <div className="live-mirror-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: 'var(--border-thick)',
            background: 'var(--color-surface-soft)',
            flex: isCollapsed ? '0 0 auto' : '1',
            minHeight: isCollapsed ? '40px' : '400px',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <header
                className="panel-header"
                style={{
                    padding: '8px 12px',
                    background: 'var(--color-surface-bright)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BrainCircuit size={14} style={{ color: isEditing ? 'var(--accent-warning)' : 'var(--accent-primary)' }} className={isEditing ? 'pulsing' : ''} />
                    <span className="mono-bold" style={{ fontSize: '11px' }}>
                        {isEditing ? 'EDITING_MODE_ACTIVE' : 'LIVE_TOPOLOGY_MIRROR'}
                    </span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '9px', opacity: 0.5 }}>
                        {isCollapsed ? '[ EXPAND ]' : '[ COLLAPSE ]'}
                    </span>
                </div>
            </header>

            {!isCollapsed && (
                <>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <textarea
                            ref={editorRef}
                            className="mono edit-area"
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            onFocus={() => setIsEditing(true)}
                            onBlur={() => {
                                // Delay resuming sync to allow click on "Inject" button
                                setTimeout(() => setIsEditing(false), 200);
                            }}
                            spellCheck={false}
                            style={{
                                flex: 1,
                                background: '#050505',
                                color: isEditing ? '#fff' : '#00d0ff',
                                fontSize: '10px',
                                padding: '12px',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'monospace',
                                transition: 'color 0.2s'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.6)',
                            padding: '4px 8px',
                            fontSize: '8px',
                            color: isEditing ? 'var(--accent-warning)' : 'var(--accent-primary)',
                            border: `1px solid ${isEditing ? 'var(--accent-warning)' : 'var(--accent-primary)'}`
                        }}>
                            {isEditing ? 'SYNC_PAUSED' : 'REALTIME_STREAM'}
                        </div>
                    </div>
                    <footer style={{
                        padding: '8px 12px',
                        borderTop: '1px solid var(--color-surface-bright)',
                        background: 'var(--color-bg)',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <button
                            className="mono"
                            onClick={handleReset}
                            title="Reset Workspace"
                            style={{
                                background: 'transparent',
                                border: '1px solid #ff4444',
                                color: '#ff4444',
                                padding: '6px'
                            }}
                        >
                            <Trash2 size={12} />
                        </button>
                        <button
                            className="mono"
                            onClick={handleApplyChanges}
                            style={{
                                background: isEditing ? 'var(--accent-primary)' : 'var(--color-surface-bright)',
                                border: '1px solid var(--accent-primary)',
                                color: isEditing ? 'black' : 'var(--accent-primary)',
                                fontSize: '10px',
                                padding: '6px',
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontWeight: 'bold'
                            }}
                        >
                            <Zap size={12} /> INJECT_TO_CANVAS
                        </button>
                    </footer>
                </>
            )}
        </div>
    );
};

export default LiveTopologyMirror;
