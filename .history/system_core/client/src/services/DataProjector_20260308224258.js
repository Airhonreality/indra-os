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
    'WORKFLOW': { color: '#ff007c', icon: 'TERMINAL', label: 'WORKFLOW' },
    'AEE_RUNNER': { color: 'var(--color-success)', icon: 'PLAY', label: 'OPERATIONAL_RUNNER' },
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

/**
 * Mapeo de Bloques de Documento.
 */
const BLOCK_TYPES = {
    'PAGE': { label: 'NEW_PAGE', icon: 'DOCUMENT', color: 'var(--color-accent)' },
    'FRAME': { label: 'FRAME', icon: 'FRAME', color: 'var(--color-accent)' },
    'TEXT': { label: 'TEXT_BOX', icon: 'TEXT', color: 'var(--color-text)' },
    'IMAGE': { label: 'IMAGE_ASSET', icon: 'IMAGE', color: 'var(--color-info)' },
    'ITERATOR': { label: 'ITERATOR', icon: 'REPEATER', color: 'var(--color-warm)' }
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
     * Proyecta un Espacio de Trabajo.
     */
    static projectWorkspace(ws) {
        if (!ws) return null;
        return {
            id: ws.id,
            title: ws.handle?.label || 'UNNAMED_WORKSPACE',
            description: ws.handle?.description || '',
            subtitle: `ID: ${ws.id?.substring(0, 8)}`,
            pinCount: ws.pins?.length || 0,
            updatedAt: ws.updated_at || ws.created_at || Date.now(),
            raw: ws
        };
    }

    /**
     * Proyecta un Servicio.
     */
    static projectService(svc) {
        if (!svc) return null;
        const raw = svc.raw || svc;
        const needsSetup = raw.needs_setup || false;

        return {
            id: svc.id,
            label: svc.handle?.label || svc.label || svc.id,
            icon: raw.icon || 'SERVICE',
            isReady: !needsSetup,
            error: raw.error || null,
            statusLabel: needsSetup ? 'STATUS_SETUP' : 'STATUS_READY',
            metadata: raw.metadata || {},
            raw: raw
        };
    }

    /**
     * Proyecta la definición de un campo individual.
     * @param {Object} field - El campo crudo del esquema.
     */
    static projectFieldDefinition(field) {
        if (!field) return null;

        const typeKey = (field.type || 'TEXT').toUpperCase();
        const typeMeta = FIELD_TYPES[typeKey] || { label: typeKey, icon: 'ATOM', color: 'inherit' };

        const projected = {
            id: field.id || field.name || field.key,
            alias: field.alias || field.name || field.id,
            label: field.label || field.name || field.id || 'UNTITLED_FIELD',
            type: typeKey,
            theme: {
                color: typeMeta.color,
                icon: typeMeta.icon,
                label: typeMeta.label
            },
            config: field.config || {},
            metadata: field.metadata || {},
            raw: field
        };

        // RECURSION: Si tiene hijos (Frames/Repeaters), proyectarlos también
        if (field.children && Array.isArray(field.children)) {
            projected.children = field.children.map(c => this.projectFieldDefinition(c)).filter(f => f !== null);
        }

        return projected;
    }

    /**
     * Proyecta un bloque de documento.
     */
    static projectDocumentBlock(node) {
        if (!node) return null;
        const meta = BLOCK_TYPES[node.type] || { label: node.type, icon: 'ATOM', color: 'inherit' };
        return {
            id: node.id,
            type: node.type,
            label: meta.label,
            icon: meta.icon,
            color: meta.color,
            raw: node
        };
    }

    /**
     * Retorna las herramientas de creación de bloques.
     */
    static getDocumentTools() {
        return Object.entries(BLOCK_TYPES).map(([key, value]) => ({
            type: key,
            ...value
        }));
    }

    /**
     * Retorna todos los tipos de campo disponibles proyectados.
     */
    static getFieldTypes() {
        return Object.entries(FIELD_TYPES).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    /**
     * Proyecta un átomo de clase DATA_SCHEMA (o cualquier objeto con estructura de tabla)
     * en una definición de columnas normalizada para la UI.
     * @param {Object} schemaSource - El objeto crudo (resultado de ATOM_READ o TABULAR_STREAM).
     */
    static projectSchema(schemaSource) {
        if (!schemaSource) return { fields: [], label: 'UNKNOWN_SCHEMA' };

        // ADR-008: El sistema es sincero. Buscamos en las dos fronteras legales.
        let rawFields = [];
        let label = 'UNTITLED_SCHEMA';
        let id = null;

        // Caso A: Es un Átomo persistido (ATOM_READ)
        if (schemaSource.payload?.fields) {
            rawFields = schemaSource.payload.fields;
            label = schemaSource.handle?.label || 'ERR: NO_IDENTITY_LABEL';
            id = schemaSource.id;
        }
        // Caso B: Es un Resultado de Stream (TABULAR_STREAM)
        else if (schemaSource.metadata?.schema?.fields) {
            rawFields = schemaSource.metadata.schema.fields;
            label = schemaSource.handle?.label || schemaSource.metadata.context?.db_name || 'ERR: NO_STREAM_LABEL';
            id = schemaSource.id || schemaSource.metadata.context?.db_id;
        }

        // Proyección Recursiva
        const fields = rawFields.map(f => this.projectFieldDefinition(f)).filter(f => f !== null);

        return {
            id: id,
            label: label,
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
