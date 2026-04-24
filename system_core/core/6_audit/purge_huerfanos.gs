/**
 * 🕵️ INDRA SONDA: PURGA ESTRUCTURAL (v1.0)
 * PROPÓSITO: Eliminar átomos huérfanos que ya no existen en Drive pero ensucian el Ledger.
 */
function PURGA_HUERFANOS_TEST() {
  const GIDS_A_BORRAR = [
    "GID-1z4q6kll",
    "GID-1xtyShRm"
  ];
  
  const WORKSPACE_ID = "103MitQudDSMinRzzMLuzkWKmPN7UaDNr"; // Veta de Oro Alpha
  
  console.log("🧹 [Purga] Iniciando limpieza de Ledger para: " + GIDS_A_BORRAR.join(", "));

  // 1. LIMPIEZA DE PINES EN EL WORKSPACE
  try {
    const wsFile = DriveApp.getFileById(WORKSPACE_ID);
    const wsDoc = JSON.parse(wsFile.getBlob().getDataAsString());
    const initialCount = wsDoc.pins.length;
    
    wsDoc.pins = wsDoc.pins.filter(pin => !GIDS_A_BORRAR.includes(pin.id));
    
    if (wsDoc.pins.length !== initialCount) {
      wsFile.setContent(JSON.stringify(wsDoc, null, 2));
      console.log("✅ [Purga] Pins eliminados del Workspace.");
    }
  } catch(e) {
    console.warn("⚠️ [Purga] No se pudo limpiar el Workspace: " + e.message);
  }

  // 2. LIMPIEZA DEL LEDGER (La Hoja de Cálculo)
  // Nota: Debes seleccionar manualmente las filas en tu hoja 'ledger' 
  // O usar este script si tienes acceso a la SpreadsheetApp.
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("ledger") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    for (let i = data.length - 1; i >= 1; i--) {
      const gid = data[i][0]; // Columna A
      if (GIDS_A_BORRAR.includes(gid)) {
        sheet.deleteRow(i + 1);
        console.log("✅ [Purga] Fila purgada del Ledger: " + gid);
      }
    }
  } catch(e) {
    console.error("❌ [Purga] Error en Ledger: " + e.message);
  }
  
  console.log("✨ [Purga] Operación finalizada. Refresca el Front-end.");
}
