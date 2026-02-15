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
    const artifactId = data.id || data.data?.id || data.ID;
    const originSource = (data.ORIGIN_SOURCE || data.data?.ORIGIN_SOURCE)?.toLowerCase();
    const accountId = data.ACCOUNT_ID || data.data?.ACCOUNT_ID;

    // AXIOMA: Recuperación y Fragmentación de Data con Normalización de Puente (ADR-008)
    const rawData = useMemo(() => {
        let items = data.data?.items || data.items || data.results || data.rows || data.data?.results || [];

        // Si no hay items en data, intentar del silo
        if (items.length === 0) {
            const silo = state.phenotype.silos?.[artifactId];
            if (silo) {
                items = Array.isArray(silo) ? silo : (silo.results || silo.items || silo.rows || []);
            }
        }

        // AXIOMA: Normalización Proyectiva (Quitar el layer 'fields' o 'properties' si existe)
        return items.map(item => {
            if (!item) return null;
            if (typeof item === 'object') {
                const fields = item.fields || item.properties || item.Properties;
                if (fields) return { id: item.id || item.ID, ...fields, _raw: item };
            }
            return item;
        }).filter(Boolean).slice(0, 5); // Solo las primeras 5 para la vista de nodo
    }, [data.data, data.items, state.phenotype.silos?.[artifactId], artifactId]);

    const columns = useMemo(() => {
        // Prioridad 1: Esquema Explícito
        const artCols = data.SCHEMA?.columns || data.data?.SCHEMA?.columns || data.data?.columns || data.columns;
        if (artCols && artCols.length > 0) return artCols;

        if (rawData.length === 0) return [];

        // Prioridad 2: Inferencia de Columnas (Introspección de Forma)
        return Object.keys(rawData[0])
            .filter(key => !key.startsWith('_'))
            .map(key => ({ id: key, label: key.toUpperCase() }));
    }, [rawData, data]);

    // Lógica de Extracción (Drag & Drop de Fila) - Mantenida para compatibilidad, aunque no usada en el nuevo render
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

    const handleReify = () => {
        execute('FETCH_VAULT_CONTENT', {
            nodeId: originSource || 'NOTION', // Fallback inteligente
            folderId: artifactId,
            accountId: accountId,
            refresh: true
        });
    };

    const handleDeepFocus = () => {
        execute('SELECT_ARTIFACT', data);
    };

    // HELPER: Renderizado Inteligente de Celdas (Sincronizado con DatabaseEngine)
    const renderCellValue = (value) => {
        if (value === null || value === undefined) return "ø";

        if (typeof value === 'object' && !Array.isArray(value)) {
            // Caso Notion/Specialized
            if (value.title && Array.isArray(value.title)) return value.title.map(t => t.plain_text).join('');
            if (value.rich_text && Array.isArray(value.rich_text)) return value.rich_text.map(t => t.plain_text).join('');
            if (value.name || value.label) return value.name || value.label;
            if (value.id) return `ID:${value.id.slice(0, 4)}...`;
            return JSON.stringify(value).slice(0, 20) + "...";
        }

        if (Array.isArray(value)) {
            return value.map(v => {
                if (typeof v === 'object') return v.name || v.label || v.plain_text || v.id || "?";
                return v;
            }).join(', ');
        }

        return String(value);
    };

    return (
        <div className="flex flex-col gap-3 group/db h-full">
            {/* MINI HEADER DE CONTEXTO */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 opacity-40 group-hover/db:opacity-100 transition-opacity">
                    <Icons.Database size={10} className="text-[var(--accent)]" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                        {originSource || 'REALITY_STREAM'}
                    </span>
                </div>
                <button
                    onClick={handleDeepFocus}
                    className="p-1 rounded bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] transition-all"
                    title="Expandir a Motor de Base de Datos"
                >
                    <Icons.Maximize size={10} />
                </button>
            </div>

            {/* GRILLA DE DATOS REIFICADA */}
            <div className="relative flex-1 bg-[var(--surface-card)] rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-[var(--surface-header)]">
                        <tr>
                            {columns.slice(0, 3).map(col => (
                                <th key={col.id} className="px-3 py-2 text-[7px] font-black text-[var(--text-dim)] uppercase tracking-tighter truncate border-b border-white/5">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y border-white/[0.02]">
                        {rawData.length > 0 ? (
                            rawData.map((row, idx) => (
                                <tr
                                    key={row.id || idx}
                                    className="hover:bg-[var(--accent)]/[0.05] transition-colors group/row"
                                >
                                    {columns.slice(0, 3).map(col => (
                                        <td key={col.id} className="px-3 py-1.5 text-[8px] font-mono text-[var(--text-soft)] opacity-60 group-hover/row:opacity-100 truncate">
                                            {renderCellValue(row[col.id])}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length || 1} className="py-8 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-30 group-hover/db:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center animate-pulse">
                                            <Icons.Inbox size={16} />
                                        </div>
                                        <span className="text-[8px] font-mono uppercase">Empty_Refraction</span>
                                        <button
                                            onClick={handleReify}
                                            className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[7px] font-black text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all uppercase tracking-widest"
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
        </div>
    );
};

export default DatabaseNodeWidget;




