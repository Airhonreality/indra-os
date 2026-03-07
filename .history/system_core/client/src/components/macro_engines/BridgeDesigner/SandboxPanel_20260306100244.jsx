/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/SandboxPanel.jsx
 * RESPONSABILIDAD: Pruebas en vivo del motor lógico contra el Core GAS.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { executeDirective } from '../../../services/directive_executor';

export function SandboxPanel({ bridgeId, coreUrl, sessionSecret }) {
    const [testInput, setTestInput] = useState('{\n  "sample_key": "sample_value"\n}');
    const [testResult, setTestResult] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);

    const runTest = async () => {
        setIsExecuting(true);
        try {
            const dataInput = JSON.parse(testInput);
            const result = await executeDirective({
                provider: 'system',
                protocol: 'LOGIC_EXECUTE',
                context_id: bridgeId,
                data_input: dataInput
            }, coreUrl, sessionSecret);

            setTestResult(result);
        } catch (err) {
            console.error('[Sandbox] Execution failed:', err);
            setTestResult({ error: err.message });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="stack glass-strong" style={{
            marginTop: 'var(--space-8)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-accent)'
        }}>
            <header className="spread">
                <div className="shelf--tight">
                    <IndraIcon name="PLAY" size="14px" style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>LIVE_RESONANCE_SANDBOX</span>
                </div>
                <button
                    className={`btn btn--sm ${isExecuting ? 'btn--ghost' : 'btn--accent'}`}
                    onClick={runTest}
                    disabled={isExecuting}
                >
                    {isExecuting ? 'EXECUTING...' : 'RUN_TEST'}
                </button>
            </header>

            <div className="shelf--loose" style={{ marginTop: 'var(--space-4)', height: '180px' }}>
                {/* Input Area */}
                <div className="fill stack--tight">
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>SAMPLE_INPUT_JSON</span>
                    <textarea
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'var(--color-bg-void)',
                            border: '1px solid var(--color-border)',
                            color: 'white',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-sm)',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Result Area */}
                <div className="fill stack--tight">
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>VIRTUAL_CONTEXT_RESULT</span>
                    <div style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-accent)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'auto'
                    }}>
                        {testResult ? (
                            <pre style={{ margin: 0 }}>{JSON.stringify(testResult, null, 2)}</pre>
                        ) : (
                            <div className="center fill" style={{ opacity: 0.2 }}>AWAITING_EXECUTION...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
