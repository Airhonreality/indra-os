/**
 * =============================================================================
 * SERVICIO: DataProjector.js
 * RESPONSABILIDAD: Transformar Átomos Crudos en Proyecciones AXIOMÁTICAS para la UI.
 *
 * DHARMA:
 *   - Agnosticismo UI: Los componentes no saben qué es un "DATA_SCHEMA".
 *   - Sinceridad Estructural: Solo proyecta lo que el átomo realmente tiene/soporta.
 * =============================================================================
 */

import { registry } from './EngineRegistry';

/**
 * Mapeo canónico de Clases a Temas Visuales (Dharma Visual).
 * Esto podría moverse a un EngineManifest en el futuro.
 */
const CLASS_THEMES = {
    'DATA_SCHEMA': { color: 'var(--color-accent)', icon: 'SCHEMA', label: 'DATA_SCHEMA' },
    'BRIDGE': { color: 'var(--color-cold)', icon: 'BRIDGE', label: 'LOGIC_BRIDGE' },
    'DOCUMENT': { color: 'var(--color-warm)', icon: 'DOCUMENT', label: 'DOCUMENT_TEMPLATE' },
    'VIRTUAL_SERVICE': { color: 'var(--color-info)', icon: 'ATOM', label: 'VIRTUAL_SERVICE' },
    'FOLDER': { color: 'var(--color-text-tertiary)', icon: 'FOLDER', label: 'COLLECTION' }
};

/**
 * Mapeo de Tipos de Campo (DNA Atómico).
 */
const FIELD_TYPES = {
    'TEXT': { label: 'TEXT_STRING', icon: 'SCHEMA', color: 'var(--color-text)' },
    'NUMBER': { label: 'NUMERIC_VALUE', icon: 'SCHEMA', color: 'var(--color-accent)' },
    'DATE': { label: 'TEMPORAL_MARK', icon: 'SCHEMA', color: 'var(--color-info)' },
    'BOOLEAN': { label: 'BINARY_SWITCH', icon: 'SCHEMA', color: 'var(--color-cold)' },
    'RELATION_SELECT': { label: 'EXTERNAL_PORTAL', icon: 'BRIDGE', color: 'var(--color-accent)' },
    'REPEATER': { label: 'RECURSIVE_VECTOR', icon: 'FRAME', color: 'var(--color-warm)' },
    'FRAME': { label: 'STRUCTURAL_FRAME', icon: 'FRAME', color: 'var(--color-text-tertiary)' }
};

export class DataProjector {
    /**
     * Proyecta un átomo crudo en un objeto listo para la UI.
     * @param {Object} atom - El átomo crudo del backend.
     * @returns {Object} - La proyeccion normalizada.
     */
    static projectArtifact(atom) {
        if (!atom) return null;

        const defaultTheme = { color: 'var(--color-text-tertiary)', icon: 'ATOM', label: atom.class };
        const theme = CLASS_THEMES[atom.class] || defaultTheme;

        return {
            id: atom.id,
            provider: atom.provider,
            class: atom.class,

            // Proyeccion de Identidad
            title: atom.handle?.label || atom.label || 'UNTITLED_ATOM',
            subtitle: `${atom.class} // ${atom.id?.substring(0, 8)}`,

            // Proyeccion Visual
            theme: {
                color: theme.color,
                icon: theme.icon,
                groupLabel: theme.label
            },

            // Proyeccion de Capacidades (Protocolos)
            capabilities: {
                canRead: atom.protocols?.includes('ATOM_READ'),
                canUpdate: atom.protocols?.includes('ATOM_UPDATE'),
                canDelete: atom.protocols?.includes('ATOM_DELETE'),
                raw: atom.protocols || []
            },

            // Proyeccion Temporal
            timestamp: atom.updated_at || atom.created_at || Date.now(),

            // Referencia al atomo original (por si acaso)
            raw: atom
        };
    }

    /**
     * Proyecta un átomo de clase DATA_SCHEMA (o cualquier objeto con estructura de tabla)
     * en una definición de columnas normalizada para la UI.
     * @param {Object} schemaSource - El objeto crudo (resultado de ATOM_READ o TABULAR_STREAM).
     */
    static projectSchema(schemaSource) {
        if (!schemaSource) return { fields: [], label: 'UNKNOWN_SCHEMA' };

        // ADR_001: Intentar extraer de metadata.schema
        const metadataSchema = schemaSource.metadata?.schema;
        const rawFields = metadataSchema?.columns || metadataSchema?.fields || schemaSource.payload?.fields || schemaSource.fields || [];

        // Normalizar campos
        const fields = rawFields.map(f => ({
            id: f.id || f.name || f.key,
            label: f.label || f.name || f.id || 'UNTITLED_FIELD',
            type: (f.type || 'text').toLowerCase(),
            metadata: f.metadata || {}
        }));

        return {
            id: schemaSource.id,
            label: schemaSource.handle?.label || schemaSource.label || 'UNTITLED_SCHEMA',
            fields: fields,
            raw: schemaSource
        };
    }

    /**
     * Agrupa una lista de átomos por su clase proyectada.
     * @param {Array} atoms 
     */
    static projectGrid(atoms) {
        const artifacts = atoms.map(a => this.projectArtifact(a)).filter(p => p !== null);

        // Identificar clases únicas
        const classes = [...new Set(artifacts.map(p => p.class))];

        return classes.map(cls => {
            const items = artifacts.filter(p => p.class === cls);
            const firstItem = items[0];

            return {
                id: cls,
                label: firstItem.theme.groupLabel,
                color: firstItem.theme.color,
                items: items
            };
        });
    }
}
