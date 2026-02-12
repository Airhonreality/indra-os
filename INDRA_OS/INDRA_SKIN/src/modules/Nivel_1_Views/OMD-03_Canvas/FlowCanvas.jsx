import React from 'react';
import { useAxiomaticSense } from '../../../core/ui/hooks/useAxiomaticSense';
import { AxiomaticGroup } from '../../../core/ui/AxiomaticTransmuter';

/**
 * OMD-03: FLOW_CANVAS (Lienzo Maestro)
 * DHARMA: Manifestación pura de la orquestación de flujos.
 */
const FlowCanvas = ({ law }) => {
    // Escuchamos la ley estructural inyectada
    const { data: subModules, isLoading } = useAxiomaticSense(law);

    return (
        <div id="omd-03-canvas" className="w-full h-full flex flex-col bg-[#050508] relative overflow-hidden group">
            {/* Overlay de Resonancia (Carga) */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-500">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-2 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-primary animate-pulse">Resonating</span>
                    </div>
                </div>
            )}

            {/* Capas de Orquestación (Flex Layout) */}
            <div className="flex-1 flex gap-px p-1 bg-white/[0.02]">
                {subModules.map((sub, idx) => (
                    <div key={sub.id || idx} className="flex-1 flex flex-col bg-black/40 border border-white/[0.03] hover:border-accent-primary/20 transition-colors overflow-hidden">
                        <AxiomaticGroup
                            entity={sub}
                            config={{ layout_mode: 'FLOW_V' }}
                        />
                    </div>
                ))}
            </div>

            {/* HUD Flotante (Placeholder para herramientas de diseño) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 p-4 bg-black/60 backdrop-blur-xl border border-white/5 rounded-full opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white/20">＋</div>
                <div className="w-24 h-8 rounded-full bg-white/5 border border-white/10"></div>
                <div className="w-8 h-8 rounded-full bg-accent-primary/20 border border-accent-primary/20"></div>
            </div>
        </div>
    );
};

export default FlowCanvas;
