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
        const providers = listProviderAccounts(); // De system_config.gs

        providers.forEach(pRef => {
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
        const hasKey = _isProviderConfigured(providerId); // De provider_registry.gs
        if (!hasKey) {
            result.status = 'MISSING_CREDENTIALS';
            result.error = 'No se encontró API Key para esta cuenta.';
            return result;
        }

        // 2. Test de Conexión Real (Protocolo de Sonda)
        // Intentamos un ATOM_READ genérico de identidad o similar según el provider
        const uqo = {
            provider: providerId,
            protocol: 'ATOM_READ',
            context_id: 'identity' // La mayoría de providers retornan info de cuenta con esto
        };

        const response = route(uqo); // Aduana real

        if (response.metadata?.status === 'OK') {
            result.status = 'OK';
            result.latency = Date.now() - start;
        } else {
            result.status = 'API_FAILURE';
            result.error = response.metadata?.error || 'Respuesta no exitosa de la API';
        }

    } catch (err) {
        result.status = 'CONTRACT_VIOLATION';
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
