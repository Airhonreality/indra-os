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

export function SandboxPanel({ bridgeId, coreUrl, sessionSecret, schemas = {}, sources = [], sourceConfigs = {} }) {
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

    const syncPayload = () => {
        if (!sources.length) return;

        const payload = {};
        sources.forEach(sid => {
            const config = sourceConfigs[sid] || {};
            const schema = schemas[sid];
            if (!schema) return;

            const customAlias = config.alias || schema.handle?.label || schema.label || sid;
            const alias = customAlias.toLowerCase().replace(/\s+/g, '_');

            const activeFields = config.activeFields;
            const fieldsToInclude = activeFields ? schema.fields?.filter(f => activeFields.includes(f.id)) : schema.fields;

            const shape = {};
            (fieldsToInclude || []).forEach(f => {
                shape[f.id] = f.type === 'number' || f.type === 'NUMBER' ? 0
                    : f.type === 'boolean' || f.type === 'BOOLEAN' || f.type === 'checkbox' ? true
                        : `demo_${f.id}`;
            });

            // Si se definió un ID de prueba manual
            if (config.test_id) {
                shape._item_id = config.test_id;
            }

            payload[alias] = shape;
        });

        setTestInput(JSON.stringify(payload, null, 2));
    };

    // Auto-sync if default
    React.useEffect(() => {
        if (testInput.includes('"sample_key"') && sources.length > 0) {
            syncPayload();
        }
    }, [sources, schemas, sourceConfigs]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 'var(--space-6)',
            padding: 'var(--space-4) var(--space-8)',
            minHeight: '200px',
            width: '100%',
            overflow: 'hidden'
        }}>
            {/* Input Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <header className="spread" style={{ marginBottom: 'var(--space-1)' }}>
                    <div className="shelf--tight">
                        <IndraIcon name="PLAY" size="14px" style={{ color: 'var(--color-accent)' }} />
                        <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>LIVE_RESONANCE_SANDBOX</span>
                        <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>// V8_ENGINE PAYLOAD</span>
                    </div>
                    <button onClick={syncPayload} className="btn btn--xs btn--ghost" style={{ fontSize: '8px', padding: '2px 4px', opacity: 0.6 }}>
                        <IndraIcon name="REFRESH" size="8px" /> SYNC_SCHEMA
                    </button>
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
                        fontSize: '11px',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        resize: 'none',
                        outline: 'none',
                        lineHeight: 1.4
                    }}
                />
            </div>

            {/* Execute Button */}
            <div className="center stack--tight" style={{ padding: '0 var(--space-4)' }}>
                <div style={{ flex: 1, width: '1px', background: 'var(--color-border)' }} />
                <button
                    className={`btn ${isExecuting ? 'btn--ghost' : 'btn--accent'}`}
                    onClick={runTest}
                    disabled={isExecuting}
                    style={{
                        padding: 'var(--space-2) var(--space-4)',
                        fontSize: '10px',
                        letterSpacing: '1px',
                        boxShadow: isExecuting ? 'none' : '0 0 10px rgba(var(--color-accent-rgb), 0.2)'
                    }}
                >
                    <div className="shelf--tight">
                        <IndraIcon name="PLAY" size="12px" />
                        <span>{isExecuting ? 'EXECUTING...' : 'EXECUTE'}</span>
                    </div>
                </button>
                <div style={{ flex: 1, width: '1px', background: 'var(--color-border)' }} />
            </div>

            {/* Result Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <header className="shelf--tight" style={{ marginBottom: 'var(--space-1)', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>VIRTUAL_CONTEXT_RESULT // </span>
                </header>
                <div style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--color-border)',
                    color: testResult?.error ? 'var(--color-danger)' : 'var(--color-accent)',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4,
                    fontSize: '11px',
                    padding: 'var(--space-3)'
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
