import React, { useState, useEffect } from 'react';
import { useCoreStore } from '../core/state/CoreStore';
import { OntologyService } from '../core/integrity/OntologyService';
import { Zap, Play, Info, ChevronRight, MessageSquare, Terminal, X, Search } from 'lucide-react';
import NanoForm from './NanoForm';
import CoreBridge from '../core/bridge/CoreBridge';

/**
 * 🛠️ ContractInspector: The Operational Heart (V2.1 Canonical)
 * Architecture: Contextual operation of selected nodes.
 * Axiom: Every method on the canvas must be executable here.
 */
const ContractInspector = () => {
    const { nodes, session, setSession, addLog } = useCoreStore();
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [formData, setFormData] = useState({});
    const [isExecuting, setIsExecuting] = useState(false);

    const selectedNodeId = session?.selectedId;
    const node = nodes[selectedNodeId];

    // Reset when node selection changes
    useEffect(() => {
        if (node?.methods?.length > 0) {
            setSelectedMethod(node.methods[0]);
            setFormData({});
        } else {
            setSelectedMethod(null);
        }
    }, [selectedNodeId]);

    if (!node) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 opacity-20 text-center gap-4">
                <Search size={48} strokeWidth={1} />
                <div className="flex flex-col gap-1">
                    <span className="mono-bold text-[10px] uppercase tracking-[0.4em]">Awaiting_Selection</span>
                    <p className="mono text-[8px] uppercase tracking-widest max-w-[200px]">Select a node on the canvas to inspect its operational surface</p>
                </div>
            </div>
        );
    }

    const archetype = OntologyService.getArchetype(node.archetype || node.semantic_intent || 'DEFAULT');
    const methodSchema = node.schemas?.[selectedMethod] || {};

    const handleExecute = async () => {
        setIsExecuting(true);
        addLog('info', `EXEC >> Invoking ${node.label}.${selectedMethod}...`);
        try {
            const result = await CoreBridge.callAction(selectedMethod, formData, node.instanceOf || node.id);
            addLog('success', `EXEC >> Success: ${JSON.stringify(result).slice(0, 100)}...`);
        } catch (e) {
            addLog('error', `EXEC >> Failed: ${e.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="contract-inspector flex flex-col h-full bg-transparent overflow-hidden border-none font-sans">
            {/* 🏷️ NODE IDENTITY HEADER */}
            <header className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-sm" style={{ background: `${archetype.color}15` }}>
                        {React.createElement(archetype.icon, { size: 14, color: archetype.color })}
                    </div>
                    <div className="flex flex-col">
                        <span className="mono-bold text-[11px] uppercase tracking-widest text-white/90">{node.label}</span>
                        <span className="mono text-[8px] opacity-30 uppercase tracking-tighter">{node.instanceOf || 'ORBITAL_INSTANCE'}</span>
                    </div>
                </div>
                <button
                    onClick={() => setSession({ selectedId: null })}
                    className="p-1 hover:bg-white/10 rounded-full opacity-30 hover:opacity-100 transition-all cursor-pointer"
                >
                    <X size={14} />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
                {/* ⚡ METHOD SELECTOR */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 opacity-30">
                        <Terminal size={10} />
                        <span className="mono-bold text-[9px] uppercase tracking-widest">Operational_Surface</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(node.methods || []).map(m => (
                            <button
                                key={m}
                                onClick={() => { setSelectedMethod(m); setFormData({}); }}
                                className={`px-3 py-2 mono text-[10px] uppercase tracking-wider border transition-all ${selectedMethod === m
                                        ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                                        : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 📝 PARAMETER FORM */}
                {selectedMethod && (
                    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-sm">
                            <div className="flex items-center gap-2 mb-2 opacity-50">
                                <Info size={10} className="text-secondary" />
                                <span className="mono text-[9px] uppercase tracking-widest">{selectedMethod}_SCHEMA</span>
                            </div>
                            <p className="mono text-[9px] opacity-30 leading-relaxed italic">
                                {methodSchema.description || 'No declarative documentation available for this method.'}
                            </p>
                        </div>

                        <div className="form-container">
                            <NanoForm
                                schema={methodSchema.parameters || {}}
                                data={formData}
                                onChange={(key, val) => setFormData(prev => ({ ...prev, [key]: val }))}
                                onSubmit={handleExecute}
                                disabled={isExecuting}
                                submitLabel={`INJECT_${selectedMethod.toUpperCase()}`}
                            />
                        </div>
                    </section>
                )}
            </main>

            <footer className="p-4 border-t border-white/5 bg-black/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isExecuting ? 'bg-accent-warning pulsing' : 'bg-accent-success'}`} />
                    <span className="mono text-[8px] opacity-40 uppercase tracking-widest">
                        {isExecuting ? 'PROJECTION_ACTIVE' : 'IDLE_AWAITING_TRIGGER'}
                    </span>
                </div>
                <span className="mono text-[8px] opacity-10">INDRA_V2.1</span>
            </footer>
        </div>
    );
};

export default ContractInspector;
