/**
 * 📜 REGISTRO DE CÁNONES (Axiom v8.0)
 * DHARMA: Mapeo directo entre Ontología L0 y Manifestación React.
 */

import React, { lazy } from 'react';

// Carga perezosa de componentes para máxima eficiencia
const SemanticDataCube = lazy(() => import('../modules/Nivel_1_Views/OMD-09_ISK/components/SemanticDataCube'));
const SpatialCanvas = lazy(() => import('../modules/Nivel_1_Views/OMD-09_ISK/components/SpatialCanvas'));

/**
 * Mapeo Maestro de Cánones.
 * Cualquier objeto con la propiedad 'axiom_canon' se proyectará usando este registro.
 */
export const AXIOM_CANON_REGISTRY = {
    // --- DATOS Y CONOCIMIENTO ---
    'DataEntry': SemanticDataCube,
    'DiscoveryEntry': SemanticDataCube,

    // --- DOCUMENTOS Y PRESENTACIONES ---
    'DocumentRecord': SemanticDataCube, // Temporal hasta tener visor específico
    'FileNode': SemanticDataCube,     // Temporal

    // --- COMUNICACIONES ---
    'SocialComment': SemanticDataCube,

    // --- LOGÍSTICA Y EVENTOS ---
    'EventRecord': SemanticDataCube,

    // Fallback: Si el canon no existe, proyectamos una visualización de depuración
    'DEFAULT': SemanticDataCube
};

/**
 * AXIOMA V12.0: Perfiles de Atención
 * Define la densidad ontológica y reglas de proyección de cada zona del sistema.
 */
export const ATTENTION_PROFILES = {
    DEEP_FOCUS: { zIndex: 0, opacity: 1, blur: 0, scale: 1 },
    NAVIGATIONAL: { zIndex: 20, opacity: 0.95, blur: 15, scale: 0.98 },
    AMBIENT: { zIndex: 10, opacity: 0.8, blur: 5, scale: 1 }
};

export const SYSTEM_MODULES = {
    PORTAL: {
        id: 'PORTAL',
        label: 'Selector de Realidades (Core)',
        profile: 'AMBIENT',
        component: 'CoreSelector'
    },
    SELECTOR: {
        id: 'SELECTOR',
        label: 'Selector de Cosmos',
        profile: 'NAVIGATIONAL',
        component: 'CosmosSelector'
    },
    DESKTOP: {
        id: 'DESKTOP',
        label: 'Escritorio de Operaciones',
        profile: 'DEEP_FOCUS',
        component: 'DynamicLayoutEngine'
    },
};

/**
 * Resuelve el componente adecuado para un canon específico.
 */
export function resolveCanonComponent(canonId) {
    return AXIOM_CANON_REGISTRY[canonId] || AXIOM_CANON_REGISTRY.DEFAULT;
}




