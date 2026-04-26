/**
 * =============================================================================
 * ARTEFACTO: 6_audit/SCHEMA_PURIFICATION.gs
 * OBJETIVO: Purga de Columnas Fantasma y Restauración de Soberanía (v19.0).
 * =============================================================================
 */

function RUN_SCHEMA_PURIFICATION() {
  const WORKSPACE_ID = '103MitQudDSMinRzzMLuzkWKmPN7UaDNr'; // VETA MAX
  
  console.log('☢️ INICIANDO PURIFICACIÓN AXIAL DE ESQUEMAS...');
  
  try {
    const ledgerId = _ledger_get_ss_id_(WORKSPACE_ID);
    console.log(`📍 Nucleo detectado: ${ledgerId}`);
    
    const ss = SpreadsheetApp.openById(ledgerId);
    const sheets = ss.getSheets();
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      console.log(`\n📄 Procesando pestaña: ${sheetName}`);
      
      // 1. REVELACIÓN: Mostrar todas las columnas ocultas
      const lastCol = sheet.getLastColumn();
      if (lastCol > 0) {
        sheet.showColumns(1, lastCol);
        console.log('   🔓 Columnas reveladas.');
      }
      
      // 2. IDENTIFICACIÓN Y PURGA: Buscar columnas fantasma (_indra_*)
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      const colsToDelete = [];
      
      headers.forEach((header, idx) => {
        const h = String(header).toLowerCase();
        if (h.startsWith('_indra_') || h.startsWith('_origin_')) {
          console.warn(`   👻 Fantasma detectado: '${header}' en columna ${idx + 1}`);
          colsToDelete.push(idx + 1);
        }
      });
      
      // Borrar de derecha a izquierda para no alterar índices
      colsToDelete.reverse().forEach(colIdx => {
        sheet.deleteColumn(colIdx);
        console.log(`   🔥 Columna ${colIdx} eliminada.`);
      });
      
      // 3. ESTÉTICA SOBERANA: Re-formatear cabeceras
      if (lastCol > 0) {
        const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
        headerRange.setFontWeight("bold")
                   .setBackground("#ffffff") // Fondo blanco (Pureza)
                   .setFontColor("#000000")
                   .setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
        sheet.autoResizeColumns(1, sheet.getLastColumn());
      }
    });
    
    console.log('\n✅ PURIFICACIÓN COMPLETADA. Homeostasis restaurada.');
    
  } catch (e) {
    console.error(`❌ ERROR CRÍTICO EN PURIFICACIÓN: ${e.message}`);
  }
}
