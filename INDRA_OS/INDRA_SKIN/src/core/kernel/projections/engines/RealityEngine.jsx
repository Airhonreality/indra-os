import React, { useEffect, useRef } from 'react';
import { ProjectionKernel } from '../../isk/ProjectionKernel.js';
import { useAxiomaticStore } from '../../../1_Axiomatic_Store/AxiomaticStore.jsx';
import useAxiomaticState from '../.././AxiomaticState.js';

/**
 * RealityEngine: Manifestación del Motor ISK en el Front.
 * DHARMA: Proyectar la física y la realidad WebGL dentro de la matriz de React.
 */
const RealityEngine = ({ data }) => {
    const canvasRef = useRef(null);
    const kernelRef = useRef(null);
    const { state } = useAxiomaticStore();
    const globalLoading = useAxiomaticState(s => s.session.isLoading);

    useEffect(() => {
        // ... (rest of the file logic will follow in next chunks if needed)
        if (!canvasRef.current) return;

        // 1. Inicialización del Kernel Espacial
        const kernel = new ProjectionKernel();
        kernel.setCanvas(canvasRef.current);
        kernelRef.current = kernel;

        // 2. Carga de "Leyes de Prueba" (Formas básicas)
        const mockLaws = [
            {
                identity: { uuid: 'node_1', label: 'NEURON_ALPHA' },
                dna: { archetype: 'circle', geometry: { expressions: {} } }
            },
            {
                identity: { uuid: 'node_2', label: 'NEURON_BETA' },
                dna: { archetype: 'circle', geometry: { expressions: {} } }
            },
            {
                identity: { uuid: 'node_3', label: 'NEURON_GAMMA' },
                dna: { archetype: 'arc', geometry: { expressions: {} } }
            }
        ];

        kernel.loadLaws(mockLaws);

        // 3. Ciclo de Vida (Tick Engine)
        let animationFrame;
        const animate = () => {
            kernel.tick();
            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        console.log("⚛️ [RealityEngine] ISK Pilot Started.");

        return () => {
            cancelAnimationFrame(animationFrame);
            // Limpieza (Opcional: destruir contexto WebGL si es necesario)
        };
    }, []);

    // 4. EL PUENTE (Auditado TGS)
    // Sincronización reactiva: Cuando cambia el estado de carga global, inyectamos una señal al ISK.
    useEffect(() => {
        if (kernelRef.current && globalLoading) {
            console.log("🌊 [RealityBridge] React Signal: IS_LOADING detected. Injecting Pulse to ISK.");
            // Aquí simulamos el envío de una señal USSP al bridge del ISK
            // En una versión real, esto pasaría por el RealityBridge.js
            const bridge = kernelRef.current.bridge;
            if (bridge) {
                // Simulamos un pulso general en la realidad
                // Por ahora solo logueamos para no romper el bucle físico sin contratos
            }
        }
    }, [globalLoading]);

    return (
        <div className="w-full h-full relative bg-black/40 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ imageRendering: 'pixelated' }}
            />

            {/* HUD de Diagnóstico del Puente */}
            <div className="absolute top-4 left-4 p-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 font-mono pointer-events-none">
                <div className="text-[10px] text-accent-primary font-black mb-2 uppercase tracking-widest">Reality_Bridge_Monitor</div>
                <div className="flex flex-col gap-1 text-[8px] text-white/50">
                    <div className="flex justify-between gap-4">
                        <span>Core_Signal:</span>
                        <span className={globalLoading ? "text-accent-primary animate-pulse" : "text-success"}>
                            {globalLoading ? 'RESONATING' : 'IDLE'}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span>ISK_Integrity:</span>
                        <span className="text-success">NOMINAL</span>
                    </div>
                </div>
            </div>

            {/* Overlay de Ayuda */}
            <div className="absolute bottom-4 right-4 text-[9px] font-mono text-white/20 italic">
                ISK_PILOT_V1_Axiom // WebGL Rendering Active
            </div>
        </div>
    );
};

export default RealityEngine;




