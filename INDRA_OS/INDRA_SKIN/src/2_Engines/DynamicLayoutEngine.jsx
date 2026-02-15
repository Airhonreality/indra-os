/**
 * CAPA 2: ENGINES
 * DynamicLayoutEngine.jsx
 * DHARMA: Renderizar el Layout del Cosmos activo.
 * AXIOMA: Centralización Total (v14.0). Se purga la estructura multi-sidebar legacy.
 */

import React, { useMemo } from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import SlotRenderer from './SlotRenderer';
import GraphEngine from './GraphEngine';
import ProjectionMatrix from '../core/kernel/ProjectionMatrix';

const DynamicLayoutEngine = () => {
    const { state, execute } = useAxiomaticStore();

    const activeLayoutArtifact = state.phenotype.activeLayout;
    const currentViewKey = state.phenotype.ui.activeViewId || 'default';

    // AXIOMA: Resolución de Realidad Percibida (Hybrid Hydration)
    const { view, slots, layoutSchema, cosmosContext } = useMemo(() => {
        if (!activeLayoutArtifact) {
            // AXIOMA: Modo de Rescate (Scaffolding Agnóstico para DevLab)
            return {
                view: { visible_slots: ['CANVAS_MAIN', 'TERMINAL_STATUS', 'FLOAT_OVERLAY'], id: 'rescue_view' },
                slots: { 'CANVAS_MAIN': compiler.compileSlot({ id: 'SLOT_NODE' }) },
                layoutSchema: { VIEW_MODE: 'DASHBOARD' },
                cosmosContext: { identity: state.phenotype.cosmosIdentity || { id: 'dev_scaffold' } }
            };
        }

        // 1. Compilación de la Verdad Híbrida (Backend + Virtual Manifest)
        const compiledSlots = {};
        const rawSlots = activeLayoutArtifact.slots || activeLayoutArtifact.SLOTS || {};

        // AXIOMA: Los slots declarados en el Layout tienen prioridad, pero se enriquecen con el Manifiesto
        Object.keys(rawSlots).forEach(slotKey => {
            const slotDef = rawSlots[slotKey];
            compiledSlots[slotKey] = compiler.compileSlot(slotDef, { slotKey });
        });

        // 2. Inyección de Slots Virtuales Obligatorios (como SLOT_NODE si no está presente)
        if (!compiledSlots['CANVAS_MAIN'] && !Object.values(compiledSlots).some(s => s.id === 'SLOT_NODE')) {
            // Si el layout no define nada para el centro, inyectamos el Slot Node por defecto como salvaguarda
            compiledSlots['CANVAS_MAIN'] = compiler.compileSlot({ id: 'SLOT_NODE' });
        }

        const views = activeLayoutArtifact.views || [];
        const targetView = views.find(v => v.id === currentViewKey) || views[0] || { id: 'default', visible_slots: Object.keys(compiledSlots) };

        return {
            view: targetView,
            slots: compiledSlots,
            layoutSchema: activeLayoutArtifact.config || { VIEW_MODE: 'DASHBOARD' },
            cosmosContext: {
                identity: state.phenotype.cosmosIdentity,
                layout: activeLayoutArtifact,
                flow: state.phenotype.activeFlow
            }
        };
    }, [activeLayoutArtifact, currentViewKey, state.sovereignty, state.phenotype.cosmosIdentity]);

    const { visible_slots = [] } = view;

    return (
        <main className="w-full h-full flex flex-col relative bg-transparent overflow-hidden">

            {/* SECCIÓN PRINCIPAL: FLUJO SOBERANO */}
            <section className="flex-1 w-full relative flex overflow-hidden">

                {/* LIENZO CENTRAL (Canvas Único) */}
                <div className="flex-1 relative h-full">
                    {/* AXIOMA: Si hay un artefacto activo que no es el Cosmos mismo, lo proyectamos con prioridad */}
                    {state.phenotype.cosmosIdentity && activeLayoutArtifact && activeLayoutArtifact.id !== state.phenotype.cosmosIdentity.id ? (
                        <div className="w-full h-full flex flex-row animate-in fade-in duration-500 relative">
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                <ProjectionMatrix
                                    componentId={activeLayoutArtifact.id}
                                    data={activeLayoutArtifact}
                                    perspective={
                                        state.sovereignty.mode === 'DEV_LAB'
                                            ? (state.phenotype.devLab?.perspective || 'VAULT')
                                            : 'BRIDGE'
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        /* Modo Exploración (Grafo o Dash por defecto) */
                        (layoutSchema.VIEW_MODE === 'GRAPH') ? (
                            <GraphEngine
                                nodes={(state.phenotype.artifacts || []).filter(a => !a._isDeleted)}
                                edges={(state.phenotype.relationships || []).filter(r => !r._isDeleted)}
                            />
                        ) : (
                            <SlotRenderer
                                slotId="CANVAS_MAIN"
                                visibleSlots={visible_slots}
                                cosmosContext={cosmosContext}
                                slots={slots}
                            />
                        )
                    )}
                </div>
            </section>

            {/* TERMINAL STATUS (Zócalo de Información) */}
            {visible_slots.includes('TERMINAL_STATUS') && (
                <footer className="h-10 shrink-0 relative z-40">
                    <SlotRenderer
                        slotId="TERMINAL_STATUS"
                        visibleSlots={visible_slots}
                        cosmosContext={cosmosContext}
                        slots={slots}
                    />
                </footer>
            )}

            {/* CAPA DE OVERLAYS */}
            <div className="absolute inset-0 pointer-events-none z-[100]">
                <SlotRenderer
                    slotId="FLOAT_OVERLAY"
                    visibleSlots={visible_slots}
                    cosmosContext={cosmosContext}
                    slots={slots}
                />
                {visible_slots.includes('AUTH_OVERLAY') && (
                    <SlotRenderer
                        slotId="AUTH_OVERLAY"
                        visibleSlots={visible_slots}
                        cosmosContext={cosmosContext}
                        slots={slots}
                    />
                )}
            </div>
        </main>
    );
};

export default DynamicLayoutEngine;



