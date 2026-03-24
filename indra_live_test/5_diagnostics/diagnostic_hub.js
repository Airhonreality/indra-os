// =============================================================================
// ARTEFACTO: 5_diagnostics/diagnostic_hub.gs
// CAPA: 5 — Diagnostics (Orquestación)
// RESPONSABILIDAD: Punto de entrada único para tareas de mantenimiento mayor.
//         Coordina la evolución de archivos y la auditoría de red.
// =============================================================================

/**
 * BIG BANG (Sinceridad Radical): 
 * 1. Evoluciona toda la persistencia en Drive (ISP v5.0).
 * 2. Ejecuta auditoría de resonancia de APIs (Account-Aware).
 * 
 * Úsalo para restaurar el sistema tras una actualización de ADR o Core.
 */
function DIAGNOSTIC_HEAL_AND_AUDIT() {
    logInfo('--- INICIANDO BIG BANG: CURACIÓN + AUDITORÍA ---');

    // 1. Evolución de Materia (Drive)
    const evolutionReport = runSystemIdentityEvolution();

    // 2. Auditoría de Resonancia (Connectivity)
    const resonanceReport = runResonanceAudit();

    const finalSummary = {
        evolution: evolutionReport,
        resonance: resonanceReport,
        timestamp: new Date().toISOString()
    };

    logInfo('--- BIG BANG COMPLETADO ---');
    logInfo(JSON.stringify(finalSummary, null, 2));

    return finalSummary;
}

/**
 * Detecta materia corrupta o vacía en el sistema.
 */
function DIAGNOSTIC_CHECK_INTEGRITY() {
    return runIntegrityCheck();
}

/**
 * Restaura un átomo desde su sombra en el archivo histórico.
 */
function DIAGNOSTIC_RESTORE_FILE(fileId) {
    if (!fileId) throw new Error('Se requiere fileId para la restauración.');
    return restoreFromBackup(fileId);
}

/**
 * Solo evoluciona archivos en Drive.
 */
function DIAGNOSTIC_EVOLVE_SYSTEM() {
    return runSystemIdentityEvolution();
}

/**
 * Solo audita conectividad de red.
 */
function DIAGNOSTIC_RUN_RESONANCE_AUDIT() {
    return runResonanceAudit();
}
