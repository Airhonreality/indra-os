/**
 * =============================================================================
 * CONTRATO: AtomMeta.js
 * DOGMA: Identidad Soberana y Linaje Acumulativo
 * =============================================================================
 * Define el bloque de metadatos del sistema (_meta) para todos los átomos.
 * Este bloque es ADITIVO: su ausencia no rompe el sistema (Axioma de Gracia).
 */

export const ATOM_META_VERSION = '1.0.0';

/**
 * Crea un bloque _meta inicial para un nuevo átomo.
 * @param {Object} params - { createdBy, schemaVersion } 
 */
export function buildInitialMeta({ createdBy = 'SYSTEM', schemaVersion = ATOM_META_VERSION } = {}) {
    const now = new Date().toISOString();
    return {
        // --- BLOQUE DE AUDITORÍA ---
        created_by:     createdBy,     // Identidad del creador
        born_at:        now,           // Fecha de ignición
        mutated_at:     now,           // Última mutación profunda
        mutant_id:      createdBy,     // Última identidad que tocó el átomo
        schema_version: schemaVersion, // Versión del motor

        // --- BLOQUE DE INTEGRIDAD ---
        integrity_hash:  null,         // Huella digital del payload (calculado al guardar)

        // --- BLOQUE DE LINAJE ---
        origin_id:       null,         // ID del átomo padre (clon)
        origin_hash:     null,         // Huella del padre al clonar
        trust_level:     'SOVEREIGN',  // 'SOVEREIGN' | 'SYNCED' | 'DIVERGENT' | 'ORPHAN'

        // --- BLOQUE DE SOCIALIZACIÓN ---
        is_shared:       false,        // ¿Visible para otros Workspaces?
        access_policy:   'PRIVATE',    // 'PRIVATE' | 'READONLY' | 'PUBLIC'
    };
}

/**
 * Crea un bloque _meta para un clon basado en un original.
 */
export function buildCloneMeta({ createdBy, schemaVersion, originAtom }) {
    return {
        ...buildInitialMeta({ createdBy, schemaVersion }),
        origin_id:    originAtom.id,
        origin_hash:  originAtom._meta?.integrity_hash || 'UNKNOWN',
        trust_level:  'SYNCED',
    };
}
/**
 * AXIOMA DE PERCEPCIÓN: La UI no lee bits, lee intenciones.
 * Estas funciones extraen la "clase cognitiva" del átomo para que el Front-end
 * sepa cómo manifestar la realidad del dato.
 */

/**
 * Retorna la Intención Semántica del átomo.
 * @param {Object} atom 
 * @returns {string} 'GENERIC_BOARD' | 'DATA_HYDRATION' | 'CALCULUS' | etc.
 */
export function getAtomPurpose(atom) {
    if (!atom) return 'UNKNOWN';
    
    // Si es un puente, su propósito vive en el payload semántico
    if (atom.class === 'BRIDGE') {
        return atom.payload?.ui_purpose || 'GENERIC_MAPPING';
    }

    return atom.class || 'GENERIC_ATOM';
}

/**
 * Extrae el Mapa de Relacionalidad de un Puente.
 * Traduce IDs crudos a etiquetas comprensibles para el usuario.
 */
export function getBridgeManifest(bridge) {
    if (!bridge || bridge.class !== 'BRIDGE') return null;

    const payload = bridge.payload || {};
    return {
        id: bridge.id,
        purpose: payload.ui_purpose || 'SYNC',
        cognitiveClass: payload.cognitive_class || 'UNKNOWN',
        // Inferencia: La primera fuente suele ser el Satélite (Notion/etc)
        sourceProvider: payload.source_provider || 'satellite', 
        // El target físico (Google Sheets/etc)
        targetProvider: payload.target_provider || 'silo'
    };
}

/**
 * Indica si el puente es una herramienta de Hidratación (Migración de datos).
 */
export function isHydrationBridge(bridge) {
    const purpose = getAtomPurpose(bridge);
    return ['DATA_HYDRATION', 'HYDRATION_TASK', 'MIGRATION'].includes(purpose);
}
