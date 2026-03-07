/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/SandboxPanel.jsx
 * RESPONSABILIDAD: Pruebas en vivo del motor lógico contra el Core GAS.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { executeDirective } from '../../../services/directive_executor';
import { IndraActionTrigger } from '../../utilities/IndraActionTrigger';

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
        <div className="shelf--loose" style={{
            padding: 'var(--space-4) var(--space-8)',
            height: '160px',
            width: '100%'
        }}>
            {/* Input Area */}
            <div className="fill stack--tight" style={{ height: '100%' }}>
                <header className="shelf--tight" style={{ marginBottom: 'var(--space-1)' }}>
                    <IndraIcon name="PLAY" size="14px" style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>LIVE_RESONANCE_SANDBOX</span>
                    <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>// V8_ENGINE PAYLOAD</span>
                </header>
                <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        color: 'white',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        resize: 'none',
                        outline: 'none'
                    }}
                />
            </div>

            {/* Execute Button */}
            <div className="center stack--tight" style={{ padding: '0 var(--space-2)' }}>
                <div style={{ height: '50px', width: '1px', background: 'var(--color-border)', marginBottom: 'var(--space-2)' }} />
                <IndraActionTrigger
                    icon="PLAY"
                    label="RUN_TEST"
                    onClick={runTest}
                    activeColor="var(--color-accent)"
                    color="var(--color-text-secondary)"
                    size="18px"
                    loading={isExecuting}
                />
                <span style={{ fontSize: '8px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>EXECUTE</span>
                <div style={{ height: '50px', width: '1px', background: 'var(--color-border)', marginTop: 'var(--space-2)' }} />
            </div>

            {/* Result Area */}
            <div className="fill stack--tight" style={{ height: '100%' }}>
                <header className="shelf--tight" style={{ marginBottom: 'var(--space-1)', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>VIRTUAL_CONTEXT_RESULT // </span>
                </header>
                <div style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--color-border)',
                    color: testResult?.error ? 'var(--color-danger)' : 'var(--color-accent)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                }}>
                    {testResult ? (
                        <pre style={{ margin: 0 }}>{JSON.stringify(testResult, null, 2)}</pre>
                    ) : (
                        <div className="center fill" style={{ opacity: 0.2 }}>AWAITING_EXECUTION...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
