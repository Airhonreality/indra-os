// ======================================================================
// ARTEFACTO: 2_Services/JobQueueService.gs (ACTUALIZADO PARA "BOOMERANG")
// ======================================================================

function createJobQueueService({ manifest, configurator, errorHandler, sheetAdapter, monitoringService, keyGenerator }) {
  const LOCK_TIMEOUT_MS = 5000;

  if (!manifest || !manifest.SHEETS_SCHEMA?.JOB_QUEUE) {
    throw new Error('JobQueueService requiere un manifiesto válido con SHEETS_SCHEMA.JOB_QUEUE.');
  }
  if (!configurator || typeof configurator.retrieveParameter !== 'function') {
    throw new Error('JobQueueService requiere un configurator válido.');
  }
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new Error('JobQueueService requiere un errorHandler válido.');
  }
  if (!sheetAdapter || typeof sheetAdapter.appendRow !== 'function') {
    throw new Error('JobQueueService requiere un sheetAdapter válido.');
  }

  // AXIOMA: Resiliencia de Infraestructura (H7-RESILIENCE)
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, 
    logEvent: () => {}, sendCriticalAlert: () => {} 
  };

  const queueSchema = manifest.SHEETS_SCHEMA.JOB_QUEUE;
  const propertyKey = queueSchema.PROPERTY;
  const manifestHeader = queueSchema.HEADER;

  let jobQueueSheetId = null;

  function _ensureSheetId() {
    if (jobQueueSheetId) return jobQueueSheetId;
    
    jobQueueSheetId = configurator.retrieveParameter({ key: propertyKey });
    if (!jobQueueSheetId || typeof jobQueueSheetId !== 'string' || jobQueueSheetId.trim() === '') {
      throw errorHandler.createError(
        'CONFIGURATION_ERROR',
        'Job Queue Sheet ID not configured. Please run the installation.'
      );
    }
    return jobQueueSheetId;
  }

  /**
   * DESCUBRIMIENTO DINÁMICO (Subsoil Autonomy - L9)
   * Lee la primera fila de la hoja para mapear columnas por nombre, no por índice fijo.
   * @private
   */
  function _discoverColumnIndexes() {
    try {
      const sheetId = _ensureSheetId();
      const sheet = sheetAdapter._getSheet({ sheetId: sheetId });
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) return null;
      
      const actualHeader = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      const mapping = {};
      actualHeader.forEach((colName, idx) => {
        if (colName) mapping[colName.trim()] = idx + 1;
      });
      return mapping;
    } catch (e) {
      _monitor.logWarn('[JobQueueService] Fallo al descubrir índices dinámicos, usando fallback de manifiesto:', e.message);
      return null;
    }
  }

  // Caché de índices para la sesión actual
  let _cachedIndexes = null;

  function _getColumnIndexes() {
    if (_cachedIndexes) return _cachedIndexes;
    const discovered = _discoverColumnIndexes();
    _cachedIndexes = discovered || manifestHeader.reduce((acc, col, idx) => {
      acc[col] = idx + 1;
      return acc;
    }, {});
    return _cachedIndexes;
  }

  /**
   * Helper interno para desencriptar/deserializar una fila en un objeto de job.
   */
  function _deserializeRow(rowData) {
    const columnIndexes = _getColumnIndexes();
    const job = {};
    
    // Mapear datos basándose en el descubrimiento dinámico
    Object.keys(columnIndexes).forEach(colName => {
      const index = columnIndexes[colName];
      const cellValue = rowData[index - 1];
      
      // Para columnas que contienen JSON serializado en la hoja, intentar parsear
      if (colName === 'initialPayload' || colName === 'result' || colName === 'error') {
        
        // CASO 1: Ya es un objeto (SheetAdapter lo deserializó previamente)
        if (typeof cellValue === 'object' && cellValue !== null) {
          job[colName] = cellValue;
          _monitor.logDebug(`[JobQueueService] ${colName}: Ya deserializado (tipo: object)`);
        } 
        // CASO 2: Es un string que debe parsearse
        else if (typeof cellValue === 'string' && cellValue.trim().length > 0) {
          const trimmed = cellValue.trim();
          _monitor.logDebug(`[JobQueueService] ${colName}: Intentando parsear string (length: ${trimmed.length})`);
          
          try {
            job[colName] = JSON.parse(trimmed);
            _monitor.logDebug(`[JobQueueService] ${colName}: ✅ Parseado exitosamente`);
          } catch (e) {
            // Si falla, es JSON corrupto. Devolver el string crudo y alertar.
            job[colName] = cellValue;
            _monitor.logWarn(`[JobQueueService] ⚠️ ${colName}: JSON malformado`, { error: e.message });
          }
        } 
        else {
          job[colName] = cellValue;
        }
      } else {
        job[colName] = cellValue;
      }
    });
    
    return job;
  }
  
  function enqueue(payload) {
    const sheetId = _ensureSheetId();
    const { flowId, initialPayload, accountId, priority = 0, scheduledAt } = payload || {};

    if (!flowId) {
      throw errorHandler.createError('VALIDATION_ERROR', 'enqueue: payload con flowId es requerido.');
    }

    const jobId = keyGenerator.generate();
    const timestamp = new Date().toISOString();
    const columnIndexes = _getColumnIndexes();
    const row = manifestHeader.map(columnName => {
      switch (columnName) {
        case 'jobId': return jobId;
        case 'status': return 'pending';
        case 'flowId': return flowId;
        case 'initialPayload': return JSON.stringify(initialPayload || {});
        case 'triggerSource': return accountId || 'unknown'; // Using accountId as triggerSource for now
        case 'createdAt': return timestamp;
        case 'updatedAt': return timestamp;
        case 'scheduledAt': return scheduledAt || '';
        default: return '';
      }
    });

    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(10000)) {
        throw errorHandler.createError('LOCK_TIMEOUT', 'Contención de bloqueo al encolar job. El sistema está bajo alta carga.');
      }
      sheetAdapter.appendRow({ sheetId: sheetId, rowData: row });
      return { jobId };
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Failed to enqueue job: ${error.message}`);
    } finally {
      lock.releaseLock();
    }
  }

  function claimNextJob() {
    const sheetId = _ensureSheetId();
    const lock = LockService.getScriptLock();
    const columnIndexes = _getColumnIndexes();
    
    // AXIOMA: Lock Queuing Refactor (L9) - Reintentos con backoff exponencial simple
    let iterations = 0;
    while (!lock.tryLock(1000) && iterations < 5) {
      iterations++;
      Utilities.sleep(Math.random() * 100); 
    }

    if (!lock.hasLock()) {
      console.warn('Could not acquire lock for claimNextJob after retries');
      return null;
    }

    try {
      // 1. Obtener todos los jobs 'pending' (Aprovechamos lectura batch)
      const allJobs = sheetAdapter.getRows({ sheetId: sheetId });
      const now = new Date();

      const candidate = allJobs.find(job => {
        if (job.status !== 'pending') return false;
        
        // Si no tiene fecha programada, es ejecución inmediata
        if (!job.scheduledAt) return true;
        
        // Si tiene fecha, verificar si ya es momento
        const scheduleDate = new Date(job.scheduledAt);
        return scheduleDate <= now;
      });

      if (!candidate) {
        _monitor.logDebug('[JobQueueService] No se encontró ningún job "pending" elegible para este momento.');
        return null;
      }

      // 2. Reclamar el candidato específico por su ID
      // Buscamos la fila física para el updateCell atomico
      const found = sheetAdapter.findRowByValue({
        sheetId: sheetId,
        columnIndex: columnIndexes.jobId,
        value: candidate.jobId
      });

      if (!found || found.rowData[columnIndexes.status - 1] !== 'pending') {
        return null; // Probablemente otro worker lo ganó en el milisegundo intermedio
      }

      const { rowNumber, rowData } = found;
      const timestamp = new Date().toISOString();
      
      _monitor.logDebug(`[JobQueueService] Reclamando job cronometrado ${candidate.jobId} en fila ${rowNumber}`);
      sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.status, value: 'processing' });
      sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.updatedAt, value: timestamp });

      const job = _deserializeRow(rowData);
      job.status = 'processing';
      
      _monitor.logInfo(`✅ [JobQueueService] Job RECLAMADO: ${job.jobId} (${job.flowId})`);
      return job;

    } catch (error) {
      _monitor.logError('[JobQueueService.claimNextJob] ERROR:', error.message);
      throw error;
    } finally {
      lock.releaseLock();
    }
  }
  
  // --- INICIO DE LA NUEVA FUNCIONALIDAD ---
  /**
   * Reclama un job específico por su ID si está en estado 'pending'.
   * @param {string} jobId - El ID del job a reclamar.
   * @returns {object|null} El objeto del job si se reclamó con éxito, o null.
   */
  function claimSpecificJob(jobId) {
    if (!jobId) {
      _monitor.logWarn('claimSpecificJob fue llamado sin un jobId.');
      return null;
    }

    const sheetId = _ensureSheetId();
    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
        _monitor.logWarn(`[JobQueueService] No se pudo obtener lock para claimSpecificJob(${jobId})`);
        return null;
      }

      const columnIndexes = _getColumnIndexes();
      const found = sheetAdapter.findRowByValue({
        sheetId: sheetId,
        columnIndex: columnIndexes.jobId,
        value: jobId
      });

      if (!found || found.rowData[columnIndexes.status - 1] !== 'pending') {
        _monitor.logDebug(`[JobQueueService] claimSpecificJob: Job ${jobId} no disponible (no encontrado o ya procesado).`);
        return null;
      }

      const { rowNumber, rowData } = found;
      const timestamp = new Date().toISOString();
      
      sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.status, value: 'processing' });
      sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.updatedAt, value: timestamp });

      const job = _deserializeRow(rowData);
      job.status = 'processing';
      _monitor.logInfo(`✅ [JobQueueService] Job específico RECLAMADO: ${jobId}`);
      return job;

    } catch (error) {
      throw errorHandler.createError('SYSTEM_FAILURE', `Fallo al reclamar el job específico '${jobId}': ${error.message}`);
    } finally {
      lock.releaseLock();
    }
  }
  // --- FIN DE LA NUEVA FUNCIONALIDAD ---

  function updateJobStatus(jobId, status, details = {}) {
    // --- PAYLOAD-AWARE ADAPTATION ---
    if (arguments.length === 1 && typeof jobId === 'object') {
      const payload = jobId;
      jobId = payload.jobId;
      status = payload.status;
      details = payload.details || {};
    }

    const sheetId = _ensureSheetId();
    const columnIndexes = _getColumnIndexes();
    try {
      const found = sheetAdapter.findRowByValue({
        sheetId: sheetId,
        columnIndex: columnIndexes.jobId,
        value: jobId
      });
      
      if (!found) {
        throw errorHandler.createError('RESOURCE_NOT_FOUND', `Job not found: ${jobId}`);
      }

      const { rowNumber } = found;
      const timestamp = new Date().toISOString();
      sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.status, value: status });
      sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.updatedAt, value: timestamp });
      
      if (status === 'failed' && details.error) {
        const errorString = JSON.stringify(details.error);
        sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.error, value: errorString });
      }

      if (status === 'completed' && details.result !== undefined) {
        const resultString = JSON.stringify(details.result);
        sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.result, value: resultString });
      }
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Failed to update job status: ${error.message}`);
    }
  }

  /**
   * ADMIN: Actualiza el initialPayload de un job existente de forma segura.
   * @param {string} jobId
   * @param {object} newPayload
   * @returns {object} { jobId, patched: true }
   */
  function admin_updateJobPayload(jobId, newPayload) {
    if (!jobId) throw errorHandler.createError('INVALID_INPUT', 'admin_updateJobPayload requires jobId');
    if (typeof newPayload !== 'object') throw errorHandler.createError('INVALID_INPUT', 'newPayload must be an object');

    const sheetId = _ensureSheetId();
    const columnIndexes = _getColumnIndexes();
    const found = sheetAdapter.findRowByValue({
      sheetId: sheetId,
      columnIndex: columnIndexes.jobId,
      value: jobId
    });

    if (!found) {
      throw errorHandler.createError('RESOURCE_NOT_FOUND', `Job not found: ${jobId}`);
    }

    const { rowNumber } = found;
    const payloadString = JSON.stringify(newPayload || {});

    // Escribir nuevo initialPayload
    sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.initialPayload, value: payloadString });

    // Actualizar timestamp
    const timestamp = new Date().toISOString();
    sheetAdapter.updateCell({ sheetId: sheetId, rowNumber, columnIndex: columnIndexes.updatedAt, value: timestamp });

    return { jobId, patched: true };
  }

  const schemas = {
    enqueue: {
      description: "Appends a new asynchronous task to the industrial job registry.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          flowId: { type: "string", io_behavior: "SCHEMA", description: "Target workflow identifier." },
          initialPayload: { type: "object", io_behavior: "STREAM", description: "Initial data context for the task." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          jobId: { type: "string", io_behavior: "PROBE", description: "Unique task tracking identifier." }
        } 
      }
    },
    claimNextJob: {
      description: "Executes an atomic claim for the next pending task eligible for processing.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          job: { type: "object", io_behavior: "STREAM", description: "The claimed task record including payload." }
        } 
      }
    },
    claimSpecificJob: {
      description: "Retrieves and claims a specific task identifier for immediate targeted execution.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          jobId: { type: "string", io_behavior: "GATE", description: "Target task identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          job: { type: "object", io_behavior: "STREAM", description: "The claimed task record." }
        } 
      }
    },
    updateJobStatus: {
      description: "Persists the transformation state and result payload of an active task.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          jobId: { type: "string", io_behavior: "GATE", description: "Target task identifier." },
          status: { type: "string", io_behavior: "SCHEMA", description: "Technical state identifier (completed/failed)." },
          details: { type: "object", io_behavior: "STREAM", description: "Resulting payload or error details." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Persistence status confirmation." }
        } 
      }
    },
    admin_updateJobPayload: {
      description: "Emergency architectural tool to modify the initial context of a persisted task.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          jobId: { type: "string", io_behavior: "GATE", description: "Target task identifier." },
          newPayload: { type: "object", io_behavior: "STREAM", description: "Modified data context." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Update confirmation status." }
        } 
      }
    }
  };

  /**
   * METABOLIC JANITOR (L9)
   * Escanea la cola en busca de "Zombie Jobs".
   */
  function cleanupZombieJobs() {
    const sheetId = _ensureSheetId();
    const columnIndexes = _getColumnIndexes();
    const rows = sheetAdapter.getRows({ sheetId: sheetId });
    const now = new Date().getTime();
    const ZOMBIE_TIMEOUT_MS = 10 * 60 * 1000;
    let zombiesCleaned = 0;
    rows.forEach((job) => {
        if (job.status === 'processing' && job.updatedAt) {
            if (now - new Date(job.updatedAt).getTime() > ZOMBIE_TIMEOUT_MS) {
                updateJobStatus(job.jobId, 'pending', { error: 'Zombie Reset' });
                zombiesCleaned++;
            }
        }
    });
    return { zombiesCleaned };
  }

  /**
   * PURGE PROTOCOL (L7)
   * Elimina todos los jobs que NO estén en estado 'pending' o 'processing'.
   * Mantiene el darma de "Puente, No Database".
   */
  function purgeProcessedJobs() {
    // 1. Obtener todos los jobs actuales como objetos
    const rows = sheetAdapter.getRows({ sheetId: jobQueueSheetId });
    if (rows.length === 0) return { purged: 0 };

    const initialCount = rows.length;
    // 2. Filtrar solo los que están vivos
    const itemsToKeep = rows.filter(job => job.status === 'pending' || job.status === 'processing');

    // Si no hay nada que borrar, salimos
    if (itemsToKeep.length === initialCount) return { purged: 0 };

    // 3. Limpiar la hoja física
    sheetAdapter.clearRows({ sheetId: jobQueueSheetId, startRow: 2 });

    // 4. Volcar los jobs que mantenemos
    if (itemsToKeep.length > 0) {
      sheetAdapter.insertRowsBatch({ 
        sheetId: jobQueueSheetId, 
        rows: itemsToKeep 
      });
    }

    return { purged: initialCount - itemsToKeep.length };
  }


  function verifyConnection() {
    try {
      _ensureSheetId();
      return { status: "ACTIVE", queueReady: true };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

  return {
    id: "JOB_QUEUE",
    label: "Task Master",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    description: "Industrial task queue for asynchronous workflow execution and guaranteed delivery.",
    semantic_intent: "STREAM",
    schemas: schemas,
    // Protocol mapping (SYS_V1)
    verifyConnection,
    // Original methods
    enqueue,
    claimNextJob,
    claimSpecificJob, 
    updateJobStatus,
    admin_updateJobPayload,
    cleanupZombieJobs,
    purgeProcessedJobs
  };

}






