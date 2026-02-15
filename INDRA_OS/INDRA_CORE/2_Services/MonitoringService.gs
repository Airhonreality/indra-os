// ======================================================================
// ARTEFACTO: 2_Services/MonitoringService.gs (FORTALECIDO)
// CAPA: 2_Services
// DHARMA: Ser el Vigilante del Sistema, registrando eventos y enviando
//         alertas críticas.
// NOTA: Esta versión es 100% conforme al Axioma DI-1, usando
//       SheetAdapter y EmailAdapter en lugar de servicios nativos.
// ======================================================================

function createMonitoringService({ manifest, configurator, errorHandler, sheetAdapter, emailAdapter }) {
  // --- Validación "Fail-Fast" Fortalecida ---
  // Validar errorHandler primero, ya que es necesario para crear los demás errores.
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    // No podemos usar errorHandler aquí, por lo que lanzamos un TypeError nativo.
    throw new TypeError('MonitoringService: errorHandler contract not fulfilled');
  }
  
  if (!manifest || !manifest.SHEETS_SCHEMA || !manifest.SHEETS_SCHEMA.AUDIT_LOG) {
    const rootKeys = manifest ? Object.keys(manifest).join(', ') : 'null';
    const sheetsKeys = (manifest && manifest.SHEETS_SCHEMA) ? Object.keys(manifest.SHEETS_SCHEMA).join(', ') : 
                      ((manifest && manifest.sheets_schema) ? `(found snake_case: ${Object.keys(manifest.sheets_schema).join(', ')})` : 'missing');
    
    throw errorHandler.createError('CONFIGURATION_ERROR', 
      `MonitoringService: manifest contract not fulfilled. \n` +
      `[DIAGNOSTIC] Root Keys found: [${rootKeys}] \n` +
      `[DIAGNOSTIC] SHEETS_SCHEMA keys found: [${sheetsKeys}] \n` +
      `[EXPECTED] SHEETS_SCHEMA.AUDIT_LOG to exist.`
    );
  }
  if (!configurator || typeof configurator.retrieveParameter !== 'function') {
    throw errorHandler.createError('CONFIGURATION_ERROR', 'MonitoringService: configurator contract not fulfilled');
  }
  if (!sheetAdapter || typeof sheetAdapter.appendRow !== 'function') {
    throw errorHandler.createError('CONFIGURATION_ERROR', 'MonitoringService: sheetAdapter contract not fulfilled (missing appendRow method)');
  }
  if (!emailAdapter || typeof emailAdapter.send !== 'function') {
    throw errorHandler.createError('CONFIGURATION_ERROR', 'MonitoringService: emailAdapter contract not fulfilled (missing send method)');
  }

  // Solución: La validación se mueve del tiempo de construcción al tiempo de ejecución
  // para evitar que los triggers fallen silenciosamente durante la fase de carga.
  let adminEmail = null;
  let auditLogSheetId = null;
  let systemLogLevel = 1; // Default: INFO
  let isConfigured = false;
  
  const LOG_LEVEL_MAP = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };
  
  /**
   * Asegura que el Monitoring Service esté configurado.
   * Se ejecuta en el primer uso del servicio (lazy loading).
   */
  function _ensureConfigured() {
    if (isConfigured) return; // Ya validado
    
    adminEmail = configurator.retrieveParameter({ key: "ADMIN_EMAIL" });
    auditLogSheetId = configurator.retrieveParameter({ key: manifest.SHEETS_SCHEMA.AUDIT_LOG.PROPERTY });
    
    const levelStr = configurator.retrieveParameter({ key: "SYSTEM_LOGGING_LEVEL" }) || "INFO";
    systemLogLevel = LOG_LEVEL_MAP[levelStr.toUpperCase()] !== undefined ? LOG_LEVEL_MAP[levelStr.toUpperCase()] : 1;
    
    isConfigured = true; // Marcar como configurado aunque alguno sea null
  }

  // AXIOMA: Buffer para logs del frontend (desarrollo)
  let frontendLogBuffer = [];
  const FRONTEND_LOGGING_ENABLED = true; // TODO: Leer de configuración

  /**
   * Registra un log que será enviado al frontend
   */
  function _logToFrontend(level, component, message, data = null) {
    if (!FRONTEND_LOGGING_ENABLED) return;
    
    frontendLogBuffer.push({
      timestamp: new Date().toISOString(),
      level: level,
      component: component,
      message: message,
      data: data
    });
    
    // Limitar tamaño del buffer (últimos 50 logs)
    if (frontendLogBuffer.length > 50) {
      frontendLogBuffer.shift();
    }
  }

  /**
   * Obtiene y limpia el buffer de logs para el frontend
   */
  function flushFrontendLogs() {
    const logs = [...frontendLogBuffer];
    frontendLogBuffer = [];
    return logs;
  }

  /**
   * Registra un evento estructurado en el Audit Log Sheet.
   * Falla silenciosamente (registra en consola) si el logging no es posible.
   * @param {object} eventData - Un objeto cuyas claves deben coincidir con las cabeceras del manifiesto.
   */
  function logEvent(eventData) {
    _ensureConfigured(); // Validar configuración antes de usar
    
    if (!auditLogSheetId) {
      console.warn("AUDIT_LOG_SHEET_ID no está configurado. Omitiendo log de evento:", JSON.stringify(eventData));
      return { success: false };
    }
    if (!eventData || typeof eventData !== 'object') {
        console.error("logEvent requiere un objeto eventData válido. Se recibió:", eventData);
        return { success: false };
    }
    
    const header = manifest.SHEETS_SCHEMA.AUDIT_LOG.HEADER;
    const row = header.map(colName => {
        const value = eventData[colName];
        if (value === undefined || value === null) {
          return ""; // Usar string vacío para celdas vacías
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
    });

    try {
      sheetAdapter.appendRow({
        sheetId: auditLogSheetId,
        rowData: row
      });
      return { success: true };
    } catch (e) {
      console.error("Fallo crítico al escribir en el Audit Log Sheet:", e.message, JSON.stringify(row));
      return { success: false };
    }
  }

  /**
   * Envía una alerta por correo electrónico si el error es clasificado como crítico.
   * @param {Error} error - El objeto de error estructurado.
   * @param {object} context - Contexto adicional para incluir en el cuerpo del email.
   * @returns {{sent: boolean, reason?: string}}
   */
  function sendCriticalAlert(error, context) {
    _ensureConfigured(); // Validar configuración antes de usar
    
    if (!errorHandler.requiresImmediateAttention(error)) {
      return { sent: false, reason: 'El error no fue clasificado como crítico.' };
    }
    if (!adminEmail) {
      return { sent: false, reason: 'La variable ADMIN_EMAIL no está configurada.' };
    }
    
    const subject = `[Indra Core] Alerta Crítica - ${error.code || 'SIN_CODIGO'}`;
    
    const body = `
      Se ha producido un error crítico en el sistema Indra Core.

      --------------------------------------------------
      DETALLES DEL ERROR
      --------------------------------------------------
      - Severidad: ${error.severity || 'No especificada'}
      - Código: ${error.code || 'No especificado'}
      - Mensaje: ${error.message || 'Sin mensaje.'}
      - Timestamp: ${error.timestamp || new Date().toISOString()}

      --------------------------------------------------
      CONTEXTO DE EJECUCIÓN
      --------------------------------------------------
      ${JSON.stringify(context || { info: 'Sin contexto adicional.' }, null, 2)}
      
      --------------------------------------------------
      STACK TRACE (SI ESTÁ DISPONIBLE)
      --------------------------------------------------
      ${error.stack || 'No disponible.'}
    `;
    
    try {
      emailAdapter.send({
        to: adminEmail,
        subject: subject,
        body: body.trim()
      });
      return { sent: true };
    } catch (e) {
      console.error("Fallo crítico al intentar enviar la alerta por email:", e.message);
      return { sent: false, reason: `Fallo del EmailAdapter: ${e.message}` };
    }
  }

  /**
   * Helpers de logging jerárquico.
   */
  function logDebug(...args) {
    _ensureConfigured();
    if (systemLogLevel <= LOG_LEVEL_MAP.DEBUG) {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
      console.log("[DEBUG]", message);
      _logToFrontend('DEBUG', 'MonitoringService', message);
    }
  }

  function logInfo(...args) {
    _ensureConfigured();
    if (systemLogLevel <= LOG_LEVEL_MAP.INFO) {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
      console.log("[INFO]", message);
      _logToFrontend('INFO', 'MonitoringService', message);
    }
  }

  function logWarn(...args) {
    _ensureConfigured();
    if (systemLogLevel <= LOG_LEVEL_MAP.WARN) {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
      console.warn("[WARN]", message);
      _logToFrontend('WARN', 'MonitoringService', message);
    }
  }

  function logError(...args) {
    _ensureConfigured();
    if (systemLogLevel <= LOG_LEVEL_MAP.ERROR) {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
      console.error("[ERROR]", message);
      _logToFrontend('ERROR', 'MonitoringService', message);
    }
  }

  const schemas = {
    logEvent: {
      description: "Asynchronously persists a structural event to the industrial audit registry.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          eventData: { type: "object", io_behavior: "STREAM", description: "Structured metadata dictionary to be recorded." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Persistence confirmation status." }
        } 
      }
    },
    sendCriticalAlert: {
      description: "Triggers immediate out-of-band notification for high-severity architectural failures.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          error: { type: "object", io_behavior: "STREAM", description: "High-severity error record triggering the alert." },
          context: { type: "object", io_behavior: "STREAM", description: "Technical context describing the failure state." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          sent: { type: "boolean", io_behavior: "PROBE", description: "Dispatch confirmation status." }
        } 
      }
    }
  };

  function verifyConnection() {
    _ensureConfigured();
    return { status: "ACTIVE", loggingLevel: Object.keys(LOG_LEVEL_MAP)[systemLogLevel] || "INFO" };
  }

  // --- SOVEREIGN CANON V12.0 (Algorithmic Core) ---
  const CANON = {
      ARCHETYPE: "SERVICE",
      DOMAIN: "OBSERVABILITY",
      CAPABILITIES: schemas
  };

  return {
    description: "Industrial monitoring engine for active event logging and critical fault orchestration.",
    CANON: CANON,
    schemas: schemas,
    // Capability Discovery
    verifyConnection,
    // Original methods
    logEvent,
    sendCriticalAlert,
    logDebug,
    logInfo,
    logWarn,
    logError,
    // Frontend logging (desarrollo)
    flushFrontendLogs
  };
}





