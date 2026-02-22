import React, { useEffect, useState } from 'react';
import { useAxiomaticStore } from '../../core/1_Axiomatic_Store/AxiomaticStore.jsx';
import { useSignifier } from '../../core/kernel/hooks/useSignifier.js';
import AxiomaticSpinner from '../../4_Atoms/AxiomaticSpinner.jsx';

/**
 * Axiomatic_Splash_Screen
 * 
 * Pantalla de carga mínima y reemplazable de AXIOM OS.
 * Dharma: Mantener la calma durante la transición de la realidad.
 */
const AxiomaticSplashScreen = ({ onComplete }) => {
    const { state } = useAxiomaticStore();
    // Usamos el nodeId 'system' para la carga global
    const { progress, label, color: signifierColor, iskResonance } = useSignifier('system');
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (progress >= 100 && state.sovereignty.status !== 'STANDBY') {
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onComplete) onComplete();
            }, 1000); // Pequeño delay para suavidad
            return () => clearTimeout(timer);
        }
    }, [progress, state.sovereignty.status]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center transition-opacity duration-1000">
            {/* 1. Fondo Orgánico (ISK Lattice) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--accent)_0%,_transparent_70%)]"
                    style={{
                        transform: `scale(${1 + (iskResonance || 0) * 0.1})`,
                        opacity: 0.1 + (iskResonance || 0) * 0.2
                    }}
                ></div>
            </div>

            {/* 2. Contenido Central (Unificado) */}
            <div className="relative z-10 flex flex-col items-center gap-12">
                <AxiomaticSpinner
                    size={120}
                    label={label || 'Initialising_Reality'}
                />

                {/* BARRA DE PROGRESO AXOMÁTICA */}
                <div className="w-64">
                    <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--accent)] transition-all duration-500"
                            style={{
                                width: `${progress}%`,
                                boxShadow: `0 0 10px var(--accent)`
                            }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-2 font-mono text-[9px] text-[var(--text-dim)] opacity-50">
                        <span>{progress}%</span>
                        <span>v5.5.0-Axiom</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AxiomaticSplashScreen;




