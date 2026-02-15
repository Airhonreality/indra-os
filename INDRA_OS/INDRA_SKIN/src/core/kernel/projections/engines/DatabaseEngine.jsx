import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Icons } from '../../../../4_Atoms/IndraIcons';
import { useAxiomaticStore } from '../../../state/AxiomaticStore';
import { MOCK_DATABASE_ROWS } from '../mocks/MockFactory';
import { useFilterPrism } from '../../hooks/useFilterPrism';

/**
 * DatabaseEngine.jsx
 * DHARMA: Proyección Universal de Estructuras Tabulares (Grid/Database).
 * AXIOMA: "El origen no importa, la forma es la ley."
 */
const DatabaseEngine = ({ data, perspective = 'STANDARD' }) => {
    const { state, execute } = useAxiomaticStore();
    const focusStack = state.phenotype.focusStack || [];
    const isFocused = focusStack.length > 1;
    const { adapter } = state.sovereignty;

    // ESTADO DE IDENTIDAD DINÁMICA
    const [accounts, setAccounts] = useState([]);
    const [activeAccount, setActiveAccount] = useState(data.ACCOUNT_ID || data.data?.ACCOUNT_ID);
    const [loadingAccounts, setLoadingAccounts] = useState(false);


    // AXIOMA: Resolución de Identidad y Origen (Deep Introspection)
    const artifactId = data.id || data.data?.id || data.ID;
    const accountId = data.ACCOUNT_ID || data.data?.ACCOUNT_ID;

    // AXIOMA: Soberanía de Origen (Contract First - PUREZA ABSOLUTA)
    // Se elimina toda inferencia (regex, path prefixes). El origen debe ser declarado.
    const originSource = useMemo(() => {
        if (data.ORIGIN_SOURCE) return data.ORIGIN_SOURCE.toLowerCase();
        if (data.data?.ORIGIN_SOURCE) return data.data.ORIGIN_SOURCE.toLowerCase();

        const siloMeta = state.phenotype.siloMetadata?.[artifactId];
        if (siloMeta?.ORIGIN_SOURCE) return siloMeta.ORIGIN_SOURCE.toLowerCase();

        return null;
    }, [data, artifactId, state.phenotype.siloMetadata]);

    // AXIOMA: Descubrimiento de Identidades (Deep Binding)
    useEffect(() => {
        const discover = async () => {
            if (!originSource) return;
            setLoadingAccounts(true);
            try {
                const result = await adapter.executeAction('tokenManager:listTokenAccounts', { provider: originSource });
                if (Array.isArray(result)) {
                    setAccounts(result);
                    // Si no hay cuenta activa aún, o la que tenemos no está en la lista, usamos la default
                    if (!activeAccount && result.length > 0) {
                        const def = result.find(a => a.isDefault) || result[0];
                        setActiveAccount(def.id);
                    }
                }
            } catch (e) {
                console.warn(`[DatabaseEngine] Discovery failed for ${originSource}:`, e);
            } finally {
                setLoadingAccounts(false);
            }
        };
        discover();
    }, [originSource]);

    // AXIOMA: Reificación ante cambio de Identidad
    useEffect(() => {
        if (activeAccount && originSource && artifactId) {
            // Solo si es distinto al que ya tenemos en el silo o si queremos forzar
            execute('FETCH_DATABASE_CONTENT', { databaseId: artifactId, nodeId: originSource, accountId: activeAccount });
        }
    }, [activeAccount]);


    // AXIOMA: Recuperación y Aplanamiento de la Data Cruda (Semantic Bridge)
    const rawData = useMemo(() => {
        let base = [];
        // Prioridad 1: Data inyectada directamente en el prop
        if (Array.isArray(data.items)) base = data.items;
        else if (Array.isArray(data.results)) base = data.results;
        else if (Array.isArray(data.rows)) base = data.rows;
        else if (Array.isArray(data.data?.results)) base = data.data.results;
        else if (Array.isArray(data.data?.items)) base = data.data.items;

        // Prioridad 2: Buscar en Silos (Caché L1 del Front)
        if (base.length === 0 && artifactId) {
            const siloData = state.phenotype.silos?.[artifactId];
            if (siloData) {
                base = Array.isArray(siloData) ? siloData : (siloData.results || siloData.items || siloData.rows || []);
            }
        }

        // Prioridad 3: Mock fallback (Solo en modo Dev)
        if (base.length === 0 && state.sovereignty?.mode !== 'LIVE') {
            base = MOCK_DATABASE_ROWS[artifactId] || [];
        }

        // Normalización de Estructuras (Quitar el layer 'fields' si existe)
        return base.map(item => {
            if (!item) return null;
            if (typeof item === 'object' && item.fields) return { id: item.id || item.ID, ...item.fields, _raw: item };
            return item;
        }).filter(Boolean);
    }, [data, artifactId, state.phenotype.silos, state.sovereignty.mode]);

    // AXIOMA: Inferencia de Columnas (Introspección de Forma)
    const columns = useMemo(() => {
        // 1. Esquema Explícito del contrato hidratado
        if (data.SCHEMA?.columns) return data.SCHEMA.columns;
        if (data.data?.SCHEMA?.columns) return data.data.SCHEMA.columns;

        // 2. Esquema desde Silo Metadata
        const siloMeta = state.phenotype.siloMetadata?.[artifactId];
        if (siloMeta?.SCHEMA?.columns) return siloMeta.SCHEMA.columns;

        if (rawData.length === 0) return [];

        // 3. Inferencia Dinámica (Just-in-Time)
        return Object.keys(rawData[0])
            .filter(key => !key.startsWith('_'))
            .map(key => ({
                id: key,
                label: key.replace(/_/g, ' ').toUpperCase(),
                type: typeof rawData[0][key] === 'number' ? 'NUMBER' : 'STRING'
            }));
    }, [data, rawData, artifactId, state.phenotype.siloMetadata]);

    // AXIOMA: Integración de Prisma (Búsqueda y Filtros Unificados)
    const {
        data: processedData,
        searchTerm,
        setSearchTerm,
        sortConfig,
        toggleSort,
        activeFilters,
        setFilter,
        clearFilters
    } = useFilterPrism(rawData, {
        searchKeys: columns.map(c => c.id),
        initialSort: { key: columns[0]?.id || 'id', direction: 'asc' }
    });

    // AXIOMA: Reificación Centralizada
    // Se elimina el useEffect de auto-fetch del componente.
    // La responsabilidad de hidratación recae en el AxiomaticStore durante la transición de foco.

    const handleResync = () => {
        if (!originSource) return;
        execute('FETCH_DATABASE_CONTENT', { databaseId: artifactId, nodeId: originSource, accountId, refresh: true });
    };

    const handleBack = () => execute('EXIT_FOCUS');
    const handleClose = () => execute('EXIT_FOCUS'); // En este contexto, salir del foco es cerrar el engine

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-deep)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* HERRAMIENTAS DE MANDO (Superior) */}
            <header className="px-8 py-5 border-b border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-6">
                    {/* Botón de Retroceso/Salida */}
                    <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                        {isFocused && (
                            <button
                                onClick={handleBack}
                                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all group"
                                title="Volver al Nivel Anterior"
                            >
                                <Icons.SidebarLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--error)] hover:bg-red-500/10 transition-all"
                            title="Cerrar Realidad"
                        >
                            <Icons.Close size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]">
                            <Icons.Database size={24} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1">{data.LABEL || 'DATA_OBJECT'}</h2>
                            <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none ${originSource ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-red-500/20 text-red-400'}`}>
                                    {originSource || 'IDENTITY_VOID'}
                                </span>
                                {accounts.length > 0 && (
                                    <div className="flex items-center gap-2 px-2 border-l border-white/10 ml-2">
                                        <span className="text-[7px] font-bold text-white/30 uppercase">Identity:</span>
                                        <select
                                            className="bg-black/40 border border-white/10 rounded px-1 py-0 text-[8px] font-mono text-[var(--accent)] outline-none cursor-pointer"
                                            value={activeAccount || ''}
                                            onChange={(e) => setActiveAccount(e.target.value)}
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.label} {acc.isDefault ? '(★)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => execute('SELECT_ARTIFACT', { id: 'IDENTITY_MANAGER', ARCHETYPE: 'IDENTITY', LABEL: 'Identity Manager', provider: originSource })}
                                            className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-[var(--accent)] transition-all"
                                            title="Gestionar Cuentas"
                                        >
                                            <Icons.Settings size={10} />
                                        </button>
                                    </div>
                                )}
                                <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{artifactId}</span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* BUSCADOR PRISMÁTICO ANIDADO */}
                <div className="flex items-center gap-3">
                    <div className="relative group min-w-[300px]">
                        <Icons.Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" />
                        <input
                            type="text"
                            placeholder="ESCUDRIÑAR ENTROPÍA..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--surface-header)] border border-[var(--border-subtle)] rounded-full pl-12 pr-6 py-2.5 text-[11px] font-mono text-[var(--text-soft)] outline-none focus:border-[var(--accent)]/40 focus:ring-4 focus:ring-[var(--accent)]/5 transition-all placeholder:text-[var(--text-dim)]"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-header)] border border-[var(--border-subtle)] rounded-full">
                        <button
                            onClick={handleResync}
                            className="p-2.5 rounded-full hover:bg-[var(--surface-card)] text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-all hover:rotate-180 duration-700"
                            title="Refrescar Manantial"
                        >
                            <Icons.Sync size={14} />
                        </button>
                        <button className="p-2.5 rounded-full hover:bg-[var(--surface-card)] text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-all" title="Descargar Snapshot">
                            <Icons.Download size={14} />
                        </button>
                    </div>
                </div>
            </header>

            {/* LIENZO DE DATOS (Table Content) */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse min-w-[1000px] select-none">
                    <thead className="sticky top-0 z-20 bg-[var(--bg-deep)]/95 backdrop-blur-xl">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.id}
                                    onClick={() => toggleSort(col.id)}
                                    className="px-8 py-5 border-b border-[var(--border-subtle)] text-[9px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em] cursor-pointer hover:text-[var(--text-primary)] hover:bg-[var(--glass-overlay)] transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        {col.label}
                                        <div className={`flex flex-col opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === col.id ? 'opacity-100' : ''}`}>
                                            <span className={`text-[8px] leading-[0.5] ${sortConfig.key === col.id && sortConfig.direction === 'asc' ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]/20'}`}>▲</span>
                                            <span className={`text-[8px] leading-[0.5] ${sortConfig.key === col.id && sortConfig.direction === 'desc' ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]/20'}`}>▼</span>
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y border-[var(--border-subtle)]">
                        {processedData.length > 0 ? (
                            processedData.map((row, idx) => (
                                <tr
                                    key={row.id || idx}
                                    onClick={() => {
                                        // AXIOMA: Disparo Sináptico (Automation Trigger)
                                        execute('EXECUTE_NODE_ACTION', {
                                            nodeId: artifactId,
                                            capability: 'onRowSelect',
                                            payload: row
                                        });
                                        // Feedback visual local (opcional: podrías usar un estado local para resaltar la fila)
                                        console.log(`[Axiom:DB] Row Selected: ${row.id || idx}`);
                                    }}
                                    className="group hover:bg-[var(--accent)]/[0.06] active:bg-[var(--accent)]/[0.1] transition-all cursor-pointer"
                                >
                                    {columns.map(col => {
                                        const cellValue = row[col.id];
                                        return (
                                            <td key={col.id} className="px-8 py-4.5 text-[11px] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">
                                                <div className="flex flex-col">
                                                    <span className={`transition-all duration-300 ${cellValue ? 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]' : 'text-[var(--text-dim)]/30 italic'}`}>
                                                        {renderCellValue(cellValue, col.type)}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-6 animate-pulse opacity-30">
                                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--border-subtle)] flex items-center justify-center">
                                            <Icons.Inbox size={32} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-xs font-black uppercase tracking-[0.5em] text-[var(--text-primary)]">No_Manifestation_Found</span>
                                            <span className="text-[9px] font-mono text-[var(--text-dim)]">EL VECTOR SE ENCUENTRA EN ESTADO DE VACÍO</span>
                                        </div>
                                        <button
                                            onClick={handleResync}
                                            className="mt-4 px-6 py-2 rounded-full border border-[var(--border-subtle)] text-[10px] uppercase font-black tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all"
                                        >
                                            FORZAR_REIFICACIÓN
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ESTADÍSTICA DE REALIDAD (Footer) */}
            <footer className="h-12 px-8 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] backdrop-blur-2xl flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-6 text-[8px] font-black uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2 text-[var(--accent)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"></div>
                        <span>STATUS: NOMINAL</span>
                    </div>
                    <div className="w-[1px] h-4 border-l border-[var(--border-subtle)]"></div>
                    <span className="text-[var(--text-dim)]">Visible_Rows: <strong className="text-[var(--text-primary)]">{processedData.length}</strong> / {rawData.length}</span>
                    <div className="w-[1px] h-4 border-l border-[var(--border-subtle)]"></div>
                    <span className="text-[var(--text-dim)]">Identity: <strong className="text-[var(--text-primary)]">{originSource?.toUpperCase() || 'VOID'}</strong></span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[8px] font-mono text-[var(--text-dim)] uppercase">Axiomatic Grid v3.2</span>
                </div>
            </footer>
        </div>
    );
};

// HELPER: Renderizado Inteligente de Celdas
const renderCellValue = (value, type) => {
    if (value === null || value === undefined) return "ø";

    // Si es un objeto complejo (e.g. relación de Notion, archivos, etc.)
    if (typeof value === 'object' && !Array.isArray(value)) {
        if (value.id && value.name) return value.name; // AXIOMA: Identidad Hidratada
        if (value.start) return value.start.split('T')[0]; // Fechas Notion
        return JSON.stringify(value).slice(0, 30) + "...";
    }

    if (Array.isArray(value)) {
        return value.map(v => {
            if (typeof v === 'object') return v.name || v.id || JSON.stringify(v);
            return v;
        }).join(', ');
    }

    if (type === 'NUMBER') return value.toLocaleString();
    if (type === 'BOOLEAN') return value ? '● TRUE' : '○ FALSE';

    return String(value);
};

export default DatabaseEngine;



