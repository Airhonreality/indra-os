import React, { useState, useMemo } from 'react';
import Icons from '../../../../4_Atoms/IndraIcons';
import { useAxiomaticStore } from '../../../state/AxiomaticStore';
import { MOCK_DATABASE_ROWS } from '../mocks/MockFactory';

/**
 * DatabaseEngine.jsx
 * DHARMA: Proyección Universal de Estructuras Tabulares (Grid/Database).
 * AXIOMA: "El origen no importa, la forma es la ley."
 * Este motor renderiza cualquier conjunto de datos que cumpla con el esquema de tabla.
 */
const DatabaseEngine = ({ data, perspective = 'STANDARD' }) => {
    const { state, execute } = useAxiomaticStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // AXIOMA: Resolución de Identidad y Origen (Deep Introspection)
    // AXIOMA: Resolución de Identidad y Origen (Deep Introspection)
    const artifactId = data.id || data.data?.id;
    const accountId = data.ACCOUNT_ID || data.data?.ACCOUNT_ID;

    // AXIOMA: Soberanía de Origen (Contract First)
    const originSource = useMemo(() => {
        if (data.ORIGIN_SOURCE) return data.ORIGIN_SOURCE.toLowerCase();
        if (data.data?.ORIGIN_SOURCE) return data.data.ORIGIN_SOURCE.toLowerCase();

        // Fallback 1: Firma por MimeType
        const mime = data.mimeType || data.data?.mimeType || '';
        if (mime.includes('notion')) return 'notion';

        // Fallback 2: Consultar metadatos del silo
        const siloMeta = state.phenotype.siloMetadata?.[artifactId];
        if (siloMeta?.ORIGIN_SOURCE) return siloMeta.ORIGIN_SOURCE.toLowerCase();

        return (data.nodeId || 'drive').toLowerCase();
    }, [data, artifactId, state.phenotype.siloMetadata]);

    // AXIOMA: Recuperación y Aplanamiento de la Data Cruda (Semantic Bridge)
    const rawData = useMemo(() => {
        let base = [];
        if (Array.isArray(data.items)) base = data.items;
        else if (Array.isArray(data.results)) base = data.results; // AXIOMA ISR
        else if (Array.isArray(data.rows)) base = data.rows;
        else if (Array.isArray(data.data?.results)) base = data.data.results;
        else if (Array.isArray(data.data?.items)) base = data.data.items;
        else if (Array.isArray(data.data?.rows)) base = data.data.rows;
        else {
            const siloId = artifactId;
            base = state.phenotype.silos?.[siloId] || [];
        }

        // Si la data está vacía, intentamos Mock fallback (Solo en modo Dev)
        if (base.length === 0 && state.sovereignty?.mode !== 'LIVE') {
            base = MOCK_DATABASE_ROWS[artifactId] || [];
        }

        return base.map(item => (item && typeof item === 'object' && item.fields) ? item.fields : item);
    }, [data, artifactId, state.phenotype.silos]);

    // AXIOMA: Reificación Automática (Just-In-Time Discovery)
    React.useEffect(() => {
        if (rawData.length === 0 && artifactId) {
            console.log(`[DatabaseEngine] 📡 Auto-Reifying ${artifactId} from ${originSource}`);
            // AXIOMA: Resolución de ID Externo. Priorizamos IDs técnicos para el backend.
            const fetchId = data.technical_id || data.external_id || artifactId;
            execute('FETCH_DATABASE_CONTENT', { databaseId: fetchId, nodeId: originSource, accountId });
        }
    }, [artifactId, data.technical_id, data.external_id]);

    const handleResync = () => {
        execute('FETCH_DATABASE_CONTENT', { databaseId: artifactId, nodeId: originSource, accountId, refresh: true });
    };

    // AXIOMA: Inferencia de Columnas (Introspección de Forma)
    const columns = useMemo(() => {
        if (data.SCHEMA?.columns) return data.SCHEMA.columns;
        if (data.data?.SCHEMA?.columns) return data.data.SCHEMA.columns;
        if (rawData.length === 0) return [];

        // Si no hay esquema explícito, inferimos de las llaves del primer objeto
        return Object.keys(rawData[0])
            .filter(key => !key.startsWith('_')) // Ocultar metadatos internos
            .map(key => ({
                id: key,
                label: key.replace(/_/g, ' ').toUpperCase(),
                type: typeof rawData[0][key] === 'number' ? 'NUMBER' : 'STRING'
            }));
    }, [data, rawData]);

    // Lógica de Filtrado y Ordenamiento
    const processedData = useMemo(() => {
        let items = [...rawData];

        if (searchTerm) {
            items = items.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        if (sortConfig.key) {
            items.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [rawData, searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-deep)] overflow-hidden animate-in fade-in duration-700">
            {/* HERRAMIENTAS DE FORMA (Header del Engine) */}
            <header className="px-8 py-6 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                        <Icons.List size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white/90 leading-none">{data.LABEL || 'Database_Grid'}</h2>
                        <span className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-[0.2em]">Structure_Mode: SYMMETRIC</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="FILTRAR REALIDAD..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-full px-5 py-2 text-[10px] font-mono text-[var(--text-soft)] outline-none focus:border-[var(--accent)]/50 w-64 transition-all"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">
                            <Icons.Search size={12} />
                        </div>
                    </div>

                    <button
                        onClick={handleResync}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)] hover:text-white"
                    >
                        <Icons.Sync size={12} />
                        <span>Resync</span>
                    </button>

                    <button className="w-8 h-8 rounded-full bg-[var(--accent)] text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-[var(--accent)]/20">
                        <Icons.Download size={14} />
                    </button>
                </div>
            </header>

            {/* CUERPO DEL GRID (El Canvas de Datos) */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                {/* Grid de Fondo */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <table className="w-full text-left border-collapse min-w-[800px] relative z-10">
                    <thead className="sticky top-0 z-20 bg-[var(--bg-deep)]/80 backdrop-blur-xl">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.id}
                                    onClick={() => handleSort(col.id)}
                                    className="px-8 py-5 border-b border-white/10 text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] cursor-pointer hover:text-[var(--accent)] transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        <span className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === col.id ? 'opacity-100 text-[var(--accent)]' : ''}`}>
                                            {sortConfig.key === col.id ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '⇅'}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.length > 0 ? (
                            processedData.map((row, idx) => (
                                <tr
                                    key={row.id || idx}
                                    className="border-b border-white/[0.03] hover:bg-[var(--accent)]/[0.02] group transition-colors"
                                >
                                    {columns.map(col => (
                                        <td key={col.id} className="px-8 py-4 text-xs font-mono text-[var(--text-soft)] opacity-70 group-hover:opacity-100 transition-opacity">
                                            {col.type === 'NUMBER' ? (
                                                <span className="text-[var(--accent)]/80">{row[col.id]}</span>
                                            ) : (
                                                // AXIOMA: Renderizado Seguro de Entropía
                                                typeof row[col.id] === 'object' && row[col.id] !== null
                                                    ? (Array.isArray(row[col.id])
                                                        ? <span className="text-[9px] opacity-60 ellipsis">{JSON.stringify(row[col.id]).slice(0, 50)}</span>
                                                        : <span className="text-[9px] font-mono text-[var(--warning)]">{JSON.stringify(row[col.id]).slice(0, 30)}</span>)
                                                    : row[col.id]
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                        <Icons.Inbox size={48} />
                                        <span className="text-xs font-mono uppercase tracking-[0.3em]">No_Data_Refracted_In_This_Vector</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* BARRA DE ESTADO (Footer) */}
            <footer className="h-10 px-8 border-t border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shadow-[0_0_5px_var(--success)]"></div>
                        <span>Protocol: NOMINAL</span>
                    </div>
                    <div className="w-[1px] h-3 bg-white/10" />
                    <span>Total_Entries: {processedData.length}</span>
                    <div className="w-[1px] h-3 bg-white/10" />
                    <span>Active_Schema: {data.schemaId || 'DYNAMIC_INFERENCE'}</span>
                </div>

                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-white/5 border border-white/5 rounded text-[8px] font-mono hover:bg-white/10 text-[var(--text-dim)]">PREV</button>
                    <button className="px-3 py-1 bg-white/5 border border-white/5 rounded text-[8px] font-mono hover:bg-white/10 text-[var(--text-dim)]">NEXT</button>
                </div>
            </footer>
        </div>
    );
};

export default DatabaseEngine;
