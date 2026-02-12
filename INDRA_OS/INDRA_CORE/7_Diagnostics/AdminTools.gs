// ======================================================================
// ARTEFACTO: 7_Diagnostics/AdminTools.gs
// DHARMA: Proveer una consola de operaciones centralizada para el diagnóstico,
//         mantenimiento y manipulación segura del estado del sistema.
// ======================================================================

/**
 * Factory para crear AdminTools - Herramientas de diagnóstico y administración.
 * Este artefacto sirve como una fachada para operaciones de mantenimiento
 * que pueden ser expuestas a través de menús de UI o arneses de diagnóstico.
 *
 * @param {object} dependencies - Dependencias inyectadas.
 * @param {object} dependencies.configurator - Servicio de configuración.
 * @param {object} dependencies.manifest - Manifiesto del sistema.
 * @param {object} dependencies.jobQueueService - Servicio de cola de jobs.
 * @param {object} dependencies.sheetAdapter - Adaptador de sheets.
 * @param {object} dependencies.errorHandler - Manejador de errores.
 * @param {object} dependencies.driveAdapter - Adaptador de Drive.
 * @param {object} dependencies.tokenManager - Gestor de Tokens.
 * @returns {object} Una instancia inmutable y congelada de AdminTools.
 */
function createAdminTools({ configurator, manifest, jobQueueService, sheetAdapter, errorHandler, driveAdapter, tokenManager }) {
  
  // Validación de dependencias para garantizar que las herramientas puedan operar.
  if (!configurator) throw new Error('AdminTools: La dependencia "configurator" es requerida.');
  if (!manifest) throw new Error('AdminTools: La dependencia "manifest" es requerida.');
  if (!jobQueueService) throw new Error('AdminTools: La dependencia "jobQueueService" es requerida.');
  if (!sheetAdapter) throw new Error('AdminTools: La dependencia "sheetAdapter" es requerida.');
  if (!errorHandler) throw new Error('AdminTools: La dependencia "errorHandler" es requerida.');
  if (!driveAdapter) throw new Error('AdminTools: La dependencia "driveAdapter" es requerida.');
  if (!tokenManager) throw new Error('AdminTools: La dependencia "tokenManager" es requerida.');
  
  /**
   * Obtiene un snapshot completo de la JobQueue, incluyendo todas las filas como objetos y estadísticas agregadas.
   * @returns {{ jobs: Array<object>, stats: object }} Un objeto con la lista de jobs y un resumen estadístico.
   */
  function listAllJobs() {
    try {
      const jobQueueSheetId = configurator.retrieveParameter({ 
        key: manifest.SHEETS_SCHEMA.JOB_QUEUE.PROPERTY 
      });
      
      if (!jobQueueSheetId) {
        throw errorHandler.createError('CONFIGURATION_ERROR', 'El ID de la hoja de cálculo de la cola de trabajos no está configurado.');
      }
      
      const jobs = sheetAdapter.getRows({ sheetId: jobQueueSheetId });
      
      if (!jobs || jobs.length === 0) {
        return { jobs: [], stats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 } };
      }
      
      const stats = {
        total: jobs.length,
        pending: jobs.filter(j => j.status === 'pending').length,
        processing: jobs.filter(j => j.status === 'processing').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        failed: jobs.filter(j => j.status === 'failed').length
      };
      
      return { jobs, stats };
      
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('ADMIN_TOOLS_ERROR', `Error al listar los jobs: ${error.message}`);
    }
  }
  
  /**
   * Devuelve únicamente las estadísticas agregadas de la cola de trabajos.
   * @returns {object} Un objeto con las estadísticas { total, pending, processing, completed, failed }.
   */
  function getQueueStats() {
    try {
      const result = listAllJobs();
      return result.stats;
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('ADMIN_TOOLS_ERROR', `Error al obtener las estadísticas de la cola: ${error.message}`);
    }
  }
  
  /**
   * Elimina todos los jobs de la cola, excepto la fila de cabecera.
   * ¡PRECAUCIÓN! Esta es una operación destructiva que borra el historial de ejecuciones.
   * @returns {{ cleared: boolean, rowsDeleted: number }} Un objeto confirmando la operación.
   */
  function clearAllJobs() {
    try {
      const jobQueueSheetId = configurator.retrieveParameter({ 
        key: manifest.SHEETS_SCHEMA.JOB_QUEUE.PROPERTY 
      });
      
      if (!jobQueueSheetId) {
        throw errorHandler.createError('CONFIGURATION_ERROR', 'El ID de la hoja de cálculo de la cola de trabajos no está configurado.');
      }
      
      // Acceso directo a la API de GAS justificado por el Dharma de AdminTools (violación controlada).
      const sheet = SpreadsheetApp.openById(jobQueueSheetId).getSheets()[0];
      const lastRow = sheet.getLastRow();
      
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
        SpreadsheetApp.flush(); // Asegurar la eliminación inmediata.
        return { cleared: true, rowsDeleted: lastRow - 1 };
      }
      
      return { cleared: true, rowsDeleted: 0 };
      
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('ADMIN_TOOLS_ERROR', `Error al limpiar los jobs: ${error.message}`);
    }
  }
  
  /**
   * Cambia el estado de un job específico a 'pending' para permitir su re-procesamiento.
   * @param {string} jobId - El ID del job a resetear.
   * @returns {void}
   */
  function resetJob(jobId) {
    try {
      if (!jobId || typeof jobId !== 'string') {
        throw errorHandler.createError('INVALID_INPUT', 'Se requiere un jobId válido.');
      }
      // Delega la operación al JobQueueService, que ya tiene la lógica para encontrar y actualizar.
      jobQueueService.updateJobStatus(jobId, 'pending', {
        error: "Reseteado manualmente por un administrador.", // Dejar una traza en el log
        result: "" // Limpiar el resultado anterior
      });
      return { reset: true, jobId: jobId };
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('ADMIN_TOOLS_ERROR', `Error al resetear el job "${jobId}": ${error.message}`);
    }
  }
  
  
  /**
   * Limpia el caché de todos los flows registrados.
   * @returns {{ cleared: boolean, flowsCleared: string[] }}
   */
  function clearAllFlowsCache() {
    try {
      // Instanciar FlowRegistry con las dependencias necesarias
      const flowRegistry = createFlowRegistry({ manifest, driveAdapter, configurator, errorHandler });
      const flowIds = flowRegistry.listFlows();
      const cache = CacheService.getScriptCache();
      const cleared = [];
      flowIds.forEach(flowId => {
        const cacheKey = 'flow_' + flowId;
        cache.remove(cacheKey);
        cleared.push(flowId);
      });
      return { cleared: true, flowsCleared: cleared };
    } catch (error) {
      if (error.code) throw error;
      throw errorHandler.createError('ADMIN_TOOLS_ERROR', `Error al limpiar el caché de todos los flows: ${error.message}`);
    }
  }


  /**
   * Actualiza el token maestro del sistema (System Token).
   * @param {object} payload - { newToken: string }
   * @returns {{ success: boolean, message: string }}
   */
  function setSystemToken(payload) {
    const { newToken } = payload || {};
    if (!newToken || typeof newToken !== 'string') {
      throw errorHandler.createError('INVALID_INPUT', 'Se requiere un newToken válido (string).');
    }
    
    // Guardamos en ambos nombres canónicos por redundancia histórica
    configurator.storeParameter({ key: 'ORBITAL_CORE_SATELLITE_API_KEY', value: newToken });
    configurator.storeParameter({ key: 'ORBITAL_SYSTEM_TOKEN', value: newToken });
    
    return { success: true, message: 'System Token actualizado correctamente.' };
  }

  // Congelar y retornar la interfaz pública del artefacto.
  const schemas = {
    listAllJobs: {
      description: "Extracts a complete snapshot of all queued jobs with aggregated statistics.",
      semantic_intent: "PROBE",
      io_interface: {
        outputs: {
          jobs: { type: "array", role: "STREAM", description: "Collection of job objects." },
          stats: { type: "object", role: "PROBE", description: "Aggregated queue statistics." }
        }
      }
    },
    getQueueStats: {
      description: "Returns aggregated queue statistics (total, pending, processing, completed, failed).",
      semantic_intent: "PROBE",
      io_interface: {
        outputs: {
          total: { type: "number", role: "PROBE", description: "Total job count." },
          pending: { type: "number", role: "PROBE", description: "Pending job count." },
          processing: { type: "number", role: "PROBE", description: "Processing job count." },
          completed: { type: "number", role: "PROBE", description: "Completed job count." },
          failed: { type: "number", role: "PROBE", description: "Failed job count." }
        }
      }
    },
    clearAllJobs: {
      description: "⚠️ DESTRUCTIVE: Removes all jobs from the queue (preserves header row).",
      semantic_intent: "TRIGGER",
      io_interface: {
        outputs: {
          cleared: { type: "boolean", role: "PROBE", description: "Operation success status." },
          rowsDeleted: { type: "number", role: "PROBE", description: "Number of rows deleted." }
        }
      }
    },
    resetJob: {
      description: "Resets a specific job status to 'pending' for reprocessing.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: {
          jobId: { type: "string", role: "GATE", description: "Unique job identifier to reset." }
        },
        outputs: {
          reset: { type: "boolean", role: "PROBE", description: "Reset operation status." },
          jobId: { type: "string", role: "STREAM", description: "Confirmed job identifier." }
        }
      }
    },
    clearAllFlowsCache: {
      description: "Purges ScriptCache for all registered workflow blueprints.",
      semantic_intent: "TRIGGER",
      io_interface: {
        outputs: {
          cleared: { type: "boolean", role: "PROBE", description: "Cache purge status." },
          flowsCleared: { type: "array", role: "STREAM", description: "List of cleared flow identifiers." }
        }
      }
    },
    setSystemToken: {
      description: "Registers a new master system token (password) for satellite authentication.",
      semantic_intent: "TRIGGER",
      exposure: "public",
      io_interface: {
        inputs: {
          newToken: { type: "string", role: "GATE", description: "New master token value." }
        },
        outputs: {
          success: { type: "boolean", role: "PROBE", description: "Operation status." },
          message: { type: "string", role: "STREAM", description: "Confirmation details." }
        }
      }
    },

  };

  function verifyConnection() {
    return { status: "ACTIVE", toolsReady: true };
  }

  return {
    id: "adminTools",
    label: "System Control",
    archetype: "SERVICE",
    domain: "GOVERNANCE",
    description: "Centralized maintenance console for system diagnostics and state manipulation.",
    semantic_intent: "ADMIN",
    schemas: schemas,
    // Protocol mapping (SYS_V1)
    verifyConnection,
    // Original methods
    listAllJobs,
    getQueueStats,
    clearAllJobs,
    resetJob,
    clearAllFlowsCache,
    setSystemToken
  };
}

