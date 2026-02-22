/**
 * src/core/System_Assembler.js
 * 🛠️ CAPA 0: Ensamblador Maestro del Sistema (The UI Bootloader).
 * Axioma: "El sistema no existe hasta que sus leyes son ensambladas y su conectividad es certificada."
 */

import adapter from './Sovereign_Adapter.js';
import compiler from './2_Semantic_Transformation/Law_Compiler.js';

const AUTH_GATE_ID = "AUTH_GATEWAY";

class SystemAssembler {
    constructor() {
        this.status = 'GENESIS';
        this.coherenceIndex = 0;
    }

    /**
     * Inicia el proceso de ensamblaje soberano.
     */
    async assemble() {
        console.log("🛠️ [Assembler] Iniciando secuencia de ignición soberana...");
        this.status = 'STANDBY';

        try {
            // 1. Ignición del Adaptador Soberano (Sincronía L0/L1)
            const ignition = await adapter.ignite();
            console.warn("[ATOMIC 5] Ignite returned to Assembler");

            // FEEDBACK LOOP: Si el adapter trae datos, los inyectamos en el compilador AQUI
            if (ignition.genotype && ignition.genotype.COMPONENT_REGISTRY) {
                console.warn("[ATOMIC 6] Injecting Ontology (Assembler side)...");
                compiler.setOntology(ignition.genotype.COMPONENT_REGISTRY, ignition.genotype);
            }

            // AXIOMA: Si el sistema está LOCKED
            if (ignition.sovereignty === 'LOCKED' || ignition.status === 'NEEDS_AUTH') {
                // ... (Bloqueo)
                // ...
            }

            if (!ignition.success) {
                console.warn("⚠️ [Assembler] Handshake impuro detectado.");
            }

            // 2. Compilación de Leyes (Front-End)
            console.warn("[ATOMIC 7] Start Compilation...");
            compiler.compile();
            console.warn("[ATOMIC 8] Compilation Finished");

            // 3. Registro de Módulos Críticos
            this._registerCoreModules();
            console.warn("[ATOMIC 9] Core Modules Registered");

            // 4. Verificación de Integridad Universal
            const integrity = await this.verifyUniversalIntegrity();
            console.warn("[ATOMIC 10] Integrity Checked");

            // PHASE 4: HOMEOSTASIS PROACTIVA (Fat Client Ignite)
            console.log("🌊 [Assembler] Phase 4: Activating Homeostasis Cycles...");

            if (integrity.isCoherent) {
                this.status = 'ACTIVE';
                this.coherenceIndex = integrity.score;
            } else {
                this.status = 'DEGRADED';
                console.warn("⚠️ [Assembler] El sistema no es totalmente coherente:", integrity.errors);
            }

            console.log(`✅ [Assembler] Sistema ensamblado. Estado: ${this.status} (Coherence: ${this.coherenceIndex}%)`);
            return {
                success: true,
                status: this.status,
                coherence: this.coherenceIndex,
                genotype: ignition.genotype, // <--- EXPORTAR EL ADN
                error: integrity.isCoherent ? null : integrity.errors.join(', ')
            };

        } catch (error) {
            this.status = 'LOCKED'; // Fallback a bloqueo seguro
            console.error("🛑 [Assembler] Fallo crítico durante el ensamblaje. Forzando modo bloqueo:", error);

            return {
                success: true, // Permitimos renderizar para mostrar el Portal
                status: 'LOCKED',
                error: error.message || "Error desconocido"
            };
        }
    }

    /**
     * Compara las leyes locales con las leyes soberanas del backend.
     * DHARMA: Asegurar que el Fenotipo (React) no diverja del Genotipo (Core).
     */
    /**
     * AUDITORÍA DE COHERENCIA (Post-Compilación)
     * DHARMA: Detectar fracturas en el puente semántico antes del render.
     */
    async verifyUniversalIntegrity() {
        if (!adapter.isIgnited || !adapter.L0) {
            return { isCoherent: false, score: 0, errors: ["Genotipo L0 no hidratado"] };
        }

        const errors = [];
        const manifest = compiler.getRenderManifest();
        const L0 = adapter.L0;
        const assignedSlots = {};

        console.log("🔍 [Assembler] Iniciando Auditoría de Coherencia...");

        // 1. Validación de Población
        if (manifest.length === 0) {
            errors.push("ONTOLOGÍA VACÍA: No hay contratos para proyectar.");
        }

        // 2. Validación de Contratos (ADN vs Anatomía)
        manifest.forEach(law => {
            // A. Verificación de Arquetipo
            if (!law.artefacts || law.artefacts.length === 0) {
                console.warn(`[Assembler] Host ${law.omd} inicializado sin artefactos activos.`);
            }

            // B. Verificación de Slot (Relajada V12)
            // AXIOMA: No todo módulo tiene cuerpo físico (Slot). Algunos son espíritus (Servicios).
            if (!law.slot || law.slot === 'UNDEFINED') {
                console.info(`[Assembler] 👻 ${law.omd} registrado como SERVICIO BACKEND (Sin UI Slot).`);
            } else {
                // AXIOMA V12 (ADR-016): Validación de Física de Proyección
                // Solo validamos colisiones para entidades con cuerpo (UI).
                if (assignedSlots[law.slot]) {
                    errors.push(`COLISIÓN DE REALIDAD: El slot físico '${law.slot}' ya está ocupado por ${assignedSlots[law.slot]}. (Intento de ${law.omd})`);
                }
                assignedSlots[law.slot] = law.omd;
            }

            // C. Verificación de Identidad
            if (law.functional_name === 'UNIT_SKELETON' && law.omd !== 'OMD-00') {
                console.warn(`[Assembler] Identidad Genérica detectada en ${law.omd}. ¿Falta label en Core?`);
            }
        });

        const score = Math.max(0, 100 - (errors.length * 5));
        const isCoherent = errors.length === 0;

        if (!isCoherent) {
            console.error("❌ [Assembler] Auditoría Fallida:", errors);
        }

        return {
            isCoherent,
            score,
            errors
        };
    }

    /**
     * Registro interno de módulos esenciales antes del render.
     */
    _registerCoreModules() {
        // En v5.6, getModulesByLevel(3) obtiene los módulos de Backbone.
        const sovereigntyModules = compiler.getModulesByLevel(3);
        console.log(`🏛️ [Assembler] Backbone de Soberanía registrado: ${sovereigntyModules.length} módulos.`);
    }

    /**
     * Obtiene el estado actual del ensamblador.
     */
    getStatus() {
        return this.status;
    }
}

const assembler = new SystemAssembler();
export default assembler;




