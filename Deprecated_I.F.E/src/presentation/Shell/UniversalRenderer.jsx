import React, { useEffect, useState } from 'react';
import { useCoreStore } from '../../core/state/CoreStore';
import CoreBridge from '../../core/bridge/CoreBridge';
import {
    Terminal, Settings2, Activity, Shield,
    Layout, Power, Zap, BrainCircuit,
    SearchCode, Command, Key
} from 'lucide-react';
import SystemRegistry from '../SystemRegistry';
import TopologyStage from '../TopologyStage/TopologyStage';
import IntelligencePanel from '../IntelligencePanel';
import VaultTokenManager from '../VaultTokenManager';
import ContractInspector from '../ContractInspector';

/**
 * 🛰️ UNIVERSAL RENDERER (v2.2 - Canonical Implementation)
 * Architecture: Sovereign Monolith with Contextual Pillar 3.
 * Axiom: UI is a projection of Intent (Intelligence vs Operation).
 */
const UniversalRenderer = () => {
    const { session, setSession, setStatus, logs, nodes } = useCoreStore();
    const [leftVisible, setLeftVisible] = useState(true);
    const [rightVisible, setRightVisible] = useState(true);

    // Pillar 3 Sub-Navigation: 'IDENTITY' | 'INTELLIGENCE' | 'INSPECTOR'
    const [activeRightTab, setActiveRightTab] = useState('INTELLIGENCE');

    const activeTheme = session?.theme || 'theme-obsidian';
    const selectedId = session?.selectedId;

    // Auto-switch to Inspector on selection
    useEffect(() => {
        if (selectedId) setActiveRightTab('INSPECTOR');
        else if (activeRightTab === 'INSPECTOR') setActiveRightTab('INTELLIGENCE');
    }, [selectedId]);

    const toggleTheme = () => {
        const newTheme = activeTheme === 'theme-obsidian' ? 'theme-blueprint' : 'theme-obsidian';
        setSession({ theme: newTheme });
    };

    const latestLog = logs && logs.length > 0 ? logs[logs.length - 1] : { type: 'info', message: 'Ready' };

    return (
        <div className={`monolith-shell ${activeTheme} font-sans`}>
            {/* 🛰️ HEADER: CONSOLE AUTHORITY authority_v2.2 */}
            <header className="monolith-header flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl z-[100]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-1 rounded-sm bg-accent-primary/10">
                            <Terminal size={12} className="text-accent-primary pulsing" />
                        </div>
                        <h1 className="mono-bold text-[11px] uppercase tracking-[0.4em] opacity-90 text-white">Indra_Sovereign</h1>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <nav className="flex items-center gap-6">
                        <button
                            onClick={() => setLeftVisible(!leftVisible)}
                            className={`flex items-center gap-2 mono text-[9px] uppercase tracking-widest transition-all ${leftVisible ? 'opacity-100 text-accent-primary' : 'opacity-20 hover:opacity-100'}`}
                        >
                            <LayoutPanelLeft size={10} />
                            Ontology
                        </button>
                        <button
                            onClick={() => setRightVisible(!rightVisible)}
                            className={`flex items-center gap-2 mono text-[9px] uppercase tracking-widest transition-all ${rightVisible ? 'opacity-100 text-accent-primary' : 'opacity-20 hover:opacity-100'}`}
                        >
                            <Command size={10} />
                            Authority
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <div className="flex items-center gap-2">
                            <span className="mono text-[8px] opacity-30 uppercase tracking-[0.2em]">Link_Status:</span>
                            <span className="mono-bold text-[8px] text-accent-success tracking-widest">NOMINAL</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-3 h-0.5 rounded-full ${i <= 4 ? 'bg-accent-primary' : 'bg-white/10 shadow-inner'}`} />)}
                        </div>
                    </div>
                    <button onClick={toggleTheme} className="p-2 border border-white/5 hover:border-accent-primary/20 transition-all rounded-sm bg-white/5">
                        <Settings2 size={12} className="opacity-40" />
                    </button>
                    <button onClick={() => { setStatus('disconnected'); window.location.reload(); }} className="p-2 border border-white/5 hover:text-red-500 transition-all rounded-sm bg-white/5">
                        <Power size={12} className="opacity-40" />
                    </button>
                </div>
            </header>

            <main className="monolith-main flex-1 flex overflow-hidden bg-black">
                {/* 🛠️ PILLAR 1: ONTOLOGY & TOOLS (LEFT) */}
                <aside
                    className="monolith-sidebar left transition-all duration-500 overflow-hidden border-r border-white/5 bg-zinc-950/40"
                    style={{ width: leftVisible ? '300px' : '0' }}
                >
                    <div className="w-[300px] h-full shadow-2xl flex flex-col">
                        <SystemRegistry />
                    </div>
                </aside>

                {/* 🕸️ PILLAR 2: WORKSPACE (CENTER) */}
                <section className="monolith-center flex-1 relative bg-black overflow-hidden select-none">
                    <TopologyStage />

                    {/* Floating Branding Overlay */}
                    <div className="absolute top-12 left-12 pointer-events-none opacity-[0.02]">
                        <Zap size={240} strokeWidth={0.5} />
                    </div>

                    <div className="absolute bottom-8 left-8 pointer-events-none flex flex-col gap-2">
                        <div className="mono text-[9px] opacity-20 uppercase tracking-[0.5em] border-l-2 border-accent-primary pl-4">
                            Axiomatic_Environment<br />
                            v2.2_Canonical_Frame
                        </div>
                        <div className="flex items-center gap-4 ml-4 opacity-5">
                            <span className="mono text-[8px]">X: 000.0</span>
                            <span className="mono text-[8px]">Y: 000.0</span>
                            <span className="mono text-[8px]">Z: 001.0</span>
                        </div>
                    </div>
                </section>

                {/* 🔐 PILLAR 3: AUTHORITY & CONTEXT (RIGHT) */}
                <aside
                    className="monolith-sidebar right transition-all duration-500 overflow-hidden border-l border-white/5 bg-zinc-950/60 backdrop-blur-3xl"
                    style={{ width: rightVisible ? '440px' : '0' }}
                >
                    <div className="w-[440px] flex flex-col h-full shadow-2xl font-sans">
                        {/* 📑 PILLAR 3 NAVIGATION */}
                        <nav className="flex items-center bg-black/40 border-b border-white/5 h-12 shrink-0">
                            {[
                                { id: 'IDENTITY', icon: Key, label: 'Vault' },
                                { id: 'INTELLIGENCE', icon: BrainCircuit, label: 'Architect' },
                                { id: 'INSPECTOR', icon: SearchCode, label: 'Inspector' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveRightTab(tab.id)}
                                    className={`flex-1 h-full flex items-center justify-center gap-2 border-none transition-all ${activeRightTab === tab.id ? 'bg-white/5 text-accent-primary opacity-100' : 'opacity-20 hover:opacity-60'}`}
                                >
                                    <tab.icon size={11} />
                                    <span className="mono-bold text-[9px] uppercase tracking-widest">{tab.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* 🧪 CONTEXTUAL CONTENT */}
                        <div className="flex-1 overflow-hidden relative">
                            <div className={`absolute inset-0 transition-all duration-500 ${activeRightTab === 'IDENTITY' ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 pointer-events-none'}`}>
                                <VaultTokenManager />
                            </div>
                            <div className={`absolute inset-0 transition-all duration-500 ${activeRightTab === 'INTELLIGENCE' ? 'translate-x-0 opacity-100' : activeRightTab === 'IDENTITY' ? 'translate-x-10' : '-translate-x-10'} opacity-0 pointer-events-none`}>
                                {activeRightTab === 'INTELLIGENCE' && <IntelligencePanel mode="sidebar" />}
                            </div>
                            <div className={`absolute inset-0 transition-all duration-500 ${activeRightTab === 'INSPECTOR' ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
                                <ContractInspector />
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* 📊 GLOBAL TELEMETRY BAR */}
            <footer className="monolith-footer h-8 flex items-center justify-between px-6 bg-zinc-950 border-t border-white/5 z-100">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    <span className="mono text-[8px] opacity-30 uppercase shrink-0">Telemetry:</span>
                    <div className="flex items-center gap-2 mask-fade-right overflow-hidden">
                        <span className={`mono text-[8px] uppercase tracking-wider truncate ${latestLog.type === 'error' ? 'text-red-500' : 'text-accent-primary opacity-60'}`}>
                            >> {latestLog.message}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 ml-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-accent-success pulsing" />
                        <span className="mono text-[8px] opacity-20 uppercase tracking-[0.2em]">Indra_OS v2.2.0</span>
                    </div>
                    <Activity size={10} className="text-secondary opacity-40 pulsing" />
                </div>
            </footer>
        </div>
    );
};

// Helper inside for Icon
const LayoutPanelLeft = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
    </svg>
);

export default UniversalRenderer;
