/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/sonde_sheets_industrial.gs
 * RESPONSABILIDAD: Prueba de Integridad del Motor de Sheets.
 * FLUJO: Creación física -> Validación ADN -> Sincronización Tabular.
 * =============================================================================
 */

function TEST_SHEETS_QUICKSILVER() {
  console.log("--- INICIANDO SONDA SHEETS INDUSTRIAL ---");
  
  const testSchema = {
    handle: { label: "Sonda Industrial (Sheets) " + new Date().toLocaleTimeString() },
    fields: [
      { id: "id", label: "UID", type: "STRING" },
      { id: "name", label: "Componente", type: "STRING" },
      { id: "status", label: "Estado", type: "STRING" }
    ]
  };

  try {
    // 1. GÉNESIS FÍSICA
    console.log("[1/4] Ejecutando ATOM_CREATE...");
    const createRes = handleSheets({
      protocol: 'ATOM_CREATE',
      data: {
        class: 'TABULAR',
        handle: testSchema.handle,
        fields: testSchema.fields
      }
    });

    if (createRes.metadata.status !== 'OK') throw new Error("Fallo en creación: " + createRes.metadata.error);
    const ssId = createRes.items[0].id;
    console.log("[PASS] Spreadsheet creada con ID: " + ssId);
    console.log("URL de Auditoria: " + createRes.metadata.silo_url);

    // 2. VALIDACIÓN DE ADN (Esquema)
    console.log("[2/4] Verificando ADN vía ATOM_READ...");
    const readRes = handleSheets({
      protocol: 'ATOM_READ',
      context_id: ssId
    });

    const detectedFields = readRes.items[0].payload.fields;
    console.log("Campos detectados: " + JSON.stringify(detectedFields));
    if (detectedFields.length !== 3) throw new Error("Discrepancia en el conteo de campos.");

    // 3. INYECCIÓN DE DATOS (Prueba de estrés rápida)
    console.log("[3/4] Inyectando datos de prueba...");
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheets()[0];
    sheet.appendRow(["INDRA-001", "Motor Resonancia", "OK"]);
    sheet.appendRow(["INDRA-002", "Cortex A-1", "CALIBRATION"]);

    // 4. RETORNO DE STREAM
    console.log("[4/4] Verificando TABULAR_STREAM...");
    const streamRes = handleSheets({
      protocol: 'TABULAR_STREAM',
      context_id: ssId
    });

    console.log("Filas recuperadas: " + streamRes.items.length);
    if (streamRes.items.length !== 2) throw new Error("Error en la recuperación del stream.");

    console.log("--- ✅ SONDA SHEETS COMPLETADA CON ÉXITO ---");
    return { status: 'OK', silo_url: createRes.metadata.silo_url };

  } catch (err) {
    console.error("--- ❌ FALLO EN SONDA SHEETS ---");
    console.error(err.message);
    return { status: 'ERROR', message: err.message };
  }
}
