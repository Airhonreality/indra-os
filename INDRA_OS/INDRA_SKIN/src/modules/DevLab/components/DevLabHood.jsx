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
    activePerspective, // Nuevo prop: Para highlighting del módulo activo
    onSelectTarget,
    onSelectPerspective, // Nuevo callback: Para cambiar de vista
    isMockEnabled,
    onToggleMock,
    isTesting,      // Loading state for tests
    onRunChaosTest,
    onRunAudits,
    onRunDiagnostic
}) => {
    // AXIOMA: Estado Local de Despliegue de Tests
    const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);

    // AXIOMA: Catálogo de Motores de Proyección (Televisor)
    const modules = [
        { id: 'VAULT', label: 'Vault Engine', icon: Icons.Vault },
        { id: 'DATABASE', label: 'DB Engine', icon: Icons.Database },
        { id: 'NODE', label: 'Node Engine', icon: Icons.Terminal },
        { id: 'COMMUNICATION', label: 'Comm Engine', icon: Icons.Inbox },
        { id: 'REALITY', label: 'Reality Engine', icon: Icons.Cosmos }
    ];

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [filteredArtifacts, setFilteredArtifacts] = useState([]);

    // AXIOMA: Sincronización de Manifiesto Canónico
    useEffect(() => {
        if (!compiler.isCompiled) {
            console.log('[DevLabHood] Forzando compilación de leyes...');
            compiler.compile();
        }

        const all = compiler.getRenderManifest() || [];
        const matches = all.filter(art =>
            (art.LABEL || art.id).toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredArtifacts(matches.slice(0, 50)); // Límite expandido
    }, [searchTerm]); // Re-calcular al buscar

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[400] flex flex-col items-center gap-8 animate-fade-in-right">

            {/* BUSCADOR DE ARTEFACTOS (Lens) - Sigue usando onSelectTarget */}
            <div className="relative group/search">
                <button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`
                       w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border
                       ${isSearchOpen ? 'bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)]' : 'glass border-white/5 text-[var(--text-dim)] hover:text-white hover:bg-white/5'}
                   `}
                    title="Inspector de Artefactos"
                >
                    <Icons.Search size={18} />
                </button>

                {/* Dropdown de Búsqueda */}
                <div className={`
                    absolute right-14 top-0 w-64 bg-[var(--bg-deep)] border border-white/10 rounded-xl shadow-2xl p-2
                    transition-all duration-300 origin-top-right overflow-hidden
                    ${isSearchOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
                `}>
                    <input
                        type="text"
                        placeholder="Buscar ID o Etiqueta..."
                        className="w-full bg-black/20 text-xs p-2 rounded border border-white/5 focus:border-[var(--accent)] focus:outline-none mb-2 text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />

                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredArtifacts.map(art => (
                            <button
                                key={art.id}
                                onClick={() => {
                                    onSelectTarget(art.id);
                                    setIsSearchOpen(false);
                                }}
                                className="text-left px-2 py-1.5 hover:bg-white/5 rounded flex items-center justify-between group/item"
                            >
                                <span className="text-[10px] font-mono text-[var(--text-secondary)] group-hover/item:text-white truncate max-w-[120px]">
                                    {art.LABEL || art.id}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-dim)] bg-white/5 px-1 rounded">
                                    {art.ARCHETYPE || 'UNK'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ALMACÉN DE MÓDULOS REAC (Engine Selector) - Controla PERSPECTIVA */}
            <div className="flex flex-col gap-3 p-2 glass border border-white/5 rounded-full shadow-2xl relative group/vault">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/vault:opacity-100 transition-opacity whitespace-nowrap">
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">Projector_Vault</span>
                </div>

                {modules.map(mod => (
                    <button
                        key={mod.id}
                        onClick={() => onSelectPerspective(mod.id)} // AXIOMA: Cambio de Lente, no de Objeto
                        className={`
                            w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 relative group/icon
                            ${activePerspective === mod.id // AXIOMA: Feedback visual basado en Lente
                                ? 'bg-[var(--accent)] text-black shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)] scale-110'
                                : 'text-[var(--text-dim)] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'}
                        `}
                    >
                        <mod.icon size={20} />

                        {/* Tooltip Lateral */}
                        <div className="absolute right-14 scale-0 group-hover/icon:scale-100 transition-transform origin-right pointer-events-none">
                            <div className="glass px-3 py-1 rounded-lg border border-white/10 shadow-xl">
                                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{mod.label}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* CONTROLES DE FIDELIDAD (Mocks / Real Data) */}
            <div className="flex flex-col gap-2 p-2 glass border border-orange-500/20 rounded-full shadow-2xl relative group/fid">
                <button
                    onClick={onToggleMock}
                    className={`
                        w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all duration-500 border
                        ${isMockEnabled
                            ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                            : 'border-white/5 text-white/20 hover:text-white/60 hover:bg-white/5'}
                    `}
                    title={isMockEnabled ? "Realidad Simulada (MOCK)" : "Realidad Soberana (LIVE)"}
                >
                    <Icons.Sync size={16} className={isMockEnabled ? 'animate-[spin_4s_linear_infinite]' : ''} />
                    <span className="text-[6px] font-black mt-1 tracking-tighter">MOCK</span>
                </button>

                {/* DIAGNOSTIC DRAWER (Horizontal Expansion) */}
                {/* DIAGNOSTIC DRAWER (Horizontal Absolute Expansion) */}
                <div className="relative w-11 h-11 z-[500] flex items-center justify-center">

                    {/* Expanding Container (Absolute, Anchored Right) */}
                    <div
                        className={`absolute right-0 top-0 h-11 flex items-center bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl overflow-hidden transition-all duration-500 ease-out ${isTestDrawerOpen ? 'w-[180px] pr-12' : 'w-11 delay-200'}`}
                    >
                        <div className={`flex items-center gap-1 pl-3 w-full justify-start ${isTestDrawerOpen ? 'opacity-100 delay-100 duration-500' : 'opacity-0 duration-0'}`}>
                            {/* 1. Chaos Test */}
                            <button onClick={onRunChaosTest} disabled={isTesting} className="text-orange-400 hover:text-orange-200 hover:bg-white/10 p-2 rounded-full transition-colors group/item relative" title="Ignite Chaos Test">
                                <span className="text-lg grayscale group-hover/item:grayscale-0 transition-all">🔥</span>
                            </button>
                            {/* 2. Audit */}
                            <button onClick={onRunAudits} disabled={isTesting} className="text-blue-400 hover:text-blue-200 hover:bg-white/10 p-2 rounded-full transition-colors group/item relative" title="V12 Sovereignty Audit">
                                <span className="text-lg grayscale group-hover/item:grayscale-0 transition-all">🛡️</span>
                            </button>
                            {/* 3. Diagnostic */}
                            <button onClick={onRunDiagnostic} disabled={isTesting} className="text-emerald-400 hover:text-emerald-200 hover:bg-white/10 p-2 rounded-full transition-colors group/item relative" title="System Diagnostic">
                                <span className="text-lg grayscale group-hover/item:grayscale-0 transition-all">🔍</span>
                            </button>
                        </div>
                    </div>

                    {/* Botón Principal (Toggle) - ALWAYS ON TOP and RIGHT */}
                    <button
                        onClick={() => setIsTestDrawerOpen(!isTestDrawerOpen)}
                        className={`absolute right-0 top-0 z-50 w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all duration-300 border ${isTestDrawerOpen ? 'bg-blue-600 text-white border-blue-400 rotate-90 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'border-white/5 text-white/20 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30'}`}
                        title="Chaos Commander (Diagnostics)"
                    >
                        {isTesting ? (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            isTestDrawerOpen ? <Icons.Close size={16} /> : <Icons.Lab size={16} />
                        )}
                        {!isTestDrawerOpen && <span className="text-[6px] font-black mt-1 tracking-tighter">TEST</span>}
                    </button>
                </div>

                {/* Indicador de Estado de Datos */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className={`text-[6px] font-mono uppercase tracking-[0.2em] ${isMockEnabled ? 'text-orange-400 animate-pulse' : 'text-blue-400 opacity-40'}`}>
                        {isMockEnabled ? 'Input: Synthetic' : 'Input: Sovereign'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DevLabHood;
