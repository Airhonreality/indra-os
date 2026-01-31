import React, { useMemo } from 'react';
import { useCoreStore } from '../../core/state/CoreStore';
import { Activity, Clock, Zap, Target, Box, Layers, ShieldCheck } from 'lucide-react';

/**
 * 🛰️ TopologyHUD: Heads-Up Display (V2.2 Canonical)
 * Architecture: Conscious Floating Overlay.
 * Axiom: Visual status must not interrupt the construction void.
 */
const TopologyHUD = () => {
    const { nodes, flows, status, currentProject, logs } = useCoreStore();

    const nodeCount = Object.keys(nodes).length;
    const connectionCount = flows?.connections?.length || 0;
    const projectLabel = currentProject?.name?.replace('.project.json', '') || 'VOID_WORKSPACE';

    // Get last critical event
    const lastCritical = useMemo(() => {
        return logs?.filter(l => l.type === 'error').slice(-1)[0] || null;
    }, [logs]);

    return (
        <div className="topology-hud pointer-events-none absolute inset-0 z-40 p-12">
            {/* 📍 TOP LEFT: WORKSPACE CONTEXT */}
            <div className="absolute top-12 left-12 flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-accent-primary shadow-[0_0_10px_var(--accent-primary)]" />
                    <div className="flex flex-col">
                        <span className="mono-bold text-[12px] uppercase tracking-[0.4em] text-white/80">{projectLabel}</span>
                        <span className="mono text-[8px] opacity-30 uppercase tracking-widest">Axiomatic_Domain_Active</span>
                    </div>
                </div>

                <div className="mt-8 flex gap-8 items-start opacity-20">
                    <div className="flex flex-col gap-1">
                        <span className="mono text-[7px] uppercase tracking-tighter">Instances</span>
                        <span className="mono-bold text-[18px]">{nodeCount.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="mono text-[7px] uppercase tracking-tighter">Synapses</span>
                        <span className="mono-bold text-[18px]">{connectionCount.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="mono text-[7px] uppercase tracking-tighter">Coherence</span>
                        <span className="mono-bold text-[18px]">100%</span>
                    </div>
                </div>
            </div>

            {/* 📍 BOTTOM LEFT: SYSTEM INTEGRITY */}
            <div className="absolute bottom-12 left-12 flex flex-col gap-4">
                {lastCritical && (
                    <div className="flex items-center gap-3 bg-red-950/20 border border-red-500/20 p-3 rounded-sm backdrop-blur-md animate-pulse">
                        <Activity size={12} className="text-red-500" />
                        <div className="flex flex-col">
                            <span className="mono-bold text-[9px] uppercase tracking-widest text-red-400">Handshake_Failure</span>
                            <span className="mono text-[8px] opacity-60 text-red-500 truncate max-w-[200px]">{lastCritical.message}</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 group pointer-events-auto cursor-help">
                        <ShieldCheck size={10} className="text-accent-success opacity-40 group-hover:opacity-100" />
                        <span className="mono text-[8px] opacity-20 group-hover:opacity-60 uppercase tracking-widest">Identity_Protection: Active</span>
                    </div>
                    <div className="flex items-center gap-2 pointer-events-auto cursor-help">
                        <Clock size={10} className="opacity-20" />
                        <span className="mono text-[8px] opacity-20 uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* 📍 RIGHT SIDE: NAVIGATION HINT (DYNAMIC) */}
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 flex flex-col gap-2 opacity-10 rotate-90 origin-right">
                <span className="mono text-[8px] uppercase tracking-[1em]">Satellite_Relay_Indra_Sovereign</span>
            </div>

            {/* 🛸 DECORATIVE INSTRUMENTATION */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.02] rounded-full pointer-events-none opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/[0.01] rounded-full pointer-events-none opacity-40" />
        </div>
    );
};

export default TopologyHUD;
