/**
 * 7_Diagnostics/MasterLaw_Alignment.gs
 * 
 * DHARMA: Alineamiento Genotipo-Fenotipo.
 *         Verifica mecánicamente que cada Arquetipo e Intención del Core
 *         tenga un correlato en la gramática visual de la UI.
 */

var MasterLaw_Alignment = {
    label: "MasterLaw Alignment Auditor",
    description: "Mechanical verification of Core-to-UI visual coverage.",
    version: "1.0.0",

    /**
     * Ejecuta una auditoría de alineación entre MasterLaw y UIMasterLaw.
     * @returns {Object} Informe de alineación.
     */
    runAudit: function() {
        const logic = typeof LOGIC_AXIOMS !== 'undefined' ? LOGIC_AXIOMS : (typeof MasterLaw !== 'undefined' ? MasterLaw : null);
        const visual = typeof VISUAL_GRAMMAR !== 'undefined' ? VISUAL_GRAMMAR : (typeof UIMasterLaw !== 'undefined' ? (UIMasterLaw.VISUAL_GRAMMAR || UIMasterLaw.visual_grammar) : null);

        if (!logic || !visual) {
            throw new Error("❌ MASTER_LAW_ALIGNMENT: LOGIC_AXIOMS or VISUAL_GRAMMAR is missing in global context.");
        }

        const report = {
            isAligned: true,
            timestamp: new Date().toISOString(),
            coverage: 100,
            gaps: [],
            warnings: []
        };

        // 1. Auditoría de Arquetipos (Core -> UI)
        const coreArchetypesObj = logic.CORE_LOGIC?.ARCHETYPES || logic.GENETIC?.ARCHETYPES || {};
        const coreArchetypes = Array.isArray(coreArchetypesObj) ? coreArchetypesObj : Object.keys(coreArchetypesObj);
        const uiArchetypes = Object.keys(visual.ARCHETYPES || {});

        // AXIOMA v12.0: Arquetipos Lógicos (no requieren UI)
        const LOGICAL_ARCHETYPES = [
            "OBSERVER",      // Telemetría interna (no draggable)
            "LOGIC_CORE",    // Orquestador interno (no visible)
            "SCHEMA",        // Validador de contratos (infraestructura)
            "SYSTEM_INFRA",  // Infraestructura del sistema (no proyectable)
            "INHIBIT"        // Mecanismo de parada (control interno)
        ];

        coreArchetypes.forEach(archetype => {
            // Saltar arquetipos puramente lógicos
            if (LOGICAL_ARCHETYPES.includes(archetype)) {
                return; // No requieren representación visual
            }

            if (!uiArchetypes.includes(archetype)) {
                report.gaps.push({
                    type: "ARCHETYPE_MISMATCH",
                    key: archetype,
                    severity: "CRITICAL",
                    message: `El Core define el arquetipo visual '${archetype}' pero no tiene representación en UIMasterLaw.`
                });
                report.isAligned = false;
            }
        });

        // 2. Auditoría de Intenciones (Core Roles -> UI Intents)
        const coreRoles = Object.keys(logic.CORE_LOGIC?.ROLES || logic.GENETIC?.ROLES || logic.ROLES || {});
        const uiIntents = Object.keys(visual.INTENTS || {});

        coreRoles.forEach(role => {
            // Nota: Permitimos flexibilidad si el role es solo informativo, 
            // pero si es un ROLE funcional de flujo, debería tener un INTENT visual.
            const functionalRoles = ["GATE", "STREAM", "BRIDGE", "TRIGGER", "TRANSFORM", "PROBE"];
            if (functionalRoles.includes(role) && !uiIntents.includes(role)) {
                // Buscamos mapeo indirecto o sugerimos creación
                report.warnings.push({
                    type: "INTENT_DEBT",
                    key: role,
                    severity: "MEDIUM",
                    message: `El role funcional '${role}' no tiene un token de intención (INTENT) específico en la UI.`
                });
            }
        });

        // 3. Cálculo de Cobertura
        const totalItems = coreArchetypes.length;
        const missingItems = report.gaps.length;
        report.coverage = totalItems === 0 ? 100 : ((totalItems - missingItems) / totalItems) * 100;

        return report;
    },

    /**
     * Imprime los resultados en la consola con formato industrial.
     */
    logReport: function() {
        console.log("--- ⚖️ MASTERLAW ALIGNMENT AUDIT ---");
        const results = this.runAudit();
        
        console.log(`Status: ${results.isAligned ? "✅ ALIGNED" : "❌ MISALIGNED"}`);
        console.log(`Coverage: ${results.coverage.toFixed(1)}%`);
        
        if (results.gaps.length > 0) {
            console.log("\n🚨 CRITICAL GAPS DETECTED:");
            results.gaps.forEach(gap => console.log(`   [${gap.key}] ${gap.message}`));
        }

        if (results.warnings.length > 0) {
            console.log("\n⚠️ SEMANTIC DEBTS:");
            results.warnings.forEach(warn => console.log(`   [${warn.key}] ${warn.message}`));
        }
        
        console.log("----------------------------------\n");
        return results;
    }
};
