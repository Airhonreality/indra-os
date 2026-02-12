import React, { useState, useEffect } from 'react';
import compiler from '../../core/laws/Law_Compiler';
import ComponentProjector from '../../core/kernel/ComponentProjector';
import Icons from '../../4_Atoms/IndraIcons';
import { useAxiomaticStore } from '../../core/state/AxiomaticStore';

/**
 * DefaultSkeleton: El Sostenedor de la Realidad.
 * DHARMA: Actuar como contenedor de posibilidad y manifestador de leyes.
 */
const DefaultSkeleton = ({ law, cosmosContext, phenotype, slotId, perspective = 'STANDARD' }) => {
    const { execute } = useAxiomaticStore();
    const [focusedArtifactId, setFocusedArtifactId] = useState(null);

    // Si no hay ley para este Slot, mostramos estado vacío puro
    if (!law) return <div className="text-[var(--text-dim)] p-4 font-mono text-xs">Unmapped Slot</div>;

    const artifacts = law.artefacts || [];

    // El artefacto activo es el seleccionado manualmente, o el primero por defecto si solo hay uno
    const activeComponentId = focusedArtifactId || (artifacts.length === 1 ? artifacts[0] : null);
    const canon = activeComponentId ? compiler.getCanon(activeComponentId) : null;

    // --- MANIFESTACIÓN TOPOLÓGICA (Orbe Orgánico) ---
    if (perspective === 'TOPOLOGICAL') {
        const label = (canon?.LABEL || law.functional_name || 'System Unit').toUpperCase();
        const arch = (canon?.ARCHETYPE || law.config?.archetype || '').toUpperCase();
        const isVault = arch === 'VAULT';

        // Búsqueda Segura de Icono
        let IconComponent = Icons.Sovereign; // Fallback maestro

        if (isVault && Icons.Vault) {
            IconComponent = Icons.Vault;
        } else if (canon?.config?.icon && Icons[canon.config.icon]) {
            IconComponent = Icons[canon.config.icon];
        }

        const hasData = artifacts.length > 0;

        const handleOrbClick = () => {
            if (hasData) {
                const targetId = activeComponentId || artifacts[0];
                console.log(`[Orb] 🧬 Igniting Focus: ${label} (${targetId})`);

                // AXIOMA: Selección de Artefacto para proyección en Canvas/Panel
                execute('SELECT_ARTIFACT', targetId);

                if (!focusedArtifactId && artifacts.length > 0) {
                    setFocusedArtifactId(artifacts[0]);
                }
            }
        };

        return (
            <div className="flex flex-col items-center gap-2 transition-all duration-500 group/orb">
                <button
                    onClick={handleOrbClick}
                    title={label}
                    className={`
                        w-14 h-14 rounded-full flex items-center justify-center relative
                        bg-[var(--bg-glass)] backdrop-blur-xl border transition-all duration-500
                        shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover/orb:shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]
                        ${hasData
                            ? 'cursor-pointer border-[var(--border-subtle)] hover:border-[var(--accent)]'
                            : 'cursor-default border-dashed border-[var(--border-subtle)] opacity-20'}
                        active:scale-95
                    `}
                >
                    {/* Hilo de Resonancia */}
                    {hasData && (
                        <div className="absolute -inset-1.5 rounded-full border border-[var(--accent)]/10 animate-pulse"></div>
                    )}

                    {/* Icono Maestro */}
                    <div className={`transition-all duration-500 ${hasData ? 'text-[var(--text-soft)] group-hover/orb:text-[var(--accent)] group-hover/orb:scale-110' : 'text-[var(--text-dim)]'}`}>
                        {IconComponent ? <IconComponent size={24} /> : '🧬'}
                    </div>

                    {/* Signos Vitales (Mini-dot) */}
                    {hasData && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-[var(--accent)] rounded-full shadow-[0_0_10px_var(--accent)] border-2 border-[var(--bg-deep)]"></div>
                    )}
                </button>

                {/* Label Topológico */}
                <div className="flex flex-col items-center opacity-40 group-hover/orb:opacity-100 transition-opacity duration-500">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--accent)] text-center max-w-[70px] leading-tight truncate">
                        {label}
                    </span>
                    <span className="text-[6px] font-mono text-[var(--text-dim)] uppercase mt-0.5 tracking-tighter">
                        {arch || 'CORE_ANCHOR'}
                    </span>
                </div>
            </div>
        );
    }

    // AXIOMA: Si hay un artefacto enfocado (o único), lo proyectamos
    if (activeComponentId && canon) {
        return (
            <div className="relative group/skeleton h-full flex flex-col">
                {artifacts.length > 1 && (
                    <button
                        onClick={() => setFocusedArtifactId(null)}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-[var(--bg-deep)]/80 border border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--accent)] transition-all opacity-0 group-hover/skeleton:opacity-100"
                    >
                        {Icons.ChevronRight ? <Icons.ChevronRight className="rotate-180" size={14} /> : '←'}
                    </button>
                )}
                <ComponentProjector
                    componentId={activeComponentId}
                    cosmosContext={cosmosContext}
                    phenotype={phenotype}
                    slotId={slotId}
                />
            </div>
        );
    }

    // AXIOMA: Vista de Colección / Selector si hay múltiples artefactos sin foco
    if (artifacts.length > 1 && !activeComponentId) {
        return (
            <div className="w-full h-full flex flex-col p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 backdrop-blur-sm animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-subtle)]/30">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-vibrant)]">
                        {law.functional_name || 'Artifact Collection'}
                    </span>
                    <span className="ml-auto text-[9px] font-mono text-[var(--accent)]/60">{artifacts.length} units detected</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {artifacts.map(id => {
                        const artifactCanon = compiler.getCanon(id);
                        return (
                            <button
                                key={id}
                                onClick={() => setFocusedArtifactId(id)}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all text-left group/item"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-deep)] flex items-center justify-center text-xl group-hover/item:scale-110 transition-all">
                                    {artifactCanon?.ARCHETYPE === 'VAULT' ? '📂' : '🧬'}
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="text-xs font-bold text-[var(--text-soft)] group-hover/item:text-[var(--accent)] truncate transition-colors">
                                        {artifactCanon?.LABEL || id}
                                    </span>
                                    <span className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-tighter opacity-60">
                                        {artifactCanon?.ARCHETYPE || 'CORE_UNIT'}
                                    </span>
                                </div>
                                {Icons.ChevronRight && <Icons.ChevronRight size={14} className="text-[var(--text-dim)] opacity-0 group-hover/item:opacity-100 transform translate-x-1 group-hover/item:translate-x-0 transition-all" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // AXIOMA: Estado de Reposo Arquitectónico (Skeleton Puro)
    const isAnchorMissing = law.isAnchor && artifacts.length === 0;

    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center p-8 rounded-3xl border border-dashed border-[var(--border-subtle)]/30 bg-[var(--bg-secondary)]/10 group hover:border-[var(--accent)]/30 transition-all"
            style={{ minHeight: '160px' }}
        >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)] group-hover:text-[var(--accent)] transition-colors text-center">
                {law.functional_name || 'System Slot'}
            </div>
            {isAnchorMissing && (
                <div className="mt-2 text-[9px] font-mono text-red-500/30 uppercase tracking-[0.2em]">
                    Identity Not Found
                </div>
            )}
            <div className="mt-6 opacity-5 group-hover:opacity-20 transition-opacity">
                {Icons.Sovereign ? <Icons.Sovereign size={32} /> : '🧬'}
            </div>
        </div>
    );
};

export default DefaultSkeleton;
