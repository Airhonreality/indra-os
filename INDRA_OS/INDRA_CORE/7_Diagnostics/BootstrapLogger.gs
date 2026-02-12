// ======================================================================
// ARTEFACTO: 7_Diagnostics/BootstrapLogger.gs
// DHARMA: Ser la primera luz en la oscuridad. Un logger primitivo que
//         NO tiene dependencias y escribe directamente en el Audit Log
//         para diagnosticar fallos de arranque.
// ======================================================================
const BootstrapLogger = {
  /**
   * Escribe un mensaje de log primitivo directamente en el Audit Log Sheet.
   * @param {string} message - El mensaje a registrar.
   */
  log: function(message) {
    try {
      // Intenta obtener el ID de la hoja de logs de forma manual y primitiva
      const properties = PropertiesService.getScriptProperties();
      const logSheetId = properties.getProperty('ORBITAL_CORE_AUDIT_LOG_SHEET_ID');
      
      if (!logSheetId) {
        // Si no se puede encontrar el ID, es imposible loguear en el Sheet.
        // Se recurre al log estándar de GAS como último recurso.
        console.error("BootstrapLogger CRITICAL: La propiedad 'ORBITAL_CORE_AUDIT_LOG_SHEET_ID' no está configurada. No se puede escribir en el Audit Log Sheet.");
        console.log(`BootstrapLogger Payload: ${message}`);
        return;
      }
      
      const spreadsheet = SpreadsheetApp.openById(logSheetId);
      const sheet = spreadsheet.getSheets()[0];
      
      const timestamp = new Date().toISOString();
      // Escribe en la primera fila vacía
      sheet.appendRow([timestamp, 'BOOTSTRAP', 'INFO', String(message)]);
      SpreadsheetApp.flush(); // Fuerza la escritura inmediata para máxima fiabilidad
      
    } catch (e) {
      // Si el logger primitivo falla por cualquier otra razón (ej. permisos),
      // se recurre al log estándar de GAS.
      console.error(`BootstrapLogger CATASTROPHIC FAILURE: No se pudo escribir en el Audit Log Sheet. Error: ${e.message}`);
      console.log(`BootstrapLogger Payload: ${message}`);
    }
  },

  /**
   * Función de prueba de humo para ser ejecutada manualmente desde el editor de GAS.
   * Verifica que el logger puede acceder y escribir en el Audit Log Sheet.
   */
  test: function() {
    console.log("Ejecutando prueba de humo de BootstrapLogger...");
    const testMessage = `SMOKE TEST: Si ves esta línea en el Audit Log Sheet, el BootstrapLogger funciona correctamente. Timestamp de prueba: ${new Date().toISOString()}`;
    this.log(testMessage);
    const properties = PropertiesService.getScriptProperties();
    const logSheetId = properties.getProperty('ORBITAL_CORE_AUDIT_LOG_SHEET_ID');
    if (logSheetId) {
        console.log(`Prueba completada. Por favor, verifica la hoja de cálculo 'Audit Log' para confirmar la escritura. ID de la hoja: ${logSheetId}`);
    } else {
        console.error("La prueba no pudo escribir en el Sheet porque la propiedad 'ORBITAL_CORE_AUDIT_LOG_SHEET_ID' no está configurada.");
    }
  }
};

/**
 * Función global para poder ejecutar el test de humo desde el menú de ejecución de GAS.
 */
function runBootstrapLoggerSmokeTest() {
  BootstrapLogger.test();
}