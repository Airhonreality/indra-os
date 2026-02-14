/**
 * CAPA 2: ENGINES
 * DynamicLayoutEngine.jsx
 * DHARMA: Renderizar el Layout del Cosmos activo.
 * AXIOMA: Este componente SOLO se renderiza cuando hay un Cosmos activo.
 *         La decisión de SI renderizarlo la toma el LayerOrchestrator.
 */

import React, { useState, useEffect, useMemo } from 'react';
import compiler from '../core/laws/Law_Compiler';
import adapter from '../core/Sovereign_Adapter';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import SlotRenderer from './SlotRenderer';
import GraphEngine from './GraphEngine';
import ComponentProjector from '../core/kernel/ComponentProjector';
import { Icons } from '../4_Atoms/IndraIcons';

const DynamicLayoutEngine = () => {
    const { state, execute } = useAxiomaticStore();

    const [currentViewKey, setCurrentViewKey] = useState("CORE_ORCHESTRATOR");
    const [isTransitioning, setIsTransitioning] = useState(false);
    // UI State Global (Controlled by SystemControlHood)
    // AXIOMA: Tabula Rasa (No Sidebars State)
    const { ui } = state.phenotype;

    // AXIOMA V8.0: Layout Data-Driven (Cosmos Soberano)
    const activeLayoutArtifact = state.phenotype.activeLayout;

    // --- REHIDRATACIÓN DE LAYOUT (Ex-LayoutHydrator Logic) ---
    // Usamos useMemo para evitar re-compilaciones costosas en cada render
    const { view, slots, layoutSchema, cosmosContext } = useMemo(() => {
        if (!activeLayoutArtifact) {
            // Fallback SAFE_MODE
            return {
                view: { visible_slots: [] },
                slots: {},
                layoutSchema: { VIEW_MODE: 'GRAPH' },
                cosmosContext: {}
            };
        }

        // 1. Obtener la vista actual (Proyección)
        const layouts = activeLayoutArtifact.LAYOUTS || {};
        const currentLayout = layouts[currentViewKey] || layouts[Object.keys(layouts)[0]] || {};

        // AXIOMA: Inyección de Layout por Defecto (System Scaffolding)
        // Si el artefacto no define vistas, asumimos la estructura canónica completa.
        const defaultView = {
            visible_slots: ['SIDEBAR_PRIMARY', 'SIDEBAR_SECONDARY', 'CANVAS_MAIN', 'TERMINAL_STATUS']
        };
        const activeView = currentLayout.VIEWS?.[currentLayout.DEFAULT_VIEW || 'DEFAULT'] || defaultView;

        // 2. Compilar Slots con Leyes (TGS Injection)
        // El compilador fusiona la definición del slot con las leyes del sistema
        const compiledSlots = {};
        const slotDefinitions = activeLayoutArtifact.SLOTS || {};

        Object.keys(slotDefinitions).forEach(slotKey => {
            compiledSlots[slotKey] = compiler.compileSlot(slotDefinitions[slotKey], state.sovereignty);
        });

        return {
            view: activeView,
            slots: compiledSlots,
            layoutSchema: activeLayoutArtifact,
            cosmosContext: {
                cosmosId: state.phenotype.cosmosIdentity?.id,
                activeLayoutId: activeLayoutArtifact.id
            }
        };

    }, [activeLayoutArtifact, currentViewKey, state.sovereignty]);

    return (
        <div className="h-full w-full overflow-hidden flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
            {/* AXIOMA: No hay Barras, Solo Sustrato y Flotantes (Gestionados por SystemControlHood) */}

            {/* NIVEL 1 & 2: CORE WORKSPACE */}
            < main className="flex-1 flex overflow-hidden w-full h-full relative" >

                {/* 🗑️ ZOMBIES ELIMINADOS: Left Sidebar (Architecture V12) */}

                {/* CENTRO (ORQUESTACIÓN) */}
                <section
                    className="flex-1 h-full flex flex-col relative overflow-hidden bg-[var(--bg-deep)]"
                    style={{
                        zIndex: 'var(--stark-z-index-canvas)'
                    }}
                >
                    <div className="w-full h-full flex flex-col overflow-hidden relative">
                        {/* AXIOMA: Proyección Unificada (v14.0)
                            Si un artefacto está activo, toma el control del centro con su Bridge/Widget/Node view. */}
                        {state.phenotype.cosmosIdentity && state.phenotype.activeLayout && state.phenotype.activeLayout.id !== state.phenotype.cosmosIdentity.id ? (
                            <div className="w-full h-full flex flex-row animate-in fade-in duration-500 relative">

                                <div className="flex-1 flex flex-col h-full overflow-hidden">
                                    <ComponentProjector
                                        componentId={state.phenotype.activeLayout.id}
                                        data={state.phenotype.activeLayout}
                                        perspective={
                                            state.sovereignty.mode === 'DEV_LAB'
                                                ? (state.phenotype.devLab?.perspective || 'VAULT')
                                                : 'BRIDGE'
                                        }
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Comportamiento Estándar del Cosmos */
                            (layoutSchema.VIEW_MODE === 'GRAPH' || !layoutSchema.VIEW_MODE) ? (
                                <GraphEngine
                                    nodes={(state.phenotype.artifacts || []).filter(a => !a._isDeleted)}
                                    edges={(state.phenotype.relationships || []).filter(r => !r._isDeleted)}
                                />
                            ) : (
                                <SlotRenderer
                                    slotId="CANVAS_MAIN"
                                    visibleSlots={view?.visible_slots || []}
                                    cosmosContext={cosmosContext}
                                />
                            )
                        )}
                    </div>

                    <div
                        className="absolute bottom-10 right-10 pointer-events-none flex flex-col justify-end items-end"
                        style={{ zIndex: 'var(--stark-z-index-overlay)' }}
                    >
                        <SlotRenderer
                            slotId="FLOAT_CORNER"
                            visibleSlots={view?.visible_slots || []}
                            cosmosContext={cosmosContext}
                        />
                    </div>
                </section>

                {/* 🗑️ ZOMBIES ELIMINADOS: Right Sidebar (Architecture V12) */}
            </main >

            {/* 🗑️ ZOMBIES ELIMINADOS: System Footer (Architecture V12) */}

            {/* AUTH GATE */}
            < div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 'var(--stark-z-index-system)' }}
            >
                <SlotRenderer
                    slotId="AUTH_OVERLAY"
                    visibleSlots={view?.visible_slots || []}
                    cosmosContext={cosmosContext}
                />
            </div >
        </div >
    );
};

export default DynamicLayoutEngine;
