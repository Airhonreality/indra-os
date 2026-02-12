
// ======================================================================
// DIAGNÓSTICO: Validación de Acceso a Hoja de Cálculo Específica
// Objetivo: Determinar causa raíz del error "Fallo al acceder a ID"
// ID Objetivo: 191b5567-ba71-80dc-9b90-f7938fac7b61
// ======================================================================

function DEBUG_DatabaseFetch() {
  const TARGET_ID = "191b5567-ba71-80dc-9b90-f7938fac7b61";
  
  Logger.log("🛡️ INICIANDO DIAGNÓSTICO DE ACCESO A DATOS");
  Logger.log(`🎯 TARGET ID: ${TARGET_ID}`);

  // 1. Intento Directo con SpreadsheetApp (Prueba de Fuego)
  try {
    const ss = SpreadsheetApp.openById(TARGET_ID);
    Logger.log("✅ [DIRECTO] SpreadsheetApp: ÉXITO");
    Logger.log(`   Nombre: ${ss.getName()}`);
    Logger.log(`   URL: ${ss.getUrl()}`);
    
    const sheet = ss.getSheets()[0];
    Logger.log(`   Hoja 1: ${sheet.getName()}`);
    
    const data = sheet.getDataRange().getValues();
    Logger.log(`   Filas Totales: ${data.length}`);
    if (data.length > 0) {
      Logger.log(`   Cabecera: ${JSON.stringify(data[0])}`);
    }
  } catch (e) {
    Logger.log("❌ [DIRECTO] SpreadsheetApp: FALLÓ");
    Logger.log(`   Error: ${e.message}`);
    
    // Análisis de Causa
    if (e.message.includes("ID")) {
      Logger.log("   ⚠️ POSIBLE CAUSA: El ID proporcionado NO es un ID válido de Google Sheets.");
      Logger.log("   NOTA: Los IDs de Google Sheets suelen ser cadenas largas alfanuméricas (ej. `1BxiMVs0XRA5nFMdKbBdB_...`).");
      Logger.log("   NOTA: El ID `191b5567-ba71...` parece un UUID interno de Indra, no un ID técnico de Google.");
    }
  }

  // 2. Intento de Resolución Inversa (Si es un archivo en Drive)
  // Intentamos ver si ese ID corresponde a un archivo en Drive y obtener su ID real
  try {
    // Nota: DriveApp usa IDs de Google, así que esto también fallará si es un UUID interno genérico
    // pero vale la pena intentar.
    const file = DriveApp.getFileById(TARGET_ID);
    Logger.log("✅ [DRIVE] Archivo encontrado en Drive");
    Logger.log(`   Nombre: ${file.getName()}`);
    Logger.log(`   MimeType: ${file.getMimeType()}`);
    
    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
      Logger.log("   ✅ Es una Hoja de Cálculo válida.");
    } else {
      Logger.log("   ❌ NO es una Hoja de Cálculo.");
    }
  } catch (e) {
    Logger.log("❌ [DRIVE] Búsqueda por ID falló");
    Logger.log(`   Error: ${e.message}`);
  }

  Logger.log("🏁 DIAGNÓSTICO FINALIZADO");
}
