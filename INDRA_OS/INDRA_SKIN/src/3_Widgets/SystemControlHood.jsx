/**
 * SystemControlHood.jsx
 * DHARMA: Contorno de Control Contextual (Nivel E4)
 * AXIOMA: "Un único hood para gobernarlos a todos los bordes."
 * Este componente inyecta controles dinámicamente según la capa activa.
 */

import React, { useState } from 'react';
import { useAxiomaticStore } from '../core/1_Axiomatic_Store/AxiomaticStore.jsx';
import { Icons } from '../4_Atoms/AxiomIcons.jsx';
import useAxiomaticState from '../core/1_Axiomatic_Store/AxiomaticState.js';

import { resolveIcon, resolveArtifactLabel } from '../core/kernel/projections/VisualHydrator.js';
import { runFullPhenotypeAudit, clearIronMemory, purgeGhostsFromState } from '../core/utils/FrontDiagnostics.js';

const SystemControlHood = () => {
    const { state, execute } = useAxiomaticStore();
    const session = useAxiomaticState(s => s.session);
    const [isExpanded, setIsExpanded] = useState(false);

    const theme = state.sovereignty.theme || 'dark';

    // UI State Global
    const { ui, focusStack, cosmosIdentity, artifacts } = state.phenotype;

    const navLayer = state.ui_layer_override;
    const isCosmosMounted = !!cosmosIdentity?.id;

    // AXIOMA: Reconstrucción del Camino de Realidad (ADR-021: Siempre la Realidad Activa)
    // En modo LIVE, ignoramos los artefactos Fantasma (Ghosts) para no romper el linaje real
    const path = isCosmosMounted
        ? ((focusStack && focusStack.length > 0)
            ? focusStack.filter(a => !a._isGhost)
            : [cosmosIdentity])
        : [];

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        execute('SET_THEME', { theme: newTheme });
        localStorage.setItem('AXIOM_THEME', newTheme);
    };

    const handleNuclearPurge = () => {
        execute('NUCLEAR_PURGE');
    };

    return (
        <div className="fixed top-4 right-4 z-[350] flex items-center justify-end pointer-events-auto">

            <div className={`
                flex items-center gap-2 p-1 rounded-full glass border transition-all duration-500 ease-out shadow-lg max-w-[90vw] border-[var(--border-subtle)]
                ${isExpanded ? 'bg-[var(--bg-deep)] pr-2' : ''}
            `}>
                {/* AXIOMA V12: Reality Navigator (Restored Breadcrumbs) */}
                {path.length > 0 && (
                    <div className="hidden md:flex items-center gap-1 pl-3 pr-2 border-r border-[var(--border-subtle)] mr-2 h-6">
                        {path.map((step, index) => (
                            <div
                                key={step.id || index}
                                className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent)] cursor-pointer transition-colors"
                                onClick={() => {
                                    // AXIOMA: Navegación por Migajas
                                    if (step.id === cosmosIdentity?.id) execute('EXIT_FOCUS');
                                    else execute('SELECT_ARTIFACT', step);
                                }}
                            >
                                <span className="opacity-50">/</span>
                                <span>{step.LABEL || step.label || step.identity?.label || step.NAME || step.name || step.id}</span>
                            </div>
                        ))}
                    </div>
                )}
                {/* AXIOMA V12: Indicador de Sincronía (Offline Badge) */}
                {session?.syncStatus === 'OFFLINE' && (
                    <div className="flex items-center gap-2 px-3 py-1 ml-1 bg-[var(--error-surface)] text-[var(--error)] rounded-full border border-[var(--error)]/20 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--error)]"></div>
                        <span className="text-[8px] font-black uppercase tracking-tighter">Trabajo sin conexión</span>
                    </div>
                )}

                {/* AXIOMA: Contorno de Control Purificado (Sin dependencias de Realidad) */}

                {/* CONTROLES EXPANDIBLES (Horizontal) */}
                <div className={`
                    flex items-center gap-2 overflow-hidden transition-all duration-500
                    ${isExpanded ? 'max-w-[400px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'}
                `}>

                    {/* 🗑️ ZOMBIE PORTAL ELIMINADO */}

                    <button
                        onClick={() => execute('SET_CURRENT_LAYER', 'SELECTOR')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${state.phenotype.ui.currentLayer === 'SELECTOR' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                        title="Selector de Cosmos"
                    >
                        <Icons.Cosmos size={14} />
                    </button>

                    <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1"></div>

                    {/* SYSTEM CONTROLS */}
                    <button
                        onClick={() => execute('SELECT_ARTIFACT', { id: 'IDENTITY_MANAGER', ARCHETYPE: 'IDENTITY', LABEL: 'Identity Manager' })}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${state.phenotype.focusStack?.some(a => a.id === 'IDENTITY_MANAGER') ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                        title="Identity & Passport Manager"
                    >
                        <Icons.Sovereign size={14} className={state.phenotype.focusStack?.some(a => a.id === 'IDENTITY_MANAGER') ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] group-hover:text-[var(--accent)]'} />
                    </button>

                    <button
                        onClick={() => execute('SET_CURRENT_LAYER', 'PORTAL')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${state.phenotype.ui.currentLayer === 'PORTAL' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                        title="Selector de Cores / Gateway"
                    >
                        <Icons.Lock size={14} className={state.phenotype.ui.currentLayer === 'PORTAL' ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] group-hover:text-[var(--accent)]'} />
                    </button>

                    <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1"></div>

                    <button
                        onClick={handleThemeToggle}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors group"
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <Icons.Sun size={14} className="text-[var(--text-dim)] group-hover:text-[var(--accent)]" />
                        ) : (
                            <Icons.Moon size={14} className="text-[var(--text-dim)] group-hover:text-[var(--accent)]" />
                        )}
                    </button>

                    <button
                        onClick={handleNuclearPurge}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--error)]/10 transition-colors group"
                        title="Nuclear Purge"
                    >
                        <Icons.Sync size={14} className="text-[var(--text-dim)] group-hover:text-[var(--error)]" />
                    </button>

                    <button
                        onClick={() => runFullPhenotypeAudit(state)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--accent)]/10 transition-colors group"
                        title="Run Phenotype Audit"
                    >
                        <Icons.Terminal size={14} className="text-[var(--text-dim)] group-hover:text-[var(--accent)]" />
                    </button>

                    <button
                        onClick={() => purgeGhostsFromState(state, execute)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--error)]/10 transition-colors group"
                        title="Purge Ghosts (Logical)"
                    >
                        <Icons.Trash size={14} className="text-[var(--text-dim)] group-hover:text-[var(--error)]" />
                    </button>

                    <button
                        onClick={clearIronMemory}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--error)]/10 transition-colors group"
                        title="Hard Reset Iron Memory (L2)"
                    >
                        <Icons.Sync size={14} className="text-[var(--text-dim)] group-hover:text-[var(--error)] animate-spin-hover" />
                    </button>

                </div>

                {/* TOGGLE PRINCIPAL (Siempre Visible) */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${isExpanded
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
                        : 'border-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-dim)]'
                        }`}
                >
                    <div className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                        {isExpanded ? <Icons.Close size={16} /> : <Icons.List size={18} />}
                    </div>
                </button>

            </div>


        </div>
    );
};

export default SystemControlHood;




