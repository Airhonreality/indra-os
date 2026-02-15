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
const SlotRenderer = ({ slotId, visibleSlots, cosmosContext, slots = {} }) => {
    const { state } = useAxiomaticStore();

    // 1. Regla de Soberanía Visual: Culling por Perspectiva
    if (!visibleSlots.includes(slotId)) {
        return null;
    }

    // 2. Obtener Definición del Slot (Traída desde el Engine de Layout)
    const slotDef = slots[slotId];

    // 3. Búsqueda de Manifestaciones (Widgets)
    // AXIOMA: Si el slot tiene widgets explícitos, los usamos. Si es un Slot Singular (id), lo usamos directamente.
    let allWidgets = [];

    if (slotDef) {
        if (slotDef.widgets && Array.isArray(slotDef.widgets)) {
            // Caso: Slot contenedor con múltiples widgets
            allWidgets = slotDef.widgets.map(w => (typeof w === 'string') ? compiler.getCanon(w) : w);
        } else {
            // Caso: Slot singular (el slot mismo es el componente/widget)
            allWidgets = [slotDef];
        }
    }

    // Fallback: Si no hay widgets definidos para este slot en el layout,
    // buscamos en el manifiesto global por si hay algo cuya 'ley' diga que pertenece aquí.
    if (allWidgets.length === 0) {
        const renderManifest = compiler.getRenderManifest();
        allWidgets = renderManifest.filter(widget => widget.slot === slotId);
    }

    // 4. Filtrado de Seguridad (Ghost Busting)
    const validWidgets = allWidgets.filter(w => {
        if (!w) return false;
        const hasIdentity = w.functional_name || (w.LABEL && w.LABEL !== 'UNIT_SKELETON');
        const hasContent = (w.artefacts && w.artefacts.length > 0) || w.isVirtual;
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
    return (
        <div
            className={`w-full h-full overflow-y-auto scrollbar-hide flex flex-col`}
            style={{
                gap: 'var(--axiom-gutter-size)',
                padding: 'var(--axiom-edge-margin)'
            }}
        >
            {validWidgets.map(widget => (
                <div
                    key={widget.omd}
                    className="w-full axiom-slot shrink-0 animate-fade-in flex justify-center"
                    data-omd={widget.omd}
                    data-cosmos-id={cosmosContext?.identity?.id}
                >
                    <DefaultSkeleton
                        law={widget}
                        slotId={slotId}
                        perspective="STANDARD"
                        cosmosContext={cosmosContext}
                        phenotype={state.phenotype}
                    />
                </div>
            ))}
        </div>
    );
};

export default SlotRenderer;



