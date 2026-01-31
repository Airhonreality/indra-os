import React, { useState, useEffect } from 'react';
import { HandshakeAudit } from '../core/diagnostics/HandshakeAudit';
import { ShieldCheck, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

/**
 * 🛰️ DiagnosticPanel: The "Atomic Handshake" Viewer (Purified V5.5)
 */
const DiagnosticPanel = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const runAudit = async () => {
        setLoading(true);
        const result = await HandshakeAudit.runAudit();
        setReport(result);
        setLoading(false);
    };

    useEffect(() => {
        runAudit();
    }, []);

    return (
        <div className="diagnostic-panel h-full overflow-y-auto p-4 flex flex-col gap-6 bg-white/5">
            <header className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#00d2ff]" />
                    <h2 className="mono-bold text-[11px] tracking-widest uppercase">Handshake_Audit</h2>
                </div>
                <button onClick={runAudit} disabled={loading} className="text-[9px] px-2 py-1 opacity-70 hover:opacity-100">
                    <RefreshCw size={10} className={loading ? 'spin-anim' : ''} /> RE_SCAN
                </button>
            </header>

            {report && (
                <div className={`p-4 border rounded-sm ${report.status === 'NOMINAL' ? 'bg-[#00ffaa]/5 border-[#00ffaa]/20' : 'bg-[#ff3366]/5 border-[#ff3366]/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {report.status === 'NOMINAL' ? <CheckCircle size={14} className="text-[#00ffaa]" /> : <AlertTriangle size={14} className="text-[#ff3366]" />}
                            <span className="mono-bold text-[13px] tracking-widest">{report.status}</span>
                        </div>
                        <span className="mono text-[10px] opacity-60">{report.synergyScore || 0}% SYNERGY</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${report.status === 'NOMINAL' ? 'bg-[#00ffaa]' : 'bg-[#ff3366]'}`}
                            style={{ width: `${report.synergyScore || 0}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="check-list flex flex-col gap-1">
                {report?.checks.map(check => (
                    <div key={check.id} className="p-3 border border-white/5 bg-white/[0.01] flex items-center justify-between hover:bg-white/[0.03] transition-colors group">
                        <div className="flex flex-col gap-0.5">
                            <div className="mono-bold text-[9px] uppercase tracking-wider">{check.name}</div>
                            <div className="mono text-[8px] opacity-40 group-hover:opacity-60 transition-opacity uppercase">{check.detail}</div>
                        </div>
                        <div className={`mono-bold text-[9px] px-2 py-0.5 rounded-sm ${check.pass ? 'text-[#00ffaa] bg-[#00ffaa]/10' : 'text-[#ff3366] bg-[#ff3366]/10'}`}>
                            {check.pass ? 'PASS' : 'FAIL'}
                        </div>
                    </div>
                ))}
            </div>

            {report?.failures.length > 0 && (
                <div className="mt-2">
                    <h4 className="mono-bold text-[#ff3366] text-[8px] mb-2 opacity-50 uppercase tracking-widest">Failure_Log</h4>
                    <div className="p-3 bg-red-950/20 border border-[#ff3366]/10 text-[#ff3366] mono text-[9px] flex flex-col gap-1">
                        {report.failures.map((f, i) => <div key={i} className="flex gap-2"><span className="opacity-40">&gt;&gt;</span> {f}</div>)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiagnosticPanel;
