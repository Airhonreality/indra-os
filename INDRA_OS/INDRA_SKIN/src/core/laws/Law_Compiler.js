import { SEMANTIC_MANIFEST } from './Semantic_Manifest';


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
        console.log(`[LawCompiler] Ontología inyectada: ${Object.keys(this._ontology).length} activos.`);
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
        console.log(`[LawCompiler] Iniciando compilación de leyes (Enriquecimiento Fenotípico)...`);

        // AXIOMA: Fusión de Realidades (Soberanía Física + Proyección Virtual)
        const virtualItems = Object.entries(SEMANTIC_MANIFEST)
            .filter(([_, def]) => def.isVirtual)
            .map(([key, def]) => ({ ...def, id: key }));

        console.log(`[LawCompiler] 🔍 Virtual Items Found: ${virtualItems.length}`);
        virtualItems.forEach(v => console.log(`  - ${v.id} (${v.ARCHETYPE})`));

        const rawItems = [...Object.values(this._ontology), ...virtualItems];
        this._enrichedRegistry = {};

        this._renderManifest = rawItems.map((item, index) => {
            const id = item.id || item.ID || `UNKNOWN_ID_${index}`;

            // AXIOMA: Búsqueda Recursiva de Identidad
            let semanticRef = SEMANTIC_MANIFEST[id];
            if (!semanticRef) {
                semanticRef = Object.values(SEMANTIC_MANIFEST).find(manifestItem =>
                    manifestItem.technical_id === id
                ) || {};
            }

            // AXIOMA V8.5 (ADR-017): Merge Profundo Híbrido
            // Frontend (semanticRef) es la base constitucional
            // Backend (item) añade/sobrescribe específicamente
            const baseMerge = this._deepMerge(semanticRef, item);

            const cleanConfig = semanticRef.config ? { ...semanticRef.config } : {};
            if (cleanConfig.icon && typeof cleanConfig.icon !== 'string') {
                cleanConfig.icon = null;
            }

            // AXIOMA V12 (ADR-016): Inferencia de Slot (Phenotypic Mobility)
            // Solo asignamos un slot por defecto (GLOBAL_REGISTRY) a componentes con "Cuerpo" (UI).
            // Los adaptadores y servicios son "Espíritus" (Back-end) y no tienen espacio físico.
            let inferredSlot = baseMerge.slot || baseMerge.SLOT || semanticRef.slot;

            const hasUI = ['UTILITY', 'SLOT', 'WIDGET', 'REALITY', 'GATE', 'ORCHESTRATOR'].includes(baseMerge.ARCHETYPE || semanticRef.ARCHETYPE);

            if (!inferredSlot && hasUI) {
                inferredSlot = 'GLOBAL_REGISTRY';
            }

            const compiled = {
                ...baseMerge,
                id: id,
                omd: baseMerge.omd || baseMerge.OMD || id || semanticRef.technical_id || 'UNKNOWN_OMD',
                slot: inferredSlot,

                // AXIOMA: Mapeo de Identidad Virtual (Frontend Priority)
                LABEL: baseMerge.LABEL || baseMerge.label || semanticRef.LABEL || semanticRef.functional_name || 'UNIT_SKELETON',
                ARCHETYPE: baseMerge.ARCHETYPE || semanticRef.ARCHETYPE || (cleanConfig.archetype || 'SERVICE').toUpperCase(),
                DOMAIN: baseMerge.DOMAIN || semanticRef.DOMAIN || (cleanConfig.intent || 'SYSTEM').toUpperCase(),

                layer: baseMerge.LEVEL || baseMerge.level || semanticRef.layer || 'NIVEL_3',
                // AXIOMA: Normalización de Capacidades (Inferencia de IO)
                CAPABILITIES: this._normalizeCapabilities(baseMerge.CAPABILITIES || baseMerge.capabilities || baseMerge.methods || {}),
                ui_layout_hint: baseMerge.ui_layout_hint || semanticRef.ui_layout_hint || 'LAYOUT_SMART_FORM'
            };

            // PUENTE V12: Generación de Artefactos (Phenotype Bridge)
            // El System_Assembler espera 'artefacts' como array de IDs para validar actividad
            compiled.artefacts = Object.keys(compiled.CAPABILITIES);
            compiled.methods = compiled.artefacts; // Alias for robustness

            // SERIALIZATION GUARD: Eliminar cualquier propiedad que sea función o símbolo
            Object.keys(compiled).forEach(key => {
                const val = compiled[key];
                if (typeof val === 'function' || typeof val === 'symbol') {
                    delete compiled[key];
                }
            });

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

            // Sanitización de capabilities
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
     * Sugiere nodos compatibles basados en el Arquetipo de origen.
     * AXIOMA: Las sugerencias facilitan el flujo de datos entre capas.
     */
    getCompatibleNodes(sourceArchetype) {
        if (!this._isCompiled) return [];
        const arch = (sourceArchetype || '').toUpperCase();

        // Reglas de Propagación Sugerida
        return this._renderManifest.filter(m => {
            const targetArch = (m.ARCHETYPE || '').toUpperCase();

            // 1. Orígenes (VAULT/ADAPTER) sugieren Procesamiento (LLM/NODE) o Destinos (SLOT)
            if (arch === 'VAULT' || arch === 'DATABASE') {
                return ['LLM', 'SERVICE', 'NODE', 'SLOT', 'EMAIL'].includes(targetArch);
            }
            // 2. Inteligencia/Lógica sugiere Destinos o Comunicación
            if (arch === 'LLM' || arch === 'SERVICE' || arch === 'NODE') {
                return ['SLOT', 'EMAIL', 'CHAT', 'DATABASE'].includes(targetArch);
            }

            return false;
        }).slice(0, 5); // Limitar sugerencias
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
            LABEL: finalDef.LABEL || finalDef.label || semanticRef.LABEL || 'VIRTUAL_SLOT',
            ARCHETYPE: (finalDef.ARCHETYPE || semanticRef.ARCHETYPE || 'SLOT').toUpperCase(),
            isVirtual: finalDef.isVirtual || semanticRef.isVirtual || false
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



