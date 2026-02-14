/**
 * DataConventions.js
 * DHARMA: Registro Canónico de Convenciones de Persistencia (ADR 003)
 * 
 * Define qué campos de un artefacto se persisten en snapshots y cuáles son volátiles.
 * Este módulo vive en el Front para mantener la Soberanía Local sin depender del Backend.
 */

/**
 * Reglas de Persistencia Selectiva
 * 
 * AXIOMA: El snapshot solo persiste "Identidad y Geometría" de INDRA,
 * nunca "Contenido Dinámico" de Terceros.
 */
export const PERSISTENCE_RULES = {
    /**
     * Campos SIEMPRE persistidos (Core de INDRA)
     * Estos definen la estructura, identidad y configuración del artefacto.
     */
    PERSISTED_ALWAYS: [
        'id',              // Identidad única del artefacto
        'type',            // Tipo de artefacto (NODE, ADAPTER, NOTE, etc.)
        'identity',        // { label, description } - Metadatos de usuario
        'position',        // { x, y } - Geometría espacial en el canvas
        'layer',           // Organización visual (ej: "proyectos", "infraestructura")
        'config',          // Configuración estática del adapter (ej: databaseId de Notion)
        'capabilities',    // Permisos y métodos habilitados del artefacto
        'userContent',     // ✅ Datos creados por el usuario (anotaciones, aprobaciones)
        'relationships',   // Conexiones con otros nodos (solo en nivel Cosmos)
        'metadata'         // Metadata adicional (createdAt, updatedAt, tags)
    ],

    /**
     * Campos NUNCA persistidos (Volátiles)
     * Estos son estados temporales, cache o datos provenientes de APIs externas.
     */
    NEVER_PERSISTED: [
        '_isDirty',        // Flag de mutación pendiente (UI)
        '_simulated',      // Flag de optimistic update (UI)
        '_tombstoned',     // Flag de eliminación pendiente (UI)
        '_liveData',       // ❌ Cache de consultas a terceros (Notion, Google, etc.)
        '_cache',          // Cache temporal de cualquier tipo
        '_fetching',       // Estado de carga (loading) para UI
        '_error',          // Error de última consulta a API
        '_lastFetched',    // Timestamp de última consulta
        '_adapterState',   // Estado interno volátil del adapter
        '_uiState',        // Estado de UI (collapsed, selected, etc.)
        '_virtualData',    // Datos calculados que se regeneran al montar
        '_isGhost',        // 👻 Artefactos Fantasma del Garage (No persistir)
        '_isMock'          // 🧪 Artefactos de Prueba (No persistir)
    ],

    /**
     * Campos CONDICIONALES (según tipo de artefacto)
     * Se persisten solo si el artefacto es del tipo especificado.
     */
    CONDITIONAL: {
        // Para artefactos de tipo NOTE o USER_ANNOTATION
        NOTE: ['userContent', 'annotations', 'createdAt', 'createdBy'],

        // Para adapters externos (Notion, Google, etc.)
        ADAPTER: ['config', 'capabilities', 'adapterType'],

        // Para layouts espaciales
        LAYOUT: ['nodes', 'VIEW_MODE', 'zoom', 'viewport'],

        // Para artefactos de tipo FLOW (lógica visual)
        FLOW: ['steps', 'triggers', 'conditions']
    }
};

/**
 * Limpia un artefacto para ser incluido en un snapshot.
 * Elimina todos los campos volátiles según PERSISTENCE_RULES.
 * 
 * @param {Object} artifact - Artefacto completo del estado
 * @returns {Object} - Artefacto limpio listo para persistencia
 * 
 * @example
 * const dirty = {
 *   id: 'art_001',
 *   type: 'NOTION_ADAPTER',
 *   config: { databaseId: 'xyz' },
 *   _liveData: { price: 1500 },
 *   _fetching: false
 * };
 * 
 * const clean = cleanArtifactForSnapshot(dirty);
 * // { id: 'art_001', type: 'NOTION_ADAPTER', config: { databaseId: 'xyz' } }
 */
export function cleanArtifactForSnapshot(artifact) {
    if (!artifact || typeof artifact !== 'object') {
        console.warn('[DataConventions] Invalid artifact for cleaning:', artifact);
        return artifact;
    }

    const clean = { ...artifact };

    // Eliminar todos los campos volátiles
    PERSISTENCE_RULES.NEVER_PERSISTED.forEach(field => {
        delete clean[field];
    });

    // Preservar solo los campos condicionales que aplican al tipo
    const artifactType = artifact.type;
    if (artifactType && PERSISTENCE_RULES.CONDITIONAL[artifactType]) {
        const allowedConditional = PERSISTENCE_RULES.CONDITIONAL[artifactType];
        // Los campos condicionales ya están en el objeto, solo validamos que existan
        // (no necesitamos filtrar porque PERSISTED_ALWAYS ya los incluye)
    }

    return clean;
}

/**
 * Limpia un array de relaciones (cables) para snapshot.
 * Similar a cleanArtifactForSnapshot pero para relationships.
 * 
 * @param {Array} relationships - Array de relaciones
 * @returns {Array} - Relaciones limpias
 */
export function cleanRelationshipsForSnapshot(relationships) {
    if (!Array.isArray(relationships)) return [];

    return relationships.map(rel => {
        const clean = { ...rel };

        // Eliminar flags volátiles de relaciones
        delete clean._isDirty;
        delete clean._simulated;
        delete clean._tombstoned;
        delete clean._uiState;

        return clean;
    });
}

/**
 * Valida si un campo debe persistirse según las reglas.
 * Útil para debugging y auditoría.
 * 
 * @param {string} fieldName - Nombre del campo
 * @param {string} artifactType - Tipo de artefacto (opcional)
 * @returns {boolean} - true si el campo debe persistirse
 */
export function shouldPersistField(fieldName, artifactType = null) {
    // Verificar si está en la lista de nunca persistidos
    if (PERSISTENCE_RULES.NEVER_PERSISTED.includes(fieldName)) {
        return false;
    }

    // Verificar si está en la lista de siempre persistidos
    if (PERSISTENCE_RULES.PERSISTED_ALWAYS.includes(fieldName)) {
        return true;
    }

    // Verificar si es condicional y aplica al tipo
    if (artifactType && PERSISTENCE_RULES.CONDITIONAL[artifactType]) {
        return PERSISTENCE_RULES.CONDITIONAL[artifactType].includes(fieldName);
    }

    // Por defecto, permitir persistencia de campos no listados
    // (esto da flexibilidad para futuros campos sin romper el sistema)
    return true;
}

/**
 * Genera un reporte de limpieza para debugging.
 * Útil para entender qué se eliminó del snapshot.
 * 
 * @param {Object} artifact - Artefacto original
 * @returns {Object} - { removed: [], preserved: [] }
 */
export function getCleaningReport(artifact) {
    const removed = [];
    const preserved = [];

    Object.keys(artifact).forEach(field => {
        if (PERSISTENCE_RULES.NEVER_PERSISTED.includes(field)) {
            removed.push(field);
        } else {
            preserved.push(field);
        }
    });

    return { removed, preserved };
}

export default {
    PERSISTENCE_RULES,
    cleanArtifactForSnapshot,
    cleanRelationshipsForSnapshot,
    shouldPersistField,
    getCleaningReport
};
