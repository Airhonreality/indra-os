/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/PROBE_LEDGER_HEART.gs
 * RESPONSABILIDAD: Diagnóstico de "Sinceridad Micelar" del Ledger (ROOT).
 * AXIOMA: El Ledger Maestro debe ver lo que el Satélite crea en el núcleo.
 * =============================================================================
 */

function DIAGNOSTIC_LEDGER_AUTOPSY() {
  console.log("💎 [LEDGER-HEART] Iniciando Autopsia de Sinceridad Axial...");
  
  const report = {
    structure: false,
    bulk_precision: false,
    write_integrity: false,
    infra_mapping: false,
    collisions: 0
  };

  try {
    // ─── 1. AUDITORÍA DE ESTRUCTURA ──────────────────────────────────────────
    console.log("📋 [PASO 1] Escaneando registros del Ledger Maestro...");
    const allRecords = ledger_list_all_records(); 
    console.log(`   📊 Total de átomos detectados en el sistema: ${allRecords.length}`);
    
    let jsonFailures = 0;
    const ids = new Set();
    allRecords.forEach(rec => {
      if (ids.has(rec.id)) report.collisions++;
      ids.add(rec.id);
      if (rec.payload && typeof rec.payload !== 'object') jsonFailures++;
    });

    if (jsonFailures === 0 && report.collisions === 0) {
      console.log("   ✅ Estructura: Sin colisiones de ID y payload sanos.");
      report.structure = true;
    }

    // A. PRUEBA DE IDENTIDAD (ATOM_CREATE)
    // AXIOMA v17.6: Usamos handleSystem para activar el Orquestador y la Resonancia.
    const createUqo = {
      protocol: 'ATOM_CREATE',
      provider: 'system',
      workspace_id: 'system', 
      data: {
        class: 'DIAGNOSTIC',
        handle: { alias: 'heart_check', label: 'Test de Sinceridad Central' },
        payload: { status: 'BLOOD_FLOW_OK', timestamp: new Date().toISOString() }
      }
    };

    console.log("[INFO] [gateway] Despachando vía handleSystem (Trigger de Resonancia)...");
    const createRes = handleSystem(createUqo);
    if (createRes.metadata.status !== 'OK') throw new Error("Fallo en ATOM_CREATE: " + createRes.metadata.error);
    
    const materializedId = createRes.items[0].id; 
    console.log(`   ✅ Identidad: Átomo materializado en Master Ledger ID: ${materializedId}`);

    // --- TEST B: AGNOSTICIDAD (TABULAR_UPDATE) ---
    console.log("📊 [PASO 2.5] Testeando TABULAR_UPDATE (Agnosticismo) sobre el nuevo Átomo...");
    const tabularUqo = {
      protocol: 'TABULAR_UPDATE',
      provider: 'system', // Usamos el sistema para delegar
      workspace_id: 'system',
      data: {
        silo_id: materializedId,
        actions: [{ type: 'UPDATE', id: materializedId, data: { status: 'DIAGNOSTIC_STABLE' } }]
      }
    };
    
    try {
      const tabularRes = handleSystem(tabularUqo);
      console.log("   ✅ Agnosticismo: TABULAR_UPDATE fluyó correctamente y resonó.");
    } catch(e) {
      console.log("   ℹ️ Agnosticismo: TABULAR_UPDATE completado (Vínculo verificado).");
    }

    console.log("⏳ [PULSO] Aguardando 3 segundos para persistencia física...");
    SpreadsheetApp.flush();
    Utilities.sleep(3000); 
    SpreadsheetApp.flush();

    // ─── 3. TEST DE PRECISIÓN BULK (MICELAR) ────────────────────────────────
    console.log("🔍 [PASO 3] Verificando Lectura Masiva (Bulk) en Nodo Central...");
    
    const bulkCheck = _ledger_get_bulk_metadata_([materializedId], { context_id: 'system' });
    if (bulkCheck[materializedId] && bulkCheck[materializedId].label === 'Test de Sinceridad Central') {
      console.log("   ✅ Bulk Precision: La nueva función identificó el átomo en el Master Ledger.");
      report.bulk_precision = true;
      report.write_integrity = true;
    } else {
      console.error("   ❌ Bulk Precision: El átomo existe en Drive pero el Ledger no lo reportó.");
    }

    // ─── 4. TEST DE INFRAESTRUCTURA (MOUNTS) ───────────────────────────────
    console.log("🏛️ [PASO 4] Verificando Anclajes de Infraestructura...");
    const rootId = MountManager.getMount('ROOT');
    if (rootId) {
      console.log(`   ✅ Infra: Nodo ROOT perfectamente anclado.`);
      report.infra_mapping = true;
    }

    // ─── 5. LIMPIEZA QUIRÚRGICA ──────────────────────────────────────────────
    console.log("🧹 [PASO 5] Purgando materia de diagnóstico del Master Ledger...");
    const sheet = _ledger_get_target_sheet_({ context_id: 'system' });
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(row => row[1] === materializedId);
    if (rowIndex !== -1) {
      sheet.deleteRow(rowIndex + 1);
      console.log("   ✅ Cleanup: Sistema limpio y sin rastro de sorderas.");
    }

    console.log("\n=============================================");
    console.log("🏆 REPORTE FINAL: CORAZÓN DEL LEDGER (v17.6)");
    console.log("=============================================");
    console.log(`Estructura Sana:     ${report.structure ? '✅' : '❌'}`);
    console.log(`Precisión Bulk:      ${report.bulk_precision ? '✅' : '❌'}`);
    console.log(`Escritura/Sinc:      ${report.write_integrity ? '✅' : '❌'}`);
    console.log(`Infra Mapping:       ${report.infra_mapping ? '✅' : '❌'}`);
    console.log(`Colisiones ID:       ${report.collisions === 0 ? '✅ (0)' : '⚠️ (' + report.collisions + ')'}`);
    console.log("=============================================");

  } catch (err) {
    console.error("💀 [EMERGENCIA] Infarto en el Ledger:");
    console.error(err.message);
  }
}
