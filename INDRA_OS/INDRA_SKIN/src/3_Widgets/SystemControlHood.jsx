/**
 * SystemControlHood.jsx
 * DHARMA: Contorno de Control Contextual (Nivel E4)
 * AXIOMA: "Un único hood para gobernarlos a todos los bordes."
 * Este componente inyecta controles dinámicamente según la capa activa.
 */

import React, { useState } from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import { Icons } from '../4_Atoms/IndraIcons';
import SecurityVault from './SecurityVault';
import useAxiomaticState from '../core/state/AxiomaticState';

import { resolveIcon, resolveArtifactLabel } from '../core/kernel/projections/VisualHydrator';

const SystemControlHood = () => {
    const { state, execute } = useAxiomaticStore();
    const session = useAxiomaticState(s => s.session);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);

    const theme = state.sovereignty.theme || 'dark';
    const isDevLab = state.sovereignty.mode === 'DEV_LAB';
    const devLabTarget = state.phenotype.devLab?.targetId;
    const devLabPerspective = state.phenotype.devLab?.perspective;

    // UI State Global
    const { ui, focusStack, cosmosIdentity, artifacts } = state.phenotype;

    const navLayer = state.ui_layer_override;
    const isCosmosMounted = !!cosmosIdentity?.id;

    // AXIOMA: Reconstrucción del Camino de Realidad (Adaptativo para DEV_LAB)
    let path = [];
    if (isDevLab) {
        path = [{ id: 'DEV_LAB', label: 'Laboratory', archetype: 'LAB', icon: Icons.Lab }];
        if (devLabTarget) {
            // HIDRATACIÓN: Convertir ID técnico a LABEL elegante
            const elegantLabel = resolveArtifactLabel(devLabTarget, artifacts);
            path.push({ id: 'TARGET', label: elegantLabel, archetype: 'TARGET', icon: Icons.Terminal });
        }
        // Deduplicación: Si la perspectiva es igual al target (ej: VAULT / VAULT), no la añadimos.
        if (devLabPerspective && devLabPerspective !== devLabTarget) {
            path.push({ id: 'PERSPECTIVE', label: devLabPerspective, archetype: 'VIEW', icon: Icons.Eye });
        }
    } else {
        // En modo LIVE, ignoramos los artefactos Fantasma (Ghosts) para no romper el linaje real
        path = isCosmosMounted
            ? ((focusStack && focusStack.length > 0)
                ? focusStack.filter(a => !a._isGhost)
                : [cosmosIdentity])
            : [];
    }

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        execute('SET_THEME', { theme: newTheme });
        localStorage.setItem('INDRA_THEME', newTheme);
    };

    const handleNuclearPurge = () => {
        if (confirm("☢️ NUCLEAR PURGE\n\nEsto borrará toda la memoria local (Genotipo L0) y forzará una descarga completa del Servidor.\n\n¿Proceder?")) {
            execute('NUCLEAR_PURGE');
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[350] flex items-center justify-end pointer-events-auto">

            <div className={`
                flex items-center gap-2 p-1 rounded-full glass border transition-all duration-500 ease-out shadow-lg max-w-[90vw]
                ${isDevLab ? 'border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-[var(--border-subtle)]'}
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
                                    if (step.id === 'DEV_LAB') execute('SET_MODE', { mode: 'DEV_LAB' });
                                    else if (step.id === cosmosIdentity?.id) execute('EXIT_FOCUS');
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

                    {/* INTERRUPTOR DE REALIDAD (LIVE vs DEV) */}
                    <button
                        onClick={() => execute('SET_MODE', { mode: state.sovereignty.mode === 'LIVE' ? 'DEV_LAB' : 'LIVE' })}
                        className={`h-8 px-3 rounded-full flex items-center gap-2 transition-all ${state.sovereignty.mode === 'DEV_LAB' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                        title={`Cambiar a Modo ${state.sovereignty.mode === 'LIVE' ? 'Laboratorio' : 'Producción'}`}
                    >
                        <Icons.Sync size={12} className={state.sovereignty.mode === 'DEV_LAB' ? 'animate-spin' : ''} />
                        <span className="text-[8px] font-black tracking-[0.2em] uppercase">
                            {state.sovereignty.mode === 'LIVE' ? 'Live' : 'Dev'}
                        </span>
                    </button>

                    <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1"></div>

                    {/* 🗑️ ZOMBIE DNA ELIMINADOS: La navegación sistémica ahora es unificada */}

                    {/* SYSTEM CONTROLS */}
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
                        onClick={() => setShowSecurity(true)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--accent)]/10 transition-colors group"
                        title="Security / Tokens"
                    >
                        <Icons.Lock size={14} className="text-[var(--text-dim)] group-hover:text-[var(--accent)]" />
                    </button>

                    <button
                        onClick={handleNuclearPurge}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--error)]/10 transition-colors group"
                        title="Nuclear Purge"
                    >
                        <Icons.Sync size={14} className="text-[var(--text-dim)] group-hover:text-[var(--error)]" />
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

            {showSecurity && <SecurityVault onClose={() => setShowSecurity(false)} />}
        </div>
    );
};

export default SystemControlHood;
