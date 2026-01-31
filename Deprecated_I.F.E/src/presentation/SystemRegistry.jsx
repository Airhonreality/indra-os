import React, { useState, useMemo } from 'react';
import useCoreStore from '../core/state/CoreStore';
import CoreBridge from '../core/bridge/CoreBridge';
import { OntologyService } from '../core/integrity/OntologyService';
import {
    Search, RefreshCw, Box, ChevronRight, Layers, LayoutPanelLeft
} from 'lucide-react';

/**
 * 🏛️ SYSTEM ONTOLOGY (Formerly SystemRegistry)
 * Architecture: Optimized Archetype Explorer (Canonical V2.1)
 * Axiom: Minimum visual noise, maximum semantic density.
 */
const SystemRegistry = () => {
    const { contracts, laws, setContracts, addLog } = useCoreStore();
    const [search, setSearch] = useState('');
    const [expandedArchetypes, setExpandedArchetypes] = useState({});

    const archetypes = useMemo(() => {
        const genetic = laws?.GENETIC?.ARCHETYPES || ['ADAPTER', 'VAULT', 'LOGIC', 'ORCHESTRATOR'];
        return Array.from(new Set(genetic)).sort();
    }, [laws]);

    const filteredNodes = useMemo(() => {
        const entries = Object.entries(contracts || {});
        return entries.filter(([key, node]) => {
            const matchesSearch = key.toLowerCase().includes(search.toLowerCase()) ||
                (node.label && node.label.toLowerCase().includes(search.toLowerCase()));
            return matchesSearch;
        });
    }, [contracts, search]);

    const groupedNodes = useMemo(() => {
        const groups = {};
        archetypes.forEach(a => groups[a] = []);
        filteredNodes.forEach(([key, node]) => {
            const arch = (node.archetype || node.category || 'UNCATEGORIZED').toUpperCase();
            if (groups[arch]) groups[arch].push({ key, ...node });
        });
        return groups;
    }, [filteredNodes, archetypes]);

    const refreshContracts = async () => {
        addLog('info', 'REGISTRY >> Searching for system contracts...');
        try {
            const result = await CoreBridge.callAction('getSystemContracts');
            if (result) {
                setContracts(result);
                addLog('success', 'REGISTRY >> Handshake Nominal. Contracts updated.');
            }
        } catch (e) {
            addLog('error', `REGISTRY >> Failure: ${e.message}`);
        }
    };

    const toggleGroup = (arch) => {
        setExpandedArchetypes(prev => ({ ...prev, [arch]: !prev[arch] }));
    };

    return (
        <div className="system-registry flex flex-col h-full bg-transparent overflow-hidden font-sans border-none">
            {/* 🔍 COMPACT SEARCH */}
            <header className="p-3 border-b border-white/5 flex flex-col gap-3 bg-white/[0.01]">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <LayoutPanelLeft size={10} className="text-accent-primary opacity-60" />
                        <span className="mono-bold text-[9px] uppercase tracking-[0.4em] opacity-40">Ontology_Infra</span>
                    </div>
                    <button onClick={refreshContracts} className="p-1.5 hover:bg-white/5 rounded-sm opacity-20 hover:opacity-100 transition-all border-none bg-transparent cursor-pointer">
                        <RefreshCw size={10} />
                    </button>
                </div>
                <div className="relative group">
                    <Search size={10} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-60 transition-opacity" />
                    <input
                        type="text"
                        placeholder="Search_Blueprints..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 pl-8 pr-3 py-1.5 text-[10px] mono focus:border-accent-primary/40 outline-none transition-all placeholder:opacity-20"
                    />
                </div>
            </header>

            {/* 📂 TREE VIEW ACCORDIONS */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-2 mt-2">
                {archetypes.map(arch => {
                    const nodes = groupedNodes[arch] || [];
                    if (nodes.length === 0 && !search) return null;
                    const isExpanded = expandedArchetypes[arch] !== false;
                    const archMeta = OntologyService.getArchetype(arch);

                    return (
                        <div key={arch} className="mb-1">
                            <button
                                onClick={() => toggleGroup(arch)}
                                className="w-full flex items-center gap-2 p-1.5 transition-colors group border-none bg-transparent cursor-pointer"
                            >
                                <ChevronRight size={10} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''} opacity-20`} />
                                <span className="mono-bold text-[8px] uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">{arch}</span>
                                <div className="h-px flex-1 bg-white/5 ml-2" />
                                <span className="mono text-[8px] opacity-10">{nodes.length}</span>
                            </button>

                            {isExpanded && (
                                <div className="flex flex-col gap-0.5 ml-2 mt-1 mb-2">
                                    {nodes.map(node => (
                                        <div
                                            key={node.key}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/x-core-node-key', node.key);
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            className="group relative flex items-center gap-3 p-2 hover:bg-white/[0.03] rounded-sm cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-white/5"
                                        >
                                            <div className="p-1.5 rounded-sm bg-white/[0.02] border border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                                                {React.createElement(archMeta.icon || Box, { size: 10, color: archMeta.color })}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="mono text-[10px] text-white/60 group-hover:text-white transition-colors truncate">{node.label || node.key}</span>
                                                <span className="mono text-[7px] opacity-20 uppercase tracking-tighter truncate">{node.key}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </main>

            <footer className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex justify-between items-center opacity-10">
                    <span className="mono text-[8px] uppercase tracking-widest">Axiom_Library_Sync</span>
                    <Layers size={8} />
                </div>
            </footer>
        </div>
    );
};

export default SystemRegistry;
