/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/WorkflowDesigner/WorkflowSandbox.jsx
 * RESPONSABILIDAD: Panel de Trazado de Workflows (Colapsable).
 * AXIOMA: Unificacion de estetica y comportamiento con el Bridge Labs.
 * =============================================================================
 */

import React, { useState } from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { IndraIcon } from '../../utilities/IndraIcons';

export function WorkflowSandbox({ 
    status, 
    traceLogs, 
    runTrace,
    isExpanded,
    onToggle
}) {
    const { workflow } = useWorkflow();
    const [viewMode, setViewMode] = useState('TRACE'); // 'TRACE' | 'JSON'
    const [mockInput, setMockInput] = useState({
        trigger: { sender: "User123", timestamp: Date.now() }
    });

    return (
        <div className={`indra-sandbox-shell ${isExpanded ? 'is-expanded' : 'is-collapsed'} glass`}>
            {/* MICRO-HEADER UNIFICADO (32px) */}
            <header className="indra-sandbox-header spread" onClick={onToggle}>
                <div className="shelf--tight" style={{ gap: 'var(--space-3)' }}>
                    <IndraIcon name="MAP_ROUTE" size="12px" color="var(--color-accent)" />
                    <span className="font-mono" style={{ fontSize: '9px', letterSpacing: '2px', fontWeight: 'bold' }}>
                        WORKFLOW // {status.toUpperCase()}
                    </span>
                    {status === 'RUNNING' && <span className="badge badge--accent" style={{ fontSize: '7px' }}>EJECUTANDO_TRAZA...</span>}
                </div>
                
                <div className="shelf--tight">
                    <button 
                        className={`btn btn--xs ${status === 'RUNNING' ? 'btn--ghost' : 'btn--accent'}`}
                        onClick={(e) => { e.stopPropagation(); runTrace(mockInput); }}
                        disabled={status === 'RUNNING'}
                        style={{ height: '20px', padding: '0 10px', fontSize: '8px', borderRadius: '2px' }}
                    >
                        <IndraIcon name={status === 'RUNNING' ? 'REFRESH' : 'PLAY'} size="10px" className={status === 'RUNNING' ? 'spin' : ''} />
                        <span style={{ marginLeft: '4px' }}>IGNITE_TRACE</span>
                    </button>
                    <div className="spacer--h" style={{ width: 'var(--space-3)' }} />
                    <IndraIcon name={isExpanded ? 'ARROW_DOWN' : 'ARROW_UP'} size="10px" opacity={0.5} />
                </div>
            </header>

            {/* CUERPO DEL SIMULADOR */}
            {isExpanded && (
                <main className="indra-sandbox-body">
                    {/* COLUMNA 1: MOCK PAYLOAD */}
                    <div className="sandbox-col stack--tight">
                        <div className="spread" style={{ padding: '0 4px', marginBottom: '8px' }}>
                            <span className="text-label" style={{ fontSize: '8px', opacity: 0.4 }}>MOCK_TRIGGER</span>
                        </div>
                        <div className="fill overflow-auto scrollbar-hidden" style={{ background: 'var(--indra-terminal-bg)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--indra-panel-border)' }}>
                            <textarea 
                                value={JSON.stringify(mockInput, null, 2)} 
                                onChange={(e) => { try { setMockInput(JSON.parse(e.target.value)); } catch(err) { /* ignore */ } }}
                                className="util-input--sm fill font-mono" 
                                style={{ background: 'transparent', border: 'none', color: 'var(--indra-terminal-text)', fontSize: '9px', width: '100%', height: '100%', outline: 'none', resize: 'none' }}
                            />
                        </div>
                    </div>

                    <div className="sandbox-divider" />

                    {/* COLUMNA 2: TRAZA SECUENCIAL */}
                    <div className="sandbox-col stack--tight fill">
                        <div className="spread" style={{ padding: '0 4px', marginBottom: '8px' }}>
                            <span className="text-label" style={{ fontSize: '8px', opacity: 0.4 }}>EXECUTION_TRACE_RESONANCE</span>
                        </div>
                        <div className="fill overflow-auto scrollbar-hidden" style={{ background: 'var(--indra-terminal-bg)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--indra-panel-border)' }}>
                            {traceLogs.length === 0 ? (
                                <div className="center fill opacity-20 font-mono" style={{ fontSize: '9px', color: 'var(--indra-terminal-text)' }}>AWAITING_RESONANCE_TRIGGER...</div>
                            ) : (
                                <div className="stack--tight">
                                    {traceLogs.map((log, i) => (
                                        <div key={i} className="shelf--tight" style={{ gap: '10px', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <div className="text-hint font-mono" style={{ minWidth: '80px', fontSize: '7px', opacity: 0.4 }}>[{log.timestamp}]</div>
                                            <div className="font-mono truncate" style={{ 
                                                fontSize: '9px', 
                                                color: log.status === 'OK' ? 'var(--color-accent)' : log.status === 'ERROR' ? 'var(--color-warm)' : 'var(--indra-terminal-text)'
                                            }}>
                                                {log.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            )}

            <style>{`
                .indra-sandbox-shell {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border-top: 1px solid var(--indra-dynamic-border);
                    display: flex; flex-direction: column;
                    background: var(--indra-panel-bg) !important;
                    margin: 0 var(--space-4);
                    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
                    overflow: hidden;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.2);
                    z-index: 100;
                }
                .is-collapsed { height: 32px; cursor: pointer; }
                .is-expanded { height: 260px; }
                .indra-sandbox-header { height: 32px; padding: 0 var(--space-4); align-items: center; user-select: none; }
                .indra-sandbox-body { flex: 1; display: flex; padding: var(--space-3); gap: var(--space-4); overflow: hidden; background: var(--indra-canvas-bg); }
                .sandbox-col { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
                .sandbox-divider { width: 1px; background: var(--indra-panel-border); }
                .scrollbar-hidden::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
