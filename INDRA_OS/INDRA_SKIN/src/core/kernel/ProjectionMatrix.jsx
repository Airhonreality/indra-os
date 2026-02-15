import React from 'react';
import compiler from '../laws/Law_Compiler';
import { resolveEngine } from '../registers/Archetype_Registry';
import SchemaFormEngine from './projections/engines/SchemaFormEngine';
import NodeEngine from './projections/engines/NodeEngine';
import { useAxiomaticStore } from '../state/AxiomaticStore';

/**
 * ProjectionMatrix (v12.0 - Atomic Projection)
 * DHARMA: Matriz de Proyección Atómica (ADR-006).
 * AXIOMA: "El proyector es una lente pura; la identidad reside en el Registro de Arquetipos."
 */
const ProjectionMatrix = ({ componentId, data, perspective = 'VAULT', schemaId, slotId, onCommit, onCancel }) => {
    const { state } = useAxiomaticStore();

    // AXIOMA: Meta-Proyección (Atómica)
    if (perspective === 'SCHEMA_PROJECTION') {
        return <SchemaFormEngine schemaId={schemaId} onCommit={onCommit} onCancel={onCancel} />;
    }

    // 1. HIDRATACIÓN SOBERANA (ADR-008)
    let canon = data || compiler.getCanon(componentId);

    // Auto-reificación si el canon está incompleto
    if (canon && (!canon.LABEL || !canon.ARCHETYPE)) {
        const compiledCanon = compiler.getCanon(componentId || canon.id || canon.ID);
        if (compiledCanon) canon = { ...compiledCanon, ...canon };
    }

    if (!canon) {
        return <div className="p-10 text-[var(--error)] font-mono border border-[var(--error)]/20 rounded-xl bg-[var(--error)]/5">
            [FATAL] CANON_NOT_FOUND: {componentId}
        </div>;
    }

    // AXIOMA: Hidratación de Silo (Pureza de Datos)
    const hydratedCanon = React.useMemo(() => {
        const artifactId = canon.id || canon.ID || componentId;
        const siloData = state.phenotype.silos?.[artifactId];
        if (siloData && typeof siloData === 'object' && !Array.isArray(siloData)) {
            console.log(`[ProjectionMatrix] 💧 Hydrated canon with silo data for ${artifactId}`);
            return { ...canon, ...siloData };
        }
        return canon;
    }, [canon, componentId, state.phenotype.silos]);

    // 2. NORMALIZACIÓN DE IDENTIDAD
    const normalizedCanon = React.useMemo(() => {
        const chargetype = hydratedCanon.ARCHETYPE || hydratedCanon.archetype || (hydratedCanon.ARCHETYPES ? hydratedCanon.ARCHETYPES[0] : 'ADAPTER');
        return {
            ...hydratedCanon,
            id: (hydratedCanon.id || hydratedCanon.ID || componentId),
            LABEL: hydratedCanon.LABEL || hydratedCanon.label || 'UNIT_SKELETON',
            ARCHETYPE: chargetype.toUpperCase(),
            DOMAIN: (hydratedCanon.DOMAIN || hydratedCanon.domain || 'SYSTEM').toUpperCase(),
            CAPABILITIES: hydratedCanon.CAPABILITIES || hydratedCanon.capabilities || {}
        };
    }, [hydratedCanon, componentId]);

    // 3. RESOLUCIÓN DE MOTOR (ADR-006)
    // AXIOMA: Ya no hay "ifs" de tipo. El Registro de Arquetipos manda.
    const availableModes = normalizedCanon.ARCHETYPES || [normalizedCanon.ARCHETYPE];
    const [activeArchetype, setActiveArchetype] = React.useState(null);

    // Modo efectivo: Prioridad al estado local, luego a la intención del registro.
    const effectiveMode = React.useMemo(() => {
        if (activeArchetype && availableModes.includes(activeArchetype)) return activeArchetype;

        // ADR-016: Si la perspectiva es NODE, forzamos NodeEngine.
        if (perspective === 'NODE') return 'NODE';

        // Fallback: El primer modo disponible en el canon.
        return availableModes[0];
    }, [activeArchetype, availableModes, perspective]);

    React.useEffect(() => {
        if (activeArchetype !== effectiveMode) setActiveArchetype(effectiveMode);
    }, [effectiveMode]);

    // RESOLUCIÓN SOBERANA
    let Engine = resolveEngine(effectiveMode);

    // AXIOMA: Si la perspectiva es una Capa Visual (ADR-016), intentamos elevar el motor.
    if (perspective !== 'NODE' && perspective !== 'SCHEMA_PROJECTION' && perspective !== effectiveMode) {
        const PerspectiveEngine = resolveEngine(perspective);
        if (PerspectiveEngine && PerspectiveEngine !== NodeEngine) {
            Engine = PerspectiveEngine;
        }
    }

    return (
        <div className="flex flex-col h-full relative" id={`projection-matrix-${normalizedCanon.id}`}>
            <div className="flex-1 overflow-hidden relative">
                <Engine
                    key={`${normalizedCanon.id}-${effectiveMode}`}
                    data={normalizedCanon}
                    perspective={perspective}
                    slotId={slotId}
                />
            </div>
        </div>
    );
};

export default ProjectionMatrix;



