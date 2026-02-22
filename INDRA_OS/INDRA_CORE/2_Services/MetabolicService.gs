/**
 * @file SystemMonitor.gs
 * @dharma Gestionar la salud, limpieza y optimización del Core (Sistema de Monitoreo).
 * @description Orquestra tareas de mantenimiento preventivo, monitoreo de cuotas y 
 *              limpieza de residuos digitales para asegurar el rendimiento a largo plazo.
 */

function createMetabolicService({ configurator, errorHandler, driveAdapter, jobQueueService }) {
  if (!configurator || !errorHandler || !driveAdapter || !jobQueueService) {
    throw new Error("MetabolicService requiere todas las dependencias.");
  }

  /**
   * SUITE 1: Asset Janitor
   * Limpia la carpeta de salida (outputs) de archivos viejos.
   */
  function runAssetJanitor() {
    const outputFolderId = configurator.retrieveParameter({ key: 'AXIOM_FOLDER_OUTPUT_ID' });
    if (!outputFolderId) return { success: false, reason: "No output folder configured." };
    
    const maxAgeDays = 7; // Configurable en el futuro
    const { deletedCount } = driveAdapter.cleanFolderByAge({ 
      folderId: outputFolderId, 
      maxAgeDays: maxAgeDays 
    });
    
    return { success: true, deletedCount };
  }

  /**
   * SUITE 2: Quota Sentinel
   * Monitorea las capacidades de Google Apps Script.
   */
  function runQuotaSentinel() {
    const mailQuota = MailApp.getRemainingDailyQuota();
    // Guardamos en PropertiesService para que la Skin pueda leerlo
    const props = PropertiesService.getScriptProperties();
    const health = {
      mailQuota: mailQuota,
      lastCheck: new Date().toISOString(),
      status: (mailQuota > 10) ? 'healthy' : 'warning'
    };
    
    props.setProperty('SYSTEM_HEALTH_QUOTAS', JSON.stringify(health));
    return health;
  }

  /**
   * SUITE 3: Performance Baseline
   * Registra métricas de pulso del sistema.
   */
  function runPerformancePulse() {
    const props = PropertiesService.getScriptProperties();
    const pulseCount = parseInt(props.getProperty('SYSTEM_PULSE_COUNT') || "0") + 1;
    props.setProperty('SYSTEM_PULSE_COUNT', pulseCount.toString());
    props.setProperty('SYSTEM_LAST_PULSE', new Date().toISOString());
    
    return { pulseCount };
  }

  /**
   * ORQUESTADOR MAESTRO DE METABOLISMO
   */
  function executeDailyMaintenance() {
    console.log("[SYSTEM_MONITOR] Iniciando mantenimiento diario...");
    
    const janitor = runAssetJanitor();
    const quota = runQuotaSentinel();
    const queue = jobQueueService.purgeProcessedJobs();
    
    console.log(`[SYSTEM_MONITOR] Resumen: Janitor(${janitor.deletedCount} files), Quota(${quota.status}), Queue(${queue.purged} purged)`);
    
    return {
      janitor,
      quota,
      queue
    };
  }

  const CANON = {
    id: "monitor",
    label: "System Monitor",
    archetype: "service",
    domain: "system_infra"
  };

  return {
    id: "monitor",
    label: "System Monitor",
    description: "Industrial self-healing engine for continuous architectural optimization and resource reclamation.",
    semantic_intent: "SENSOR",
    CANON: CANON,
    schemas: schemas,
    // Protocol mapping (SYS_V1)
    verifyConnection,
    // Original methods
    runAssetJanitor,
    runQuotaSentinel,
    runPerformancePulse,
    executeDailyMaintenance
  };
}







