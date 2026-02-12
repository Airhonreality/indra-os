import React, { useState } from 'react';
import { useAxiomaticStore } from '../../../state/AxiomaticStore';
import { useSignifier } from '../../hooks/useSignifier';
import { Icons } from "../../../../4_Atoms/IndraIcons";
import NodeEngine from './NodeEngine';

/**
 * SlotEngine: El Constructor de Realidad (Axiomatic V1.0)
 * DHARMA: Actuar como un portal polimórfico entre el Grafo y el Dashboard.
 * AXIOMA: "El foco no es una app, es una estación de trabajo del grafo."
 */
const SlotEngine = ({ data, perspective }) => {
    const { state, execute } = useAxiomaticStore();
    const { id, LABEL, ARCHETYPE } = data;

    const [activeViewId, setActiveViewId] = useState(data.views?.[0]?.id || 'v1');
    const [selectedProperty, setSelectedProperty] = useState(null);

    // Si estamos en modo NODO (dentro del Grafo), nos comportamos como un nodo normal
    if (perspective === 'NODE') {
        return <NodeEngine data={{ ...data, LABEL: `[SLOT] ${LABEL}` }} />;
    }

    // MODO FOCO (Inmersión)
    // AXIOMA: Las vistas se resuelven del ADN del nodo, con fallback a vistas estándar
    const views = data.views || [
        { id: 'v1', label: 'Tablero de Control', type: 'DASHBOARD' },
        { id: 'v2', label: 'Documento Técnico', type: 'DOCUMENT_PAGINATED' }
    ];
    const activeView = views.find(v => v.id === activeViewId) || views[0];

    // DEFINICIÓN DE PROPIEDADES DINÁMICAS (Puertos de Borde)
    // AXIOMA: Si el nodo trae CAPABILITIES, las usamos como propiedades primarias
    const capabilities = data.CAPABILITIES || {};
    const hasCapabilities = Object.keys(capabilities).length > 0;

    const properties = hasCapabilities
        ? Object.entries(capabilities).map(([key, config]) => ({
            id: key,
            label: config.label || key,
            icon: config.icon || '⚡',
            status: config.status || 'DEFAULT',
            value: config.value || 'None'
        }))
        : (ARCHETYPE?.includes('ADAPTER') ? [
            { id: 'api_token', label: 'Token de Acceso', icon: '🔑', status: 'CONNECTED', value: '••••••••' },
            { id: 'db_id', label: 'Database ID', icon: '🆔', status: 'BROKEN', value: 'None' },
            { id: 'sync_interval', label: 'Refresco (s)', icon: '⏱️', status: 'DEFAULT', value: '60' },
            { id: 'data_status', label: 'Estado Sync', icon: '📡', status: 'CONNECTED', value: 'VIVO' }
        ] : [
            { id: 'bg_color', label: 'Color de Fondo', icon: '🎨', status: 'DEFAULT', value: '#0a0a0a' },
            { id: 'main_font', label: 'Tipografía', icon: 'Aa', status: 'CONNECTED', value: 'Inter' },
            { id: 'data_source', label: 'Origen de Datos', icon: '📡', status: 'BROKEN', value: 'None' },
            { id: 'margin', label: 'Márgenes', icon: '📐', status: 'DEFAULT', value: '20px' }
        ]);

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
                        <h2 className="text-lg font-bold text-white/90 leading-none">{LABEL}</h2>
                        <span className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest opacity-60">Composite_Node_Active</span>
                    </div>
                </div>

                <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                    {views.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setActiveViewId(v.id)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === v.id ? 'bg-[var(--accent)] text-black' : 'text-white/40 hover:text-white/60'
                                }`}
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
                <aside className="w-72 border-r border-white/5 bg-black/20 flex flex-col p-4 gap-2 z-40">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 pl-2">Propiedades_Input</span>
                    {properties.map(prop => (
                        <div
                            key={prop.id}
                            onClick={() => setSelectedProperty(prop.id)}
                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer group ${selectedProperty === prop.id
                                ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/5'
                                : 'bg-white/2 bg-transparent border-transparent hover:border-white/10'
                                }`}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-lg border border-white/5 group-hover:border-[var(--accent)]/30 transition-all">
                                    {prop.icon}
                                </div>
                                {/* Signifier Universal */}
                                <div
                                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--bg-deep)] shadow-sm animate-pulse"
                                    style={{ backgroundColor: getStatusColor(prop.status) }}
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${selectedProperty === prop.id ? 'text-[var(--accent)]' : 'text-white/60'
                                    }`}>
                                    {prop.label}
                                </span>
                                <span className="text-[9px] font-mono text-white/20 truncate italic">
                                    {prop.status === 'CONNECTED' ? 'Linked_to_Graph' : `Default: ${prop.value}`}
                                </span>
                            </div>
                        </div>
                    ))}

                    <div className="mt-auto p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                            <span className="text-[9px] font-black text-white/40 uppercase">Static_Analysis</span>
                        </div>
                        <p className="text-[8px] text-white/30 leading-relaxed font-medium">
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
                        {activeView.type === 'DOCUMENT_PAGINATED' ? (
                            <div className="w-[794px] min-h-[1123px] bg-white text-black shadow-2xl rounded-sm p-20 animate-in zoom-in-95 duration-700 origin-top">
                                <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">{activeView.label}</h1>
                                <div className="h-1 bg-black w-32 mb-12" />
                                <div className="space-y-8 opacity-20">
                                    <div className="h-4 bg-black rounded-full w-full" />
                                    <div className="h-4 bg-black rounded-full w-3/4" />
                                    <div className="h-32 bg-black/5 rounded-2xl border-2 border-dashed border-black/10 flex items-center justify-center font-bold">FRAGMENTO_DE_DATOS</div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-5xl grid grid-cols-12 gap-8 h-fit">
                                <div className="col-span-12 p-12 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl">
                                    <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.4em] mb-6 block">Visualización_Infinitia</span>
                                    <div className="h-64 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Icons.Search size={32} />
                                            <span className="text-xs font-mono uppercase">Esperando_Carga_de_Datos...</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-4 h-48 rounded-[30px] bg-white/5 border border-white/5"></div>
                                <div className="col-span-4 h-48 rounded-[30px] bg-white/5 border border-white/5"></div>
                                <div className="col-span-4 h-48 rounded-[30px] bg-white/5 border border-white/5"></div>
                            </div>
                        )}
                    </div>

                    {/* INSPECTOR DE HERRAMIENTA NATURAL (Emerge cuando se selecciona una propiedad) */}
                    {selectedProperty && (
                        <aside className="w-80 border-l border-white/5 bg-black/40 backdrop-blur-xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Ajustes_Locales</h3>
                                <button onClick={() => setSelectedProperty(null)} className="text-white/20 hover:text-white/60">
                                    <Icons.Close size={18} />
                                </button>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
                                <span className="text-[10px] font-bold text-[var(--accent)] uppercase">Configuración de {selectedProperty}</span>

                                {selectedProperty === 'db_id' && LABEL.toUpperCase().includes('NOTION') ? (
                                    <div className="space-y-4">
                                        <p className="text-[9px] text-white/40 leading-relaxed uppercase font-black">Paso 1: Pega tu Database ID de Notion</p>
                                        <input
                                            type="text"
                                            placeholder="8f92-xxxx-xxxx-xxxx"
                                            className="w-full h-10 rounded-lg bg-black/60 border border-[var(--accent)]/30 px-3 text-[10px] font-mono text-[var(--accent)] outline-none"
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
                                        <div className="flex-1 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center px-4 text-xs font-mono text-white/80">
                                            {properties.find(p => p.id === selectedProperty)?.value}
                                        </div>
                                        <button className="p-3 rounded-lg bg-[var(--accent)] text-black">
                                            <Icons.Check size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 gap-4 opacity-30">
                                <Icons.Connect size={24} />
                                <p className="text-[9px] text-center font-medium leading-relaxed">
                                    Arrastra un nodo del Grafo hasta este panel para **Vincular** esta propiedad globalmente.
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
