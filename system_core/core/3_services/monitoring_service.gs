// =============================================================================
// ARTEFACTO: 3_services/monitoring_service.gs
// CAPA: 3 — Services (Infraestructura de Soporte)
// RESPONSABILIDAD: El túnel de conciencia hacia el Cliente. Captura todos los eventos
//         del servidor durante una ejecución y los "flushea" en el campo
//         `metadata.logs` del response HTTP para que el cliente los muestre
//         en consola en tiempo real. En Hito 1: solo buffer en memoria.
//
// AXIOMAS:
//   - En Hito 1: NO persiste nada. Cero Sheets, cero Drive, cero email.
//   - El buffer de logs es LOCAL a cada instancia de llamada GAS.
//   - `flushLogs()` DEBE ser llamado exactamente una vez al final de cada petición.
//   - Depende de `error_handler.gs` para estructurar eventos de nivel ERROR.
//
// RESTRICCIONES:
//   - NO puede escribir en Drive ni en Sheets en esta fase.
//   - NO puede hacer llamadas de red externas.
//   - `flushLogs()` vacía el buffer. Llamarlo dos veces en la misma ejecución
//     retorna un array vacío en la segunda llamada. Es por diseño.
// =============================================================================

/**
 * Niveles de log por severidad, en orden ascendente.
 * @const {Object.<string, number>}
 */
const LOG_LEVELS = Object.freeze({
  DEBUG:   0,
  INFO:    1,
  WARN:    2,
  ERROR:   3,
  SILENT:  99, // Deshabilita todos los logs
});

/**
 * Nivel mínimo de log que se añade al buffer.
 * Cambiar a 'INFO' para producción, 'DEBUG' para desarrollo.
 * @const {string}
 */
const ACTIVE_LOG_LEVEL = 'DEBUG';

// Buffer en memoria de la ejecución actual.
// GAS es stateless: este array vive solo durante una ejecución de doPost.
let _logBuffer_ = [];

/**
 * Función interna que añade una entrada al buffer si supera el nivel mínimo.
 * @param {string} level   - Nivel del log ('DEBUG', 'INFO', 'WARN', 'ERROR').
 * @param {string} message - Mensaje del evento.
 * @param {*} [context]    - Datos de contexto adicionales (opcional).
 * @private
 */
function _log_(level, message, context) {
  if (LOG_LEVELS[level] < LOG_LEVELS[ACTIVE_LOG_LEVEL]) return;

  const entry = {
    level:     level,
    message:   String(message),
    timestamp: new Date().toISOString(),
  };

  // Serialización segura del contexto (evita referencias circulares)
  if (context !== undefined && context !== null) {
    try {
      entry.context = JSON.parse(JSON.stringify(context));
    } catch (e) {
      entry.context = '[monitoring_service: contexto no serializable]';
    }
  }

  _logBuffer_.push(entry);

  // También imprime en los logs nativos de GAS (visible en el editor GAS)
  console.log(`[${level}] ${message}`);
}

// ─── API PÚBLICA ─────────────────────────────────────────────────────────────

/**
 * Registra un evento de nivel DEBUG (solo visible en modo desarrollo).
 * @param {string} message - Mensaje del evento.
 * @param {*} [context]    - Datos de contexto adicionales.
 */
function logDebug(message, context) {
  _log_('DEBUG', message, context);
}

/**
 * Registra un evento informativo normal del sistema.
 * @param {string} message - Mensaje del evento.
 * @param {*} [context]    - Datos de contexto adicionales.
 */
function logInfo(message, context) {
  _log_('INFO', message, context);
}

/**
 * Registra una advertencia: el sistema continúa pero algo es anómalo.
 * @param {string} message - Mensaje de la advertencia.
 * @param {*} [context]    - Datos de contexto adicionales.
 */
function logWarn(message, context) {
  _log_('WARN', message, context);
}

/**
 * Registra un error: el sistema no pudo completar la operación.
 * @param {string} message    - Mensaje del error.
 * @param {Object} [errorObj] - Objeto de error creado por `error_handler.gs`.
 */
function logError(message, errorObj) {
  _log_('ERROR', message, errorObj || null);
}

/**
 * Retorna el buffer de logs acumulado y lo vacía (flush).
 * Debe ser llamado exactamente UNA VEZ al final de cada petición HTTP,
 * inmediatamente antes de construir el response JSON final.
 *
 * @returns {Array<Object>} Array de entradas de log del ciclo de ejecución actual.
 */
function flushLogs() {
  const snapshot = _logBuffer_.slice(); // Copia defensiva
  _logBuffer_ = [];                      // Vaciar buffer
  return snapshot;
}

/**
 * Retorna el número de entradas en el buffer actual sin vaciarlo.
 * Útil para tests y diagnóstico.
 * @returns {number}
 */
function getBufferSize() {
  return _logBuffer_.length;
}
