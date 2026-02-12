/**
 * CAPA 2: ENGINES
 * SlotRenderer.jsx
 * DHARMA: Renderizador universal de slots con contexto de Cosmos.
 * AXIOMA: Separation of Concerns - Un slot no sabe QUÉ renderiza, solo CÓMO.
 * 
 * FEATURE CLAVE: Inyecta el contexto del Cosmos activo en cada widget,
 * permitiendo que dashboards y widgets sepan de dónde vienen y puedan
 * actuar como puntos de intervención reglados.
 */

import React from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import compiler from '../core/laws/Law_Compiler';
import DefaultSkeleton from '../modules/System_Core/DefaultSkeleton';

/**
 * Renderiza un slot específico con su colección de widgets.
 * @param {string} slotId - ID del slot a renderizar (ej: 'CANVAS_MAIN')
 * @param {Array} visibleSlots - Lista de slots visibles en la perspectiva actual
 * @param {Object} cosmosContext - Contexto del Cosmos activo (identity, layout, flow)
 */
const SlotRenderer = ({ slotId, visibleSlots, cosmosContext }) => {
    const { state } = useAxiomaticStore();

    // 1. Regla de Soberanía Visual: Culling por Perspectiva
    if (!visibleSlots.includes(slotId)) {
        return null;
    }

    // 2. Búsqueda de Manifestaciones (Widgets asignados a este slot)
    const renderManifest = compiler.getRenderManifest();
    const allWidgets = renderManifest.filter(widget => widget.slot === slotId);

    // 3. Fallback de Slot Vacío (Industrial Scaffolding)
    // AXIOMA: Filtrado de Fantasmas (Ghost Busting)
    // Eliminamos widgets que no tienen identidad definida (Lógica Vieja o Placeholders)
    const validWidgets = allWidgets.filter(w => {
        const hasIdentity = w.functional_name || (w.LABEL && w.LABEL !== 'UNIT_SKELETON');
        const hasContent = w.artefacts && w.artefacts.length > 0;
        return hasIdentity || hasContent;
    });

    if (validWidgets.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center opacity-40 border border-[var(--border-subtle)] border-dashed m-1 rounded-lg">
                <span className="text-[7px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                    Empty::{slotId}
                </span>
            </div>
        );
    }

    // 4. Proyección de Colección con Contexto Inyectado
    const isSidebar = slotId.includes('SIDEBAR');

    return (
        <div
            className={`w-full h-full overflow-y-auto scrollbar-hide flex flex-col`}
            style={{
                gap: 'var(--stark-gutter-size)',
                padding: 'var(--stark-edge-margin)'
            }}
        >
            {validWidgets.map(widget => (
                <div
                    key={widget.omd}
                    className="w-full stark-slot shrink-0 animate-fade-in flex justify-center"
                    data-omd={widget.omd}
                    data-cosmos-id={cosmosContext?.identity?.id}
                >
                    {/* AXIOMA: Manifestación Universal vía DefaultSkeleton 
                        con Perspectiva Adaptativa */}
                    <DefaultSkeleton
                        law={widget}
                        slotId={slotId}
                        perspective={isSidebar ? 'STANDARD' : 'STANDARD'} // AXIOMA: Soberanía de Panel sobre Orbes
                        cosmosContext={cosmosContext}
                        phenotype={state.phenotype}
                    />
                </div>
            ))}
        </div>
    );
};

export default SlotRenderer;
