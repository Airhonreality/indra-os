import React, { useState, useEffect } from 'react';
import { useAxiomaticStore } from '../../../../1_Axiomatic_Store/AxiomaticStore.jsx';
import NodeEngine from '../NodeEngine.jsx';
import CompositorHeader from './CompositorHeader.jsx';
import CompositorPropertyPanel from './CompositorPropertyPanel.jsx';
import CompositorLiveView from './CompositorLiveView.jsx';
import CompositorDashboard from './CompositorDashboard.jsx';
import { resolveIcon } from '../../VisualHydrator.js';

/**
 * CompositorEngine (ex-SlotEngine) — Axiomatic v2.0
 * DHARMA: Portal polimórfico entre el Grafo y el espacio de trabajo 2D.
 * AXIOMA: "El foco no es una app, es una estación de trabajo del grafo."
 *
 * FIX: El bug de inversión NODE/UTILITY se resolvió aquí:
 *  — En modo NODE → delegar a NodeEngine SIN label modificado (era el zombie)
 *  — En modo FOCUS (cualquier otro) → activar el Compositor completo
 */
const CompositorEngine = ({ data, perspective }) => {
    const { state, execute } = useAxiomaticStore();
    const { id, LABEL, ARCHETYPE } = data;

    // ─── FIX DE INVERSIÓN ────────────────────────────────────────────────────
    // ANTES: SlotEngine pasaba `[SLOT] ${LABEL}` al NodeEngine → confundía el
    // ARCHETYPE y hacía que el nodo apareciera vacío en NODE mode.
    // AHORA: Pasamos data puro. NodeEngine ya detecta isSlot por ARCHETYPE.
    if (perspective === 'NODE') {
        return <NodeEngine data={data} />;
    }
    // ─────────────────────────────────────────────────────────────────────────

    const [selectedProperty, setSelectedProperty] = useState(null);

    // AXIOMA: Detección agnóstica de vínculo sináptico entrante
    const incomingConnection = (state.phenotype.relationships || [])
        .find(r => r.target === id && !r._isDeleted);
    const sourceNode = incomingConnection
        ? state.phenotype.artifacts?.[incomingConnection.source]
        : null;

    // AXIOMA: Herencia de materia viva — prioridad absoluta a _currentProjection
    // Normalizar: si es objeto único, no array, lo envolvemos para el LiveView
    const rawProjection = data._currentProjection ?? data.payload ?? null;
    const liveData = rawProjection !== null
        ? (Array.isArray(rawProjection) ? rawProjection : [rawProjection])
        : null;

    // AXIOMA: Vistas derivadas del estado real (no hardcoded)
    const views = [
        { id: 'dashboard', label: 'Dashboard', type: 'DASHBOARD' },
        ...(liveData ? [{ id: 'live', label: 'Live Data', type: 'GRID' }] : [])
    ];

    const [activeViewId, setActiveViewId] = useState('dashboard');

    // Auto-saltar a Live cuando llegan datos
    useEffect(() => {
        if (liveData && activeViewId === 'dashboard') {
            setActiveViewId('live');
        }
    }, [liveData]);

    const activeView = views.find(v => v.id === activeViewId) || views[0];

    // AXIOMA: Propiedades derivadas 100% de CAPABILITIES reales del nodo
    const rawCapabilities = data.CAPABILITIES || data.capabilities || {};
    const properties = Object.entries(rawCapabilities).map(([key, config]) => ({
        id: key,
        label: config.label || config.human_label || key,
        icon: resolveIcon(config.icon),
        status: config.status || 'DEFAULT',
        value: config.value || config.type || '—'
    }));

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-deep)] overflow-hidden">

            <CompositorHeader
                label={sourceNode ? `${sourceNode.human_label || sourceNode.LABEL || sourceNode.label} :: PROJECTION` : LABEL}
                views={views}
                activeViewId={activeViewId}
                onViewChange={setActiveViewId}
                onExit={() => execute('EXIT_FOCUS')}
            />

            <div className="flex-1 flex relative overflow-hidden">

                <CompositorPropertyPanel
                    capabilities={rawCapabilities}
                    sourceNode={sourceNode}
                    selectedProperty={selectedProperty}
                    onSelectProperty={setSelectedProperty}
                />

                {/* LIENZO PRINCIPAL */}
                <main className="flex-1 relative overflow-hidden flex bg-[#030303]">
                    {/* Grid sutil de fondo */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                    />

                    <div className="flex-1 flex items-center justify-center p-8 overflow-auto scrollbar-hide">
                        {activeView.type === 'GRID' && liveData ? (
                            <CompositorLiveView liveData={liveData} />
                        ) : (
                            <CompositorDashboard
                                properties={properties}
                                selectedProperty={selectedProperty}
                                onSelectProperty={setSelectedProperty}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CompositorEngine;

