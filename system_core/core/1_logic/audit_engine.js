/**
 * TOP-LEVEL DIAGNOSTIC: Permite ejecutar la auditoría manualmente desde el Editor de GAS.
 */
function DIAGNOSTIC_RUN_FULL_AUDIT() {
    const report = AuditEngine.runFullAudit();
    Logger.log(JSON.stringify(report, null, 2));
    return report;
}

/**
 * BIG BANG: Ejecuta la reparación completa y luego la auditoría.
 * Úsalo para restaurar el sistema tras una actualización de ADR.
 */
function DIAGNOSTIC_HEAL_AND_AUDIT() {
    runSystemIdentityRepair();
    const report = AuditEngine.runFullAudit();
    Logger.log("--- REPORTE FINAL DE AUDITORÍA ---");
    Logger.log(JSON.stringify(report, null, 2));
    return report;
}


var AuditEngine = {

    /**
     * Performs a full system audit of all registered providers.
     * @returns {Object} Audit report as items and metadata.
     */
    runFullAudit: function () {
        logInfo("[AuditEngine] Starting System Sincerity Audit (ADR-008)...");

        // 1. Obtener la lista de todos los providers registrados
        const providers = _scanProviders(); // de provider_registry.gs

        const results = providers.map(p => this.auditProvider(p));

        const summary = {
            total: results.length,
            passed: results.filter(r => r.status === 'PASSED').length,
            failed: results.filter(r => r.status === 'FAILED').length,
            timestamp: new Date().toISOString()
        };

        return {
            items: results,
            metadata: {
                status: summary.failed > 0 ? "WARNING" : "OK",
                summary: summary,
                axiom: "ADR-008_LEY_DE_ADUANA"
            }
        };
    },

    /**
     * Audits a single provider configuration and interface.
     * @param {Object} conf The PROVIDER_CONF object.
     */
    auditProvider: function (conf) {
        const report = {
            provider: conf.id,
            status: 'PASSED',
            issues: [],
            checks: []
        };

        // --- NIVEL 1: IDENTIDAD (IUH 3.0) ---
        const identityCheck = { name: 'IUH_IDENTITY', status: 'OK', issues: [] };
        if (!conf.handle?.label) identityCheck.issues.push("Missing handle.label");
        if (!conf.handle?.alias) identityCheck.issues.push("Missing handle.alias");
        if (identityCheck.issues.length > 0) identityCheck.status = 'FAIL';
        report.checks.push(identityCheck);

        // --- NIVEL 2: CONTRATO DE INTERFAZ ---
        const interfaceCheck = { name: 'INTERFACE_SYNC', status: 'OK', issues: [] };
        const declaredProtocols = conf.protocols || [];
        const implementationMap = conf.implements || {};
        const scope = globalThis || this;

        declaredProtocols.forEach(proto => {
            if (!implementationMap[proto]) {
                interfaceCheck.issues.push(`Protocol ${proto} declared but not implemented in 'implements' map.`);
            } else {
                const handlerName = implementationMap[proto];
                if (typeof scope[handlerName] !== 'function') {
                    interfaceCheck.issues.push(`Handler function '${handlerName}' (for ${proto}) is missing in global scope.`);
                }
            }
        });

        if (interfaceCheck.issues.length > 0) interfaceCheck.status = 'FAIL';
        report.checks.push(interfaceCheck);

        // --- NIVEL 3: DRY RUN (RESONANCIA) ---
        // Si el provider tiene HIERARCHY_TREE y es el propio system (seguro de testear), lo probamos.
        // Para otros, probamos solo si están configurados (para evitar errores de Auth en Notion etc.)
        if (declaredProtocols.includes('HIERARCHY_TREE') && interfaceCheck.status === 'OK') {
            const resonanceCheck = { name: 'CONTRACT_RESONANCE', status: 'OK', issues: [] };
            const isConfigured = _isProviderConfigured ? _isProviderConfigured(conf) : true;

            if (isConfigured) {
                try {
                    // Ejecutamos via route() para que pase por la Aduana real
                    const testUqo = {
                        provider: conf.id,
                        protocol: 'HIERARCHY_TREE',
                        context_id: 'ROOT'
                    };

                    // El router validará automáticamente el retorno contra el contrato
                    const result = route(testUqo);

                    if (result.metadata?.status === 'ERROR') {
                        // Si el error es de contrato (catchable por router), resonanceCheck fallará
                        resonanceCheck.status = 'FAIL';
                        resonanceCheck.issues.push(result.metadata.error || "Execution returned ERROR status.");
                    }
                } catch (e) {
                    resonanceCheck.status = 'FAIL';
                    resonanceCheck.issues.push(e.message || "Contract Violation caught by Router.");
                }
                report.checks.push(resonanceCheck);
            } else {
                report.checks.push({ name: 'CONTRACT_RESONANCE', status: 'SKIPPED', issues: ["Provider not configured (Auth missing)."] });
            }
        }

        // Reporte final del provider
        if (report.checks.some(c => c.status === 'FAIL')) {
            report.status = 'FAILED';
            report.issues = report.checks.filter(c => c.status === 'FAIL').map(c => `${c.name}: ${c.issues.join(' | ')}`);
        }

        return report;
    }
};
