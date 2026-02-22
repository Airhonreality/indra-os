import { SEMANTIC_MANIFEST } from './Semantic_Manifest.js';


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
     * Recupera un esquema de artefacto por ID.
     */
    getArtifactSchema(schemaId) {
        if (!schemaId) return null;
        return this._schemas?.[schemaId] || this._schemas?.[schemaId.toUpperCase()];
    }

    /**
     * Inyecta la Ontología cruda (Component Registry)
     */
    setOntology(ontology, genotype) {
        this._ontology = ontology || {};
        this._genotype = genotype || {};
        // console.log(`[LawCompiler] Ontología inyectada: ${Object.keys(this._ontology).length} activos.`);
    }

    /**
     * Procesa la ontología para generar el Manifiesto de Render.
     * Aquí se aplican las Leyes visuales y la cartografía de slots.
     */
    /**
     * AXIOMA V8.5 (ADR-017): Deep Merge Profundo Universal
     * Fusiona objetos recursivamente permitiendo que Frontend y Backend colaboren.
     */
    _deepMerge(base, override) {
        if (!base || typeof base !== 'object') return override;
        if (!override || typeof override !== 'object') return base;

        const result = { ...base };
        for (const key in override) {
            const overrideValue = override[key];
            const baseValue = result[key];

            // Arrays se reemplazan (no se fusionan elemento a elemento)
            if (Array.isArray(overrideValue)) {
                result[key] = overrideValue;
            }
            // Objetos se fusionan recursivamente
            else if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
                result[key] = this._deepMerge(baseValue || {}, overrideValue);
            }
            // Primitivos sobrescriben
            else {
                result[key] = overrideValue;
            }
        }
        return result;
    }

    compile() {
        // console.log(`[LawCompiler] ADR-022: Iniciando compilación bifurcada (Real | Virtual)...`);

        // AXIOMA: Los únicos items que necesitan el SemanticManifest son los virtuales.
        // Los items reales (backend) vienen ya canónicos del GenotypeDistiller (ADR-022 Paso 1).
        const virtualItems = Object.entries(SEMANTIC_MANIFEST)
            .filter(([_, def]) => def.isVirtual)
            .map(([key, def]) => ({ ...def, id: key, _isVirtualItem: true }));

        // console.log(`[LawCompiler] 🔍 Virtual Items: ${virtualItems.length} | Real Items: ${Object.values(this._ontology).length}`);

        const rawItems = [...Object.values(this._ontology), ...virtualItems];
        this._enrichedRegistry = {};

        this._renderManifest = rawItems.map((item, index) => {
            const id = item.id || item.ID || `UNKNOWN_ID_${index}`;
            return this.compileItem(item, id);
        });

        // Indexar por niveles para SystemAssembler
        this._modulesByLevel = {};
        this._renderManifest.forEach(module => {
            const level = module.LEVEL || module.layer || 0;
            const numericLevel = typeof level === 'string' ? (parseInt(level.split('_')[1]) || 0) : level;
            if (!this._modulesByLevel[numericLevel]) this._modulesByLevel[numericLevel] = [];
            this._modulesByLevel[numericLevel].push(module);
        });

        const realCount = this._renderManifest.filter(m => !m.isVirtual).length;
        const virtualCount = this._renderManifest.filter(m => m.isVirtual).length;
        // console.log(`[LawCompiler] ADR-022 Compilación finalizada. Real: ${realCount} | Virtual: ${virtualCount}`);
        this._isCompiled = true;
        return this._renderManifest;
    }

    /**
     * compileItem: Reifica un artefacto individual siguiendo el Protocolo V14.
     * DHARMA: El CANON es la Verdad. No hay heurística.
     */
    compileItem(item, forcedId = null) {
        const id = forcedId || item.id || item.ID;

        // AXIOMA V14: Prioridad absoluta al CANON declarado
        const canon = item.CANON || item.canon || {};
        const source = { ...item, ...canon }; // El canon sobrescribe la raíz si hay colisión

        // 1. NORMALIZACIÓN DE IDENTIDAD TRIATÓMICA (Honestidad Radical)
        const archetype = (source.ARCHETYPE || source.archetype) ? (source.ARCHETYPE || source.archetype).toUpperCase() : null;
        const domain = (source.DOMAIN || source.domain) ? (source.DOMAIN || source.domain).toUpperCase() : null;

        // 2. EXTRACCIÓN Y NORMALIZACIÓN DE CAPACIDADES
        const normalizedCaps = this._normalizeCapabilities(
            source.CAPABILITIES || source.capabilities || {},
            domain
        );

        const compiled = {
            id: id,
            LABEL: source.LABEL || source.label || source.name || null,
            ARCHETYPE: archetype,
            DOMAIN: domain,
            LEVEL: source.LEVEL || source.layer || null,
            CAPABILITIES: normalizedCaps,
            traits: source.traits || canon.traits || [],
            origin: source.origin || source.ORIGIN_SOURCE || null,

            // Metadatos Contractuales
            VITAL_SIGNS: source.VITAL_SIGNS || source.vital_signs || {},
            UI_LAYOUT: source.UI_LAYOUT || source.ui_layout || {},

            // Flags de Estado
            isVirtual: !!(item.isVirtual || item._isVirtualItem),

            // Propiedades de Proyección Legacy (Mantener solo si es estrictamente necesario)
            slot: source.slot || null,
            omd: source.omd || (id ? id.toUpperCase() : null)
        };

        // SERIALIZATION GUARD
        Object.keys(compiled).forEach(k => {
            if (typeof compiled[k] === 'function' || typeof compiled[k] === 'symbol') delete compiled[k];
        });

        this._enrichedRegistry[id.toLowerCase()] = compiled;
        return compiled;
    }

    /**
     * compileCosmos: Compila un plano completo de realidad. 
     * Implementa la "Excavación de Esencia" (Extractor) para el Envelope 2.2.
     */
    compileCosmos(cosmosState) {
        if (!cosmosState) return null;

        console.log("[LawCompiler] 🔍 Compiling Cosmos. State keys:", Object.keys(cosmosState));

        // AXIOMA: Excavación de Esencia (Extractor)
        // Buscamos la carga útil en las capas de transporte conocidas
        let artifactsSource =
            cosmosState.artifacts ||
            cosmosState.payload?.artifacts ||
            cosmosState.result?.artifacts ||
            cosmosState.artifacts_map ||
            cosmosState.phenotype?.artifacts;

        let relationshipsSource =
            cosmosState.relationships ||
            cosmosState.payload?.relationships ||
            (Array.isArray(cosmosState.result) ? cosmosState.result[0]?.relationships : null) ||
            [];

        const compiledArtifacts = {};
        const rawArtifacts = Array.isArray(artifactsSource)
            ? artifactsSource
            : Object.values(artifactsSource || {});

        console.log(`[LawCompiler] 🏗️ Founding ${rawArtifacts.length} raw artifacts to compile.`);

        rawArtifacts.forEach(art => {
            const id = art.id || art.ID;
            if (id) compiledArtifacts[id] = this.compileItem(art, id);
        });

        return {
            ...cosmosState,
            LABEL: cosmosState.LABEL || cosmosState.identity?.label || cosmosState.payload?.LABEL || cosmosState.id,
            artifacts: compiledArtifacts,
            relationships: (relationshipsSource || []).map(rel => ({
                ...rel,
                id: rel.id || rel.ID || `rel_${Math.random().toString(36).substr(2, 9)}`
            }))
        };
    }

    /**
     * Normaliza capacidades infiriendo IO y etiquetas canónicas.
     * AXIOMA: Traduce el lenguaje técnico del adaptador al lenguaje funcional del front.
     */
    _normalizeCapabilities(caps, itemDomain = 'SYSTEM') {
        const normalized = {};
        let entries = [];
        if (Array.isArray(caps)) {
            entries = caps.map(k => [k, {}]);
        } else if (typeof caps === 'object' && caps !== null) {
            entries = Object.entries(caps);
        }

        entries.forEach(([key, val]) => {
            const meta = (typeof val === 'object' && val !== null) ? val : {};

            // AXIOMA: Contrato Explícito (ADR-022)
            const io = meta.io;
            const traits = meta.traits || [];

            normalized[key] = {
                id: meta.id || key,
                ...meta,
                io: io,
                traits: Array.isArray(traits) ? traits : [traits],
                type: (meta.type || 'SIGNAL').toUpperCase(),
                LABEL: meta.LABEL || meta.label || meta.desc || key
            };

            if (typeof normalized[key].icon !== 'string') delete normalized[key].icon;
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
     * Sugiere nodos compatibles basados en el Contrato de Salida del origen.
     * AXIOMA: La compatibilidad la dictan los puertos (IO Mapping), no el nombre.
     */
    getCompatibleNodes(sourceNodeId) {
        if (!this._isCompiled) return [];
        const sourceCanon = this.getCanon(sourceNodeId);
        if (!sourceCanon) return [];

        const sourceCaps = Object.values(sourceCanon.CAPABILITIES || {});
        const outputTypes = sourceCaps
            .filter(cap => ['READ', 'STREAM', 'PROBE', 'OUTPUT'].includes(cap.io))
            .map(cap => (cap.type || 'SIGNAL').toUpperCase());

        // Si no hay salidas claras, no podemos sugerir nada por contrato puro.
        if (outputTypes.length === 0) return [];

        // Reglas de Sintonía Fina: Buscamos nodos que tengan una entrada compatible.
        return this._renderManifest.filter(m => {
            if (m.id === sourceNodeId) return false; // No sugerir auto-loop

            const targetCaps = Object.values(m.CAPABILITIES || {});
            const inputTypes = targetCaps
                .filter(cap => ['WRITE', 'TRIGGER', 'INPUT'].includes(cap.io))
                .map(cap => (cap.type || 'SIGNAL').toUpperCase());

            // AXIOMA: Intersección de Frecuencias
            // Un nodo es sugerido si acepta al menos uno de los tipos de salida del origen.
            const isMatch = outputTypes.some(out => inputTypes.includes(out));

            // Caso Especial: Los Receptores/Compositores aceptan casi todo lo visualiable.
            const isVisualCompositor = !!targetCaps.find(c => c.io === 'INPUT' || c.io === 'WRITE') && (targetCaps.some(c => c.id === 'RECEIVE' || c.id === 'PROJECTION'));

            return isMatch || isVisualCompositor;
        }).slice(0, 5); // Limitar sugerencias para visibilidad
    }

    /**
     * AXIOMA V8.6: Compilación Atómica de Slots (Interstellar Hydration)
     * Procesa una definición de slot individual realizando el Deep Merge con 
     * el manifiesto semántico local.
     */
    compileSlot(baseDef, context = {}) {
        const id = baseDef.id || baseDef.technical_id || baseDef.ID;

        // 1. Localizar la Verdad Virtual (Frontend)
        let semanticRef = SEMANTIC_MANIFEST[id];
        if (!semanticRef) {
            semanticRef = Object.values(SEMANTIC_MANIFEST).find(m => m.technical_id === id) || {};
        }

        // 2. Fusionar Genotipo (Backend) con Verdad Virtual (Frontend)
        const finalDef = this._deepMerge(semanticRef, baseDef);

        // 3. Normalizar Capacidades del Slot
        if (finalDef.CAPABILITIES || finalDef.methods) {
            finalDef.CAPABILITIES = this._normalizeCapabilities(finalDef.CAPABILITIES || finalDef.methods);
        }

        // 4. Asegurar Identidad Fenotípica
        return {
            ...finalDef,
            id: id,
            LABEL: finalDef.LABEL || 'VIRTUAL_SLOT',
            ARCHETYPE: (finalDef.ARCHETYPE || 'COMPOSITOR').toUpperCase(),
            isVirtual: true
        };
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




