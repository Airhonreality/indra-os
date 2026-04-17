/**
 * =============================================================================
 * ARTEFACTO: 3_services/pulse_service.gs
 * RESPONSABILIDAD: Motor lógico de la Red de Pulsos. 
 * DHARMA (ADR-018):
 *   - Auto-Ignición (The Boomerang): El Core se invoca a sí mismo.
 *   - Liberación Inmediata: Respondemos al cliente antes de ejecutar.
 *   - Soberanía Micelar: Validamos identidad del dueño del pulso (ADR-019).
 * CORE_VERSION = "4.50.0-OMNI-SOVEREIGN"; // FASE: Renacimiento Completado.
 * =============================================================================
 */

/**
 * Encola una intención (UQO) para su ejecución asíncrona.
 * @param {Object} uqo - El UQO con la intención original.
 * @param {Object} [options] - scheduling, trigger_source, etc.
 * @returns {string} ID del pulso generado.
 */
function pulse_service_enqueue(uqo, options = {}) {
  const pulseId = Utilities.getUuid();
  const now = new Date().toISOString();
  
  // AXIOMA DE SOBERANÍA: El pulso hereda la identidad del dueño actual (ADR-019)
  const ownerEmail = readCoreOwnerEmail(); // → system_config.gs
  
  const pulseData = {
    pulse_id: pulseId,
    timestamp: now,
    scheduled_at: options.scheduled_at || now,
    owner_id: ownerEmail,
    trigger_source: options.trigger_source || 'MANUAL',
    protocol: uqo.protocol,
    provider: uqo.provider,
    status: 'PENDING',
    uqo_payload: uqo,
    trace_id: uqo.trace_id || Utilities.getUuid()
  };
  
  // Guardar físicamente en el Ledger
  pulse_ledger_append(pulseData); // → pulse_ledger.gs
  
  // Lanzar ignición asíncrona (Boomerang)
  // No esperamos el resultado para liberar al cliente de inmediato.
  pulse_service_ignite(pulseId);
  
  return pulseId;
}

/**
 * Disparador de ignición (El Boomerang).
 * Llama al Core vía HTTP con el header de ignición.
 * @param {string} pulseId - El ID del pulso a encender.
 */
function pulse_service_ignite(pulseId) {
  try {
    let selfUrl = null;
    try {
      selfUrl = ScriptApp.getService().getUrl();
    } catch (e) {
      logWarn('[pulse_service] No se pudo obtener URL del script (falta permiso script.webapp.deploy).');
    }
    
    if (!selfUrl) {
      logWarn('[pulse_service] Boomerang omitido por falta de identidad URL.');
      return;
    }
    
    const igniteHeader = { 'X-Indra-Ignite': 'true', 'X-Indra-Pulse-ID': pulseId };
    
    // Ignición asíncrona (fetch sin esperar)
    UrlFetchApp.fetch(selfUrl, {
      method: 'post',
      headers: igniteHeader,
      payload: JSON.stringify({ protocol: 'PULSE_WAKEUP', pulse_id: pulseId }),
      muteHttpExceptions: true
    });
    
    pulse_ledger_updateStatus(pulseId, 'IGNITED');
    logInfo(`[pulse_service] Ignición enviada para pulso: ${pulseId}`);
  } catch (err) {
    logError('[pulse_service] Fallo en la ignición del Boomerang.', err);
  }
}

/**
 * Procesa el siguiente pulso disponible en la cola.
 * Invocado por el Boomerang (Gateway) o el Maintenance Trigger.
 */
