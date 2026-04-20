// =============================================================================
// ARTEFACTO: 4_support/error_handler.gs
// CAPA: 4 — Support (Utilidades Puras)
// RESPONSABILIDAD: Clasificador inmutable de la falla. Fábrica de objetos de error
//         estructurados. Cero dependencias. Si todo lo demás falla, esto funciona.
//
// AXIOMAS:
//   - Sin dependencias externas. No llama a monitoring_service ni a nadie.
//   - El objeto de error es inmutable (Object.freeze).
//   - La severidad se clasifica automáticamente por código.
//   - Protección contra referencias circulares en el campo `details`.
//
// RESTRICCIONES:
//   - NO puede hacer llamadas de red.
//   - NO puede escribir en PropertiesService.
//   - NO puede referenciar ningún otro archivo del Core.
// =============================================================================

/**
 * Mapa de severidad por código de error.
 * CRITICAL: El sistema no puede continuar. Requiere intervención inmediata.
 * WARNING:  El sistema puede degradar la petición actual y continuar.
 * @const {Object.<string, string>}
 */
const ERROR_SEVERITY_MAP = Object.freeze({
  // === CRITICAL ===
  SYSTEM_FAILURE:       'CRITICAL', // Falla interna catastrófica del Core
  UNAUTHORIZED:         'CRITICAL', // Token de acceso inválido o ausente
  CONFIG_MISSING:       'CRITICAL', // Clave de configuración crítica no encontrada
  PROVIDER_UNREACHABLE: 'CRITICAL', // La API externa no respondió
  EXTERNAL_API_ERROR:   'CRITICAL', // La API externa respondió con un error 4xx/5xx
  CONTRACT_VIOLATION:   'CRITICAL', // Un Provider retornó un átomo sin campos canónicos
  SECURITY_BREACH:      'CRITICAL', // Intento de acceso a recurso protegido

  // === WARNING ===
  INVALID_INPUT:        'WARNING',  // El UQO está mal formado
  PROTOCOL_NOT_FOUND:   'WARNING',  // El protocolo solicitado no existe
  PROTOCOL_NOT_CRYSTALIZED: 'WARNING', // El protocolo no está en el mapa estático
  PROVIDER_NOT_FOUND:   'WARNING',  // El provider solicitado no está registrado
  UNSUPPORTED_FILTER:   'WARNING',  // El operador de filtro no es válido
  NOT_FOUND:            'WARNING',  // El ítem solicitado no existe
  DATA_PROCESSING_ERROR:'WARNING',  // Error al mapear datos del backend externo
  PERSISTENCE_FAILURE:  'WARNING',  // Error al escribir en Google Drive
});

/**
 * Catálogo de sugerencias de recuperación (Recovery Hints).
 */
const RECOVERY_HINTS = {
  UNAUTHORIZED: 'Inicia sesión de nuevo para renovar tus credenciales.',
  PROTOCOL_NOT_CRYSTALIZED: 'Contacta al soberano para registrar este protocolo en el mapa estático.',
  NOT_FOUND: 'Verifica el ID del átomo o la ruta solicitada.',
  SYSTEM_FAILURE: 'Inténtalo de nuevo en unos momentos o revisa el Core Log.',
  PROVIDER_UNREACHABLE: 'Verifica tu conexión a internet o el estado del servicio externo.'
};

/**
 * Serializa el campo `details` de forma segura, evitando referencias circulares.
 * @param {*} details - El objeto de detalles a serializar.
 * @returns {*} El objeto de detalles seguro, o un string de error si hay circularidad.
 * @private
 */
function _serializeDetails_(details) {
  if (details === null || details === undefined) return null;
  if (typeof details !== 'object') return details;

  const seen = new WeakSet();
  try {
    JSON.stringify(details, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) throw new Error('circular_reference');
        seen.add(value);
      }
      return value;
    });
    return details;
  } catch (e) {
    return '[ErrorHandler: details contenía una referencia circular y fue omitido]';
  }
}

/**
 * Crea y retorna un objeto de error estándar e inmutable.
 *
 * @param {string} code   - Código de error del catálogo ERROR_SEVERITY_MAP.
 * @param {string} message - Descripción legible del error para logs y UI.
 * @param {Object} [details=null] - Contexto adicional (stack, payload, etc.)
 * @returns {Readonly<Object>} Objeto de error congelado.
 */
function createError(code, message, details) {
  if (!code || typeof code !== 'string') code = 'SYSTEM_FAILURE';
  if (!message || typeof message !== 'string') message = 'Error desconocido.';

  const severity = ERROR_SEVERITY_MAP[code] || 'WARNING';

  const errorObject = {
    code:      code,
    message:   message,
    severity:  severity,
    timestamp: new Date().toISOString(),
    details:   _serializeDetails_(details || null),
    recovery_hint: RECOVERY_HINTS[code] || 'No hay sugerencias disponibles para este error.'
  };

  return Object.freeze(errorObject);
}

/**
 * Crea un Átomo de Indra que representa un error.
 * Sigue el estándar de Sinceridad Atómica de Indra OS.
 */
function createErrorAtom(code, message, details) {
  const errorObj = createError(code, message, details);
  
  return {
    id: `err_${Date.now()}_${code.toLowerCase()}`,
    class: 'INDRA_ERROR',
    payload: errorObj,
    metadata: {
      generated_by: 'core_error_handler_v1',
      is_system_error: true
    }
  };
}

/**
 * Determina si un error es recuperable (WARNING) o catastrófico (CRITICAL).
 * @param {Object} errorObject - Un objeto creado por `createError`.
 * @returns {boolean} `true` si el sistema puede intentar continuar.
 */
function isRecoverable(errorObject) {
  return errorObject && errorObject.severity === 'WARNING';
}

/**
 * Determina si un error requiere atención inmediata del administrador.
 * @param {Object} errorObject - Un objeto creado por `createError`.
 * @returns {boolean} `true` si el error es CRITICAL.
 */
function requiresImmediateAttention(errorObject) {
  return errorObject && errorObject.severity === 'CRITICAL';
}
