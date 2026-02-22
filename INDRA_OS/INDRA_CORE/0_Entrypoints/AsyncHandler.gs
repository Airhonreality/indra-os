// ======================================================================
// ARTEFACTO: 0_Entrypoints/Triggers.gs (REFACTORIZADO PARA "BOOMERANG")
// DHARMA: Contener los 'workers' y 'callbacks' que son invocados por
//         disparadores externos (triggers de tiempo o web apps).
// ======================================================================

// ======================================================================
// FUNCIÓN DE LEGADO: processSingleJobTrigger (Interruptor Lento)
// ======================================================================

/**
 * Procesa el SIGUIENTE job 'pending' de la cola.
 * Invocada por el trigger de tiempo (el mecanismo lento).
 * Se mantiene por retrocompatibilidad durante la transición.
 */
function processSingleJobTrigger() {
//   console.log('DIAGNÓSTICO (Lento): processSingleJobTrigger INICIADO.');
  
  try {
    const allTriggers = ScriptApp.getProjectTriggers();
    const thisTrigger = allTriggers.find(t => 
      t.getHandlerFunction() === 'processSingleJobTrigger' && 
      t.getTriggerSource() === ScriptApp.TriggerSource.CLOCK
    );
    if (thisTrigger) ScriptApp.deleteTrigger(thisTrigger);
  } catch (cleanupError) {
//     console.error('DIAGNÓSTICO (Lento): Error durante auto-limpieza de trigger:', cleanupError.message);
  }
  
  // No necesita su propio candado, ya que processNextJobInQueue (vía _processJobById) lo maneja.
  // Simplemente delega a la lógica que reclama el siguiente job.
  try {
    const { publicApi } = _assembleExecutionStack();
    const result = publicApi.processNextJobInQueue();
//     console.log('DIAGNÓSTICO (Lento): Procesamiento completado. Resultado:', JSON.stringify(result));
  } catch (e) {
//     console.error('DIAGNÓSTICO (Lento): Error CATASTRÓFICO durante la ejecución:', e.message, e.stack);
  }
}

// ======================================================================
// NUEVA ARQUITECTURA "BOOMERANG" (Interruptor Rápido)
// ======================================================================

/**
 * Punto de entrada para el callback del Worker (la llamada de retorno del boomerang).
 * Es una función "tonta" que solo extrae el jobId y delega el trabajo.
 * @param {object} e - El objeto de evento de doPost, que contiene el payload.
 */
function doPost_Worker_Callback(e) {
  // --- INSTRUMENTACIÓN DE DIAGNÓSTICO ---
//   console.log('[DIAG_TRIGGERS] Retorno de Boomerang RECIBIDO. Evento completo:', JSON.stringify(e));
  // --- FIN DE INSTRUMENTACIÓN ---
  
  try {
    const payload = JSON.parse(e.postData.contents);
    const jobId = payload.jobId;
    if (!jobId) {
      // console.error('[DIAG_TRIGGERS] FALLO: El retorno del Boomerang no contenía un jobId.');
      return;
    }
    
    // console.log(`[DIAG_TRIGGERS] Delegando al procesador para el job ID: ${jobId}`);
    _processJobById(jobId);
    
  } catch (error) {
//     console.error('DIAGNÓSTICO (Rápido): Error CATASTRÓFICO en el callback del Worker:', error.message, error.stack);
  }
}

/**
 * Función central y testeable que procesa un job por su ID.
 * Adquiere un candado para garantizar una ejecución única.
 * @private
 * @param {string} jobId - El ID del job específico a procesar.
 */
