/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/system_sonde.gs
 * RESPONSABILIDAD: Test de estrés de resonancia e integridad física.
 * =============================================================================
 */

function SONDE_STRESS_RESONANCE() {
  const testWsId = "1x62Bzrxhp9RH3C3DxpIIrGK24FC-WQlh"; 
  const iterations = 5;
  const startTime = Date.now();
  
  logInfo("🚀 Iniciando Test de Estrés de Resonancia v11.0...");
  
  for (let i = 1; i <= iterations; i++) {
    const newName = `Nexus_Resonance_Phase_${i}_${Math.floor(Math.random()*999)}`;
    logInfo(`\n--- ITERACIÓN ${i}: ${newName} ---`);
    
    try {
      // 1. Ejecutar el protocolo vía Orchestrator
      const uqo = {
        protocol: 'ATOM_UPDATE',
        context_id: testWsId,
        data: { handle: { label: newName } },
        provider: 'system'
      };
      
      const result = handleSystem(uqo);
      
      if (result.metadata.status !== 'OK') {
        throw new Error(`Protocol Error: ${result.metadata.error}`);
      }
      
      // --- AXIOMA DE PACIENCIA (v11.2) ---
      // Damos un respiro a la API de Drive para que la resonancia física sea visible
      Utilities.sleep(1200);
      
      // 2. Verificación de Sinceridad JIT (Directo a Drive)
      const file = DriveApp.getFileById(testWsId);
      const atomData = JSON.parse(file.getBlob().getDataAsString());
      
      const dnaName = atomData.handle?.label;
      let containerName = "[NO_BODY]";
      
      if (atomData.payload?.cell_folder_id) {
        const folder = DriveApp.getFolderById(atomData.payload.cell_folder_id);
        containerName = folder.getName();
      }
      
      const dnaOk = dnaName === newName;
      const containerOk = containerName === newName;
      
      logInfo(`[audit] DNA Record: ${dnaName} | ${dnaOk ? '✅' : '❌'}`);
      logInfo(`[audit] CONTAINER:  ${containerName} | ${containerOk ? '✅' : '❌'}`);
      
      if (!dnaOk || !containerOk) {
        logWarn("[audit] Resonancia incompleta detectada.");
      }

    } catch (e) {
      logError(`❌ FALLO CRÍTICO EN ONDA ${i}`, e);
      break;
    }
  }
  
  logInfo(`\n🏁 Test finalizado en ${Date.now() - startTime}ms`);
}
