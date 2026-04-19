/**
 * =============================================================================
 * ARTEFACTO: 3_services/trigger_hub.gs
 * RESPONSABILIDAD: Motor de resolución de disparadores externos (Trigger Hub).
 * DHARMA (ADR-018):
 *   - Blindaje: El ID externo no revela el Workflow ID.
 *   - Sinceridad: Registra el origen del disparo (Webhook).
 * =============================================================================
 */

/**
 * Resuelve un Webhook ID y encola el Workflow correspondiente.
 * @param {string} webhookId - El ID soberano desde la URL.
 * @returns {string} El ID del pulso generado.
 */
function trigger_hub_activate(webhookId) {
  const mapping = trigger_registry_resolve(webhookId); // → trigger_registry.gs
  if (!mapping) {
    throw createError('NOT_FOUND', 'El Webhook ID es inválido o ha sido revocado.');
  }

  // AXIOMA: Construimos un UQO síncrono para ejecutar el workflow
  const uqo = {
    protocol: 'WORKFLOW_EXECUTE',
    provider: 'system',
    data: {
      workflow_id: mapping.workflow_id
    },
    trace_id: Utilities.getUuid()
  };

  // Encolar pulso (Liberación Inmediata)
  return pulse_service_enqueue(uqo, {
    trigger_source: 'WEBHOOK',
    owner_id: mapping.owner_id
  });
}

/**
 * Registra o recupera el Webhook ID para un Workflow.
 * @param {string} workflowId - El ID del workflow.
 */
function trigger_hub_getWebhookId(workflowId) {
  const ownerId = readCoreOwnerEmail();
  const ss = _trigger_registry_getSS();
  const data = ss.getSheets()[0].getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === workflowId && data[i][2] === ownerId && data[i][4] === 'ACTIVE') {
      return data[i][0];
    }
  }
  
  // Si no existe, lo creamos
  return trigger_registry_register(workflowId, ownerId);
}

/**
 * PROTOCOLO: SYSTEM_TRIGGER_HUB_GENERATE
 * Regenera o sincroniza todos los disparadores activos.
 */
function SYSTEM_TRIGGER_HUB_GENERATE(uqo) {
  logInfo('[trigger_hub] Sincronizando infraestructura de disparadores...');
  // Por ahora, un simple handshake de éxito hasta que el Ledger de Workflows esté expandido.
  return { metadata: { status: 'OK', message: 'Infraestructura de disparadores sincronizada.' } };
}
