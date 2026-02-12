/**
 * DebugAdapter.gs
 * DHARMA: Adapter canónico para control de debugging y logs
 * AXIOMA: "El debugging es una capability autodescubrible, no código hardcodeado"
 */

function createDebugAdapter({ monitoringService, configurator }) {
  
  const CANON = {
    LABEL: "Debug Control Panel",
    ARCHETYPE: "SYSTEM_UTILITY",
    DOMAIN: "SYSTEM_CORE",
    
    CAPABILITIES: {
      toggleBackendLogs: {
        io: "WRITE",
        desc: "Enable/disable backend logs sent to frontend",
        schema: {
          inputs: {
            enabled: { type: "boolean", label: "Enabled" }
          },
          outputs: {
            success: { type: "boolean" },
            newState: { type: "boolean" }
          }
        }
      },
      
      toggleFrontendLogs: {
        io: "WRITE",
        desc: "Enable/disable frontend verbose logging",
        schema: {
          inputs: {
            enabled: { type: "boolean", label: "Enabled" }
          },
          outputs: {
            success: { type: "boolean" },
            newState: { type: "boolean" }
          }
        }
      },
      
      setLogLevel: {
        io: "WRITE",
        desc: "Set system logging level",
        schema: {
          inputs: {
            level: { 
              type: "string", 
              label: "Log Level",
              options: ["DEBUG", "INFO", "WARN", "ERROR"]
            }
          },
          outputs: {
            success: { type: "boolean" },
            currentLevel: { type: "string" }
          }
        }
      },
      
      getDebugStatus: {
        io: "READ",
        desc: "Get current debug configuration",
        schema: {
          inputs: {},
          outputs: {
            backendLogsEnabled: { type: "boolean" },
            frontendLogsEnabled: { type: "boolean" },
            logLevel: { type: "string" },
            bufferSize: { type: "number" }
          }
        }
      },
      
      clearLogBuffer: {
        io: "WRITE",
        desc: "Clear accumulated log buffer",
        schema: {
          inputs: {},
          outputs: {
            success: { type: "boolean" },
            clearedCount: { type: "number" }
          }
        }
      }
    },
    
    VITAL_SIGNS: {
      BACKEND_LOGS: {
        criticality: "NOMINAL",
        value: "ENABLED",
        trend: "stable",
        source: "MonitoringService"
      },
      FRONTEND_LOGS: {
        criticality: "NOMINAL",
        value: "ENABLED",
        trend: "stable",
        source: "localStorage"
      },
      LOG_LEVEL: {
        criticality: "NOMINAL",
        value: "INFO",
        trend: "stable",
        source: "PropertiesService"
      },
      BUFFER_SIZE: {
        criticality: "NOMINAL",
        value: "0 logs",
        trend: "stable",
        source: "MonitoringService"
      }
    },
    
    UI_LAYOUT: {
      SIDE_PANEL: "ENABLED",
      TERMINAL_STREAM: "DISABLED",
      WIDGET_TYPE: "TOGGLE_PANEL"
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
    label: "Debug Control Panel",
    archetype: CANON.ARCHETYPE,
    domain: CANON.DOMAIN,
    description: "System utility for controlling logging and debugging features.",
    semantic_intent: "CONTROL",
    CANON,
    toggleBackendLogs,
    toggleFrontendLogs,
    setLogLevel,
    getDebugStatus,
    clearLogBuffer,
    verifyConnection
  });
}
