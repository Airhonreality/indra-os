import React, { useRef, useEffect, useState } from 'react';
import { ProjectionKernel } from '../../core/IndraSpatialKernel/ProjectionKernel';

/**
 * 🌌 SpatialCanvas: El portal de manifestación del ISK.
 * Integra el ProjectionKernel con el ciclo de vida de React.
 */
const SpatialCanvas = ({ laws = [], stateOverride = null }) => {
    const canvasRef = useRef(null);
    const kernelRef = useRef(new ProjectionKernel());
    const [integrity, setIntegrity] = useState({ status: 'OK' });
    const [exploitation, setExploitation] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 1. Vinculamos el canvas al Kernel (L1->L2->L3)
        kernelRef.current.setCanvas(canvas);

        // 2. Cargamos las leyes espaciales iniciales
        if (laws.length > 0) {
            kernelRef.current.loadLaws(laws);
        }

        // 3. ResizeObserver para robustez dimensional (The Mirror Shield)
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                // Notificamos al renderer si es necesario (el renderer usa gl.viewport internamente o vía u_resolution)
            }
        });
        resizeObserver.observe(canvas.parentElement);

        // 4. Ciclo de Reificación Progresiva (RequestAnimationFrame)
        let animationId;
        const renderLoop = () => {
            // Simulamos un stream de datos del Core (Falsa reactividad para el test)
            let mockCoreState = {
                'core.power': 50 + Math.sin(Date.now() / 500) * 50,
                'time.now': Date.now() / 1000
            };

            // Aplicamos override estratégico para tests de integridad
            if (stateOverride) {
                mockCoreState = stateOverride(mockCoreState);
            }

            kernelRef.current.update(mockCoreState);

            // Sincronizamos el estado de la UI con el del Kernel cada frame o según sea necesario
            setIntegrity(kernelRef.current.state.integrity);
            setExploitation(kernelRef.current.state.exploitation);

            kernelRef.current.tick();
            animationId = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
        };
    }, [laws]);

    return (
        <div className="spatial-canvas-container w-full h-full relative bg-black overflow-hidden">
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ imageRendering: 'pixelated' }}
            />

            <div className="absolute top-4 left-4 pointer-events-none">
                <h1 className="mono-bold text-[10px] text-white/40 tracking-[0.2em]">
                    INDRA_SPATIAL_KERNEL // HIGH_FIDELITY_ARRAY
                </h1>

                {/* HUD de Integridad */}
                <div className={`mt-2 p-1 border ${integrity.status === 'CRITICAL' ? 'bg-red-900/40 border-red-500' : 'bg-green-900/20 border-white/10'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${integrity.status === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className="mono-bold text-[9px] text-white/80">
                            INTEGRITY: {integrity.status}
                        </span>
                    </div>
                    {integrity.status === 'CRITICAL' && (
                        <div className="mt-1 mono-regular text-[8px] text-red-200">
                            Faltan: {integrity.missing?.join(', ')}
                        </div>
                    )}
                </div>

                {/* HUD de Explotación */}
                {exploitation && exploitation.status === 'WARNING' && (
                    <div className="mt-2 p-1 border bg-yellow-900/20 border-yellow-500/40">
                        <span className="mono-bold text-[9px] text-yellow-500">
                            EXPLOITATION_WARNING: {exploitation.unusedRatio}
                        </span>
                        <div className="mono-regular text-[7px] text-yellow-200/60 max-w-[200px] truncate">
                            Unused: {exploitation.unusedFields?.join(', ')}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpatialCanvas;
