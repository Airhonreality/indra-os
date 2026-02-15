import React, { useState } from 'react';
import Icons from '../../../../4_Atoms/IndraIcons';

/**
 * BridgeChassis
 * DHARMA: El Bastidor Universal para Vistas de Puente (v8.0).
 * Proporciona la estructura espacial: Sidebar de Inspección + Canvas de Contenido.
 */
const BridgeChassis = ({ title, domain, data, inspectorPanel, children, slotId }) => {
    const [isInspectorOpen, setIsInspectorOpen] = useState(false); // AXIOMA: Cerrado por defecto en espacios densos

    return (
        <div className="w-full h-full flex flex-row overflow-hidden relative bg-[var(--bg-deep)]">

            {/* LADO A: EL LIENZO (CONTENIDO PRINCIPAL) */}
            <main className="flex-1 h-full relative overflow-hidden flex flex-col min-w-0">
                {/* Header Interno del Chasis */}
                <header className="h-14 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-[var(--surface-header)] backdrop-blur-md z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse"></div>
                        <div className="flex flex-col">
                            <h2 className="text-[10px] font-black tracking-[0.2em] text-[var(--text-primary)] uppercase truncate max-w-[150px]">{title}</h2>
                            <span className="text-[7px] font-mono text-[var(--text-dim)] uppercase tracking-widest">{domain}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                            className={`p-1.5 rounded-lg transition-all ${isInspectorOpen ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-header)]'}`}
                            title="Toggle Inspector"
                        >
                            <Icons.SidebarRight size={14} />
                        </button>
                    </div>
                </header>

                {/* Área de Trabajo */}
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </main>

            {/* LADO B: EL INSPECTOR (DERECHA) */}
            <aside
                className={`
                    border-[var(--border-color)] bg-[var(--bg-secondary)] backdrop-blur-3xl transition-all duration-500 ease-out flex flex-col overflow-hidden
                    ${isInspectorOpen ? 'w-[320px] h-full border-l' : 'w-0 h-full border-l-0'}
                `}
                style={{ zIndex: 30 }}
            >
                <div className="w-[320px] h-full flex flex-col">
                    <header className="h-12 border-b border-[var(--border-subtle)] flex items-center px-6 shrink-0 justify-between bg-[var(--surface-header)]">
                        <span className="text-[8px] font-black tracking-[0.3em] text-[var(--accent)] uppercase opacity-60">Intelligence_Unit</span>
                        <button onClick={() => setIsInspectorOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-header)] transition-colors">
                            <Icons.Close size={12} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                        {inspectorPanel}
                    </div>

                    <footer className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-header)]">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[7px] font-mono text-[var(--text-dim)] uppercase">
                                <span>Artifact_ID:</span>
                                <span className="text-[var(--accent)]">{data?.id?.slice(0, 8)}...</span>
                            </div>
                        </div>
                    </footer>
                </div>
            </aside>

            {/* Overlay sutil de ruido/textura */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}></div>
        </div>
    );
};

export default BridgeChassis;



