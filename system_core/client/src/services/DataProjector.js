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

const CLASS_THEMES = {
    // ESTADIO 1: POTENCIA (Materia Prima / Inercia) -> AMBAR
    'DATA_SCHEMA': { color: 'var(--color-warm)', icon: 'SCHEMA', label: 'ESQUEMA_DATOS' },
    'FOLDER': { color: 'var(--color-warm)', icon: 'FOLDER', label: 'COLECCIÓN' },
    'DATABASE': { color: 'var(--color-warm)', icon: 'SCHEMA', label: 'BASE_DATOS' },

    // ESTADIO 2: AGENCIA (Motores / Resonancia) -> CIAN
    'BRIDGE': { color: 'var(--color-accent)', icon: 'BRIDGE', label: 'PUENTE_LÓGICO' },
    'WORKFLOW': { color: 'var(--color-accent)', icon: 'WORKFLOW', label: 'FLUJO_PROCESO' },
    'AEE_RUNNER': { color: 'var(--color-accent)', icon: 'PLAY', label: 'EJECUTOR_OPERATIVO' },
    'VIRTUAL_SERVICE': { color: 'var(--color-accent)', icon: 'ATOM', label: 'SERVICIO_VIRTUAL' },

    // ESTADIO 3: MATERIALIZACIÓN (Resultados / Teleología) -> PÚRPURA/FRÍO
    'DOCUMENT': { color: 'var(--color-cold)', icon: 'DOCUMENT', label: 'DOCUMENTO' },
    'VIDEO_PROJECT': { color: 'var(--color-cold)', icon: 'PLAY', label: 'PROYECTO_VIDEO' },
    'CALENDAR_HIVE': { color: 'var(--color-cold)', icon: 'CALENDAR', label: 'AGENDA_HIVE' },
    'CALENDAR_EVENT': { color: 'var(--color-cold)', icon: 'CALENDAR', label: 'EVENTO' },
    
    // SISTEMA / SERVICIOS
    'SERVICE': { color: 'var(--color-success)', icon: 'SERVICE', label: 'SERVICIO' }
};


/**
 * Mapeo de Tipos de Campo (DNA Atómico).
 */
const FIELD_TYPES = {
    'TEXT': { label: 'Texto', icon: 'SCHEMA', color: 'var(--color-text-primary)' },
    'NUMBER': { label: 'Número', icon: 'SCHEMA', color: 'var(--color-accent)' },
    'DATE': { label: 'Fecha', icon: 'SCHEMA', color: 'var(--color-info)' },
    'BOOLEAN': { label: 'Interruptor (Sí/No)', icon: 'SCHEMA', color: 'var(--color-cold)' },
    'RELATION_SELECT': { label: 'Relación (Buscador)', icon: 'BRIDGE', color: 'var(--color-accent)' },
    'COMPUTED': { label: 'Cálculo / Fórmula', icon: 'MAGIC', color: 'var(--color-accent)' },
    'REPEATER': { label: 'Repetidor (Lista)', icon: 'FRAME', color: 'var(--color-warm)' },
    'FRAME': { label: 'Grupo (Contenedor)', icon: 'FRAME', color: 'var(--color-text-secondary)' }
};

/**
 * Mapeo de Bloques de Documento.
 */
const BLOCK_TYPES = {
    'PAGE': { label: 'Página', icon: 'DOCUMENT', color: 'var(--color-accent)' },
    'FRAME': { label: 'Caja / Marco', icon: 'FRAME', color: 'var(--color-cold)' },
    'TEXT': { label: 'Bloque de Texto', icon: 'TEXT', color: 'var(--color-text-primary)' },
    'IMAGE': { label: 'Imagen', icon: 'IMAGE', color: 'var(--color-info)' },
    'ITERATOR': { label: 'Bucle (Lista)', icon: 'REPEATER', color: 'var(--color-warm)' }
};

const AGENTIC_CATEGORIES = {
    POTENCY: ['DATA_SCHEMA', 'FOLDER', 'ACCOUNT_IDENTITY'],
    AGENCY: ['BRIDGE', 'WORKFLOW', 'AEE_RUNNER', 'VIRTUAL_SERVICE'],
    MANIFESTATION: ['VIDEO_PROJECT', 'CALENDAR_HIVE', 'CALENDAR_EVENT', 'DOCUMENT'],
    SERVICE: ['SERVICE', 'DATABASE']
};

