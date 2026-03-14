
import React from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { IndraIcon } from '../../utilities/IndraIcons';

export function WorkflowSandbox() {
    const { workflow } = useWorkflow();

    return (
        <div className="workflow-sandbox glass">
            <header className="spread">
                <div className="shelf--tight">
                    <span className="text-label" style={{ fontSize: '9px', opacity: 0.5 }}>TERMINAL // SIMULATION_ENV</span>
                </div>
                <div className="shelf">
                    <button className="btn-axiom btn-axiom--accent">
                        <div className="btn-axiom__inner shelf--tight">
                            <IndraIcon name="PLAY" size="10px" />
                            <span>RUN_TRACE</span>
                        </div>
                    </button>
                </div>
            </header>

            <main className="sandbox-grid">
                <div className="mock-area stack--tight">
                    <div className="shelf--tight" style={{ marginBottom: '4px' }}>
                        <div className="util-dot" />
                        <span className="text-label" style={{ fontSize: '8px opacity: 0.6' }}>MOCK_TRIGGER_DATA</span>
                    </div>
                    <div className="terminal-box glass-void">
                        <pre className="font-mono">
                            {JSON.stringify({
                                trigger: {
                                    sender: "User123",
                                    timestamp: Date.now()
                                }
                            }, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="trace-area stack--tight">
                    <div className="shelf--tight" style={{ marginBottom: '4px' }}>
                        <div className="util-dot pulse" style={{ background: 'var(--color-accent)' }} />
                        <span className="text-label" style={{ fontSize: '8px opacity: 0.6' }}>EXECUTION_TRACE</span>
                    </div>
                    <div className="terminal-box glass-void stack--tight">
                        <div className="trace-line shelf--tight font-mono">
                            <span className="timestamp">[{new Date().toLocaleTimeString()}]</span>
                            <span className="status ok">INIT: SUCCESS</span>
                        </div>
                        {workflow.stations.map(s => (
                            <div key={s.id} className="trace-line shelf--tight font-mono opacity-40">
                                <span className="timestamp">[{new Date().toLocaleTimeString()}]</span>
                                <span className="status pending">{s.config?.label?.toUpperCase() || s.id.toUpperCase()}: PENDING...</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
