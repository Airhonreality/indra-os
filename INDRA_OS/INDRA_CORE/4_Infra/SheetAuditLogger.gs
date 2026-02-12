/**
 * SheetAuditLogger.gs
 * DHARMA: Registrador Temporal de Sincronizaciones (ADR 003)
 * 
 * Mantiene un timeline forense de todos los eventos de estabilización de realidad.
 * Permite rastrear pérdidas de datos y diagnosticar problemas de sincronía.
 */

function createSheetAuditLogger({ configurator, monitoringService }) {
  
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {} 
  };

  /**
   * Registra un evento de sincronización en la Sheet de auditoría.
   * Si la Sheet no existe o no tiene permisos, falla silenciosamente.
   */
  function logSyncEvent(event) {
    try {
      const sheetId = configurator.retrieveParameter({ key: 'SYNC_AUDIT_SHEET_ID' });
      
      // Si no hay Sheet configurada, logging silencioso (no bloquear el sistema)
      if (!sheetId) {
        _monitor.logDebug('[SheetAuditLogger] No SYNC_AUDIT_SHEET_ID configured. Silent skip.');
        return { logged: false, reason: 'NO_SHEET_CONFIGURED' };
      }

      const spreadsheet = SpreadsheetApp.openById(sheetId);
      let sheet = spreadsheet.getSheetByName('SYNC_LOG');
      
      // Crear la hoja si no existe
      if (!sheet) {
        sheet = spreadsheet.insertSheet('SYNC_LOG');
        // Headers
        sheet.appendRow([
          'Timestamp',
          'Cosmos ID',
          'Revision Hash',
          'Node Count',
          'Relationship Count',
          'Source',
          'Trigger Action',
          'Sync Duration (ms)'
        ]);
        sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4a5568').setFontColor('#ffffff');
      }

      // Registrar el evento
      sheet.appendRow([
        new Date().toISOString(),
        event.cosmosId || 'unknown',
        event.revisionHash || '',
        event.nodeCount || 0,
        event.relationshipCount || 0,
        event.source || 'UNKNOWN',
        event.triggerAction || '',
        event.syncDuration || 0
      ]);

      _monitor.logDebug(`[SheetAuditLogger] ✅ Logged sync event for ${event.cosmosId}`);
      return { logged: true, sheetId: sheetId };

    } catch (e) {
      // Fallo silencioso: no queremos que un error de logging rompa el sistema
      _monitor.logWarn(`[SheetAuditLogger] ⚠️ Failed to log event: ${e.message}`);
      return { logged: false, error: e.message };
    }
  }

  /**
   * Obtiene los últimos N eventos de sincronización.
   * Útil para debugging desde el DevLab.
   */
  function getRecentEvents(limit = 50) {
    try {
      const sheetId = configurator.retrieveParameter({ key: 'SYNC_AUDIT_SHEET_ID' });
      if (!sheetId) return { events: [], reason: 'NO_SHEET_CONFIGURED' };

      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const sheet = spreadsheet.getSheetByName('SYNC_LOG');
      if (!sheet) return { events: [], reason: 'SHEET_NOT_FOUND' };

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { events: [] }; // Solo headers

      const startRow = Math.max(2, lastRow - limit + 1);
      const numRows = lastRow - startRow + 1;
      const data = sheet.getRange(startRow, 1, numRows, 8).getValues();

      const events = data.map(row => ({
        timestamp: row[0],
        cosmosId: row[1],
        revisionHash: row[2],
        nodeCount: row[3],
        relationshipCount: row[4],
        source: row[5],
        triggerAction: row[6],
        syncDuration: row[7]
      }));

      return { events: events.reverse() }; // Más recientes primero
    } catch (e) {
      _monitor.logError(`[SheetAuditLogger] Failed to retrieve events: ${e.message}`);
      return { events: [], error: e.message };
    }
  }

  return {
    id: "sheetAuditLogger",
    label: "Sheet Audit Logger",
    archetype: "SERVICE",
    domain: "MONITORING",
    description: "Forensic timeline logger for reality stabilization events.",
    logSyncEvent,
    getRecentEvents
  };
}
