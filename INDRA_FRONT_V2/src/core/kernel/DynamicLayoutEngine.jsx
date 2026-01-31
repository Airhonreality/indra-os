/**
 * src/core/kernel/DynamicLayoutEngine.jsx
 * 🚀 MOTOR DE RENDERIZADO AUTOMÁTICO (The UI Automator)
 * Axioma: "La interfaz no se programa; se manifiesta a partir de la Ley."
 * 
 * Este componente interpreta el manifiesto del LawCompiler y construye la cáscara de la UI.
 */

import React from 'react';
import compiler from '../laws/LawCompiler';

// Simulación de carga dinámica de componentes (Lazy Loading)
const ComponentRegistry = {
    "AccessPortal": () => <div className="p-10 bg-black/80 text-white">PORTAL (OMD-01)</div>,
    "IdentityVault": () => <div className="p-4 bg-gray-900 border-l border-gold">VAULT (OMD-02)</div>,
    "FlowOrchestrator": () => <div className="flex-1 bg-stone-900">CANVAS (OMD-03)</div>,
    "ContextInspector": () => <div className="w-80 bg-zinc-900 border-l">INSPECTOR (OMD-05)</div>,
    "ExecutionMonitor": () => <div className="h-10 bg-black border-t text-xs flex items-center px-4">MONITOR (OMD-06)</div>
};

const DynamicLayoutEngine = () => {
    const renderManifest = compiler.getRenderManifest();

    return (
        <div id="indra-root" className="w-screen h-screen flex flex-col overflow-hidden bg-black text-white">
            {/* Capa de Soberanía (Nivel 3 - Overlays) */}
            {renderManifest.filter(m => m.slot.includes('overlay')).map(module => (
                <div key={module.omd} id={module.id} className="absolute inset-0 z-[1000] pointer-events-none">
                    <div className="pointer-events-auto">
                        {ComponentRegistry[module.component] ? ComponentRegistry[module.component]() : `Missing: ${module.component}`}
                    </div>
                </div>
            ))}

            <div className="flex flex-1 overflow-hidden">
                {/* Lateral Izquierdo (Módulos Nivel 1 o 2) */}
                {renderManifest.filter(m => m.slot === 'sidebar-left').map(module => (
                    <aside key={module.omd} id={module.id} className="h-full">
                        {ComponentRegistry[module.component] ? ComponentRegistry[module.component]() : module.id}
                    </aside>
                ))}

                {/* Escenario Central (Nivel 1) */}
                <main className="flex-1 relative">
                    {renderManifest.filter(m => m.slot === 'center-stage').map(module => (
                        <div key={module.omd} id={module.id} className="w-full h-full">
                            {ComponentRegistry[module.component] ? ComponentRegistry[module.component]() : module.id}
                        </div>
                    ))}
                </main>

                {/* Lateral Derecho (Nivel 2/3) */}
                {renderManifest.filter(m => m.slot === 'sidebar-right' || m.slot === 'drawer-right').map(module => (
                    <aside key={module.omd} id={module.id} className="h-full">
                        {ComponentRegistry[module.component] ? ComponentRegistry[module.component]() : module.id}
                    </aside>
                ))}
            </div>

            {/* Barra Inferior (Nivel 3) */}
            {renderManifest.filter(m => m.slot === 'bar-bottom').map(module => (
                <footer key={module.omd} id={module.id} className="w-full">
                    {ComponentRegistry[module.component] ? ComponentRegistry[module.component]() : module.id}
                </footer>
            ))}
        </div>
    );
};

export default DynamicLayoutEngine;
