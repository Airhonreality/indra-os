import React, { useState } from 'react';
import useCoreStore from '../core/state/CoreStore';
import CoreBridge from '../core/bridge/CoreBridge';
import { Terminal, Database, Copy, Trash2, Check, Clock, ShieldCheck, Activity, AlertTriangle, Wrench, RefreshCw } from 'lucide-react';

/**
 * 🛰️ LogStream: Real-time Telemetry & Diagnostics
 * Axiom: Total Observability.
 */

const LogEntry = ({ entry }) => {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const { contracts } = useCoreStore();
    const [repairing, setRepairing] = useState(false);

    const runRepair = async (e) => {
        e.stopPropagation();
        setRepairing(true);
        try {
            await CoreBridge.callCore('publicApi', 'quickDiagnostic', { targetAdapter: entry.adapter });
        } catch (err) {
            console.error('Repair trigger failed:', err);
        } finally {
            setRepairing(false);
        }
    };

    const copyResult = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(JSON.stringify(entry.response, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isSuccess = entry.status === 'success';
    const severity = entry.severity || (isSuccess ? 'info' : 'critical');
    const contract = contracts[entry.adapter]?.schemas?.[entry.method];

    return (
        <div
            onClick={() => setExpanded(!expanded)}
            style={{
                borderBottom: 'var(--border-thin)',
                padding: '8px 16px',
                background: expanded ? 'var(--color-bg)' : 'transparent',
                cursor: 'pointer',
                borderLeft: `4px solid ${_getSeverityColor(severity)}`,
                animation: severity === 'critical' ? 'pulse 2s infinite' : 'none'
            }}
        >
            <div className="telemetry-row">
                <span className="mono" style={{ opacity: 0.4, minWidth: '80px' }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span
                    className="badge"
                    style={{
                        width: '80px',
                        textAlign: 'center',
                        background: _getSeverityColor(severity),
                        color: 'white',
                        fontWeight: 900,
                        fontSize: '9px'
                    }}
                >
                    {severity.toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, paddingLeft: 'var(--space-md)' }}>
                    <span className="mono" style={{ fontWeight: 800 }}>{entry.adapter}.{entry.method}</span>
                </div>
                <button onClick={copyResult} style={{ padding: '2px 6px', background: 'transparent' }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
            </div>

            {expanded && (
                <div className="telemetry-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                    <div style={{ gridColumn: '1 / -1', padding: '16px', background: 'var(--color-surface-bright)', border: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between' }}>
                        <div className="mono" style={{ fontSize: '10px' }}>[CID] {entry.id}</div>
                        <button onClick={runRepair} disabled={repairing} className="mono" style={{ fontSize: '10px', padding: '4px 8px' }}>
                            {repairing ? <RefreshCw size={10} className="spin-anim" /> : <Wrench size={10} />} RUN_NODE_DIAGNOSTIC
                        </button>
                    </div>

                    <div>
                        <div style={{ fontSize: '9px', fontWeight: 900, marginBottom: '4px', opacity: 0.5 }}>PAYLOAD</div>
                        <pre className="code-block">{JSON.stringify(entry.payload, null, 2)}</pre>
                    </div>
                    <div>
                        <div style={{ fontSize: '9px', fontWeight: 900, marginBottom: '4px', opacity: 0.5 }}>CORE_RESPONSE</div>
                        <pre className="code-block" style={{ color: isSuccess ? 'inherit' : 'var(--accent-error)' }}>
                            {JSON.stringify(entry.response, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

const _getSeverityColor = (severity) => {
    switch (severity) {
        case 'info': return 'var(--text-dim)';
        case 'warning': return '#f59e0b'; // Amber
        case 'alert': return 'var(--accent-error)';
        case 'critical': return '#000000'; // Black (High contrast alert)
        default: return 'var(--text-primary)';
    }
};

const LogStream = () => {
    const [tab, setTab] = useState('LOGS');
    const { executionLog, clearExecutionLogs, coreUrl, contracts, lastOutput } = useCoreStore();

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', borderBottom: 'var(--border-thick)', background: 'var(--color-bg)' }}>
                <button
                    onClick={() => setTab('LOGS')}
                    style={{ border: 'none', borderRight: 'var(--border-thin)', background: tab === 'LOGS' ? 'var(--text-primary)' : 'transparent', color: tab === 'LOGS' ? 'var(--color-bg)' : 'inherit', borderRadius: 0 }}
                >
                    <Terminal size={12} /> TELEMETRY [{executionLog.length}]
                </button>
                <button
                    onClick={() => setTab('STATE')}
                    style={{ border: 'none', borderRight: 'var(--border-thin)', background: tab === 'STATE' ? 'var(--text-primary)' : 'transparent', color: tab === 'STATE' ? 'var(--color-bg)' : 'inherit', borderRadius: 0 }}
                >
                    <Database size={12} /> REPLICA_STATE
                </button>
                <button onClick={clearExecutionLogs} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', opacity: 0.4 }}>
                    <Trash2 size={12} />
                </button>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', background: 'var(--color-surface-soft)' }}>
                {tab === 'LOGS' && (
                    <div>
                        {executionLog.length === 0 ? (
                            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                <Clock size={40} style={{ marginRight: '12px' }} />
                                <span className="mono">NO_DATA_TRANSIT_RECORDED</span>
                            </div>
                        ) : (
                            executionLog.map(log => <LogEntry key={log.id} entry={log} />)
                        )}
                    </div>
                )}

                {tab === 'STATE' && (
                    <div style={{ padding: '24px' }}>
                        <h3 className="mono" style={{ fontSize: '11px', fontWeight: 900, marginBottom: '12px' }}>VIRTUAL_DATA_ATOM_STATUS</h3>
                        <pre className="code-block" style={{ background: 'var(--color-bg)' }}>
                            {JSON.stringify({
                                coreUrl,
                                synchronized: Object.keys(contracts).length > 0,
                                nodesDiscovered: Object.keys(contracts).length,
                                lastOutput: lastOutput ? 'RETAINED' : 'NULL'
                            }, null, 2)}
                        </pre>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LogStream;
