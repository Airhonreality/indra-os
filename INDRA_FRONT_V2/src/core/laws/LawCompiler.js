/**
 * src/core/laws/LawCompiler.js
 * ⚖️ CAPA 0: Compilador de Leyes y Orquestador de Soberanía.
 * Axioma: "La Ley no es un objeto estático; es un proceso de compilación que garantiza la coherencia entre el Core y la Manifestación."
 * 
 * Este motor se encarga de:
 * 1. Cargar y validar la Constitución Visual (VisualLaws).
 * 2. Compilar las Leyes Estructurales (StructuralLaws) de cada módulo.
 * 3. Resolver herencias de arquetipos e intenciones.
 * 4. Proveer un diccionario unificado para toda la aplicación.
 */

import { VISUAL_LAWS } from './VisualLaws';

class LawCompiler {
    constructor() {
        this.registry = VISUAL_LAWS;
        this.compiledLaws = new Map();
        this.isCompiled = false;
    }

    /**
     * Compila la totalidad del sistema de leyes.
     * Cruza las leyes visuales con el mapa de distribución OMD.
     */
    compile() {
        console.log("⚖️ [LawCompiler] Iniciando compilación de Capa 0...");

        const { DISTRIBUTION_MAP, ARCHETYPES, INTENTS } = this.registry;

        for (const [omdId, spec] of Object.entries(DISTRIBUTION_MAP)) {
            const compiledSpec = {
                ...spec,
                omd: omdId,
                // Inyectamos reglas heredadas del arquetipo si existen en la config
                visual_rules: ARCHETYPES[spec.config?.archetype] || null,
                intent_rules: INTENTS[spec.config?.intent] || null
            };

            this.compiledLaws.set(omdId, Object.freeze(compiledSpec));
        }

        this.isCompiled = true;
        console.log(`✅ [LawCompiler] Sistema compilado: ${this.compiledLaws.size} módulos OMD registrados.`);
    }

    /**
     * Obtiene la ley compilada de un módulo específico.
     * @param {string} omdId - ID del blueprint (ej: 'OMD-03').
     */
    getLaw(omdId) {
        if (!this.isCompiled) this.compile();
        return this.compiledLaws.get(omdId);
    }

    /**
     * Resuelve las propiedades de un arquetipo visual.
     */
    resolveArchetype(archetypeId) {
        return this.registry.ARCHETYPES[archetypeId] || null;
    }

    /**
     * Obtiene todos los módulos de un nivel específico.
     * @param {number} level - 1, 2 o 3.
     */
    getModulesByLevel(level) {
        if (!this.isCompiled) this.compile();
        const levelKey = `NIVEL_${level}`;
        return Array.from(this.compiledLaws.values())
            .filter(law => law.layer === levelKey);
    }

    /**
     * Destila el mapa de leyes para el protocolo MCP (Model Context Protocol).
     * Produce un JSON liviano de "Solo Identidad" para que la IA lo use como mapa mental.
     */
    distillForAI() {
        if (!this.isCompiled) this.compile();

        const cognitiveMap = {
            version: "2.1.0-STARK",
            system_layers: this.registry.SYSTEM_LAYERS,
            capability_map: {}
        };

        for (const [id, law] of this.compiledLaws) {
            cognitiveMap.capability_map[id] = {
                intent: law.functional_name,
                layer: law.layer,
                can_invoke: law.config?.polymorphic ? "POLYMORPHIC" : "STATIC",
                interface: law.config?.submodules || "CORE_ATOMIC"
            };
        }

        return Object.freeze(cognitiveMap);
    }

    /**
     * Genera un manifiesto de renderizado automático.
     * Permite a un Renderizador Maestro instanciar la UI basándose en las leyes.
     */
    getRenderManifest() {
        if (!this.isCompiled) this.compile();

        return Array.from(this.compiledLaws.values()).map(law => ({
            id: law.technical_id,
            omd: law.omd,
            component: law.component,
            slot: law.slot,
            visual: law.visual_rules,
            behavior: law.intent_rules,
            props: law.config
        }));
    }

    /**
     * Verifica si un componente cumple con su contrato técnico.
     * (Box Testing Hook)
     */
    validateIntegrity(omdId, componentProps) {
        const law = this.getLaw(omdId);
        if (!law) return { valid: false, error: `Blueprint ${omdId} no encontrado.` };

        // Validación básica de Slots y Contexto
        if (componentProps.slot && componentProps.slot !== law.slot) {
            return { valid: false, error: `Violación de Slot: ${omdId} debe cargar en ${law.slot}` };
        }

        return { valid: true };
    }
}

const compiler = new LawCompiler();
export default compiler;
