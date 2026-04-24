/**
 * 🧹 INDRA SONDA: LIMPIEZA DE ETIQUETAS (v1.2)
 * PROPÓSITO: Eliminar los "Pines" del Workspace y las filas del Ledger.
 */
function LIMPIEZA_AXIAL() {
  const WORKSPACE_ID = "1RxM94Lcql7-pUfEL2W5SW8Pl1dV8ZcSP"; // ID del ARCHIVO Manifiesto
  const GIDS_A_BORRAR = ["GID-1z4q6kll", "GID-1xtyShRm"];
  
  console.log("🧹 [Limpieza] Iniciando purga de etiquetas para: " + GIDS_A_BORRAR.join(", "));

  // 1. LIMPIEZA DE PINES
  try {
    const wsFile = DriveApp.getFileById(WORKSPACE_ID);
    const wsDoc = JSON.parse(wsFile.getBlob().getDataAsString());
    const prevCount = wsDoc.pins.length;
    
    wsDoc.pins = wsDoc.pins.filter(pin => !GIDS_A_BORRAR.includes(pin.id));
    
    if (wsDoc.pins.length !== prevCount) {
      wsFile.setContent(JSON.stringify(wsDoc, null, 2));
      console.log("✅ [Limpieza] Etiquetas eliminadas del Manifiesto.");
    }
  } catch(e) {
    console.error("❌ [Limpieza] Error al leer el Manifiesto: " + e.message);
  }

  // 2. LIMPIEZA DE LEDGER
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("ledger") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    for (let i = data.length - 1; i >= 1; i--) {
      const gid = data[i][0];
      if (GIDS_A_BORRAR.includes(gid)) {
        sheet.deleteRow(i + 1);
        console.log("✅ [Limpieza] Fila eliminada del Ledger: " + gid);
      }
    }
  } catch(e) {
    console.error("❌ [Limpieza] Error en Ledger: " + e.message);
  }
  
  console.log("✨ [Efecto] Sincronización restaurada. Refresca el Front-end.");
}
