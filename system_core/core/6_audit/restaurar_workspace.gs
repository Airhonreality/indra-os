/**
 * 🛠️ INDRA SONDA: RESTAURACIÓN Y PURGA (v1.1)
 * PROPÓSITO: Reparar un Workspace corrupto y eliminar átomos huérfanos.
 */
function RESTAURAR_Y_PURGAR_WORKSPACE() {
  const WORKSPACE_ID = "1RxM94Lcql7-pUfEL2W5SW8Pl1dV8ZcSP"; // Veta de Oro Alpha (Manifest ID)
  const GIDS_A_BORRAR = ["GID-1z4q6kll", "GID-1xtyShRm"];
  
  console.log("🛠️ [Healer] Iniciando restauración del Workspace: " + WORKSPACE_ID);

  try {
    const wsFile = DriveApp.getFileById(WORKSPACE_ID);
    let wsDoc;
    
    try {
      const content = wsFile.getBlob().getDataAsString();
      wsDoc = JSON.parse(content || "{}");
    } catch(e) {
      console.warn("⚠️ [Healer] JSON Corrupto detectado. Reconstruyendo desde cero...");
      wsDoc = {
        id: WORKSPACE_ID,
        class: "WORKSPACE",
        handle: { label: "Veta de Oro Alpha", alias: "veta_de_oro_alpha" },
        pins: []
      };
    }

    // Asegurar estructura
    wsDoc.pins = wsDoc.pins || [];
    const initialCount = wsDoc.pins.length;

    // Purga de huérfanos en los pins
    wsDoc.pins = wsDoc.pins.filter(pin => !GIDS_A_BORRAR.includes(pin.id));
    
    console.log("✅ [Healer] Workspace saneado. Sellando materia...");
    wsFile.setContent(JSON.stringify(wsDoc, null, 2));

  } catch(e) {
    console.error("❌ [Healer] Error crítico en Drive: " + e.message);
  }

  // LIMPIEZA DE LEDGER (Hoja de cálculo)
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("ledger") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    let purgedCount = 0;
    for (let i = data.length - 1; i >= 1; i--) {
      const gid = data[i][0];
      if (GIDS_A_BORRAR.includes(gid)) {
        sheet.deleteRow(i + 1);
        purgedCount++;
      }
    }
    console.log(`✅ [Healer] ${purgedCount} filas eliminadas del Ledger.`);
  } catch(e) {
    console.error("❌ [Healer] Error en Ledger: " + e.message);
  }

  console.log("✨ [Healer] Equilibrio restaurado. Refresca el Front-end.");
}