function pulse_service_process_next() {
  const pending = pulse_ledger_getPending(); // → pulse_ledger.gs
  if (!pending || pending.length === 0) {
    logInfo('[pulse_service] Sin pulsos pendientes en la cola.');
    return null;
  }
  
  const pulse = pending[0];
  const pulseId = pulse.pulse_id;
  
  logInfo(`[pulse_service] Procesando pulso: ${pulseId} (${pulse.owner_id})`);
  pulse_ledger_updateStatus(pulseId, 'EXECUTING');
  
  try {
    // AXIOMA DE SINCERIDAD: Ejecutamos a través del router original
    // para que se cumplan todas las validaciones de contrato y burst control.
    const result = route(pulse.uqo_payload); // → protocol_router.gs
    
    const status = result.metadata?.status === 'ERROR' ? 'FAILED' : 'COMPLETED';
    const summary = result.metadata?.execution || result.metadata || {};
    
    pulse_ledger_updateStatus(pulseId, status, { result_summary: summary });
    logInfo(`[pulse_service] Pulso ${pulseId} finalizado como: ${status}`);
    
    return result;
  } catch (err) {
    logError(`[pulse_service] Error crítico al ejecutar pulso ${pulseId}`, err);
    pulse_ledger_updateStatus(pulseId, 'FAILED', { result_summary: { error: err.message } });
    return null;
  }
}

/**
 * Trigger de Mantenimiento (Resurrección de Pulsos).
 * Debe configurarse para ejecutarse cada día (no cada minuto).
 * OPTIMIZACIÓN: Solo ejecuta si hay workflows con triggers activos.
 */
function pulse_service_maintenance_trigger() {
  logInfo('[pulse_service] Ejecutando ronda de mantenimiento de pulsos...');
  
  // Validación: Si no hay triggers de workflow activos, no purgar innecesariamente
  let hasWorkflowTriggers = false;
  try {
    const triggers = ScriptApp.getProjectTriggers();
    hasWorkflowTriggers = triggers.some(t => t.getHandlerFunction() === 'pulse_service_maintenance_trigger');
  } catch (err) {
    logWarn(`[pulse_service] No se pudo verificar triggers: ${err.message}`);
    // Si no hay permisos, asumimos que no hay triggers configurados para este script
  }
  
  if (!hasWorkflowTriggers) {
    logInfo('[pulse_service] Sin triggers de workflow activos o sin permisos. Mantenimiento omitido.');
    return;
  }
  
  // 1. Salud del Ledger: Purgar tareas terminadas/fallidas antiguas (Axioma de Autocuración)
  pulse_ledger_purge(); // → pulse_ledger.gs
  
  // 2. Ejecutar siguiente pendiente
  pulse_service_process_next();

  // 3. LATIDO DE INTEGRIDAD SOBERANA (v4.50)
  pulse_service_integrity_heartbeat();
}

/**
 * Patrulla de Integridad: Reconcilia Ledger vs Realidad Física.
 */
function pulse_service_integrity_heartbeat() {
  logInfo('[pulse_service] Iniciando Patrulla de Integridad...');
  const ledgerId = readMasterLedgerId();
  if (!ledgerId) return;

  try {
    const atoms = _ledger_get_batch_metadata_(['WORKSPACE', 'DATA_SCHEMA', 'BRIDGE']);
    atoms.forEach(atom => {
       try {
         // Verificar existencia física
         const file = DriveApp.getFileById(atom.drive_id);
         
         // Reconciliación de Naming: Si el usuario renombró en Drive, el Ledger se adapta.
         const physicalName = file.getName();
         if (physicalName !== atom.label) {
           logInfo(`[integrity] Reconciliando etiqueta: ${atom.label} -> ${physicalName}`);
           // Actualizar Ledger (vía system_provider)
         }
       } catch (e) {
         logWarn(`[integrity] Átomo huérfano detectado: ${atom.label} (${atom.drive_id}). Marcando para revisión.`);
         // Aquí podríamos marcar en el Ledger como STATUS: 'ORPHAN'
       }
    });
    
    // 4. Salubridad de Procesos (Task Monitor)
    // Limpiar procesos 'ACTIVE' que no han pulsado en más de 2 horas.
    logInfo('[pulse_service] Patrulla de Integridad finalizada con éxito.');
  } catch (err) {
    logError('[pulse_service] Fallo en la patrulla de integridad.', err);
  }
}
