// =============================================================================
// ARTEFACTO: 0_gateway/pulse_router.gs
// CAPA: 0 — Gateway Layer (Interceptor de Pulsos)
// RESPONSABILIDAD: Interceptar side-channels (Boomerang y Webhooks) antes
//         de la autenticación del Gateway.
// =============================================================================

/**
 * Procesa la ignición de pulsos (The Boomerang | ADR-018).
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {GoogleAppsScript.Content.TextOutput|null} Response o null si no es un pulso.
 */
function pulse_router_intercept(e) {
  // 1. Detección de Ignición de Pulsos (Boomerang)
  const igniteHeader = e && e.parameter && e.parameter.ignite === 'true' || 
                       e && e.headers && e.headers['X-Indra-Ignite'] === 'true';
  
  if (igniteHeader) {
    logInfo('[pulse_router] Boomerang detectado. Iniciando Red de Pulsos.');
    try {
      const pulseResult = pulse_service_process_next(); // → pulse_service.gs
      return _buildResponse_(200, { 
        items: [], 
        metadata: { status: 'OK', message: 'Ignición completada.', pulse_executed: !!pulseResult } 
      });
    } catch (err) {
      logError('[pulse_router] Error en ignición del Boomerang.', err);
      return _buildResponse_(500, { items: [], metadata: { status: 'ERROR', error: err.message } });
    }
  }

  // 2. Detección de Webhooks de Soberanía (ADR-018)
  const webhookId = e && e.parameter && e.parameter.webhook_id;
  if (webhookId) {
    logInfo('[pulse_router] Webhook de Soberanía detectado.', { webhookId });
    try {
      const pulseId = trigger_hub_activate(webhookId); // → trigger_hub.gs
      return _buildResponse_(202, { 
        items: [], 
        metadata: { status: 'OK', message: 'Trigger aceptado. Pulso encolado.', pulse_id: pulseId } 
      });
    } catch (err) {
      logError('[pulse_router] Error en activación de Webhook de Soberanía.', err);
      return _buildResponse_(404, { items: [], metadata: { status: 'ERROR', error: err.message } });
    }
  }

  return null; // No es un side-channel, continuar al Gateway normal
}
