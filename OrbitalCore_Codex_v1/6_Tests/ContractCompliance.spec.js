/**
 * 6_Tests/ContractCompliance.spec.js
 * 
 * DHARMA: Test de Integridad Axiomática v3 (Stark UI).
 */

function testGlobal_ContractAxiomaticCompliance() {
    console.log("Iniciando auditoría de cumplimiento axiomático...");

    // Invocamos el servicio de gobernanza directamente
    const stack = _assembleExecutionStack();
    const mockConfig = { isInSafeMode: () => false, retrieveParameter: () => 'mock' };
    const report = ContractGatekeeper.validateAllContracts(stack, mockConfig);

    if (!report.isValid) {
        const errors = report.errors || [];
        const criticalErrors = report.criticalErrors || [];
        const errorMsg = [
            `❌ FALLO DE CUMPLIMIENTO AXIOMÁTICO: Se detectaron ${errors.length + criticalErrors.length} violaciones.`,
            ...criticalErrors.map(err => `  - [CRITICAL] ${err}`),
            ...errors.map(err => `  - ${err}`),
            "",
            "TIP: Revisa '7_Diagnostics/ContractBuilder.gs' para generar el boilerplate correcto y",
            "la documentación en 'Axiomatic_Json_Schema_core_Contract_Canon.md' para las reglas."
        ].join("\n");

        throw new Error(errorMsg);
    }

    console.log("✅ Todos los contratos cumplen con los estándares v3.");
    return true;
}