function _processJobById(jobId) {
//   console.log(`DIAGNÓSTICO (Rápido): Iniciando procesamiento para job ID: ${jobId}`);
  const lock = LockService.getScriptLock();
  
  try {
    const hasLock = lock.tryLock(10000); // Esperar hasta 10 segundos
    if (!hasLock) {
//       console.warn(`DIAGNÓSTICO (Rápido): No se pudo adquirir candado para procesar job ${jobId}. Otra instancia ya está trabajando.`);
      return;
    }
    
//     console.log(`DIAGNÓSTICO (Rápido): Candado adquirido para job ${jobId}.`);
    
    const { jobQueueService, publicApi } = _assembleExecutionStack();
    
    // 1. Reclamar el job específico. La verificación de 'pending' ocurre dentro.
    const job = jobQueueService.claimSpecificJob(jobId);
    
    // 2. Si se reclamó con éxito, procesarlo.
    if (job) {
      publicApi.processSpecificJob(job);
//       console.log(`DIAGNÓSTICO (Rápido): Procesamiento para job ${jobId} finalizado.`);
    } else {
      // Esto puede ocurrir si dos llamadas boomerang llegan casi al mismo tiempo y
      // una ya reclamó el job. Es un caso normal, no un error.
      console.log(`DIAGNÓSTICO (Rápido): El job ${jobId} ya no estaba disponible para ser reclamado. Terminando.`);
    }
    
  } catch (error) {
    const errorMessage = error.message || String(error);
    const errorStack = error.stack || 'No stack trace available.';
    console.error(`DIAGNÓSTICO (Rápido): Error CATASTRÓFICO durante _processJobById para job ${jobId}: `, errorMessage, errorStack);
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
      console.log(`DIAGNÓSTICO (Rápido): Candado liberado para job ${jobId}.`);
    }
  }
}

// ======================================================================
// SISTEMA DE PULSO (HEARTBEAT) - AXIOMA L6 "METABOLIC JANITOR"
// ======================================================================

/**
 * Función de mantenimiento periódico (Heartbeat).
 * Debe configurarse para ejecutarse cada 10-20 minutos.
 * Responsabilidades:
 * 1. Limpiar jobs "Zombies" (que quedaron en 'processing' por error).
 * 2. Procesar jobs pendientes si el Boomerang falló.
 */
function runSystemHeartbeat() {
  console.log('💓 [HEARTBEAT] Iniciando pulso del sistema...');
  
  try {
    const stack = _assembleExecutionStack();
    const { jobQueueService, publicApi } = stack;

    // 1. Limpieza de Zombies
    const { zombiesCleaned } = jobQueueService.cleanupZombieJobs();
    if (zombiesCleaned > 0) {
      console.warn(`💓 [HEARTBEAT] Se limpiaron ${zombiesCleaned} jobs zombies.`);
    }

    // 2. Sistema Metabólico (Pulso y Mantenimiento)
    const { metabolicService } = stack;
    if (metabolicService) {
      metabolicService.runPerformancePulse(); // Latido de telemetría
      
      const props = PropertiesService.getScriptProperties();
      const lastPurge = parseInt(props.getProperty('LAST_QUEUE_PURGE_TS') || "0");
      const nowTs = new Date().getTime();
      
      // Mantenimiento Diario (Janitor, Quotas, Queue Purge)
      if (nowTs - lastPurge > 24 * 60 * 60 * 1000) {
        metabolicService.executeDailyMaintenance();
        props.setProperty('LAST_QUEUE_PURGE_TS', nowTs.toString());
      }
    }


    // 3. Procesamiento de Respaldo (Backup Worker)

    // Intentamos procesar UN job por ciclo para no saturar.
    const result = publicApi.processNextJobInQueue();
    
    if (result.processed) {
      console.log(`💓 [HEARTBEAT] Job de respaldo procesado: ${result.jobId} (${result.status})`);
    } else {
      console.log('💓 [HEARTBEAT] No hay jobs pendientes en la cola.');
    }

  } catch (e) {
    console.error('💔 [HEARTBEAT] Fallo crítico en el pulso:', e.message);
  }
}

/**
 * Instala el disparador de reloj para el Heartbeat (20 minutos).
 */
function installHeartbeatTrigger() {
  const triggerName = 'runSystemHeartbeat';
  // Limpiar previos
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(t => {
    if (t.getHandlerFunction() === triggerName) {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Crear nuevo (20 min)
  ScriptApp.newTrigger(triggerName)
    .timeBased()
    .everyMinutes(20)
    .create();
    
  console.log(`✅ Trigger '${triggerName}' instalado.`);
}






