/**
 * AxiomaticLoadingOverlay.jsx
 * ELEMENT: Velo de Resonancia.
 * DHARMA: Cubrir la transición entre planos de realidad con elegancia técnica.
 */

import React from 'react';
import useAxiomaticState from '../../core/1_Axiomatic_Store/AxiomaticState.js';
import AxiomaticSpinner from '../../4_Atoms/AxiomaticSpinner.jsx';

const AxiomaticLoadingOverlay = () => {
    const isLoading = useAxiomaticState(s => s.session?.isLoading);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-700">
            {/* Capa de Difracción Óptica */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_90%)] opacity-80"></div>

            <div className="relative z-10">
                <AxiomaticSpinner
                    size={96}
                    label="Sintonizando Realidad"
                />
            </div>

            {/* Micro-Texto de Diagnóstico */}
            <div className="absolute bottom-12 text-[8px] font-mono text-white/20 uppercase tracking-[1em] animate-pulse">
                Quantum_Resonance_Active // Sincronizando_Axiom_Core
            </div>
        </div>
    );
};

export default AxiomaticLoadingOverlay;

