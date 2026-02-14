import React, { useState, useEffect } from 'react';
import { Icons } from '../../../4_Atoms/IndraIcons';
import compiler from '../../../core/laws/Law_Compiler';

/**
 * DevLabHood
 * DHARMA: Contorno de Ingeniería Vertical.
 * Responsabilidad: Almacén de módulos de proyección y controles de fidelidad (Mocks).
 */
const DevLabHood = ({
    activeTarget,
    activePerspective,
    activeArchetype,
    onSelectTarget,
    onSelectPerspective,
    isMockEnabled,
    onToggleMock,
    isTesting,
    onRunChaosTest,
    onRunAudits,
    onRunDiagnostic,
    onRunTrace,
    onRunForensics,
    onRunDeterminismProbe,
    execute
}) => {
    const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);

    // AXIOMA: Catálogo de Motores de Proyección (Total Engineering View)
    const modules = [
        { id: 'VAULT', label: 'Vault', icon: Icons.Vault, archetypes: ['VAULT', 'ADAPTER', 'DRIVE'] },
        { id: 'DATABASE', label: 'Database', icon: Icons.Database, archetypes: ['DATABASE', 'COLLECTION', 'GRID'] },
        { id: 'NODE', label: 'Node', icon: Icons.Terminal, archetypes: ['NODE', 'TERMINAL'] },
        { id: 'COMMUNICATION', label: 'Mail', icon: Icons.Inbox, archetypes: ['SIGNAL', 'EMAIL', 'CHAT'] },
        { id: 'LLM', label: 'LLM', icon: Icons.Settings, archetypes: ['SERVICE', 'AGENT', 'INTELLIGENCE'] },
        { id: 'REALITY', label: 'Reality', icon: Icons.Cosmos, archetypes: ['GRAPH', 'COSMOS'] },
        { id: 'SLOT', label: 'Slot', icon: Icons.Transform, archetypes: ['SLOT', 'COMPOSITE'] }
    ];

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredArtifacts, setFilteredArtifacts] = useState([]);

    useEffect(() => {
        if (!compiler.isCompiled) compiler.compile();
        const all = compiler.getRenderManifest() || [];
        const matches = all.filter(art => (art.LABEL || art.id).toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredArtifacts(matches.slice(0, 50));
    }, [searchTerm]);

    const isRecommended = (mod) => {
        if (!activeArchetype) return false;
        return mod.archetypes?.some(a => activeArchetype.includes(a));
    };

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[400] flex flex-col items-center gap-4 animate-fade-in-right">

            {/* SOVEREIGN ENGINEERING DOCK (Unified Hood) */}
            <div className="flex flex-col gap-4 p-3 glass border border-white/10 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-3xl relative">

                {/* 1. DISCOVERY (Artifact Search) */}
                <div className="relative group/search">
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSearchOpen ? 'bg-[var(--accent)] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        title="Search Artifacts"
                    >
                        <Icons.Search size={20} />
                    </button>

                    {/* Floating Search Panel */}
                    {isSearchOpen && (
                        <div className="absolute right-16 top-0 w-72 bg-[var(--bg-deep)] border border-white/10 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 mb-3 bg-white/5 p-2 rounded-xl border border-white/5">
                                <Icons.Search size={14} className="text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full bg-transparent text-xs focus:outline-none text-white placeholder:text-white/10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {filteredArtifacts.map(art => (
                                    <button key={art.id} onClick={() => { onSelectTarget(art.id); setIsSearchOpen(false); }}
                                        className={`text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between group/item ${activeTarget === art.id ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20' : ''}`}
                                    >
                                        <span className="text-[10px] font-black uppercase text-white/60 truncate max-w-[150px]">{art.LABEL || art.id}</span>
                                        <span className="text-[7px] font-mono text-white/20">{art.ARCHETYPE}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-[1px] w-8 bg-white/10 mx-auto" />

                {/* 2. ENGINE SELECTOR (The Heart) */}
                <div className="flex flex-col gap-2">
                    {modules.map(mod => {
                        const active = activePerspective === mod.id;
                        const recommended = isRecommended(mod);
                        return (
                            <button
                                key={mod.id}
                                onClick={() => {
                                    if (!activeTarget || activeTarget === 'DRIVE') {
                                        execute('INJECT_PHANTOM_ARTIFACT', { engineId: mod.id });
                                        if (!isMockEnabled) onToggleMock();
                                    }
                                    onSelectPerspective(mod.id);
                                }}
                                className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 relative group/icon
                                    ${active ? 'bg-[var(--accent)] text-black shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] scale-110' :
                                        recommended ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                            >
                                <mod.icon size={18} />
                                <span className={`text-[6px] font-black mt-1 tracking-tighter ${active ? 'text-black' : 'text-[var(--text-dim)] group-hover/icon:text-white'}`}>{mod.label}</span>

                                {recommended && !active && <div className="absolute inset-0 rounded-2xl border border-[var(--accent)] animate-ping opacity-20" />}
                            </button>
                        );
                    })}
                </div>

                <div className="h-[1px] w-8 bg-white/10 mx-auto" />

                {/* 3. RELIABILITY & TUNING */}
                <div className="flex flex-col gap-2">
                    {/* Mock Toggle */}
                    <button
                        onClick={onToggleMock}
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${isMockEnabled ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'text-white/20 hover:text-white/40'}`}
                    >
                        <Icons.Sync size={16} className={isMockEnabled ? 'animate-spin-slow' : ''} />
                        <span className="text-[6px] font-black mt-1">MOCK</span>
                    </button>

                    {/* Diagnostics Drawer */}
                    <div className="relative w-12 h-12">
                        <div className={`absolute right-14 top-0 h-12 flex items-center bg-[var(--bg-deep)]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden ${isTestDrawerOpen ? 'w-[320px] px-3' : 'w-0 opacity-0'}`}>
                            <div className="flex items-center gap-1">
                                <button onClick={onRunChaosTest} title="Chaos" className="p-2 hover:bg-white/10 rounded-xl transition-all"><span className="text-lg grayscale hover:grayscale-0">🔥</span></button>
                                <button onClick={onRunAudits} title="Audit" className="p-2 hover:bg-white/10 rounded-xl transition-all"><span className="text-lg grayscale hover:grayscale-0">🛡️</span></button>
                                <button onClick={onRunDiagnostic} title="Diagnostic" className="p-2 hover:bg-white/10 rounded-xl transition-all"><span className="text-lg grayscale hover:grayscale-0">🔍</span></button>
                                <button onClick={onRunTrace} title="Trace" className="p-2 hover:bg-white/10 rounded-xl transition-all"><span className="text-lg grayscale hover:grayscale-0">🛰️</span></button>
                                <button onClick={onRunForensics} title="Forensics" className="p-2 hover:bg-white/10 rounded-xl transition-all"><span className="text-lg grayscale hover:grayscale-0">💀</span></button>
                                <button onClick={onRunDeterminismProbe} title="Identity" className="p-2 hover:bg-white/10 rounded-xl transition-all"><span className="text-lg grayscale hover:grayscale-0">🆔</span></button>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsTestDrawerOpen(!isTestDrawerOpen)}
                            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${isTestDrawerOpen ? 'bg-blue-600 text-white' : 'text-white/20 hover:text-blue-400 hover:bg-blue-500/10'}`}
                        >
                            <Icons.Lab size={18} />
                            <span className="text-[6px] font-black mt-1">TEST</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* QUICK REALITY STATUS */}
            <div className="flex flex-col items-end gap-1 px-4 opacity-40">
                <span className="text-[7px] font-black uppercase tracking-widest text-white/50">Vector: {activeTarget}</span>
                <span className="text-[7px] font-mono text-[var(--accent)] uppercase">{activePerspective} Mode</span>
            </div>
        </div>
    );
};

export default DevLabHood;
