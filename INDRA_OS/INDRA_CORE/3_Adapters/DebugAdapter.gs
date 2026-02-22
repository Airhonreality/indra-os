/**
 * DebugAdapter.gs
 * DHARMA: Adapter canónico para control de debugging y logs
 * AXIOMA: "El debugging es una capability autodescubrible, no código hardcodeado"
 */

function createDebugAdapter({ monitoringService, configurator }) {
  
  const CANON = {
    id: "debug",
    label: "Axiom Debug Panel",
    archetype: "infra",
    domain: "system",
    REIFICATION_HINTS: {
        id: "id",
        label: "label || id",
        items: "logs || items"
    },
    
    CAPABILITIES: {
      toggleBackendLogs: {
        id: "WRITE_DATA",
        io: "WRITE",
        desc: "Enable/disable backend logs sent to frontend",
        traits: ["DIAGNOSTICS", "CONTROL"],
        inputs: { enabled: { type: "boolean", label: "Enabled" } },
        outputs: { success: { type: "boolean" }, newState: { type: "boolean" } }
      },
      toggleFrontendLogs: {
        id: "WRITE_DATA",
        io: "WRITE",
        desc: "Enable/disable frontend verbose logging",
        traits: ["DIAGNOSTICS", "CONTROL"],
        inputs: { enabled: { type: "boolean", label: "Enabled" } },
        outputs: { success: { type: "boolean" }, newState: { type: "boolean" } }
      },
      setLogLevel: {
        id: "WRITE_DATA",
        io: "WRITE",
        desc: "Set system logging level",
        traits: ["DIAGNOSTICS", "CONTROL"],
        inputs: { level: { type: "string", label: "Log Level", options: ["DEBUG", "INFO", "WARN", "ERROR"] } },
        outputs: { success: { type: "boolean" }, currentLevel: { type: "string" } }
      },
      getDebugStatus: {
        id: "READ_DATA",
        io: "READ",
        desc: "Get current debug configuration",
        traits: ["DIAGNOSTICS", "METRICS"],
        inputs: {},
        outputs: { backendLogsEnabled: { type: "boolean" }, frontendLogsEnabled: { type: "boolean" }, logLevel: { type: "string" }, bufferSize: { type: "number" } }
      },
      clearLogBuffer: {
        id: "WRITE_DATA",
        io: "WRITE",
        desc: "Clear accumulated log buffer",
        traits: ["DIAGNOSTICS", "CLEANUP"],
        inputs: {},
        outputs: { success: { type: "boolean" }, clearedCount: { type: "number" } }
      }
    }
  };
  
  // Estado interno
  let backendLogsEnabled = true;
  let frontendLogsEnabled = true;
  
  /**
   * Toggle backend logs
   */
  function toggleBackendLogs(payload) {
    const { enabled } = payload;
    backendLogsEnabled = enabled;
    
    // Guardar en PropertiesService
    try {
      PropertiesService.getScriptProperties().setProperty(
        'DEBUG_BACKEND_LOGS_ENABLED', 
        enabled.toString()
      );
    } catch (e) {
      monitoringService.logWarn('DebugAdapter', 'Failed to save backend logs setting', e.message);
    }
    
    monitoringService.logInfo('DebugAdapter', `Backend logs ${enabled ? 'enabled' : 'disabled'}`);
    
    return {
      success: true,
      newState: enabled
    };
  }
  
  /**
   * Toggle frontend logs (retorna instrucción para el frontend)
   */
  function toggleFrontendLogs(payload) {
    const { enabled } = payload;
    frontendLogsEnabled = enabled;
    
    monitoringService.logInfo('DebugAdapter', `Frontend logs ${enabled ? 'enabled' : 'disabled'}`);
    
    return {
      success: true,
      newState: enabled,
      _frontendAction: {
        type: 'SET_STORAGE',
        key: 'BACKEND_LOGS_ENABLED',
        value: enabled.toString()
      }
    };
  }
  
  /**
   * Set log level
   */
  function setLogLevel(payload) {
    const { level } = payload;
    
    try {
      PropertiesService.getScriptProperties().setProperty(
        'SYSTEM_LOGGING_LEVEL', 
        level
      );
      
      monitoringService.logInfo('DebugAdapter', `Log level set to: ${level}`);
      
      return {
        success: true,
        currentLevel: level
      };
    } catch (e) {
      monitoringService.logError('DebugAdapter', 'Failed to set log level', e.message);
      return {
        success: false,
        currentLevel: 'ERROR'
      };
    }
  }
  
  /**
   * Get debug status
   */
  function getDebugStatus() {
    const logLevel = PropertiesService.getScriptProperties().getProperty('SYSTEM_LOGGING_LEVEL') || 'INFO';
    
    return {
      backendLogsEnabled: backendLogsEnabled,
      frontendLogsEnabled: frontendLogsEnabled,
      logLevel: logLevel,
      bufferSize: 0 // TODO: Get from monitoringService
    };
  }
  
  /**
   * Clear log buffer
   */
  function clearLogBuffer() {
    const flushed = monitoringService.flushFrontendLogs();
    
    return {
      success: true,
      clearedCount: flushed.length
    };
  }
  
  /**
   * Verify connection
   */
  function verifyConnection() {
    return {
      success: true,
      status: "ACTIVE",
      backendLogsEnabled: backendLogsEnabled,
      frontendLogsEnabled: frontendLogsEnabled
    };
  }
  
  return Object.freeze({
    id: "debug",
    label: CANON.label,
    archetype: CANON.archetype,
    domain: CANON.domain,
    description: "System utility for controlling logging and debugging features.",
    CANON: CANON,
    toggleBackendLogs,
    toggleFrontendLogs,
    setLogLevel,
    getDebugStatus,
    clearLogBuffer,
    verifyConnection
  });
}







