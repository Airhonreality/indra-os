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
