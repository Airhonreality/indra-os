import React from 'react';
import compiler from '../2_Semantic_Transformation/Law_Compiler.js';
import { resolveEngine } from '../registers/Archetype_Registry.js';
import SchemaFormEngine from './projections/engines/SchemaFormEngine.jsx';
import NodeEngine from './projections/engines/NodeEngine.jsx';
import { useAxiomaticStore } from '../1_Axiomatic_Store/AxiomaticStore.jsx';

/**
 * ProjectionMatrix (v12.0 - Atomic Projection)
 * DHARMA: Matriz de Proyección Atómica (ADR-006).
 * AXIOMA: "El proyector es una lente pura; la identidad reside en el Registro de Arquetipos."
 */
const ProjectionMatrix = ({ componentId, archetype, data, perspective = 'VAULT', schemaId, slotId, onCommit, onCancel }) => {
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

    // 2. NORMALIZACIÓN DE IDENTIDAD SOBERANA (ADR-008)
    const normalizedCanon = React.useMemo(() => {
        const caps = hydratedCanon.CAPABILITIES || hydratedCanon.capabilities || {};
        const arch = (hydratedCanon.ARCHETYPE || hydratedCanon.archetype || 'NODE').toUpperCase();

        return {
            ...hydratedCanon,
            id: (hydratedCanon.id || hydratedCanon.ID || componentId || archetype),
            LABEL: hydratedCanon.LABEL || hydratedCanon.label || 'UNIT_SKELETON',
            ARCHETYPE: arch,
            DOMAIN: (hydratedCanon.DOMAIN || hydratedCanon.domain || 'SYSTEM').toUpperCase(),
            CAPABILITIES: caps
        };
    }, [hydratedCanon, componentId]);

    // 3. RESOLUCIÓN DE MOTOR (ADR-006)
    // AXIOMA: Resolución SOBERANA por rasgos y capacidades
    const Engine = React.useMemo(() => {
        // ADR-016: Si la perspectiva es NODE, forzamos NodeEngine (Capa de Lógica Pura)
        if (perspective === 'NODE') return NodeEngine;

        // Resolvemos el motor analizando el canon normalizado completo
        return resolveEngine(normalizedCanon);
    }, [normalizedCanon, perspective]);

    const isFullScale = perspective !== 'WIDGET' && perspective !== 'ICON';

    // AXIOMA: Cámara de Vacío (Geometry Awareness)
    // Si estamos en un modo de visualización compacto (Widget/Icon), blindamos el renderizado.
    // Nota: Con Lazy Loading, 'Engine' es un objeto LazyExoticComponent, no una función directa.
    if (!isFullScale && normalizedCanon.LABEL === 'UNIT_SKELETON') {
        return (
            <div className="inline-flex items-center justify-center p-1" title="Sistema en Standby">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/20 animate-pulse border border-[var(--accent)]/10" />
            </div>
        );
    }

    return (
        <React.Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-lg border border-[var(--accent)]/20">
                    Hydrating {normalizedCanon.ARCHETYPE}...
                </div>
            </div>
        }>
            <div className={`${isFullScale ? 'flex flex-col h-full' : 'inline-flex'} relative`} id={`projection-matrix-${normalizedCanon.id}`}>
                <div className={`${isFullScale ? 'flex-1 overflow-hidden' : ''} relative`}>
                    <ErrorBoundary fallback={<div className="w-full h-full flex items-center justify-center text-[var(--error)] bg-[var(--error)]/5 border border-[var(--error)]/20 rounded-xl p-4 text-xs font-mono">⚠️ Projection Failure: {normalizedCanon.ARCHETYPE}</div>}>
                        {Engine ? (
                            <Engine
                                key={`${normalizedCanon.id}-${normalizedCanon.ARCHETYPE}`}
                                data={normalizedCanon}
                                perspective={perspective}
                                slotId={slotId}
                            />
                        ) : (
                            <div className="p-4 text-red-500">Engine Resolution Failed: {normalizedCanon.ARCHETYPE}</div>
                        )}
                    </ErrorBoundary>
                </div>
            </div>
        </React.Suspense>
    );
};

// MINI ERROR BOUNDARY (Cámara de Vacío)
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("[ProjectionMatrix:Failure]", error, errorInfo); }
    render() {
        if (this.state.hasError) return this.props.fallback || <div className="p-2 text-xs text-red-400">{String(this.state.error)}</div>;
        return this.props.children;
    }
}

export default ProjectionMatrix;




