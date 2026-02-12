/**
 * SessionCommander.gs
 * DHARMA: Supervisor de Estado de Realidad (L8)
 */
function createSessionCommander({ 
  protocolTransmitter, 
  schemaLexicon, 
  realityValidator, 
  monitoringService 
}) {

  const LATENCY_TIMEOUT = 2000; // ms antes de emitir Token de Paciencia

  const schemas = {
    validateSession: {
      description: "Verifies the physical existence and accessibility of a session anchor.",
      semantic_intent: "PROBE",
      exposure: "public",
      io: { inputs: { cosmosId: { type: "string" } }, outputs: { success: { type: "boolean" }, _SIGNAL: { type: "string" } } }
    },
    requestMount: {
      description: "Executes the full chain of recovery, translation and validation for a reality mount.",
      semantic_intent: "TRIGGER",
      exposure: "public",
       io: { inputs: { cosmosId: { type: "string" } }, outputs: { success: { type: "boolean" }, result: { type: "object" } } }
    },
    terminateSession: {
      description: "Closes a session and issues an ejection signal.",
      semantic_intent: "TRIGGER",
      exposure: "public",
       io: { inputs: { cosmosId: { type: "string" } }, outputs: { success: { type: "boolean" }, _SIGNAL: { type: "string" } } }
    }
  };

  function validateSession(args) {
    const { cosmosId } = args || {};
    if (!cosmosId) return { success: false, _SIGNAL: 'FORCE_EJECT' };
    const status = protocolTransmitter.lockCheck(cosmosId);
    if (!status.exists || status.trashed) {
      return { success: false, _SIGNAL: 'FORCE_EJECT', reason: 'REALITY_NOT_FOUND' };
    }
    return { success: true, status: 'VALID' };
  }

  function requestMount(args) {
    const { cosmosId, simulateLatency = 0 } = args || {};
    const startTime = Date.now();
    if (monitoringService) monitoringService.logInfo('SessionCommander', `🚀 Iniciando montaje de Cosmos: ${cosmosId}`);

    try {
      let existence = protocolTransmitter.lockCheck(cosmosId);
      
      // AXIOMA: Resiliencia ante Latencia de Capa Física (Drive Pulse)
      if (!existence.exists) {
        if (monitoringService) monitoringService.logWarn('SessionCommander', `⏳ Cosmos no detectado en primer pulso. Intentando re-incidencia...`);
        Utilities.sleep(1000);
        existence = protocolTransmitter.lockCheck(cosmosId);
      }

      if (!existence.exists) {
        return { success: false, _SIGNAL: 'FORCE_EJECT', reason: 'FILE_NOT_FOUND' };
      }

      if (simulateLatency > LATENCY_TIMEOUT) {
         if (monitoringService) monitoringService.logWarn('SessionCommander', `⏳ Latencia Detectada (${simulateLatency}ms). Emitiendo PATIENCE_TOKEN.`);
         return { 
           success: true, 
           _SIGNAL: 'PATIENCE_TOKEN', 
           payload: { estimated_wait: simulateLatency, cosmosId: cosmosId } 
         };
      }

      const rawData = protocolTransmitter.read(cosmosId);
      const version = rawData.indx_schema_version || 'v1.0';
      const normalizedData = schemaLexicon.translate(rawData, version);
      const judgment = realityValidator.validate(normalizedData);

      if (!judgment.valid) {
        if (monitoringService) monitoringService.logWarn('SessionCommander', `🏺 Realidad Incoherente: ${judgment.verdict}`);
        return { 
          success: true, 
          _SIGNAL: 'RECOVERY_MODE', 
          verdict: judgment.verdict,
          details: judgment.details,
          _revisionHash: existence.updatedAt || new Date().getTime().toString(),
          payload: normalizedData
        };
      }

      const duration = Date.now() - startTime;
      if (monitoringService) monitoringService.logInfo('SessionCommander', `✅ Montaje completado en ${duration}ms`);

      if (normalizedData.namespace) {
        if (normalizedData.namespace.ui) {
          try { normalizedData.activeLayout = protocolTransmitter.read(normalizedData.namespace.ui); } catch(e) {}
        }
        if (normalizedData.namespace.logic) {
          try { normalizedData.activeFlow = protocolTransmitter.read(normalizedData.namespace.logic); } catch(e) {}
        }
      }

      return {
        success: true,
        result: normalizedData,
        _revisionHash: existence.updatedAt || new Date().getTime().toString(),
        _meta: {
          duration: duration,
          version: realityValidator.CANON
        }
      };

    } catch (e) {
      const errorMsg = e.message || e.toString();
      if (monitoringService) monitoringService.logError('SessionCommander', `🛑 Fallo crítico en requestMount: ${errorMsg}`);
      return { success: false, error: errorMsg, _SIGNAL: 'FORCE_EJECT' };
    }
  }

  function terminateSession(args) {
    const { cosmosId } = args || {};
    if (monitoringService) monitoringService.logWarn('SessionCommander', `💀 Terminando sesión: ${cosmosId}`);
    return { success: true, _SIGNAL: 'FORCE_EJECT' };
  }

  return Object.freeze({
    id: 'commander',
    label: 'Session Commander',
    archetype: 'GATEWAY',
    domain: 'GOVERNANCE',
    semantic_intent: 'GATE',
    schemas,
    validateSession,
    requestMount,
    terminateSession,
    // AXIOMA: Alias de Compatibilidad (Isomorfismo Frontend-Backend)
    mountCosmos: requestMount
  });
}
