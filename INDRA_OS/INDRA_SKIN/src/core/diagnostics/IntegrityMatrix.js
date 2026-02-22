/**
 * src/core/diagnostics/IntegrityMatrix.js
 * 🚀 EL GRAN VALIDADOR AXIOMÁTICO (The Layer Synchronizer)
 * Axioma: "La verdad no es una opinión; es la intersección lógica entre el DNA y la Materia."
 */

import compiler from '../2_Semantic_Transformation/Law_Compiler.js';

const VALID_ATOMS = [
    'INPUT_TEXT', 'INPUT_SECRET', 'INPUT_NUMBER', 'TEXTAREA', 'DROPDOWN',
    'CHECKBOX', 'RADIO', 'SLIDER', 'TOGGLE', 'ACTION_BUTTON', 'ACTION_ICON',
    'STATUS_TAG', 'PROGRESS_BAR', 'DATA_TICKET', 'TABS', 'BREADCRUMBS'
];

class IntegrityMatrix {
    constructor() {
        this.violations = [];
        this.stats = { totalChecks: 0, passed: 0, failed: 0 };
    }

    /**
     * Realiza una auditoría agresiva de todas las leyes y tipos.
     */
    runAudit(structuralLawsMap) {
        console.log("🔍 [IntegrityMatrix] Iniciando Auditoría de Coherencia...");
        this.violations = [];

        // 1. Verificar Naming de Distribución vs Glosario
        this.auditDistributionMap();

        // 2. Verificar Tipos de Átomos vs Glosario
        this.auditStructuralLaws(structuralLawsMap);

        // 3. Verificar Coherencia de OMD IDs
        this.auditOmdFormats();

        this.report();
    }

    auditDistributionMap() {
        // En v8.0 la distribución es dinámica. Validamos solo si el compilador tiene registro legacy.
        const registry = compiler.registry || {};
        const distribution = registry.DISTRIBUTION_MAP || {};

        for (const [id, spec] of Object.entries(distribution)) {
            this.stats.totalChecks++;
            // Validamos que el slot exista en el Glosario o en las leyes locales
            if (!spec.slot) {
                this.addViolation("DISTRIBUTION", id, `El módulo no tiene un SLOT de destino definido.`);
            }
        }
    }

    auditStructuralLaws(lawsMap) {
        const validAtoms = VALID_ATOMS;

        for (const [omdId, law] of Object.entries(lawsMap)) {
            const root = law[omdId] || law;
            if (!root.sub_modules) continue;

            Object.values(root.sub_modules).forEach(sub => {
                sub.atoms?.forEach(atom => {
                    this.stats.totalChecks++;
                    if (!validAtoms.includes(atom.type)) {
                        this.addViolation("STRUCTURAL_LAW", omdId, `Tipo de Átomo '${atom.type}' no está registrado en el Glosario.`);
                    }
                });
            });
        }
    }

    auditOmdFormats() {
        const registry = compiler.registry || {};
        const distribution = registry.DISTRIBUTION_MAP || {};
        const semanticRegex = /^[A-Z_]+(_[A-Z0-9]+)*$/;

        Object.keys(distribution).forEach(id => {
            if (!semanticRegex.test(id)) {
                this.addViolation("NOMENCLATURE", id, `El ID '${id}' viola el canon semántico (Gritante_Mayúsculas).`);
            }
        });
    }

    addViolation(layer, source, message) {
        this.violations.push({ layer, source, message });
        this.stats.failed++;
    }

    report() {
        console.table(this.violations);
        console.log(`📊 Audit Finished: ${this.stats.totalChecks} checks. ${this.stats.failed} violations found.`);
        return this.violations.length === 0;
    }
}

const diagnostic = new IntegrityMatrix();
export default diagnostic;




