import React from 'react';
import { Icons } from '../../../../../4_Atoms/AxiomIcons.jsx';

/**
 * CompositorLiveView
 * DHARMA: Proyecta la materia viva recibida del grafo en forma de tabla agnóstica.
 * AXIOMA: "Si el dato llega, lo mostramos. Sin juicios de forma."
 */
const CompositorLiveView = ({ liveData }) => {
    // Normalizar: aceptar array, objeto único, o primitivo
    const rows = Array.isArray(liveData) ? liveData : [liveData];
    const firstRow = rows[0];
    const columns = firstRow && typeof firstRow === 'object'
        ? Object.keys(firstRow).filter(k => !k.startsWith('_'))
        : ['value'];

    const getCellValue = (row, col) => {
        if (typeof row !== 'object') return String(row);
        const v = row[col];
        if (v === null || v === undefined) return '—';
        if (typeof v === 'object') return JSON.stringify(v).slice(0, 40);
        return String(v);
    };

    return (
        <div className="w-full h-full p-8 animate-in fade-in duration-500 overflow-auto">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-[var(--accent)] uppercase tracking-widest flex items-center gap-3">
                        <Icons.Connect size={18} className="animate-pulse" />
                        Live_Matter_Grid
                    </h3>
                    <span className="text-[10px] font-mono text-white/30">
                        {rows.length} fragments · {columns.length} fields
                    </span>
                </div>

                {/* Tabla Agnóstica */}
                <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5">
                                {columns.map(col => (
                                    <th key={col} className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-white/[0.02]">
                                    {columns.map((col, j) => (
                                        <td key={j} className="px-6 py-4 text-xs font-medium text-white/70">
                                            {getCellValue(row, col)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CompositorLiveView;