// ======================================================================
// FUNCIONES DE ARNÉS (Wrappers para ser llamados manualmente desde el editor)
// ======================================================================

/**
 * ARNÉS DE DIAGNÓSTICO: Muestra las estadísticas de la JobQueue en la UI o en los Logs.
 */
function showJobQueueStats() {
  try {
    const stack = _assembleExecutionStack();
    const stats = stack.adminTools.getQueueStats();
    
    const message = `📊 Estado de la Cola de Jobs:\n\n` +
                    `Total: ${stats.total}\n` +
                    `⏳ Pendientes: ${stats.pending}\n` +
                    `⚙️ Procesando: ${stats.processing}\n` +
                    `✅ Completados: ${stats.completed}\n` +
                    `❌ Fallados: ${stats.failed}`;
    
    // Intenta usar la UI, si falla (contexto sin UI), usa el Logger.
    try {
      const ui = SpreadsheetApp.getUi();
      ui.alert('📋 Estado de la Cola', message, ui.ButtonSet.OK);
    } catch (uiError) {
      Logger.log('═════════════════════════════════════════');
      Logger.log(message);
      Logger.log('═════════════════════════════════════════');
    }
    
  } catch (error) {
    const errorMsg = 'Error al obtener estadísticas: ' + error.message;
    try {
      SpreadsheetApp.getUi().alert('❌ Error', errorMsg, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (uiError) {
      Logger.log('❌ ' + errorMsg);
    }
  }
}

/**
 * ARNÉS DE DIAGNÓSTICO: Resetea un job específico a 'pending'.
 * Instrucciones: Edita la constante 'jobId' y ejecuta esta función.
 */
function adminResetJobToPending() {
  // ⚙️ EDITA ESTE VALOR CON EL JOB ID QUE QUIERES RESETEAR:
  const jobId = 'ID_DEL_JOB_A_RESETEAR';
  
  try {
    const stack = _assembleExecutionStack();
    Logger.log(`🔄 Reseteando job a 'pending': ${jobId}`);
    
    stack.adminTools.resetJob(jobId);
    
    Logger.log(`✅ Operación completada. El job "${jobId}" ahora está en estado 'pending' y listo para ser re-procesado.`);
    
  } catch (error) {
    Logger.log(`❌ Error al resetear el job: ${error.message}\nStack: ${error.stack}`);
  }
}



/**
 * ARNÉS DE DIAGNÓSTICO: Limpia el caché de todos los flows.
 */
function adminClearAllFlowsCache() {
  try {
    const stack = _assembleExecutionStack();
    Logger.log('🗑️ Limpiando caché de TODOS los flows...');
    const result = stack.adminTools.clearAllFlowsCache();
    if (result.cleared) {
      Logger.log(`✅ Caché limpiado para flows: ${(result.flowsCleared || []).join(', ')}`);
    }
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
  }
}

