function TEST_DatabaseEngine_Fetch() {
  const databaseId = "191b5567-ba71-80dc-9b90-f7938fac7b61";
  
  // AXIOMA: Ensamblaje Correcto del Stack de Ejecución
  const assembler = createSystemAssembler();
  const system = assembler.assembleServerStack({});
  
  // Acceso directo a través del registro de nodos
  const sheetAdapter = system.nodes.sheet;
  const notionAdapter = system.nodes.notion;

  Logger.log(`🔍 Intentando diagnosticar base de datos con ID: ${databaseId}`);

  // ---------------------------------------------------------
  // 1. HIPÓTESIS: Es una Base de Datos de NOTION (UUID Format)
  // ---------------------------------------------------------
  if (notionAdapter) {
    Logger.log("🧪 [PRUEBA 1] Intentando fetch con NotionAdapter (Hipótesis UUID)...");
    try {
      // Intentamos consultar la base de datos usando el método 'query' estándar del adaptador
      // Nota: NotionAdapter generalmente expone 'query' o 'query_db'
      const resultNotion = notionAdapter.query({ databaseId: databaseId });
      
      Logger.log("✅ [ÉXITO] IDENTIDAD CONFIRMADA: Es una Notion Database.");
      Logger.log("   Items encontrados: " + (resultNotion.results ? resultNotion.results.length : "N/A"));
      Logger.log("   Schema Sample: " + JSON.stringify(resultNotion).substring(0, 300));
      return;
    } catch (e) {
      Logger.log(`❌ [FALLO Notion]: ${e.message}`);
      if (e.message.includes("404") || e.message.includes("not found")) {
        Logger.log("   ℹ️ El ID tiene formato Notion pero no se encontró en la cuenta conectada.");
      }
    }
  } else {
    Logger.log("⚠️ NotionAdapter no está disponible en este entorno.");
  }

  // ---------------------------------------------------------
  // 2. HIPÓTESIS: Es una Hoja de Cálculo de Google (Sheet ID)
  // ---------------------------------------------------------
  if (sheetAdapter) {
    Logger.log("🧪 [PRUEBA 2] Intentando fetch con SheetAdapter...");
    try {
      const resultDirect = sheetAdapter.read({ sheetId: databaseId });
      Logger.log("✅ [ÉXITO] Identificado como Google Sheet.");
      return;
    } catch (e) {
      Logger.log(`❌ [FALLO Sheet]: ${e.message}`);
      // El error original ya nos decía que fallaba aquí
    }
  }
}
