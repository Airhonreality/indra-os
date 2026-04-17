/**
 * =============================================================================
 * ARTEFACTO: 0_utils/indra_watchdog.js
 * RESPONSABILIDAD: Vigilancia del tiempo de ejecución y prevención de timeouts.
 * AXIOMA: Fatiga de Proceso (Checkpoint-based).
 * =============================================================================
 */

const Watchdog = (function() {
  let startTime = null;
  const EXECUTION_LIMIT_MS = 25000; // 25s (Límite razonable para una petición web de 30s)

  /**
   * Inicia el cronómetro de la petición actual.
   */
  function start() {
    startTime = Date.now();
    logDebug('[watchdog] Cronómetro de ejecución iniciado.');
  }

  /**
   * Verifica si el proceso está cerca de su límite de fatiga.
   * Un proveedor debería llamar a esto en bucles largos.
   * @returns {boolean} true si el tiempo está por agotarse.
   */
  function isFatigued() {
    if (!startTime) return false;
    const elapsed = Date.now() - startTime;
    return elapsed > EXECUTION_LIMIT_MS;
  }

  /**
   * Obtiene el tiempo restante antes de la interrupción controlada.
   */
  function getRemainingTime() {
    if (!startTime) return 0;
    return Math.max(0, EXECUTION_LIMIT_MS - (Date.now() - startTime));
  }

  /**
   * Obtiene el tiempo transcurrido desde el inicio.
   */
  function getElapsedMs() {
    if (!startTime) return 0;
    return Date.now() - startTime;
  }

  return {
    start: start,
    isFatigued: isFatigued,
    getRemainingTime: getRemainingTime,
    getElapsedMs: getElapsedMs
  };

})();
