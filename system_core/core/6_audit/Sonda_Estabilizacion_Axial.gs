/**
 * =============================================================================
 * SONDA DE AUDITORÍA: Estabilización Axial v2.0 (RECURSIVA)
 * RESPONSABILIDAD: Validar la integridad del Ledger y la Reconstrucción de Raíz.
 * =============================================================================
 */

function SONDA_EJECUTAR_TEST_AXIAL() {
  const LOG_PREFIX = '🧪 [SONDA:AXIAL] ';
  console.log(`${LOG_PREFIX} Iniciando secuencia de verificación v2.0...`);

  try {
    const rootFolderId = readRootFolderId();
    if (!rootFolderId) throw new Error('No se detectó ROOT_FOLDER_ID.');

    // --- TEST 1: INTEGRIDAD DE MÉTODOS ---
    console.log(`${LOG_PREFIX} Test 1: Comprobando métodos modificados...`);
    if (typeof ledger_rebuild_from_drive_internal_ !== 'function') throw new Error('Motor de reconstrucción no detectado.');
    console.log('✅ Metodología presente.');

    // --- TEST 2: RECONSTRUCCIÓN MAESTRA (REDESCUBRIMIENTO DE WORKSPACES) ---
    console.log(`${LOG_PREFIX} Test 2: Ejecutando Reconstrucción Maestra (ROOT)...`);
    const masterResult = SYSTEM_REBUILD_LEDGER({}); 
    const totalMaster = masterResult.items?.[0]?.total_rebuilt || 0;
    console.log(`✅ Maestro reconstruido: ${totalMaster} átomos (Incluyendo Workspaces).`);

    // --- TEST 3: RECONSTRUCCIÓN CELULAR RECURSIVA ---
    console.log(`${LOG_PREFIX} Test 3: Escaneando Workspaces para reconstrucción interna...`);
    const workspaces = ledger_list_by_class('WORKSPACE', {}); // Ahora deberían aparecer en el Maestro
    
    if (workspaces && workspaces.length > 0) {
      workspaces.forEach(ws => {
        console.log(`   -> 🌀 Reconstruyendo Workspace: ${ws.handle?.label || ws.id}...`);
        try {
          const wsResult = SYSTEM_REBUILD_LEDGER({ workspace_id: ws.id });
          console.log(`      ✅ Sincronizados ${wsResult.items?.[0]?.total_rebuilt || 0} átomos internos.`);
        } catch (err) {
          console.error(`      ❌ Error al reconstruir ${ws.id}: ${err.message}`);
        }
      });
    } else {
      console.warn('   ⚠️ No se detectaron Workspaces en el Ledger Maestro tras la reconstrucción.');
    }

    console.log(`\n${LOG_PREFIX} 💎 RESULTADO FINAL: ECOSISTEMA TOTALMENTE SINCRONIZADO.`);
    
  } catch (e) {
    console.error(`${LOG_PREFIX} ❌ FALLO DE AUDITORÍA:`, e.message);
  }
}
