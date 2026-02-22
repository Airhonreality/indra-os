/**
 * Archetype_Registry.js
 * DHARMA: Registro Oficial de Arquetipos y Motores de Proyección.
 * Misión: Mapear cada Arquetipo a su Motor de Renderizado Universal (Engine).
 */

import React, { lazy } from 'react';

// AXIOMA: Lazy Loading para Romper Ciclos de Dependencia Circular (ADR-020)
// El Registro de Arquetipos no debe importar estáticamente los motores que lo consumen.

const VaultEngine = lazy(() => import('../kernel/projections/engines/VaultEngine.jsx'));
const NodeEngine = lazy(() => import('../kernel/projections/engines/NodeEngine.jsx'));
const CommunicationEngine = lazy(() => import('../kernel/projections/engines/CommunicationEngine.jsx'));
const RealityEngine = lazy(() => import('../kernel/projections/engines/RealityEngine.jsx'));
const ServiceEngine = lazy(() => import('../kernel/projections/engines/ServiceEngine.jsx'));
// RENAME: SlotEngine → CompositorEngine (Axiomatic v2.0)
const CompositorEngine = lazy(() => import('../kernel/projections/engines/CompositorEngine/CompositorEngine.jsx'));
const DatabaseEngine = lazy(() => import('../kernel/projections/engines/DatabaseEngine.jsx'));
const IdentityEngine = lazy(() => import('../kernel/projections/engines/IdentityEngine.jsx'));

// Mapa Canónico de Arquetipos Base (Soberanía Única)
const ARCHETYPE_REGISTRY = {
    'VAULT': VaultEngine,
    'DATABASE': DatabaseEngine,
    'COMMUNICATION': CommunicationEngine,
    'NODE': NodeEngine,
    'SERVICE': ServiceEngine,
    'REALITY': RealityEngine,
    'COMPOSITOR': CompositorEngine,
    'IDENTITY': IdentityEngine,
    'DEFAULT': NodeEngine
};

/**
 * Resuelve el Motor de Renderizado analizando rasgos y capacidades.
 * AXIOMA: "La función define la forma." (ADR-022)
 */
export const resolveEngine = (nodeData) => {
    if (!nodeData) return ARCHETYPE_REGISTRY.DEFAULT;

    // 1. Detección por Rasgos (Evolución Genética)
    const traits = (nodeData.traits || nodeData.TRAITS || []).map(t => String(t).toUpperCase());
    const caps = nodeData.CAPABILITIES || nodeData.capabilities || {};
    const arch = String(nodeData.ARCHETYPE || nodeData.archetype || '').toUpperCase();

    const capIds = Object.values(caps).map(c => typeof c === 'object' ? c.id : c);

    // Prioridad 1: Bóvedas y Almacenamiento
    if (traits.includes('STORAGE') || traits.includes('VAULT') || capIds.includes('LIST_FILES') || arch === 'VAULT') return VaultEngine;

    // Prioridad 2: Bases de Datos y Rejillas
    if (traits.includes('GRID') || traits.includes('DATABASE') || capIds.includes('DATA_STREAM') || arch === 'DATABASE') return DatabaseEngine;

    // Prioridad 3: Comunicación
    if (traits.includes('COMMUNICATION') || traits.includes('MAIL') || capIds.includes('SEND_MESSAGE') || arch === 'COMMUNICATION') return CommunicationEngine;

    // Prioridad 4: Composición y UI Estructural
    if (traits.includes('SLOT') || traits.includes('COMPOSITOR') || capIds.includes('RECEIVE') || arch === 'COMPOSITOR' || arch === 'SLOT') return CompositorEngine;

    // Prioridad 5: Realidad Espacial
    if (traits.includes('REALITY') || arch === 'REALITY') return RealityEngine;

    // Prioridad 6: Servicios e IA
    if (traits.includes('SERVICE') || traits.includes('AGENT') || arch === 'SERVICE' || arch === 'AGENT') return ServiceEngine;

    // Prioridad 7: Identidad y Config
    if (traits.includes('IDENTITY') || arch === 'IDENTITY') return IdentityEngine;

    // Fallback al Registro Estático (Si el arquetipo es explícito y no se detectó por rasgos)
    return ARCHETYPE_REGISTRY[arch] || ARCHETYPE_REGISTRY.DEFAULT;
};

export default ARCHETYPE_REGISTRY;




