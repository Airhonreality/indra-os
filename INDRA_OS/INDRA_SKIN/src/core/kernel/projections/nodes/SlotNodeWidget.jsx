import React from 'react';
import Icons from '../../../../4_Atoms/AxiomIcons.jsx';

/**
 * SlotNodeWidget
 * DHARMA: Visualizar proyecciones de datos entrantes directamente en el grafo.
 * AXIOMA: "El Slot es un espejo del flujo."
 */
const SlotNodeWidget = ({ data }) => {
    // AXIOMA: Detección de Materia Polimórfica
    const rawMatter = data._currentProjection || data.payload || data.data?.items || (data.items && Array.isArray(data.items) ? data.items : null);
    const projection = Array.isArray(rawMatter) ? rawMatter : (rawMatter ? [rawMatter] : []);
    const hasData = projection.length > 0;

    return (
        <div className="flex flex-col gap-2 h-full justify-center">
            {hasData ? (
                <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-2 mb-1 px-1">
                        <Icons.Connect size={10} className="text-[var(--accent)] animate-pulse" />
                        <span className="text-[7px] font-black text-[var(--accent)] uppercase tracking-widest">Projection_Live</span>
                    </div>

                    <div className="bg-black/30 rounded-lg border border-white/5 p-2 space-y-1.5 overflow-hidden">
                        {projection.slice(0, 3).map((item, idx) => {
                            const label = item?.LABEL || item?.name || item?.title || (item?.fields?.Name?.title?.[0]?.plain_text) || (typeof item === 'string' ? item : `Fragment_${idx}`);
                            return (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[var(--accent)] opacity-40" />
                                    <span className="text-[8px] font-mono text-[var(--text-soft)] truncate opacity-80">
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                        {projection.length > 3 && (
                            <div className="text-[6px] font-black text-[var(--text-dim)] uppercase tracking-tighter pl-3">
                                + {projection.length - 3} more fragments
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border border-dashed border-white/20 animate-spin-slow"></div>
                        <Icons.Maximize size={16} className="absolute inset-0 m-auto text-white/50" />
                    </div>
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em]">Awaiting_Signal</span>
                </div>
            )}
        </div>
    );
};

export default SlotNodeWidget;

