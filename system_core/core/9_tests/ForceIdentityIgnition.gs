/**
 * 🔥 INDRA IDENTITY IGNITION (Manual Bypass)
 * Dharma: Inyectar materia física en la Sheet de Entidades para validar la lectura del Core.
 * RESPONSABILIDAD: Forzar la existencia del usuario de test en el Ledger real.
 */
function forceCreateUser() {
  // IDs reales extraídos de tus logs
  const LEDGER_SS_ID = "1kdZNr3knwkrVHPFNInr_yaIJo_DFR2-S_O7q-qlGjic";
  const testEmail = "sovereign-test@indra-os.com";

  console.log(`\n--- 🔥 INICIANDO INYECCIÓN MANUAL EN [${LEDGER_SS_ID}] ---`);

  try {
    const ss = SpreadsheetApp.openById(LEDGER_SS_ID);
    let sheet = ss.getSheetByName("Entidades");

    if (!sheet) {
        console.log("⚠️ Hoja 'Entidades' no encontrada. Creando estructura canónica...");
        sheet = ss.insertSheet("Entidades");
        // Estándar de columnas Indra v17
        sheet.appendRow(["id", "handle", "class", "payload", "created_at", "status"]);
        sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f3f3");
    }

    // Limpiamos entradas previas del mismo email para evitar duplicidad en el test
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][3].includes(testEmail)) {
            sheet.deleteRow(i + 1);
            console.log("🗑️ Entrada previa eliminada.");
        }
    }

    // Inyección de Materia
    const testId = "USR_" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const payload = JSON.stringify({ 
        email: testEmail, 
        role: "SOVEREIGN_TESTER",
        name: "Javier Audit" 
    });
    
    sheet.appendRow([
        testId, 
        "audit-user", 
        "IDENTITY", 
        payload, 
        new Date().toISOString(), 
        "ACTIVE"
    ]);

    SpreadsheetApp.flush();
    console.log(`✅ MATERIA INYECTADA: ID=${testId} | Email=${testEmail}`);
    console.log("---------------------------------------------------------");
    console.log("PRÓXIMO PASO: Ejecuta 'ManualIdentityCheck.gs' para ver si el Core lo reconoce.");
    console.log("---------------------------------------------------------");

  } catch (e) {
    console.error("❌ FALLO EN INYECCIÓN: " + e.message);
  }
}
