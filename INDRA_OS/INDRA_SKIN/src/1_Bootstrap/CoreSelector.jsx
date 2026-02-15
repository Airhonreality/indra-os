/**
 * CAPA 1: BOOTSTRAP
 * CoreSelector.jsx
 * DHARMA: Selector de Realidad y Gestión de Enlaces Multicore.
 * AXIOMA: "El front es un viajero; los Cores son los mundos que habita."
 */

import React, { useState, useEffect } from 'react';
import adapter from '../core/Sovereign_Adapter';
import { CONFIG, updateCoreUrl } from '../core/Config';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import { Icons } from '../4_Atoms/IndraIcons';

const CoreSelector = ({ asOverlay = false, onClose }) => {
    const { execute } = useAxiomaticStore();

    // Lista de Cores Conocidos (Address Book)
    const [knownCores, setKnownCores] = useState(() => {
        const stored = localStorage.getItem('INDRA_KNOWN_CORES');
        return stored ? JSON.parse(stored) : [
            { id: 'default', label: 'Indra Office', url: CONFIG.CORE_URL, token: CONFIG.SYSTEM_TOKEN }
        ];
    });

    const [activeCoreId, setActiveCoreId] = useState(localStorage.getItem('INDRA_ACTIVE_CORE_ID') || 'default');
    const [isAdding, setIsAdding] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState(null);

    // Formulario para nuevo Core
    const [newCore, setNewCore] = useState({ label: '', url: '', token: '' });

    const saveCores = (cores) => {
        setKnownCores(cores);
        localStorage.setItem('INDRA_KNOWN_CORES', JSON.stringify(cores));
    };

    const handleConnect = async (core) => {
        setIsAuthenticating(true);
        setError(null);

        try {
            console.log(`[CoreSelector] Conectando a ${core.label}...`);

            // 1. Persistencia de Sesión Activa
            localStorage.setItem('INDRA_SESSION_TOKEN', core.token);
            localStorage.setItem('INDRA_OVERRIDE_URL', core.url);
            localStorage.setItem('INDRA_ACTIVE_CORE_ID', core.id);

            // 2. Reinicializar el conector
            const { default: connector } = await import('../core/Core_Connector');
            connector.init(core.url, core.token);

            // 3. Handshake (Ignición)
            const result = await adapter.ignite();

            if (result.sovereignty === 'ACTIVE') {
                console.log(`[CoreSelector] ✅ Vínculo establecido con ${core.label}`);

                if (asOverlay) {
                    execute('IGNITE_SYSTEM', {
                        sovereignty: 'ACTIVE',
                        genotype: result.genotype
                    });
                    if (onClose) onClose();
                } else {
                    window.location.reload(); // Recarga limpia para cambio de Core
                }
            } else {
                setError(`ERROR_VETO: El Core '${core.label}' rechazó la conexión.`);
            }
        } catch (err) {
            setError(`CORE_INALCANZABLE: ${err.message}`);
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleAddCore = () => {
        if (!newCore.url || !newCore.token) return;
        const coreId = `core_${Date.now()}`;
        const updated = [...knownCores, { ...newCore, id: coreId, label: newCore.label || 'Nuevo Core' }];
        saveCores(updated);
        setIsAdding(false);
        setNewCore({ label: '', url: '', token: '' });
    };

    const removeCore = (id) => {
        if (id === 'default') return;
        saveCores(knownCores.filter(c => c.id !== id));
    };

    return (
        <div className={`w-full h-full flex items-center justify-center bg-[var(--bg-deep)] p-8 ${asOverlay ? 'bg-black/80 backdrop-blur-3xl fixed inset-0 z-[100]' : ''}`}>

            <div className="w-full max-w-4xl grid grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500">

                {/* Lateral: Info de Identidad */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
                    <div className="w-20 h-20 rounded-3xl border-2 border-[var(--accent)] flex items-center justify-center shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                        <Icons.Cosmos size={40} className="text-[var(--accent)] animate-spin-slow" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">Core_Selector</h1>
                        <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest font-mono">Multi-Reality_Gateway_v3.0</p>
                    </div>

                    <div className="mt-auto p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[9px] text-[var(--text-dim)] leading-relaxed italic">
                            "Los Cosmos viven dentro de los Cores. Selecciona una realidad para proyectarla en tu interfaz local."
                        </p>
                    </div>

                    {asOverlay && (
                        <button onClick={onClose} className="text-left text-[9px] font-black uppercase text-[var(--accent)] hover:opacity-50">
                            [ Esc ] Cancelar Navegación
                        </button>
                    )}
                </div>

                {/* Principal: Lista de Realidades */}
                <div className="col-span-12 md:col-span-8 flex flex-col gap-4">

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-mono leading-relaxed mb-2">
                            🛑 ERROR: {error}
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Realidades_Registradas</span>
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="text-[10px] font-black uppercase text-[var(--accent)] flex items-center gap-2 hover:brightness-125"
                        >
                            <Icons.Plus size={14} /> {isAdding ? 'Ver Lista' : 'Añadir Core'}
                        </button>
                    </div>

                    {isAdding ? (
                        <div className="flex flex-col gap-6 p-8 bg-white/5 border border-white/10 rounded-3xl animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-2">Manual_Entry</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[8px] font-mono text-white/30 uppercase mb-2 block">Nombre del Orbe</label>
                                    <input
                                        type="text"
                                        value={newCore.label}
                                        onChange={e => setNewCore({ ...newCore, label: e.target.value })}
                                        placeholder="ej: Core Producción"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--accent)]/50 transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] font-mono text-white/30 uppercase mb-2 block">URL del Script (Core)</label>
                                    <input
                                        type="text"
                                        value={newCore.url}
                                        onChange={e => setNewCore({ ...newCore, url: e.target.value })}
                                        placeholder="https://script.google.com/..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--accent)]/50 transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] font-mono text-white/30 uppercase mb-2 block">Sistema Token (Secret)</label>
                                    <input
                                        type="password"
                                        value={newCore.token}
                                        onChange={e => setNewCore({ ...newCore, token: e.target.value })}
                                        placeholder="••••••••••••"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--accent)]/50 transition-all font-mono"
                                    />
                                </div>
                                <button
                                    onClick={handleAddCore}
                                    className="w-full bg-[var(--accent)] text-black py-4 rounded-xl font-black uppercase text-xs hover:scale-[1.01] transition-all"
                                >
                                    Vincular Realidad
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            {knownCores.map(core => (
                                <div
                                    key={core.id}
                                    className={`group flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer ${activeCoreId === core.id ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/5' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-6 flex-1" onClick={() => handleConnect(core)}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl bg-black/40 border transition-all ${activeCoreId === core.id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-white/5 text-white/20'}`}>
                                            <Icons.Transform size={30} className={activeCoreId === core.id ? 'animate-pulse' : ''} />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-lg leading-none">{core.label}</h3>
                                                {activeCoreId === core.id && (
                                                    <span className="px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[7px] text-[var(--accent)] font-black uppercase border border-[var(--accent)]/30">Active</span>
                                                )}
                                            </div>
                                            <span className="text-[8px] font-mono text-white/20 truncate max-w-[300px]">{core.url}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {isAuthenticating && activeCoreId === core.id ? (
                                            <Icons.Sync size={18} className="animate-spin text-[var(--accent)]" />
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeCore(core.id); }}
                                                className="p-3 rounded-xl hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all"
                                            >
                                                <Icons.Trash size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Diagnostics Background Decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/20 rounded-full animate-spin-slow"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/20 rounded-full animate-reverse-slow"></div>
            </div>
        </div>
    );
};

export default CoreSelector;
