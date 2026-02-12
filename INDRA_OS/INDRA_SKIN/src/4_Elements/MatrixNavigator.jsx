import React from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import { Icons } from '../4_Atoms/IndraIcons';

/**
 * MatrixNavigator (v1.5 UNIFIED)
 * DHARMA: Navegador Relacional Co-dependiente.
 * Propósito: Gestionar Orígenes (Quién soy) y Perspectivas (Cómo me veo).
 * 
 * Axioma: "El origen determina la vista; la vista proyecta el origen."
 */
const MatrixNavigator = ({ currentArtifact }) => {
    const { state, execute } = useAxiomaticStore();

    if (!currentArtifact) return null;

    const currentPerspective = state.phenotype.devLab?.perspective || 'VAULT';
    const primaryArchetype = currentArtifact.ARCHETYPE;

    // --- 1. LÓGICA DE ORÍGENES (Relaciones Horizontales) ---
    // Buscamos artefactos equivalentes (mismo arquetipo base)
    const peers = state.phenotype.artifacts?.filter(a => {
        const peerArch = a.ARCHETYPE;
        const isVaultMatch = (primaryArchetype === 'VAULT' || primaryArchetype === 'BRIDGE') &&
            (peerArch === 'VAULT' || peerArch === 'BRIDGE');
        return (peerArch === primaryArchetype || isVaultMatch) && a.id !== currentArtifact.id && !a._isDeleted;
    }) || [];

    // --- 2. LÓGICA DE PERSPECTIVAS (Relaciones Verticales / Capas) ---
    // Filtramos las vistas disponibles según la ontología del artefacto actual
    const availablePerspectives = currentArtifact.ARCHETYPES || [currentArtifact.ARCHETYPE];

    // AXIOMA: Latencia Evolutiva. Si no hay opciones, el navegador es un residuo. No se proyecta.
    if (availablePerspectives.length <= 1 && peers.length === 0) return null;

    return (
        <>
            {/* A. SELECTOR DE ORIGENES (Flotante Izquierdo) */}
            {peers.length > 0 && (
                <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[400] group/origins flex items-center animate-in fade-in slide-in-from-left-4 duration-1000">
                    {/* El Orbe de Conexión (Estilo Hood Vertical) */}
                    <div className="flex flex-col gap-2 p-1.5 glass border border-[var(--border-subtle)] rounded-full shadow-2xl pointer-events-auto">
                        <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center relative cursor-pointer group-hover/origins:scale-110 transition-transform duration-500 bg-[var(--bg-deep)]/40 border border-white/5">
                            <Icons.Sync size={14} className="text-[var(--accent)] animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent)] text-black text-[8px] font-black flex items-center justify-center shadow-[0_0_10px_var(--accent-glow)]">
                                {peers.length}
                            </div>
                        </div>
                    </div>

                    {/* Flyout de Orígenes (Mejorado) */}
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 flex flex-col gap-3 p-4 bg-[var(--bg-deep)]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] opacity-0 scale-95 translate-x-[-20px] pointer-events-none group-hover/origins:opacity-100 group-hover/origins:scale-100 group-hover/origins:translate-x-0 group-hover/origins:pointer-events-auto transition-all duration-500 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                        <header className="px-2 py-1 flex flex-col gap-1 border-b border-white/5 mb-2">
                            <span className="text-[8px] font-black text-[var(--accent)] tracking-[0.3em] uppercase opacity-60">Matrix_Peers</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase">Orígenes Equivalentes</span>
                        </header>
                        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                            {peers.map(peer => (
                                <button
                                    key={peer.id}
                                    onClick={() => execute('SELECT_ARTIFACT', peer.id)}
                                    className="w-56 flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-transparent hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 transition-all text-left group/btn"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] border border-white/5 flex items-center justify-center text-[var(--text-dim)] shadow-inner group-hover/btn:text-[var(--accent)] transition-colors">
                                        {peer.ARCHETYPE === 'VAULT' || peer.ARCHETYPE === 'BRIDGE' ? <Icons.Vault size={16} /> :
                                            peer.ARCHETYPE === 'DATABASE' || peer.ARCHETYPE === 'GRID' ? <Icons.List size={16} /> :
                                                peer.ARCHETYPE === 'NODE' ? <Icons.Lab size={16} /> :
                                                    <Icons.System size={16} />}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[11px] font-bold text-[var(--text-soft)] truncate group-hover/btn:text-white transition-colors">{peer.LABEL || peer.label}</span>
                                        <span className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-tighter opacity-50">{peer.id}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* B. PERSPECTIVE SUPPORT HOOD (Cápsula Inferior Canónica) */}
            {availablePerspectives.length > 1 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] pointer-events-auto group/hood">
                    <div className="flex items-center gap-1 p-1 glass border border-[var(--border-subtle)] rounded-full shadow-2xl animate-in slide-in-from-bottom-8 duration-1000 transition-all group-hover/hood:scale-[1.02]">

                        {/* Indicador de Naturaleza de la Realidad */}
                        <div className="flex items-center gap-3 px-4 py-2 border-r border-white/10 mr-1">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)] animate-pulse"></div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-[var(--accent)] tracking-[0.3em] uppercase leading-none mb-0.5">Matrix_Support</span>
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Perspectives</span>
                            </div>
                        </div>

                        {/* Botones de Cambio de Realidad (Estilo Hood) */}
                        <div className="flex items-center gap-1 px-1">
                            {availablePerspectives.map(p => (
                                <button
                                    key={p}
                                    onClick={() => execute('SET_LAB_PERSPECTIVE', p)}
                                    className={`
                                        h-9 px-8 rounded-full text-[9px] font-black tracking-[0.2em] uppercase transition-all duration-500
                                        ${currentPerspective === p
                                            ? 'bg-[var(--accent)] text-black shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)] scale-105 z-10'
                                            : 'text-[var(--text-dim)] hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MatrixNavigator;
