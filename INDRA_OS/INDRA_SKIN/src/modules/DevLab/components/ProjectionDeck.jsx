import React from 'react';
import { useAxiomaticStore } from '../../../core/state/AxiomaticStore';
import ProjectionMatrix from '../../../core/kernel/ProjectionMatrix';

/**
 * ProjectionDeck
 * DHARMA: Plataforma de Proyección de Realidad.
 * Responsabilidad: Renderizar el artefacto seleccionado dentro de un contenedor controlado.
 */
const ProjectionDeck = ({ componentId, data, perspective, isTesting }) => {
    const { state } = useAxiomaticStore();

    // 1. Resolución de Datos Vivos (Phenotype Lookup)
    // Buscamos si el artefacto ya existe en la memoria activa o usamos la data inyectada
    const liveArtifact = data || state.phenotype.artifacts?.find(a => a.id === componentId);

    // 2. Construcción del Paylaod
    const renderData = liveArtifact || { id: componentId };

    return (
        <div
            className={`absolute inset-0 z-0 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] 
            ${isTesting ? 'scale-[0.98] opacity-60 blur-[2px] grayscale-[0.3]' : 'scale-100 opacity-100'}`}
        >
            {/* AMBIENTE DE LABORATORIO (Diagnostic Screen) */}
            <div className="w-full h-full flex items-center justify-center p-6 md:p-12 lg:p-20 bg-[radial-gradient(circle_at_center,_var(--bg-secondary)_0%,_transparent_70%)] opacity-30 pointer-events-none"></div>

            <div className="absolute inset-0 flex items-center justify-center p-8 md:p-14 lg:p-24 overflow-hidden">
                {/* MARCO DEL TELEVISOR (Sovereign Chassis) */}
                <div className="w-full h-full max-w-[1800px] max-h-[1000px] flex flex-col relative group/deck">

                    {/* INDICADORES TÉCNICOS DE ESQUINA */}
                    <div className="absolute -top-6 -left-2 flex flex-col gap-1 z-20 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--accent)]"></div>
                            <span className="text-[8px] font-black text-[var(--accent)] uppercase tracking-[0.3em]">Televisor_Ready</span>
                        </div>
                        <div className="h-[1px] w-20 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-30"></div>
                    </div>

                    <div className="absolute -top-6 -right-2 flex flex-col items-end gap-1 z-20">
                        <span className="text-[7px] font-mono text-white/30 uppercase">Perspective: {perspective}</span>
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => <div key={i} className="w-3 h-0.5 bg-white/10"></div>)}
                        </div>
                    </div>

                    {/* EL LIENZO (The Glass Screen) */}
                    <div className={`
                        flex-1 glass rounded-[3rem] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.8)] 
                        relative flex flex-col overflow-hidden transition-all duration-700
                        ${isTesting ? 'border-orange-500/30 ring-1 ring-orange-500/10' : 'hover:border-white/10'}
                    `}>
                        {/* Escaneo de Interferencia (Grid Técnico) */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                            style={{ backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                        </div>

                        {/* PROYECTOR AXIOMÁTICO (El Corazón del Lab) */}
                        <div className="flex-1 relative overflow-hidden">
                            <ProjectionMatrix
                                componentId={componentId}
                                data={renderData}
                                perspective={perspective}
                            />
                        </div>

                        {/* Barra de Estado del Televisor */}
                        <div className="h-8 bg-black/40 border-t border-white/5 backdrop-blur-md flex items-center justify-between px-10">
                            <div className="flex items-center gap-4">
                                <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">Target_ID: {componentId}</span>
                                <div className="w-1 h-3 bg-white/5 rounded-full"></div>
                                <span className="text-[7px] font-black text-[var(--accent)]/40 uppercase tracking-tighter">Diagnostic_Affinities: NOMINAL</span>
                            </div>
                            <div className="flex gap-2 opacity-20 group-hover/deck:opacity-60 transition-opacity">
                                <div className="w-2 h-2 rounded-full border border-white/40"></div>
                                <div className="w-2 h-2 rounded-full border border-white/40"></div>
                            </div>
                        </div>
                    </div>

                    {/* Sombras Proyectadas (Profundidad) */}
                    <div className="absolute -inset-10 bg-[var(--accent)]/5 blur-[100px] rounded-full opacity-20 pointer-events-none -z-10 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

export default ProjectionDeck;



