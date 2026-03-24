// =============================================================================
// ARTEFACTO: 6_audit/resonance_audit.gs
// CAPA: 6 — Audit Layer (Mantenimiento)
// RESPONSABILIDAD: Verificación de la "salud de los tubos". 
//         Auditoría de APIs, conectividad y sincronización de interfaces.
// 
// AXIOMAS:
//   - No repara archivos (esa es tarea de identity_evolution.gs).
//   - Es Account-Aware: valida cada cuenta configurada (notion:ID).
//   - Diagnóstico ruidoso: reporta fallos de resonancia sin piedad.
// =============================================================================

/**
 * Orquestador principal de Auditoría de Resonancia.
 * Valida la conectividad con todos los providers externos.
 */
function runResonanceAudit() {
    logInfo('🚀 Iniciando Auditoría de Resonancia (Connectivity Check)...');

    const report = {
        timestamp: new Date().toISOString(),
        providers: {},
        summary: { total: 0, healthy: 0, failures: 0 }
    };

    try {
        const allConfigs = _scanProviders(); // De provider_registry.gs
        const accountsToAudit = [];

        allConfigs.forEach(conf => {
            const accounts = listProviderAccounts(conf.id); // De system_config.gs
            const isInfrastructure = !conf.config_schema || conf.config_schema.length === 0;

            if (accounts.length === 0) {
                // AXIOMA DE INFRAESTRUCTURA: Si no requiere config, es resonante por defecto.
                if (isInfrastructure) {
                    accountsToAudit.push(conf.id);
                } else {
                    // Es un silo de datos pero no tiene cuenta -> reportar como desconectado
                    report.summary.total++;
                    report.providers[conf.id] = {
                        status: 'MISSING_CREDENTIALS',
                        error: `No hay cuentas configuradas para "${conf.id}".`
                    };
                    report.summary.failures++;
                }
            } else {
                accounts.forEach(acc => {
                    accountsToAudit.push(`${conf.id}:${acc.account_id}`);
                });
            }
        });

        accountsToAudit.forEach(pRef => {
            report.summary.total++;
            logInfo(`[audit] Verificando Resonancia: ${pRef}...`);

            const auditResult = _auditProviderResonance_(pRef);
            report.providers[pRef] = auditResult;

            if (auditResult.status === 'OK') {
                report.summary.healthy++;
            } else {
                report.summary.failures++;
                logWarn(`[audit] RESSONANCE_FAILURE en "${pRef}": ${auditResult.error}`);
            }
        });

        logInfo(`[audit] Auditoría Completada. Sinceros: ${report.summary.healthy} | Oscuros: ${report.summary.failures}`);
        return report;

    } catch (err) {
        logError('[audit] Fallo crítico en motor de auditoría', err);
        throw err;
    }
}

/**
 * Audita la resonancia de un provider específico (instancia:ID).
 * @private
 */
function _auditProviderResonance_(providerId) {
    const [baseProvider] = providerId.split(':');
    const result = {
        status: 'UNKNOWN',
        latency: 0,
        contract: 'VIGENTE'
    };

    const start = Date.now();

    try {
        // 1. Verificar existencia de Credenciales
        const parts = providerId.split(':');
        const baseId = parts[0];
        const accountId = parts[1] || 'default';

        // El proveedor 'system' no requiere keys
        if (baseId === 'system') {
            // No need to check
        } else {
            const hasKey = readProviderApiKey(baseId, accountId); // De system_config.gs
            if (!hasKey) {
                result.status = 'MISSING_CREDENTIALS';
                result.error = `No se encontró API Key para la cuenta "${accountId}" de "${baseId}".`;
                return result;
            }
        }

        // 2. Test de Conexión Real (Protocolo de Sonda)
        // Intentamos un ATOM_READ genérico. No importa si el objeto no existe, 
        // lo que importa es si la API responde (Resonancia).
        const uqo = {
            provider: providerId,
            protocol: 'ATOM_READ',
            context_id: 'RESONANCE_TEST_PROBE'
        };

        try {
            const response = route(uqo); // Aduana real

            // AXIOMA DE RESONANCIA: Si llegamos aquí sin excepción de aduana (Router),
            // y el error no es de AUTH, significa que el túnel está ABIERTO.
            const metadata = response.metadata || {};

            if (metadata.status === 'OK') {
                result.status = 'OK';
            } else {
                // Si el error es sobre el ID, pero no sobre la API Key, es resonancia exitosa.
                const authErrors = ['UNAUTHORIZED', 'INVALID_CREDENTIALS', 'MISSING_API_KEY'];
                const isAuthError = authErrors.some(e => (metadata.error || '').toUpperCase().includes(e));

                if (!isAuthError) {
                    result.status = 'OK';
                    result.warning = metadata.error || 'Respuesta de API recibida.';
                } else {
                    result.status = 'API_FAILURE';
                    result.error = metadata.error;
                }
            }
            result.latency = Date.now() - start;

        } catch (routeErr) {
            // Si el router lanza excepción, suele ser por contrato o error de red fatal
            result.status = 'CONTRACT_VIOLATION';
            result.error = routeErr.message;
        }

    } catch (err) {
        result.status = 'ERROR';
        result.error = err.message;
    }

    return result;
}

/**
 * Función global para invocar desde el dashboard de diagnósticos.
 */
function DIAGNOSTIC_RUN_RESONANCE_AUDIT() {
    const report = runResonanceAudit();

    // Imprimir reporte visual en logs
    console.log('====================================');
    console.log('   RESONANCE AUDIT REPORT   ');
    console.log('====================================');
    Object.keys(report.providers).forEach(p => {
        const r = report.providers[p];
        const icon = r.status === 'OK' ? '✅' : '❌';
        console.log(`${icon} ${p.padEnd(20)} | STATUS: ${r.status.padEnd(15)} | ${r.latency}ms`);
        if (r.error) console.log(`   └─ ERROR: ${r.error}`);
    });
    console.log('====================================');

    return report;
}
