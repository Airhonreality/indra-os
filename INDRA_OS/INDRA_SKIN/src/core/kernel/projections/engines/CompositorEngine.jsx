import React, { useState, useEffect } from 'react';
import { useAxiomaticStore } from '../../../1_Axiomatic_Store/AxiomaticStore.jsx';
import { useSignifier } from '../../hooks/useSignifier.js';
import { Icons } from "../../../../4_Atoms/AxiomIcons.jsx";
import NodeEngine from './NodeEngine.jsx';
import SchemaFormEngine from './SchemaFormEngine.jsx';

/**
 * SlotEngine: El Constructor de Realidad (Axiomatic V1.0)
 * DHARMA: Actuar como un portal polimórfico entre el Grafo y el Dashboard.
 * AXIOMA: "El foco no es una app, es una estación de trabajo del grafo."
 */
import { resolveIcon } from '../VisualHydrator.js';

const SlotEngine = ({ data, perspective }) => {
    const { state, execute } = useAxiomaticStore();
    const id = data.id;
    const label = data.label || data.LABEL;
    const archetype = data.archetype || data.ARCHETYPE;

    // Si estamos en modo NODO (dentro del Grafo), nos comportamos como un nodo normal
    if (perspective === 'NODE') {
        return <NodeEngine data={{ ...data, label: `[SLOT] ${label} ` }} />;
    }

    const [selectedProperty, setSelectedProperty] = useState(null);

    // AXIOMA: Detección de Vínculos Sinápticos (Soberanía de Red)
    // Agnosticism: Cualquier conexión entrante es un origen de datos potencial
    const incomingConnection = (state.phenotype.relationships || []).find(r => r.target === id && !r._isDeleted);
    const sourceNode = incomingConnection ? state.phenotype.artifacts[incomingConnection.source] : null;

    // AXIOMA: Las vistas se resuelven del ADN del nodo, con fallback a vistas estándar
    const liveData = data._currentProjection || data.payload || null;

    const standardViews = [
        { id: 'v1', label: 'Dashboard', type: 'DASHBOARD' },
        ...(liveData ? [{ id: 'live', label: 'Live Projection', type: 'GRID' }] : [])
    ];
    const views = data.views || standardViews;

    // Auto-seleccionar vista Live si llega materia nueva
    const [activeViewId, setActiveViewId] = useState(liveData ? 'live' : 'v1');

    // Sincronizar vista si liveData cambia y estamos en v1
    useEffect(() => {
        if (liveData && activeViewId === 'v1') setActiveViewId('live');
    }, [liveData]);

    const activeView = views.find(v => v.id === activeViewId) || views[0] || { id: 'v1', type: 'DASHBOARD' };

    // DEFINICIÓN DE PROPIEDADES DINÁMICAS (Puertos de Borde)
    const rawCapabilities = data.CAPABILITIES || data.capabilities || {};
    const capabilities = (Object.keys(rawCapabilities).length === 0 && data._isGhost) ? {
        "CORE_SYMBOLS": { "label": "Símbolos Core", "icon": "TV_SCREEN", "status": "CONNECTED", "value": "ACTIVE" },
        "HYDRATION": { "label": "Hidratación", "icon": "SYNC", "status": "DEFAULT", "value": "100%" },
        "DETERMINISM": { "label": "Determinismo", "icon": "LOCK", "status": "CONNECTED", "value": "TRUE" },
        "LATENCY": { "label": "Latencia", "icon": "CLOCK", "status": "DEFAULT", "value": "12ms" }
    } : rawCapabilities;

    const properties = Object.keys(capabilities).length > 0
        ? Object.entries(capabilities).map(([key, config]) => ({
            id: key,
            label: config.label || key,
            icon: resolveIcon(config.icon),
            status: config.status || 'DEFAULT',
            value: config.value || 'None'
        }))
        : [
            { id: 'bg_color', label: 'Color de Fondo', icon: <span className="text-lg">🎨</span>, status: 'DEFAULT', value: '#0a0a0a' },
            { id: 'main_font', label: 'Tipografía', icon: <span className="text-lg">Aa</span>, status: 'CONNECTED', value: 'Inter' },
            {
                id: 'data_source',
                label: 'Origen de Datos',
                icon: <span className="text-lg transition-transform hover:scale-125">📡</span>,
                status: sourceNode ? 'CONNECTED' : 'BROKEN',
                value: sourceNode ? (sourceNode.label || sourceNode.LABEL || sourceNode.id) : 'None'
            },
            { id: 'margin', label: 'Márgenes', icon: <span className="text-lg">📐</span>, status: 'DEFAULT', value: '20px' }
        ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONNECTED': return 'var(--accent)';
            case 'BROKEN': return 'var(--error)';
            default: return 'var(--text-dim)';
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-deep)] overflow-hidden relative">

            {/* HEADER SOBERANO */}
            <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-8 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                        <Icons.Transform size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white/90 leading-none">{label}</h2>
                        <span className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest opacity-60">Composite_Node_Active</span>
                    </div>
                </div>

                <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                    {views.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setActiveViewId(v.id)}
                            className={`px - 4 py - 2 rounded - lg text - [10px] font - black uppercase tracking - widest transition - all ${activeViewId === v.id ? 'bg-[var(--accent)] text-black' : 'text-white/40 hover:text-white/60'
                                } `}
                        >
                            {v.label}
                        </button>
                    ))}
                </nav>

                <button
                    onClick={() => execute('EXIT_FOCUS')}
                    className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] hover:bg-[var(--error)]/20 transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-tighter">Exit_Slot</span>
                    <Icons.Close size={16} className="group-hover:rotate-90 transition-transform" />
                </button>
            </header>

            <div className="flex-1 flex relative">

                {/* PUERTOS DE BORDE (LADO IZQUIERDO: INPUTS/PROPIEDADES) */}
                <aside className="w-72 border-r border-[var(--border-subtle)] bg-[var(--surface-header)] flex flex-col p-4 gap-2 z-40">
                    <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em] mb-4 pl-2">Propiedades_Input</span>
                    {properties.map(prop => (
                        <div
                            key={prop.id}
                            onClick={() => setSelectedProperty(prop.id)}
                            className={`flex items - center gap - 4 p - 3 rounded - 2xl border transition - all cursor - pointer group ${selectedProperty === prop.id
                                    ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/5'
                                    : 'bg-white/2 bg-transparent border-transparent hover:border-white/10'
                                } `}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-[var(--surface-card)] flex items-center justify-center text-lg border border-[var(--border-subtle)] group-hover:border-[var(--accent)]/30 transition-all">
                                    {typeof prop.icon === 'function'
                                        ? React.createElement(prop.icon, { size: 20 })
                                        : prop.icon}
                                </div>
                                {/* Signifier Universal */}
                                <div
                                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--bg-deep)] shadow-sm animate-pulse"
                                    style={{ backgroundColor: getStatusColor(prop.status) }}
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={`text - [10px] font - bold uppercase tracking - tight transition - colors ${selectedProperty === prop.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                                    } `}>
                                    {prop.label}
                                </span>
                                <span className="text-[9px] font-mono text-[var(--text-dim)] truncate italic">
                                    {prop.status === 'CONNECTED' ? 'Linked_to_Graph' : `Default: ${prop.value} `}
                                </span>
                            </div>
                        </div>
                    ))}

                    <div className="mt-auto p-4 rounded-2xl bg-[var(--surface-header)] border border-[var(--border-subtle)]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                            <span className="text-[9px] font-black text-[var(--text-dim)] uppercase">Static_Analysis</span>
                        </div>
                        <p className="text-[8px] text-[var(--text-dim)] leading-relaxed font-medium">
                            Este slot está recibiendo datos de [Notion_DB] y aplicando leyes de estilo corporativo L1.
                        </p>
                    </div>
                </aside>

                {/* AREA DE RENDERIZADO (EL LIENZO) */}
                <main className="flex-1 relative overflow-hidden flex bg-[#030303]">
                    {/* Grid de precisión sutil */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                    />

                    <div className="flex-1 flex items-center justify-center p-12 overflow-auto scrollbar-hide">
                        {activeView.type === 'GRID' && liveData ? (
                            <div className="w-full h-full p-8 animate-in fade-in duration-500 overflow-auto">
                                <div className="max-w-5xl mx-auto space-y-6">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <h3 className="text-xl font-bold text-[var(--accent)] uppercase tracking-widest">Live_Projection_Grid</h3>
                                        <span className="text-[10px] font-mono text-white/30">{liveData.length} Fragments Received</span>
                                    </div>
                                    <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5">
                                                    {Object.keys(liveData[0] || {}).filter(k => !k.startsWith('_')).map(k => (
                                                        <th key={k} className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">{k}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {liveData.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-white/[0.02]">
                                                        {Object.entries(row).filter(([k]) => !k.startsWith('_')).map(([k, v], j) => (
                                                            <td key={j} className="px-6 py-4 text-xs font-medium text-white/70">
                                                                {typeof v === 'object' ? JSON.stringify(v).slice(0, 30) : String(v)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : activeView.type === 'DOCUMENT_PAGINATED' ? (
                            <div className="w-[794px] min-h-[1123px] bg-white text-black shadow-2xl rounded-sm p-16 animate-in zoom-in-95 duration-700 origin-top transform hover:scale-[1.02] transition-transform">
                                <div className="flex justify-between items-end border-b-4 border-black pb-8 mb-12">
                                    <div>
                                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{activeView.label}</h1>
                                        <span className="text-sm font-mono tracking-widest block opacity-60">REF: {id ? id.slice(0, 8) : 'ANON-00'}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold uppercase mb-1">Status Report</div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <span className="font-mono text-xs">CERTIFIED</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-12 mb-16">
                                    <div className="space-y-4">
                                        <div className="h-4 bg-black/5 rounded w-full animate-pulse" />
                                        <div className="h-4 bg-black/5 rounded w-5/6" />
                                        <div className="h-4 bg-black/5 rounded w-4/6" />
                                    </div>
                                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                                        <h3 className="text-xs font-bold uppercase mb-4">Metric Analysis</h3>
                                        <div className="space-y-2">
                                            {properties.slice(0, 3).map(p => (
                                                <div key={p.id} className="flex justify-between items-center text-xs">
                                                    <span className="font-mono text-gray-500">{p.label}</span>
                                                    <span className="font-bold">{p.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-64 bg-black/5 rounded-none border border-black/10 flex flex-col items-center justify-center gap-4">
                                    <Icons.Database size={32} className="opacity-20" />
                                    <span className="font-mono text-xs text-black/40 uppercase tracking-widest">Data_Fragment_Visualization_Area</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-6xl grid grid-cols-12 gap-6 h-fit p-4">
                                {properties.map((prop, i) => (
                                    <div
                                        key={prop.id}
                                        onClick={() => setSelectedProperty(prop.id)}
                                        className={`
col - span - 12 md: col - span - 6 lg: col - span - 4 p - 6 rounded - [32px]
bg - white / 5 border border - white / 10 backdrop - blur - xl
hover: border - [var(--accent)]/40 hover:bg-white/10 transition - all cursor - pointer group / tile
animate -in fade -in slide -in -from - bottom duration - 500
                                            relative overflow - hidden
    `}
                                        style={{ animationDelay: `${i * 100} ms` }}
                                    >
                                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover/tile:opacity-100 transition-opacity">
                                            <Icons.ArrowRight size={16} className="text-[var(--accent)] -rotate-45" />
                                        </div>

                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-card)] flex items-center justify-center text-2xl border border-[var(--border-subtle)] group-hover/tile:scale-110 transition-transform shadow-lg shadow-black/20">
                                                {typeof prop.icon === 'function'
                                                    ? React.createElement(prop.icon, { size: 24 })
                                                    : prop.icon}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1">State_Signal</span>
                                                <div className="flex items-center gap-2 bg-[var(--surface-header)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
                                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor(prop.status) }} />
                                                    <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase">{prop.status}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight mb-1 group-hover/tile:text-[var(--accent)] transition-colors">{prop.label}</h4>
                                        <p className="text-[10px] text-[var(--text-dim)] font-mono mb-6 truncate">{prop.id.toUpperCase()}_module_v1.0</p>

                                        <div className="h-24 bg-[var(--surface-header)] rounded-2xl border border-[var(--border-subtle)] flex items-end p-1 gap-[2px] overflow-hidden relative">
                                            <div className="absolute top-2 left-2 text-[8px] font-mono text-white/20">Telemetry_Graph</div>
                                            {/* Visualización de pulso sintético */}
                                            {[...Array(24)].map((_, j) => (
                                                <div
                                                    key={j}
                                                    className="flex-1 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/40 rounded-t-[1px] transition-all duration-300"
                                                    style={{ height: `${20 + Math.random() * 60}% ` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Capability Tile */}
                                <div className="col-span-12 md:col-span-6 lg:col-span-4 p-6 rounded-[32px] border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-header)] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer h-[280px]">
                                    <div className="w-12 h-12 rounded-full bg-[var(--surface-card)] flex items-center justify-center text-[var(--text-dim)] group-hover:bg-[var(--accent)] group-hover:text-black transition-all">
                                        <Icons.Plus size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-[var(--text-dim)] group-hover:text-[var(--text-secondary)] uppercase tracking-widest transition-colors">Añadir Capacidad</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* INSPECTOR DE HERRAMIENTA NATURAL (Emerge cuando se selecciona una propiedad) */}
                    {selectedProperty && (
                        <aside className="w-80 border-l border-[var(--border-subtle)] bg-[var(--surface-header)] backdrop-blur-xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest">Ajustes_Locales</h3>
                                <button onClick={() => setSelectedProperty(null)} className="text-[var(--text-dim)] hover:text-[var(--text-secondary)]">
                                    <Icons.Close size={18} />
                                </button>
                            </div>

                            <div className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col gap-4">
                                <span className="text-[10px] font-bold text-[var(--accent)] uppercase">Configuración de {selectedProperty}</span>

                                {selectedProperty === 'db_id' && LABEL.toUpperCase().includes('NOTION') ? (
                                    <div className="space-y-4">
                                        <p className="text-[9px] text-[var(--text-dim)] leading-relaxed uppercase font-black">Paso 1: Pega tu Database ID de Notion</p>
                                        <input
                                            type="text"
                                            placeholder="8f92-xxxx-xxxx-xxxx"
                                            className="w-full h-10 rounded-lg bg-[var(--surface-header)] border border-[var(--accent)]/30 px-3 text-[10px] font-mono text-[var(--accent)] outline-none"
                                        />
                                        <button
                                            className="w-full py-2 rounded-lg bg-[var(--accent)] text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                            onClick={() => execute('LOG_ENTRY', { msg: '📡 Sincronizando tabla de Notion...', type: 'INFO' })}
                                        >
                                            Vincular Tabla
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div
                                            id={`prop - value - ${selectedProperty} `}
                                            className="flex-1 h-10 rounded-lg bg-[var(--surface-header)] border border-[var(--border-subtle)] flex items-center px-4 text-xs font-mono text-[var(--text-primary)] transition-all duration-500"
                                        >
                                            {properties.find(p => p.id === selectedProperty)?.value}
                                        </div>
                                        <button className="p-3 rounded-lg bg-[var(--accent)] text-black hover:scale-105 transition-transform">
                                            <Icons.Check size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.opacity = '1'; }}
                                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.opacity = '0.3'; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    e.currentTarget.style.opacity = '0.3';
                                    const raw = e.dataTransfer.getData('axiom/artifact');
                                    if (raw) {
                                        try {
                                            const artifact = JSON.parse(raw);
                                            execute('LOG_ENTRY', { msg: `🔗 Vinculación Axiomática: [${selectedProperty}] -> [${artifact.LABEL || artifact.name}]`, type: 'SUCCESS' });
                                            execute('LINK_SLOT_PROPERTY', { slotId: id, propertyId: selectedProperty, targetArtifact: artifact });

                                            // Optimistic UI Update (Feedback Inmediato)
                                            const propLabel = document.getElementById(`prop - value - ${selectedProperty} `);
                                            if (propLabel) {
                                                propLabel.innerText = `Linked: ${artifact.LABEL || artifact.name} `;
                                                propLabel.style.color = 'var(--accent)';
                                                propLabel.style.fontWeight = 'bold';
                                            }
                                        } catch (err) {
                                            console.error("Arthas Drop Error", err);
                                        }
                                    }
                                }}
                                className="flex-1 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 gap-4 opacity-30 transition-all duration-300"
                            >
                                <Icons.Connect size={24} className="animate-pulse" />
                                <p className="text-[9px] text-center font-medium leading-relaxed pointer-events-none">
                                    Arrastra un nodo del Grafo hasta este panel para <strong className="text-[var(--accent)]">Vincular</strong> esta propiedad globalmente.
                                </p>
                            </div>
                        </aside>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SlotEngine;




