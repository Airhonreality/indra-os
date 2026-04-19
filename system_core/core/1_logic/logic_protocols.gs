/**
 * =============================================================================
 * ARTEFACTO: 1_logic/logic_protocols.gs
 * RESPONSABILIDAD: Nativización de protocolos de datos (Logic Tier).
 * AXIOMA DE SINCERIDAD: Solo contiene protocolos que requieren lógica pura
 *         o coordinación entre múltiples providers.
 * =============================================================================
 */

/**
 * PROTOCOLO: PULSE_WAKEUP
 * Despierta el motor de procesos para procesar la cola de tareas.
 */
function PULSE_WAKEUP(uqo) {
  pulse_service_process_next(); 
  return { metadata: { status: 'OK' } };
}

// NOTA: Los protocolos ATOM_*, SERVICE_*, SCHEMA_*, etc., ahora se descubren
// dinámicamente vía PAD en sus respectivos providers, evitando bucles recursivos.

