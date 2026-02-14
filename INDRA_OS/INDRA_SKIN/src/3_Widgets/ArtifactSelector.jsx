import React, { useState, useEffect, useMemo } from 'react';
import compiler from '../core/laws/Law_Compiler';
import { Icons } from '../4_Atoms/IndraIcons';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';

/**
 * ArtifactSelector (The Catalog)
 * DHARMA: Interface for selecting and instantiating new artifacts from the Semantic Manifest.
 * AXIOMA: "Only what is known can be manifested."
 */
const ArtifactSelector = ({ onSelect, onClose }) => {
    const { state } = useAxiomaticStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [availableArtifacts, setAvailableArtifacts] = useState([]);

    const artifactCount = state.phenotype.artifacts?.length || 0;

    useEffect(() => {
        if (!compiler.isCompiled) compiler.compile();
        const allCanons = compiler.getRenderManifest();

        // --- SOVEREIGN SIEVE V3 (Manifestation Protocol) ---
        const artifactsWithMeta = allCanons.map(canon => {
            // 1. Explicit Cloaking
            if (canon.visibility === 'HIDDEN' || canon.VISIBILITY === 'HIDDEN') return null;

            // 2. Metadata Normalization
            const domain = (canon.DOMAIN || canon.domain || 'SYSTEM').toUpperCase();
            const archetype = (canon.ARCHETYPE || canon.archetype || 'NODE').toUpperCase();

            // 3. AXIOMATIC LOCK (Linear-Fractal Flow)
            // Si el Cosmos está vacío, bloqueamos lo que no sea Semilla
            const isSeed = archetype.includes('VAULT') || archetype.includes('ADAPTER') || archetype.includes('TRIGGER');
            const isLocked = artifactCount === 0 && !isSeed;

            // 4. COMPOSITE-ONLY EXCLUSION
            if (archetype.includes('DESIGN_TOOL') || archetype.includes('STYLING')) return null;

            // 5. ARCHETYPE PASS
            const manifestableArchetypes = [
                'ADAPTER', 'VAULT', 'ORCHESTRATOR', 'AGENT',
                'WIDGET', 'DATAGRID', 'SERVICE', 'TRANSFORM',
                'GRID', 'COMPUTE', 'NODE', 'SLOT', 'SLOT_NODE', 'UTILITY', 'STYLING'
            ];
            const isTool = manifestableArchetypes.some(a => archetype.includes(a));
            const isBridge = archetype.includes('ADAPTER') || archetype.includes('VAULT') || archetype.includes('AGENT');

            // 6. DOMAIN REJECTION
            const coreDomains = ['SYSTEM_CORE', 'SYSTEM_INFRA', 'DATA_ENGINE', 'LOGIC', 'TEMPORAL'];
            const isInfra = coreDomains.includes(domain);
            if (isInfra && !isBridge) return null;
            if (!isTool && !isBridge) return null;
            if (!canon.LABEL && !canon.label && !canon.functional_name) return null;

            return { ...canon, isLocked };
        }).filter(Boolean);

        // Sort by label
        artifactsWithMeta.sort((a, b) => {
            const labelA = (a.LABEL || a.label || '').toUpperCase();
            const labelB = (b.LABEL || b.label || '').toUpperCase();
            return labelA.localeCompare(labelB);
        });

        setAvailableArtifacts(artifactsWithMeta);
    }, [artifactCount]);

    // 6. CATEGORIZATION LOGIC (Semantic Neighborhoods)
    const categorize = (art) => {
        const arch = (art.ARCHETYPE || art.archetype || '').toUpperCase();
        const dom = (art.DOMAIN || art.domain || '').toUpperCase();

        // Vaults & Knowledge Base
        if (arch.includes('VAULT') || dom.includes('KNOWLEDGE') || dom.includes('DATA')) return 'KNOWLEDGE_VAULTS';

        // Intelligence & Cognitive Agents
        if (dom.includes('INTELLIGENCE') || dom.includes('COGNITIVE') || arch.includes('AGENT')) return 'COGNITIVE_ENGINES';

        // Bridges & External Channels
        if (arch.includes('ADAPTER') || dom.includes('COMMUNICATION') || dom.includes('SPATIAL') || dom.includes('MEDIA')) return 'BRIDGES_AND_ADAPTERS';

        // Visual Utilities (Macro-Apps)
        if (arch.includes('SLOT') || arch.includes('REALITY') || arch.includes('UTILITY') || arch.includes('VISUAL_UTILITY')) return 'VISUAL_UTILITIES';

        // Atomic Widgets (Micro-Tools)
        if (arch.includes('WIDGET') || arch.includes('STYLING') || arch.includes('MATH')) return 'ATOMIC_WIDGETS';

        // Structure & Logic
        if (arch.includes('ORCHESTRATOR') || arch.includes('TRANSFORM') || arch.includes('GRID')) return 'ORCHESTRATION_UNITS';

        return 'UTILITIES';
    };

    const categories = [
        { id: 'COGNITIVE_ENGINES', label: 'Cerebros y Motores Cognitivos', icon: '🧠', desc: 'Sistemas de razonamiento y procesamiento inteligente.' },
        { id: 'KNOWLEDGE_VAULTS', label: 'Bóvedas de Conocimiento', icon: '📂', desc: 'Repositorios de archivos, bases de datos y memoria.' },
        { id: 'BRIDGES_AND_ADAPTERS', label: 'Puentes y Herramientas', icon: '🔌', desc: 'Conectores con el mundo exterior y herramientas operativas.' },
        { id: 'VISOR_REALITY', label: 'Proyectores de Realidad', icon: '🌌', desc: 'Motores para visualizar datos complejos (3D, Tiempo, Mapas).' },
        { id: 'VISUAL_UTILITIES', label: 'Herramientas de Frontend (Apps)', icon: '🛠️', desc: 'Aplicaciones completas para manipular datos.' },
        { id: 'ATOMIC_WIDGETS', label: 'Controles y Átomos (Widgets)', icon: '🎛️', desc: 'Componentes pequeños para incrustar en otras herramientas.' },
        { id: 'ORCHESTRATION_UNITS', label: 'Unidades de Orquestación', icon: '⚡', desc: 'Sistemas de control de flujos y estructuras complejas.' },
        { id: 'UTILITIES', label: 'Utilidades Diversas', icon: '📦', desc: 'Herramientas de soporte y servicios auxiliares.' }
    ];

    const filtered = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return availableArtifacts.filter(art => {
            const label = (art.LABEL || art.label || art.functional_name || '').toLowerCase();
            const arch = (art.ARCHETYPE || art.archetype || '').toLowerCase();
            const dom = (art.DOMAIN || art.domain || '').toLowerCase();
            return label.includes(query) || arch.includes(query) || dom.includes(query);
        });
    }, [searchTerm, availableArtifacts]);

    const grouped = useMemo(() => {
        const groups = {};
        filtered.forEach(art => {
            const cat = categorize(art);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(art);
        });
        return groups;
    }, [filtered]);

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="w-[800px] max-h-[85vh] bg-[var(--bg-deep)] border border-[var(--border-vibrant)]/30 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="p-8 border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-secondary)]/50 to-transparent">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--accent)]/10 rounded-2xl border border-[var(--accent)]/20 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]">
                                <Icons.Search size={24} className="text-[var(--accent)]" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-black text-[var(--text-vibrant)] tracking-tighter uppercase italic">
                                    Manifest <span className="text-[var(--accent)]">Protocol</span>
                                </h2>
                                <span className="text-[10px] font-mono text-[var(--text-dim)] tracking-[0.3em] uppercase opacity-70">
                                    Reality_Synchronization_Interface // L1_GATE
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-all p-3 hover:bg-[var(--accent)]/5 rounded-full border border-transparent hover:border-[var(--accent)]/20">
                            <Icons.Close size={24} />
                        </button>
                    </div>

                    {/* Search Engine */}
                    <div className="relative group">
                        <input
                            type="text"
                            className="w-full bg-[var(--bg-primary)]/80 border border-[var(--border-subtle)] rounded-2xl py-4 pl-12 pr-6 text-base text-[var(--text-vibrant)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 outline-none transition-all shadow-inner font-medium"
                            placeholder="Identify artifact by frequency name, archetype or domain..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Icons.Search size={18} className="text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Content Area - Categorized Grid */}
                <div className="flex-1 overflow-y-auto p-8 bg-dot-pattern scrollbar-thin scrollbar-thumb-[var(--border-subtle)]">
                    {categories.map(cat => {
                        const items = grouped[cat.id];
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={cat.id} className="mb-10 last:mb-0">
                                <header className="flex flex-col gap-1 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-lg shadow-sm">
                                            {cat.icon}
                                        </div>
                                        <h3 className="text-xs font-black text-[var(--text-vibrant)] uppercase tracking-[0.25em]">
                                            {cat.label}
                                        </h3>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--border-subtle)] to-transparent ml-2 opacity-50" />
                                        <span className="text-[10px] font-mono text-[var(--accent)] px-2 py-0.5 rounded bg-[var(--accent)]/5 border border-[var(--accent)]/20">
                                            {items.length} UNITS
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-dim)] font-medium pl-11 opacity-60 italic">
                                        {cat.desc}
                                    </p>
                                </header>

                                <div className="grid grid-cols-2 gap-4 pl-11">
                                    {items.map((artifact, idx) => (
                                        <button
                                            key={`${cat.id}-${idx}`}
                                            onClick={() => !artifact.isLocked && onSelect(artifact)}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group text-left relative overflow-hidden ${artifact.isLocked
                                                ? 'bg-black/20 border-white/5 cursor-not-allowed opacity-50'
                                                : 'bg-[var(--bg-secondary)]/30 border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]/80 hover:border-[var(--accent)]/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]'
                                                }`}
                                        >
                                            {!artifact.isLocked && <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}

                                            <div className={`w-12 h-12 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] flex items-center justify-center transition-all shadow-sm ${artifact.isLocked ? 'grayscale' : 'group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] group-hover:scale-110'
                                                } relative z-10`}>
                                                <span className={`text-2xl filter drop-shadow-md ${!artifact.isLocked && 'group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]'}`}>
                                                    {artifact.isLocked ? '🔒' : cat.icon}
                                                </span>
                                            </div>

                                            <div className="relative z-10 flex-1 min-w-0">
                                                <h4 className={`font-bold text-sm mb-1 transition-colors truncate ${artifact.isLocked ? 'text-white/20' : 'text-[var(--text-soft)] group-hover:text-[var(--text-vibrant)]'
                                                    }`}>
                                                    {artifact.LABEL || artifact.label || artifact.functional_name}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded bg-[var(--bg-deep)] border border-[var(--border-subtle)] tracking-tighter uppercase transition-colors ${artifact.isLocked ? 'text-white/10' : 'text-[var(--text-dim)] group-hover:text-[var(--accent)]'
                                                        }`}>
                                                        {artifact.isLocked ? 'SOCKED' : (artifact.ARCHETYPE || artifact.archetype || 'UNIT').split('_')[0]}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
                                                    <span className="text-[9px] font-mono text-[var(--text-dim)] opacity-40 uppercase truncate">
                                                        {artifact.isLocked ? 'REQUIRES_DATA_SEED' : (artifact.DOMAIN || artifact.domain || 'SYSTEM')}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="py-24 text-center flex flex-col items-center justify-center gap-6 animate-in zoom-in-90 duration-300">
                            <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-5xl opacity-20 shadow-inner">
                                📡
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="font-black text-sm text-[var(--text-dim)] tracking-widest uppercase">
                                    SIGNAL_LOSS // NO_RESULTS_FOUND
                                </div>
                                <div className="font-mono text-[10px] text-[var(--text-dim)] opacity-50 italic">
                                    Frequency "{searchTerm}" does not match any known manifest circuit.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="px-8 py-5 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                            <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                                L0_ONTOLOGY: {availableArtifacts.length}
                            </span>
                        </div>
                        <div className="w-[1px] h-4 bg-[var(--border-subtle)] opacity-50"></div>
                        <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                            ACTIVE_SIEVE: SOVEREIGN_V3
                        </span>
                    </div>

                    <div className="flex items-center gap-2 font-black text-[9px] tracking-[0.3em] text-[var(--accent)] opacity-80 uppercase">
                        <span>Indra_OS</span>
                        <span className="text-[var(--text-dim)] opacity-30">//</span>
                        <span>Manifest_v8.1</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtifactSelector;