export class DataProjector {
    /**
     * Proyecta un átomo crudo en un objeto listo para la UI.
     * @param {Object} atom - El átomo crudo del backend.
     * @returns {Object} - La proyeccion normalizada.
     */
    static projectArtifact(atom) {
        if (!atom) return null;

        const defaultTheme = { color: 'var(--color-accent)', icon: 'ATOM', label: atom.class || 'ARTEFACTO' };
        
        // Sinceridad de Origen: Detectar si es un servicio navegable (Silo) o un servicio proyectado
        const isProjectedService = !!atom.label && !!atom.id && !atom.class;
        const isService = atom.protocols?.includes('HIERARCHY_TREE') || atom.provider_base || isProjectedService || (!atom.class && atom.id);
        const atomClass = atom.class || (isService ? 'SERVICE' : 'ATOM');
        
        const theme = CLASS_THEMES[atomClass] || defaultTheme;
        const color = atom.color || theme.color;

        return {
            id: atom.id,
            provider: atom.provider || atom.id, // Para servicios, el id suele ser el provider
            class: atomClass,

            // Proyección de Identidad (Sinceridad Radical ADR-008)
            // Se elimina SIN_NOMBRE. Si no hay identidad, hay una DEUDA DE IDENTIDAD que debe ser visible.
            title: atom.handle?.label || atom.label || atom.id || atom.provider || (isService ? atom.provider_base : null) || '[DEUDA_IDENTIDAD]',
            subtitle: `${atomClass} // ${atom.provider || atom.id || '??'}`,

            // Proyeccion Visual
            theme: {
                color: color,
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

            // Proyeccion de Densidad (Carga Cognitiva)
            density: this._calculateDensity(atom),

            // Referencia al atomo original (por si acaso)
            raw: atom
        };
    }

    /**
     * Calcula la "densidad" o peso del átomo para indicadores UI.
     */
    static _calculateDensity(atom) {
        if (!atom.payload) return 0;
        
        switch (atom.class) {
            case 'DATA_SCHEMA':
                return atom.payload.fields?.length || 0;
            case 'BRIDGE':
            case 'WORKFLOW':
                return (atom.payload.sources?.length || 0) + (atom.payload.steps?.length || 0);
            case 'FOLDER':
                return atom.payload.children?.length || 0;
            case 'VIDEO_PROJECT':
                return atom.payload.timeline?.length || 0;
            default:
                return 0;
        }
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
        
        // Mapeo inteligente de iconos fallbacks
        const iconMap = {
            'system': 'VAULT',
            'calendar_universal': 'CALENDAR',
            'drive': 'FOLDER',
            'notion': 'DATABASE',
            'email': 'MAIL',
            'llm': 'ATOM_VIRTUAL'
        };

        const baseId = svc.provider_base || svc.id?.split(':')[0] || 'unknown';

        return {
            id: svc.id,
            label: svc.handle?.label || svc.label || svc.id || 'GENERIC_PROVIDER',
            icon: svc.icon || raw.icon || iconMap[baseId] || 'SERVICE',
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
            id: field.id || 'ERR: NO_ID',
            alias: field.alias || 'ERR: NO_ALIAS',
            label: field.label || 'UNTITLED_FIELD',
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
        if (!schemaSource) return { fields: [], label: 'ESQUEMA_DESCONOCIDO' };

        // ADR-008: Sinceridad Total en las dos Fronteras Legales.
        let rawFields = [];
        let label = 'ESQUEMA_SIN_TÍTULO';
        let id = null;

        // Caso A: Átomo completo (ATOM_READ) -> payload.fields es ley.
        if (schemaSource.payload?.fields) {
            rawFields = schemaSource.payload.fields;
            label = schemaSource.handle?.label || 'ERROR: SIN_IDENTIDAD';
            id = schemaSource.id;
        }
        // Caso B: Proyección Dinámica (TABULAR_STREAM) -> metadata.schema.fields es ley.
        else if (schemaSource.metadata?.schema?.fields) {
            rawFields = schemaSource.metadata.schema.fields;
            label = schemaSource.handle?.label || schemaSource.metadata.context?.db_name || 'PROYECCIÓN_DE_DATOS';
            id = schemaSource.id || schemaSource.metadata.context?.db_id;
        }

        // Proyección Recursiva (Estándar INDRA)
        const fields = rawFields.map(f => this.projectFieldDefinition(f)).filter(f => f !== null);

        return {
            id: id,
            label: label,
            fields: fields,
            bridge_id: schemaSource.payload?.bridge_id || schemaSource.metadata?.bridge_id || null, 
            raw: schemaSource
        };
    }

    /**
     * Proyecta un nodo de Workflow (Estación).
     */
    static projectStation(station) {
        if (!station) return null;
        return {
            id: station.id || 'ERR: NO_STATION_ID',
            label: station.config?.label || 'ERR: STATION_NO_LABEL',
            type: station.type || 'PROTOCOL',
            raw: station
        };
    }

    /**
     * Proyecto el Workspace bajo el modelo Agentic (20/50/30).
     */
    static projectAgenticWorkspace(atoms) {
        const artifacts = atoms.map(a => this.projectArtifact(a)).filter(p => p !== null);

        // Agrupación por intención
        const potency = artifacts.filter(p => AGENTIC_CATEGORIES.POTENCY.includes(p.class));
        const agency = artifacts.filter(p => AGENTIC_CATEGORIES.AGENCY.includes(p.class));
        const manifestation = artifacts.filter(p => AGENTIC_CATEGORIES.MANIFESTATION.includes(p.class));

        // Capturar "Huérfanos de Categoría" para evitar pérdida de datos
        const others = artifacts.filter(p => 
            !AGENTIC_CATEGORIES.POTENCY.includes(p.class) && 
            !AGENTIC_CATEGORIES.AGENCY.includes(p.class) && 
            !AGENTIC_CATEGORIES.MANIFESTATION.includes(p.class)
        );

        return {
            potency: [...potency, ...others], // Por defecto, lo desconocido es materia prima
            agency,
            manifestation
        };
    }

    /**
     * Agrupa una lista de átomos por su clase proyectada (Legacy Grid).
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
