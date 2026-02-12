import React, { useMemo } from 'react';
import { useAxiomaticStore } from '../../../state/AxiomaticStore';
import Icons from '../../../../4_Atoms/IndraIcons';

/**
 * DatabaseNodeWidget
 * V10.8: Transmutación a "Grid Slice".
 * AXIOMA: "El nodo es la ventana, la fila es la unidad."
 */
const DatabaseNodeWidget = ({ data, execute }) => {
    const { state } = useAxiomaticStore();

    // AXIOMA: Resolución de Identidad y Origen (Deep Introspection)
    const artifactId = data.id || data.data?.id;
    const originSource = (data.ORIGIN_SOURCE || data.data?.ORIGIN_SOURCE || 'drive').toLowerCase();
    const accountId = data.ACCOUNT_ID || data.data?.ACCOUNT_ID;

    // AXIOMA: Recuperación y Fragmentación de Data
    const rawData = useMemo(() => {
        const items = data.data?.items || data.items || state.phenotype.silos?.[artifactId] || [];
        return items.slice(0, 5); // Solo las primeras 5 para la vista de nodo
    }, [data.data, data.items, state.phenotype.silos?.[artifactId]]);

    const columns = useMemo(() => {
        if (rawData.length === 0) return [];
        return Object.keys(rawData[0])
            .filter(key => !key.startsWith('_'))
            .slice(0, 3) // Máximo 3 columnas en la vista resumida
            .map(key => ({ id: key, label: key.replace(/_/g, ' ').toUpperCase() }));
    }, [rawData]);

    // Lógica de Extracción (Drag & Drop de Fila)
    const handleDragStart = (e, row) => {
        const rowId = row.id || `row_${Math.random().toString(36).substr(2, 5)}`;
        const artifactFragment = {
            id: `${data.id}_${rowId}`,
            parentId: data.id,
            LABEL: row.name || row.title || row.LABEL || `Entry: ${rowId}`,
            ARCHETYPE: 'DATA_ENTRY',
            DOMAIN: 'FRAGMENT',
            data: row
        };
        e.dataTransfer.setData('indra/artifact', JSON.stringify(artifactFragment));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex flex-col w-full min-h-[140px] relative overflow-hidden group/db bg-black/40 rounded-xl border border-white/5">
            {/* Fondo Estructural */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
                    backgroundSize: '10px 10px'
                }}
            />

            {/* Tabla de Operación Rápida */}
            <div className="relative z-10 flex flex-col h-full">
                <table className="w-full text-left border-collapse border-spacing-0">
                    <thead>
                        <tr className="bg-white/5">
                            {columns.map(col => (
                                <th key={col.id} className="px-3 py-1.5 text-[7px] font-black text-[var(--text-dim)] uppercase tracking-widest border-b border-white/5">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {rawData.length > 0 ? (
                            rawData.map((row, idx) => (
                                <tr
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, row)}
                                    className="hover:bg-[var(--accent)]/[0.05] cursor-grab active:cursor-grabbing transition-colors group/row"
                                >
                                    {columns.map(col => (
                                        <td key={col.id} className="px-3 py-1.5 text-[8px] font-mono text-[var(--text-soft)] opacity-60 group-hover/row:opacity-100 truncate max-w-[100px]">
                                            {row[col.id] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length || 1} className="py-8 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-30 group-hover/db:opacity-100 transition-opacity">
                                        <Icons.Inbox size={24} />
                                        <span className="text-[7px] font-mono uppercase tracking-[0.3em]">Empty_Refraction</span>
                                        <button
                                            onClick={() => {
                                                console.log(`[DatabaseWidget] 📡 Reifying ${artifactId} from ${originSource}`);
                                                execute('FETCH_DATABASE_CONTENT', {
                                                    databaseId: artifactId,
                                                    nodeId: originSource,
                                                    accountId: accountId,
                                                    refresh: true
                                                });
                                            }}
                                            className="px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-full text-[7px] font-black text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-all"
                                        >
                                            REIFY_DATA
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Overlay de Interacción de Fila */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover/db:opacity-100 transition-opacity">
                <div className="text-[7px] font-mono text-[var(--accent)] bg-[var(--accent)]/10 px-1 rounded border border-[var(--accent)]/20 uppercase tracking-tighter">SURFACE_MODE</div>
            </div>
        </div>
    );
};

export default DatabaseNodeWidget;

