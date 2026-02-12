import { SEMANTIC_MANIFEST } from './Semantic_Manifest';
import { inferSlot } from './SkinConstitution';

/**
 * Law_Compiler.js
 * DHARMA: Compilador de Leyes Fenotípicas.
 * Misión: Traducir Genotipo (Datos Crudos) a Fenotipo (React Props).
 */

class LawCompiler {
    constructor() {
        this._ontology = {};
        this._genotype = {}; // Full Genotype Context
        this._renderManifest = [];
        this._modulesByLevel = {};
        this._schemas = {};
        this._enrichedRegistry = {}; // Cache de items compilados
        this._isCompiled = false;
    }

    get ontology() { return this._ontology; }
    get isCompiled() { return this._isCompiled; }

    /**
     * Inyecta los esquemas de artefactos (Artifact Schemas)
     */
    setArtifactSchemas(schemas) {
        this._schemas = schemas || {};
        console.log(`[LawCompiler] Esquemas de artefactos inyectados: ${Object.keys(this._schemas).length} tipos.`);
    }

    /**
     * Inyecta la Ontología cruda (Component Registry)
     */
    setOntology(ontology, genotype) {
        this._ontology = ontology || {};
        this._genotype = genotype || {};
        console.log(`[LawCompiler] Ontología inyectada: ${Object.keys(this._ontology).length} activos.`);
    }

    /**
     * Procesa la ontología para generar el Manifiesto de Render.
     * Aquí se aplican las Leyes visuales y la cartografía de slots.
     */
    compile() {
        console.log(`[LawCompiler] Iniciando compilación de leyes (Enriquecimiento Fenotípico)...`);

        const rawItems = Object.values(this._ontology);
        this._enrichedRegistry = {};

        this._renderManifest = rawItems.map((item, index) => {
            const id = item.id || item.ID || `UNKNOWN_ID_${index}`;
            // AXIOMA: Búsqueda Recursiva de Identidad
            // 1. Por Clave Primaria (Ej: 'PROPERTY_INSPECTOR')
            let semanticRef = SEMANTIC_MANIFEST[id];

            // 2. Por ID Técnico (Si el backend usa 'view_property_inspector')
            if (!semanticRef) {
                semanticRef = Object.values(SEMANTIC_MANIFEST).find(manifestItem =>
                    manifestItem.technical_id === id
                ) || {};
            }

            // Construimos el objeto compilado (El Fenotipo)
            const compiled = {
                ...item,
                id: id,
                omd: item.omd || item.OMD || id || semanticRef.technical_id || 'UNKNOWN_OMD',
                slot: item.slot || item.SLOT || semanticRef.slot || inferSlot(item),

                // AXIOMA: Asegurar campos para ComponentProjector (ADR-008)
                // AXIOMA: Asegurar campos para ComponentProjector (ADR-008)
                LABEL: item.LABEL || item.label || semanticRef.LABEL || semanticRef.functional_name || 'UNIT_SKELETON',
                ARCHETYPE: item.ARCHETYPE || item.archetype || (item.ARCHETYPES ? item.ARCHETYPES[0] : null) || (semanticRef.config ? semanticRef.config.archetype : 'SERVICE'),
                DOMAIN: item.DOMAIN || item.domain || (semanticRef.config ? semanticRef.config.intent : 'SYSTEM'),

                layer: item.LEVEL || item.level || semanticRef.layer || 'NIVEL_3',
                // AXIOMA: Normalización de Capacidades (Inferencia de IO)
                CAPABILITIES: this._normalizeCapabilities(item.CAPABILITIES || item.capabilities || item.methods || {}),
                ui_layout_hint: item.ui_layout_hint || semanticRef.ui_layout_hint || 'LAYOUT_SMART_FORM'
            };

            this._enrichedRegistry[id.toLowerCase()] = compiled;
            return compiled;
        });

        // Indexar por niveles para SystemAssembler
        this._modulesByLevel = {};
        this._renderManifest.forEach(module => {
            const level = module.layer || 0;
            // Normalizar niveles semánticos (NIVEL_1 -> 1)
            const numericLevel = typeof level === 'string' ? (parseInt(level.split('_')[1]) || 0) : level;

            if (!this._modulesByLevel[numericLevel]) this._modulesByLevel[numericLevel] = [];
            this._modulesByLevel[numericLevel].push(module);
        });

        console.log(`[LawCompiler] Compilación finalizada. Manifiesto: ${this._renderManifest.length} items.`);
        this._isCompiled = true;
        return this._renderManifest;
    }

    /**
     * Normaliza capacidades infiriendo IO si falta.
     */
    _normalizeCapabilities(caps) {
        const normalized = {};
        // Si es array de strings (métodos crudos), convertirlos a objetos
        let entries = [];
        if (Array.isArray(caps)) {
            entries = caps.map(k => [k, {}]);
        } else if (typeof caps === 'object' && caps !== null) {
            entries = Object.entries(caps);
        }

        entries.forEach(([key, val]) => {
            const meta = (typeof val === 'object' && val !== null) ? val : {};
            // Inferencia Heurística de IO
            let io = meta.io;
            if (!io) {
                const lowerKey = String(key).toLowerCase();
                if (lowerKey.match(/^(get|read|fetch|list|scan|query|search|check|retrieve)/)) io = 'READ';
                else if (lowerKey.match(/^(set|write|update|create|delete|add|remove|send|post|exec|insert|append)/)) io = 'WRITE';
                else if (lowerKey.match(/^(on|listen|sub|watch)/)) io = 'STREAM';
                else io = 'TRIGGER'; // Default seguro (Input)
            }

            normalized[key] = {
                ...meta,
                io: io,
                type: meta.type || 'SIGNAL',
                human_label: meta.human_label || meta.desc || key
            };
        });
        return normalized;
    }

    /**
     * Obtiene el Canon (Definición completa) de un componente por ID.
     */
    getCanon(id) {
        if (!id) return null;
        const lowerId = String(id).toLowerCase();

        // 1. Intentar obtener el item enriquecido (Fenotipo)
        if (this._enrichedRegistry[lowerId]) return this._enrichedRegistry[lowerId];

        // 2. Fallback a la Ontología cruda (Genotipo)
        if (this._ontology[id]) return this._ontology[id];

        // 3. Búsqueda insensible a mayúsculas en crudo
        const found = Object.values(this._ontology).find(m =>
            (m.id || m.ID || '').toLowerCase() === lowerId
        );

        if (!found) {
            // console.warn(`[LawCompiler] Canon not found for ID: ${id}`);
        }

        return found;
    }

    /**
     * Retorna todo el manifiesto compilado.
     */
    getRenderManifest() {
        return this._renderManifest;
    }

    /**
     * Retorna módulos por nivel jerárquico.
     */
    getModulesByLevel(level) {
        return this._modulesByLevel[level] || [];
    }
}

// Singleton Instance
const compiler = new LawCompiler();
export default compiler;
