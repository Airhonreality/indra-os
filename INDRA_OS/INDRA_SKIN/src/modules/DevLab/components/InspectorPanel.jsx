import React, { useState } from 'react';
import { Icons } from '../../../4_Atoms/IndraIcons';

/**
 * RealityMonitor: Visualizador de métricas de soberanía.
 */
const RealityMonitor = ({ state, execute }) => {
    const cosmos = state.phenotype.cosmosIdentity;
    const revisionHash = state.sovereignty.revisionHash || state.phenotype.cosmosIdentity?._revisionHash;

    const touchReality = () => {
        if (!cosmos && !confirm("No hay un Cosmos activo. ¿Disparar pulso de resonancia al vacío?")) return;
        execute('LOG_ENTRY', {
            time: new Date().toLocaleTimeString(),
            msg: '🔮 Propagating Reality Touch (Resonance Pulse)...',
            type: 'INFO'
        });
        execute('SET_LAYOUT_DIRTY', true);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-4 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] space-y-4 shadow-inner">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-[var(--accent)] uppercase tracking-widest opacity-70">Active_Cosmos_ID</span>
                    <span className="text-[10px] font-mono text-[var(--text-soft)] truncate">{cosmos?.id || 'NO_COSMOS_MOUNTED'}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-[var(--accent)] uppercase tracking-widest opacity-70">Sovereign_Hash</span>
                    <code className="text-[9px] font-mono text-[var(--success)] bg-black/40 px-2 py-1 rounded border border-[var(--success)]/20 shadow-[0_0_10px_rgba(34,197,94,0.05)]">
                        {revisionHash || 'AWAITING_GENESIS'}
                    </code>
                </div>
            </div>

            <div className="space-y-3">
                <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest block">Core Protocols</span>
                <button
                    onClick={touchReality}
                    className="w-full py-2.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[var(--accent)] font-bold text-[9px] tracking-[0.2em] uppercase hover:bg-[var(--accent)]/10 transition-all active:scale-95 mb-2 group overflow-hidden relative"
                >
                    <span className="relative z-10">Touch_Reality</span>
                    <div className="absolute inset-0 bg-[var(--accent)]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>

            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-1">Axiomatic Verification V12</span>
                <ul className="text-[9px] text-blue-200/60 space-y-1.5 list-none">
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500/40"></div> Snapshot Sovereignty Protocol.</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500/40"></div> Piggybacking Persistence Layer.</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500/40"></div> Revision Locking Protocol.</li>
                </ul>
            </div>
        </div>
    );
};

/**
 * InspectorPanel: Sistema de navegación por pestañas para la verdad del código.
 */
const InspectorPanel = ({ state, execute, selectedId, isDnaOpen }) => {
    const [activeTab, setActiveTab] = useState('STRUCTURE');

    return (
        <div className={`absolute top-0 right-0 h-full w-[450px] glass border-l border-white/5 z-20 transition-transform duration-700 ease-out backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${isDnaOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full overflow-hidden flex flex-col p-8">
                <div className="flex items-center justify-between mb-10 py-2 border-b border-white/5">
                    <h2 className="text-sm font-black tracking-[0.4em] text-[var(--accent)] flex items-center gap-3">
                        <Icons.Lab size={18} /> GENOTYPE INSPECTOR
                    </h2>
                    <button
                        onClick={() => execute('TOGGLE_UI_PANEL', { panel: 'dna' })}
                        className="p-2 hover:bg-white/10 rounded-full transition-all active:rotate-90"
                    >
                        <Icons.Close size={18} className="text-white/40" />
                    </button>
                </div>

                <div className="flex gap-6 mb-6 border-b border-white/10">
                    {['STRUCTURE', 'VITAL_LOGS', 'REALITY'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-[10px] font-bold tracking-widest pb-3 transition-all relative ${activeTab === tab
                                ? 'text-[var(--accent)]'
                                : 'text-[var(--text-dim)] hover:text-white'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {activeTab === 'STRUCTURE' && (
                        <div className="flex-1 overflow-auto custom-scrollbar bg-black/20 rounded-xl p-4 border border-white/5">
                            <pre className="text-[10px] font-mono text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                                {state.genotype ? (
                                    (() => {
                                        const registry = state.genotype.COMPONENT_REGISTRY || {};
                                        const selectedKey = Object.keys(registry).find(k => k.toUpperCase() === selectedId?.toUpperCase());
                                        const filteredData = selectedKey ? registry[selectedKey] : {
                                            ERROR: "ATOM_NOT_IN_REGISTRY",
                                            TARGET: selectedId,
                                            FULL_REGISTRY_KEYS: Object.keys(registry)
                                        };
                                        return JSON.stringify(filteredData, null, 2);
                                    })()
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 opacity-50">
                                        <div className="animate-spin mb-3">🌀</div>
                                        <span className="text-[8px] tracking-[0.2em]">AWAITING_CORE_GENOTYPE...</span>
                                    </div>
                                )}
                            </pre>
                        </div>
                    )}

                    {activeTab === 'VITAL_LOGS' && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-black/20 rounded-xl border border-white/5">
                            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                                <span className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-[0.2em]">Operational Stream</span>
                                <span className="text-[8px] font-mono text-[var(--success)] opacity-50">{state.phenotype.logs?.length || 0} ENTRIES</span>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar font-mono text-[9px] flex flex-col-reverse p-2">
                                {state.phenotype.logs?.map((log, i) => (
                                    <div key={i} className={`flex gap-3 py-1.5 px-2 border-b border-white/5 animate-in fade-in slide-in-from-left-2 duration-300 ${log.type === 'ERROR' ? 'text-red-400 bg-red-400/5' : (log.type === 'SUCCESS' ? 'text-[var(--success)] bg-green-400/5' : (log.type === 'WARN' ? 'text-orange-400 bg-orange-400/5' : 'text-[var(--text-dim)] hover:bg-white/5'))}`}>
                                        <span className="opacity-30 shrink-0">[{log.time}]</span>
                                        <span className="break-words">{log.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'REALITY' && <RealityMonitor state={state} execute={execute} />}
                </div>
            </div>
        </div>
    );
};

export default InspectorPanel;
