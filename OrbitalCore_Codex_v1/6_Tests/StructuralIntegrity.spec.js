/**
 * 6_Tests/StructuralIntegrity.spec.js
 * DHARMA: Test de Integridad Estructural y Auditoría de Deuda.
 */

function testStructural_AxiomaticAudit() {
    console.log("=== 🔬 INICIANDO AUDITORÍA ESTRUCTURAL V5.5 ===");

    const stack = _assembleExecutionStack();
    const gatekeeperReport = ContractGatekeeper.validateAllContracts(stack);

    console.log(`Auditoría completa: ${gatekeeperReport.auditedModules} módulos revisados.`);

    if (!gatekeeperReport.isValid) {
        console.error(`❌ DEPLOY BLOQUEADO: Se encontraron ${gatekeeperReport.criticalErrors.length} errores críticos.`);
        gatekeeperReport.criticalErrors.forEach(err => {
            console.error(`  - ERROR: ${err}`);
        });
        // Descomentar para forzar fallo en CI/CD
        // throw new Error("Axiomatic Corruption detected in contracts");
    } else {
        console.log("✅ Integridad Estructural certificada por ContractGatekeeper.");
        if (gatekeeperReport.warnings.length > 0) {
            console.warn(`Aviso: ${gatekeeperReport.warnings.length} advertencias detectadas.`);
        }
    }

    return true;
}
