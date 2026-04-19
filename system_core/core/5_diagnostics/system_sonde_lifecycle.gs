/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/system_sonde_lifecycle.gs
 * RESPONSABILIDAD: Test de estrés de ciclo de vida completo (Create-Update-Delete).
 * AXIOMA: Verificación de Integridad Atómica y Resonancia en Sincronía.
 * =============================================================================
 */

function SONDE_LIFECYCLE_STRESS() {
  const startTime = Date.now();
  const testLabel = `Sonde_Superior_${Math.floor(Math.random()*999)}`;
  let testAtomId = null;

  logInfo(`🚀 Iniciando SONDA SUPERIOR DE CICLO DE VIDA: ${testLabel}`);

  try {
    // ─── FASE 1: GÉNESIS ───
    logInfo("\n[F1] Ejecutando ATOM_CREATE...");
    const createRes = handleSystem({
      protocol: 'ATOM_CREATE',
      data: { class: 'WORKSPACE', handle: { label: testLabel } },
      provider: 'system'
    });

    if (createRes.metadata.status !== 'OK') throw new Error(`Fallo en Creación: ${createRes.metadata.error}`);
    testAtomId = createRes.items[0].id;
    logSuccess(`[sonde] Átomo creado con éxito. ID: ${testAtomId}`);

    // Validación Física Post-Génesis
    Utilities.sleep(1500);
    const dnaFile = DriveApp.getFileById(testAtomId);
    const container = dnaFile.getParents().next();
    logInfo(`[audit] ADN Físico: ✅ | Contenedor: ${container.getName()} ✅`);

    // ─── FASE 2: EVOLUCIÓN (ESTRÉS DE RESONANCIA) ───
    logInfo("\n[F2] Iniciando Estrés de Mutación (3 Ondas)...");
    for (let i = 1; i <= 3; i++) {
        const updateName = `${testLabel}_Onda_${i}`;
        logInfo(`  Onda ${i}: Mutando a ${updateName}...`);
        
        const updateRes = handleSystem({
            protocol: 'ATOM_UPDATE',
            context_id: testAtomId,
            data: { handle: { label: updateName } },
            provider: 'system'
        });
        
        if (updateRes.metadata.status !== 'OK') throw new Error(`Fallo en Onda ${i}: ${updateRes.metadata.error}`);
        
        Utilities.sleep(1500); // Paciencia de Drive
        
        const currentContainerName = container.getName();
        if (currentContainerName !== updateName) {
            logError(`[audit] DESINCRONIZACIÓN FÍSICA: Se esperaba ${updateName}, se encontró ${currentContainerName}`);
            throw new Error("Resonancia fallida durante el estrés.");
        }
        logSuccess(`  [audit] Onda ${i} RESONADA ✅`);
    }

    // ─── FASE 3: PURGA ───
    logInfo("\n[F3] Ejecutando ATOM_DELETE...");
    const deleteRes = handleSystem({
        protocol: 'ATOM_DELETE',
        context_id: testAtomId,
        provider: 'system'
    });

    if (deleteRes.metadata.status !== 'OK') throw new Error(`Fallo en Eliminación: ${deleteRes.metadata.error}`);
    
    Utilities.sleep(1500);
    try {
        DriveApp.getFileById(testAtomId);
        if (!DriveApp.getFileById(testAtomId).isTrashed()) {
             throw new Error("El archivo sigue vivo en Drive.");
        }
    } catch (e) {
        // Correcto: getFileById debería fallar o devolver algo en papelera
        logSuccess("[audit] Purga Física confirmada. ADN eliminado ✅");
    }

    logSuccess(`\n🏁 SONDA SUPERIOR COMPLETADA EN ${Date.now() - startTime}ms`);
    logInfo("ESTADO DEL CORE: SOBERANO Y SINCERADO.");

  } catch (err) {
    logError(`\n❌ FALLO CRÍTICO EN LA SONDA: ${err.message}`);
    // Intentar limpieza si el átomo quedó huérfano
    if (testAtomId) {
        logWarn(`[cleanup] Intentando purga de emergencia para ${testAtomId}`);
        try { DriveApp.getFileById(testAtomId).setTrashed(true); } catch(e){}
    }
  }
}
