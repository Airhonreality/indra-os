import React from 'react';
import compiler from '../laws/Law_Compiler';
import { resolveEngine } from '../registers/Archetype_Registry';
import SchemaFormEngine from './projections/engines/SchemaFormEngine';
import NodeEngine from './projections/engines/NodeEngine'; // Mantenemos import directo para caso edge NODE
import MatrixNavigator from '../../4_Elements/MatrixNavigator';

/**
 * ComponentProjector (v8.0 Refactor MATRIX)
 * DHARMA: Matriz de Proyección Atómica.
 * Ya no toma decisiones. Solo consulta el Registro Soberano.
 */
const ComponentProjector = ({ componentId, data, perspective = 'VAULT', schemaId, slotId, onCommit, onCancel }) => {

    // Ruta de Proyección de Esquemas (Caso Especial: Meta-Proyección)
    if (perspective === 'SCHEMA_PROJECTION') {
        return <SchemaFormEngine schemaId={schemaId} onCommit={onCommit} onCancel={onCancel} />;
    }

    // 1. OBTENCIÓN DE MATERIA PRIMA (ADR-008: Reificación Proactiva)
    let canon = data || compiler.getCanon(componentId);

    // Si la data está incompleta, intentamos reificarla con el compilador
    if (canon && (!canon.LABEL || !canon.ARCHETYPE)) {
        const compiledCanon = compiler.getCanon(componentId || canon.id || canon.ID);
        if (compiledCanon) canon = { ...compiledCanon, ...canon };
    }

    if (!canon) {
        return <div className="p-10 text-[var(--error)] font-mono border border-[var(--error)]/20 rounded-xl bg-[var(--error)]/5">
            [FATAL] CANON_NOT_FOUND: {componentId}
        </div>;
    }

    // 2. VALIDACIÓN SOBERANA (Anti-Fallbacks Silenciosos)
    // Usamos normalización segura para evitar bloqueos innecesarios
    const LABEL = canon.LABEL || canon.label || 'UNIT_SKELETON';
    const ARCHETYPE = canon.ARCHETYPE || canon.archetype || (canon.ARCHETYPES ? canon.ARCHETYPES[0] : 'ADAPTER');
    const DOMAIN = canon.DOMAIN || canon.domain || 'SYSTEM';

    // Solo logueamos error pero permitimos renderizar con normalización
    if (!canon.LABEL && !canon.ARCHETYPE) {
        console.warn(`[Projector] Partial Contract for ${componentId}. Normalizing...`);
    }

    // AXIOMA: Estabilización de Referencias (Memoization)
    const normalizedCanon = React.useMemo(() => ({
        ...canon,
        id: (canon.id || canon.ID || componentId), // SOBERANÍA BINARIA: Preservar Case-Sensitivity
        LABEL: LABEL,
        ARCHETYPE: ARCHETYPE.toUpperCase(),
        DOMAIN: DOMAIN.toUpperCase(),
        CAPABILITIES: canon.CAPABILITIES || canon.capabilities || {}
    }), [canon, componentId, LABEL, ARCHETYPE, DOMAIN]);

    const availableModes = React.useMemo(() =>
        normalizedCanon.ARCHETYPES || [normalizedCanon.ARCHETYPE],
        [normalizedCanon]);

    // LÓGICA DE ESTADO DERIVADO (Elegancia Reactiva)
    // Estado local para la navegación por pestañas
    const [activeArchetype, setActiveArchetype] = React.useState(null);

    // Calculamos el modo efectivo AL VUELO (Zero-Latency Check)
    // AXIOMA: Prioridad de Servicio. Si tiene DATABASE, es lo que el usuario quiere ver.
    let effectiveMode = (activeArchetype && availableModes.includes(activeArchetype))
        ? activeArchetype
        : (availableModes.includes('DATABASE') ? 'DATABASE' : (availableModes.includes('VAULT') ? 'VAULT' : availableModes[0]));

    // Efecto de sincronización visual (Solo si necesitamos actualizar el state para highlights de UI)
    React.useEffect(() => {
        if (activeArchetype !== effectiveMode) {
            setActiveArchetype(effectiveMode);
        }
    }, [effectiveMode]); // Dependencia ÚNICA y estable

    // RESOLUCIÓN SOBERANA (ADR-006)
    let Engine = resolveEngine(effectiveMode);

    if (perspective === 'NODE') Engine = NodeEngine;

    return (
        <div className="flex flex-col h-full relative">
            {/* AXIOMA: Navegador de Matriz (Orígenes + Perspectivas) */}
            <MatrixNavigator currentArtifact={normalizedCanon} />

            {/* Renderizado de la Realidad */}
            <div className="flex-1 overflow-hidden relative">
                <Engine
                    key={`${componentId}-${effectiveMode}`} // Key compuesta estable
                    data={normalizedCanon}
                    perspective={perspective}
                    slotId={slotId}
                />
            </div>
        </div>
    );
};

export default ComponentProjector;
