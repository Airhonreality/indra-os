import React from 'react';
import { Icons } from '../../../../../4_Atoms/AxiomIcons.jsx';

/**
 * CompositorDashboard
 * DHARMA: Vista de reposo del Compositor. Muestra capacidades como mosaicos.
 * AXIOMA: "Sin datos, mostramos posibilidades — no mentiras."
 */

const getStatusColor = (status) => {
    switch (status) {
        case 'CONNECTED': return 'var(--accent)';
        case 'BROKEN': return 'var(--error)';
        case 'IDLE': return 'var(--text-dim)';
        default: return 'var(--text-dim)';
    }
};

const CompositorDashboard = ({ properties, selectedProperty, onSelectProperty }) => {
    if (!properties || properties.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 opacity-20">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                        <Icons.Transform size={32} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em]">No_Capabilities_Defined</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl grid grid-cols-12 gap-6 h-fit p-4">
            {properties.map((prop, i) => (
                <div
                    key={prop.id}
                    onClick={() => onSelectProperty(prop.id)}
                    className={`
                        col-span-12 md:col-span-6 lg:col-span-4 p-6 rounded-[32px] 
                        bg-white/5 border border-white/10 backdrop-blur-xl 
                        hover:border-[var(--accent)]/40 hover:bg-white/10 transition-all cursor-pointer group/tile 
                        animate-in fade-in slide-in-from-bottom duration-500
                        relative overflow-hidden
                    `}
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover/tile:opacity-100 transition-opacity">
                        <Icons.ArrowRight size={16} className="text-[var(--accent)] -rotate-45" />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--surface-card)] flex items-center justify-center text-2xl border border-[var(--border-subtle)] group-hover/tile:scale-110 transition-transform shadow-lg shadow-black/20">
                            {typeof prop.icon === 'function'
                                ? React.createElement(prop.icon, { size: 24 })
                                : (prop.icon || <Icons.Transform size={24} />)}
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1">State_Signal</span>
                            <div className="flex items-center gap-2 bg-[var(--surface-header)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor(prop.status) }} />
                                <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase">{prop.status}</span>
                            </div>
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight mb-1 group-hover/tile:text-[var(--accent)] transition-colors">
                        {prop.label}
                    </h4>
                    <p className="text-[10px] text-[var(--text-dim)] font-mono mb-6 truncate">
                        {prop.id.toUpperCase()}_port · {prop.value}
                    </p>

                    {/* Pulso de telemetría sintético */}
                    <div className="h-20 bg-[var(--surface-header)] rounded-2xl border border-[var(--border-subtle)] flex items-end p-1 gap-[2px] overflow-hidden relative">
                        <div className="absolute top-2 left-2 text-[8px] font-mono text-white/20">IO_Telemetry</div>
                        {[...Array(20)].map((_, j) => (
                            <div
                                key={j}
                                className="flex-1 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/40 rounded-t-[1px] transition-all duration-300"
                                style={{ height: `${15 + (j * 13 + i * 7) % 70}%` }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CompositorDashboard;

