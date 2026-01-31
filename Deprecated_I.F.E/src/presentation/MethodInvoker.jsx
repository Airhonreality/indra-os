import React, { useState, useEffect } from 'react';
import useCoreStore from '../core/state/CoreStore';
import CoreBridge from '../core/bridge/CoreBridge';
import { OntologyService } from '../core/integrity/OntologyService';
import NanoForm from './NanoForm';
import { Play, RefreshCw, History, Activity, Info } from 'lucide-react';

/**
 * 🔬 MethodInvoker: The Engineering Chamber
 * Architecture: Dynamic I/O mapper. Translates Core Contracts into Atomic Forms.
 * Axiom: Zero Hardcoding. Everything is projected from the backend schema.
 */

const MethodInvoker = () => {
    const { selectedMethod, executionLog } = useCoreStore();
    const [payload, setPayload] = useState({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Dynamic schema conversion for NanoForm compatibility
    const [formSchema, setFormSchema] = useState({});

    useEffect(() => {
        const schema = selectedMethod?.schema;
        if (!schema) {
            setFormSchema({});
            setPayload({});
            return;
        }

        // Axiom: Support both Legacy (params) and Modern (io.inputs) contracts
        const inputs = schema.io?.inputs || schema.params || {};
        const newNanoSchema = {};
        const initialPayload = {};

        Object.entries(inputs).forEach(([key, param]) => {
            newNanoSchema[key] = {
                label: param.label || key.toUpperCase(),
                type: _mapType(param.type),
                role: param.role,
                placeholder: param.description || (param.example ? `Example: ${param.example}` : `Enter ${key}...`),
                required: param.required || (param.validation?.required) || false,
                defaultValue: param.defaultValue || param.default,
                example: param.example,
                dataSource: param.dataSource,
                options: []
            };
            initialPayload[key] = (param.defaultValue !== undefined ? param.defaultValue : (param.default !== undefined ? param.default : ''));
        });

        setFormSchema(newNanoSchema);
        setPayload(initialPayload);

        // Fetch dynamic options for selection fields
        Object.entries(newNanoSchema).forEach(async ([key, field]) => {
            if (field.type === 'selection' && field.dataSource) {
                try {
                    const result = await CoreBridge.callCore(selectedMethod.adapter, field.dataSource, {});
                    // Handle both array of strings and array of objects { id, label }
                    const options = Array.isArray(result) ? result : (result.providers || result.accounts || []);
                    setFormSchema(prev => ({
                        ...prev,
                        [key]: { ...prev[key], options: options }
                    }));
                } catch (e) {
                    console.error(`Failed to fetch options for ${key}:`, e);
                }
            }
        });
    }, [selectedMethod]);

    const _mapType = (coreType) => {
        const mapping = {
            'string': 'text',
            'id': 'text',
            'url': 'url',
            'number': 'number',
            'object': 'textarea',
            'boolean': 'checkbox',
            'selection': 'selection'
        };
        return mapping[coreType] || 'text';
    };

    const handleFieldChange = (key, value) => setPayload(prev => ({ ...prev, [key]: value }));

    const handleExecute = async () => {
        if (!selectedMethod) return;
        setIsExecuting(true);
        const store = useCoreStore.getState();

        try {
            // Pre-processing: Parse JSON strings for object/textarea types if they are strings
            const processedPayload = { ...payload };
            Object.entries(formSchema).forEach(([key, schema]) => {
                if (schema.type === 'textarea' && typeof processedPayload[key] === 'string') {
                    // Check if it looks like JSON
                    const trimmed = processedPayload[key].trim();
                    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                        try {
                            processedPayload[key] = JSON.parse(processedPayload[key]);
                        } catch (e) {
                            console.warn(`Failed to parse JSON for field ${key}, sending as string.`);
                        }
                    }
                }
            });

            const result = await CoreBridge.callCore(selectedMethod.adapter, selectedMethod.method, processedPayload);
            store.logExecution({
                adapter: selectedMethod.adapter,
                method: selectedMethod.method,
                payload,
                status: 'success',
                response: result
            });
        } catch (e) {
            console.error('Execution Error:', e);
            store.logExecution({
                adapter: selectedMethod.adapter,
                method: selectedMethod.method,
                payload,
                status: 'error',
                response: e.message
            });
        } finally {
            setIsExecuting(false);
        }
    };

    if (!selectedMethod) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                <Activity size={120} strokeWidth={0.5} />
                <h2 className="mono" style={{ letterSpacing: '8px', marginTop: 'var(--space-xl)' }}>AWAITING_QUANTUM_TARGET</h2>
            </div>
        );
    }

    const { adapter, method, schema } = selectedMethod;
    const theme = OntologyService.getIntentTheme(schema?.intent);
    const IntentIcon = theme.icon;

    return (
        <div style={{ padding: 'var(--space-xl)', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ borderBottom: 'var(--border-thick)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <span className="badge" style={{ background: 'var(--text-primary)', color: 'var(--color-bg)' }}>
                        {selectedMethod.archetype || 'NODE'}
                    </span>
                    <span className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>PROJECTION_KEY: {adapter}.{method}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <IntentIcon size={24} color={theme.color} />
                        <h1 className="mono" style={{ fontSize: '42px', margin: 0, fontWeight: 900, lineHeight: 1 }}>{method}</h1>
                    </div>
                    <button onClick={() => setShowHistoryModal(true)} className="mono" style={{ fontSize: '10px', background: 'transparent' }}>
                        <History size={12} /> RECALL_SNAPSHOT
                    </button>
                </div>

                {schema?.description && (
                    <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: '8px', opacity: 0.7 }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p className="mono" style={{ fontSize: '12px', margin: 0 }}>{schema.description}</p>
                    </div>
                )}
            </header>

            <section className="execution-chamber" style={{ minHeight: '300px' }}>
                {Object.keys(formSchema).length === 0 ? (
                    <div className="code-block" style={{ padding: 'var(--space-xl)', textAlign: 'center', opacity: 0.4 }}>
                        [SIGNAL] NO_INPUT_PARAMETERS_REQUIRED_FOR_THIS_ATOMIC_CONTRACT
                        <div style={{ marginTop: 'var(--space-lg)' }}>
                            <button
                                onClick={handleExecute}
                                disabled={isExecuting}
                                className="btn-primary"
                                style={{
                                    width: '240px',
                                    background: theme.color,
                                    border: 'none',
                                    color: 'white'
                                }}
                            >
                                {isExecuting ? <RefreshCw className="spin-anim" size={14} /> : <Play size={14} />} EXECUTE_VOID
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ maxWidth: '600px' }}>
                        <div className="mono" style={{ fontSize: '10px', opacity: 0.4, marginBottom: 'var(--space-md)' }}>[INPUT_BUFFER_READY]</div>
                        <NanoForm
                            schema={formSchema}
                            data={payload}
                            onChange={handleFieldChange}
                            onSubmit={handleExecute}
                            disabled={isExecuting}
                            submitLabel={isExecuting ? 'TRANSMITTING...' : `EXECUTE_${schema?.intent || 'ACTION'}`}
                            accentColor={theme.color}
                        />
                    </div>
                )}
            </section>

            {/* Response Preview Area */}
            {executionLog.length > 0 && executionLog[0].adapter === adapter && executionLog[0].method === method && (
                <section style={{ marginTop: 'var(--space-xl)', borderTop: 'var(--border-thin)', paddingTop: 'var(--space-xl)' }}>
                    <div className="mono" style={{ fontSize: '11px', fontWeight: 900, marginBottom: 'var(--space-md)' }}>[LATEST_RESPONSE_BUFFER]</div>
                    <pre className="code-block" style={{ maxHeight: '400px', overflow: 'auto', borderLeft: `4px solid ${theme.color}` }}>
                        {JSON.stringify(executionLog[0].response, null, 2)}
                    </pre>
                </section>
            )}

            {/* Modal de Historia */}
            {showHistoryModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="gateway-card" style={{ width: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <header className="panel-header" style={{ flexShrink: 0 }}>
                            <History size={14} /> <span>HISTORICAL_SNAPSHOTS_LOG</span>
                            <button onClick={() => setShowHistoryModal(false)} style={{ marginLeft: 'auto', background: 'transparent' }}>CLOSE</button>
                        </header>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                            {executionLog.map(log => (
                                <div key={log.id} className="code-block" style={{ fontSize: '10px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.5, borderBottom: '1px solid #eee', marginBottom: '4px' }}>
                                        <span>{log.timestamp}</span>
                                        <span>{log.status === 'success' ? 'VALID' : 'REJECTED'}</span>
                                    </div>
                                    <div style={{ fontWeight: 800 }}>{log.adapter}.{log.method}</div>
                                    <pre style={{ margin: '4px 0 0 0', opacity: 0.8 }}>{JSON.stringify(log.payload, null, 2)}</pre>
                                </div>
                            ))}
                            {executionLog.length === 0 && <div className="code-block">[SYSTEM] NO_RECORDS_FOUND_IN_PERSISTENT_MEMORY</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MethodInvoker;
