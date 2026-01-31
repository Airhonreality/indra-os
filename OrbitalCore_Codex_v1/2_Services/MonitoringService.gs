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
  
  if (!manifest || !manifest.sheetsSchema || !manifest.sheetsSchema.auditLog) {
    const rootKeys = manifest ? Object.keys(manifest).join(', ') : 'null';
    const sheetsKeys = (manifest && manifest.sheetsSchema) ? Object.keys(manifest.sheetsSchema).join(', ') : 
                      ((manifest && manifest.sheets_schema) ? `(found snake_case: ${Object.keys(manifest.sheets_schema).join(', ')})` : 'missing');
    
    throw errorHandler.createError('CONFIGURATION_ERROR', 
      `MonitoringService: manifest contract not fulfilled. \n` +
      `[DIAGNOSTIC] Root Keys found: [${rootKeys}] \n` +
      `[DIAGNOSTIC] sheetsSchema keys found: [${sheetsKeys}] \n` +
      `[EXPECTED] sheetsSchema.auditLog to exist.`
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

  // --- INICIO DE INTERVENCIÓN (LAZY LOADING - PURIFICACIÓN QUIRÚRGICA) ---
  // Solución: La validación se mueve del tiempo de construcción al tiempo de ejecución
  // para evitar que los triggers fallen silenciosamente durante la fase de carga.
  let adminEmail = null;
  let auditLogSheetId = null;
  let systemLogLevel = 1; // Default: INFO
  let isConfigured = false;
  
  const LOG_LEVELS = {
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
    auditLogSheetId = configurator.retrieveParameter({ key: manifest.sheetsSchema.auditLog.propertyKey });
    
    const levelStr = configurator.retrieveParameter({ key: "system_logging_level" }) || "INFO";
    systemLogLevel = LOG_LEVELS[levelStr.toUpperCase()] !== undefined ? LOG_LEVELS[levelStr.toUpperCase()] : 1;
    
    isConfigured = true; // Marcar como configurado aunque alguno sea null
  }
  // --- FIN DE INTERVENCIÓN ---

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
    
    const header = manifest.sheetsSchema.auditLog.header;
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
    
    const subject = `[Orbital Core] Alerta Crítica - ${error.code || 'SIN_CODIGO'}`;
    
    const body = `
      Se ha producido un error crítico en el sistema Orbital Core.

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
    if (systemLogLevel <= LOG_LEVELS.DEBUG) {
      console.log("[DEBUG]", ...args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a));
    }
  }

  function logInfo(...args) {
    _ensureConfigured();
    if (systemLogLevel <= LOG_LEVELS.INFO) {
      console.log("[INFO]", ...args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a));
    }
  }

  function logWarn(...args) {
    _ensureConfigured();
    if (systemLogLevel <= LOG_LEVELS.WARN) {
      console.warn("[WARN]", ...args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a));
    }
  }

  function logError(...args) {
    _ensureConfigured();
    if (systemLogLevel <= LOG_LEVELS.ERROR) {
      console.error("[ERROR]", ...args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a));
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

  return Object.freeze({
    label: "Audit Orchestrator",
    description: "Industrial monitoring engine for active event logging and critical fault orchestration.",
    semantic_intent: "OBSERVER",
    archetype: "SYSTEM_CORE",
    schemas: schemas,
    logEvent,
    sendCriticalAlert,
    logDebug,
    logInfo,
    logWarn,
    logError
  });
}
