import React from 'react';
import { Icons } from '../../../../../4_Atoms/AxiomIcons.jsx';

/**
 * CompositorHeader
 * DHARMA: Cabecera soberana del Compositor. Identidad + Control de Vista.
 * AXIOMA: "La cabecera no pensaa, muestra y obedece."
 */
const CompositorHeader = ({ label, views, activeViewId, onViewChange, onExit }) => {
    return (
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-8 z-50 shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                    <Icons.Transform size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white/90 leading-none">{label}</h2>
                    <span className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest opacity-60">
                        Compositor_Active
                    </span>
                </div>
            </div>

            <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                {views.map(v => (
                    <button
                        key={v.id}
                        onClick={() => onViewChange(v.id)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === v.id
                            ? 'bg-[var(--accent)] text-black'
                            : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        {v.label}
                    </button>
                ))}
            </nav>

            <button
                onClick={onExit}
                className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] hover:bg-[var(--error)]/20 transition-all"
            >
                <span className="text-[10px] font-black uppercase tracking-tighter">Exit_Compositor</span>
                <Icons.Close size={16} className="group-hover:rotate-90 transition-transform" />
            </button>
        </header>
    );
};

export default CompositorHeader;

