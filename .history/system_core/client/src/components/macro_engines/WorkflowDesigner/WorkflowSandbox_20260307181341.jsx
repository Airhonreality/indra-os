
import React from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { IndraIcon } from '../../utilities/IndraIcons';

export function WorkflowSandbox() {
    const { workflow } = useWorkflow();

    return (
        <div className="workflow-sandbox glass-panel">
            <header className="spread">
                <div className="shelf--tight font-mono" style={{ fontSize: '10px', opacity: 0.6 }}>
                    <IndraIcon name="TERMINAL" size="12px" />
                    <span>SANDBOX_SIMULATION_ENV</span>
                </div>
                <div className="shelf--tight">
                    <button className="btn--xs btn--accent">
                        <IndraIcon name="PLAY" />
                        RUN_TRACE
                    </button>
                </div>
            </header>

            <main className="sandbox-body shelf--loose">
                <div className="input-mock fill stack--tight">
                    <span className="util-label">MOCK_TRIGGER_DATA</span>
                    <pre style={{
                        background: 'var(--color-bg-void)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        color: 'var(--color-text-tertiary)',
                        height: '100px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify({
                            trigger: {
                                sender: "User123",
                                timestamp: Date.now()
                            }
                        }, null, 2)}
                    </pre>
                </div>

                <div className="v-divider" style={{ width: '1px', height: '100px', background: 'var(--color-border)' }} />

                <div className="output-trace fill stack--tight">
                    <span className="util-label">EXECUTION_TRACE</span>
                    <div className="trace-list stack--tight" style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
                        <div className="shelf--tight" style={{ color: 'var(--color-success)' }}>
                            <IndraIcon name="OK" size="10px" />
                            <span>INIT: Success</span>
                        </div>
                        {workflow.stations.map(s => (
                            <div key={s.id} className="shelf--tight" style={{ opacity: 0.4 }}>
                                <IndraIcon name="SYNC" size="10px" />
                                <span>{s.config?.label || s.id}: Pending</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
