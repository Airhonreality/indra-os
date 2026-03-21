import React, { useState } from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { IndraIcon } from '../../utilities/IndraIcons';

export function WorkflowSandbox({ status, traceLogs, runTrace }) {
    const { workflow } = useWorkflow();
    const [mockInput, setMockInput] = useState({
        trigger: {
            sender: "User123",
            timestamp: Date.now()
        }
    });

    return (
        <div className={`workflow-sandbox glass ${status === 'RUNNING' ? 'running' : ''}`}>
            <header className="spread">
                <div className="shelf--tight">
                    <span className="text-label" style={{ fontSize: '9px', opacity: 0.5, letterSpacing: '0.1em' }}>SANDBOX // {status.toUpperCase()}</span>
                </div>
                <div className="shelf">
                    <button
                        className={`btn ${status === 'RUNNING' ? 'btn--ghost' : 'btn--accent'}`}
                        onClick={() => runTrace(mockInput)}
                        disabled={status === 'RUNNING'}
                    >
                        <IndraIcon name={status === 'RUNNING' ? 'SYNC' : 'PLAY'} style={status === 'RUNNING' ? { animation: 'spin 1s linear infinite' } : {}} />
                        {status === 'RUNNING' ? 'RUNNING_TRACE...' : 'INIT_RES_TRACE'}
                    </button>
                </div>
            </header>

            <main className="sandbox-grid">
                <div className="mock-area stack--tight">
                    <div className="shelf--tight" style={{ marginBottom: '4px' }}>
                        <div className="util-dot" />
                        <span className="text-label" style={{ fontSize: '8px', opacity: 0.6 }}>DNA_PAYLOAD_MOCK</span>
                    </div>
                    <div className="terminal-box glass-void">
                        <pre className="font-mono text-hint" style={{ fontSize: '10px' }}>
                            {JSON.stringify(mockInput, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="trace-area stack--tight">
                    <div className="shelf--tight" style={{ marginBottom: '4px' }}>
                        <div className={`util-dot ${status === 'RUNNING' ? 'pulse' : ''}`} style={{ background: status === 'RUNNING' ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)' }} />
                        <span className="text-label" style={{ fontSize: '8px', opacity: 0.6 }}>SYSTEM_EXECUTION_TRACE</span>
                    </div>
                    <div className="terminal-box glass-void stack--tight" style={{ minHeight: '120px' }}>
                        {traceLogs.length === 0 && (
                            <div className="trace-line shelf--tight font-mono opacity-20 center">
                                <span className="text-hint">AWAITING_RESONANCE_TRIGGER...</span>
                            </div>
                        )}
                        {traceLogs.map((log, i) => (
                            <div key={i} className="trace-line shelf--tight font-mono" style={{ fontSize: '10px' }}>
                                <span className="timestamp" style={{ opacity: 0.4 }}>[{log.timestamp}]</span>
                                <span className={`status ${log.status.toLowerCase()}`} style={{
                                    color: log.status === 'OK' ? 'var(--color-accent)' : log.status === 'ERROR' ? 'var(--color-warm)' : 'var(--color-text-primary)'
                                }}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
