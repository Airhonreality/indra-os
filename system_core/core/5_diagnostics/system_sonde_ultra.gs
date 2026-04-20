/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/system_sonde_ultra.gs
 * RESPONSABILIDAD: Auditoría Omni-direccional de la Arquitectura v14.0.
 * AXIOMA: Si el Bridge miente o la Infraestructura recuerda, el sistema ha fallado.
 * =============================================================================
 */

function SONDE_ULTRA_OMNI_AUDIT() {
  const startTime = Date.now();
  const report = { genesis: null, resonance: null, purge: null, purity: null };
  const sessionLabel = `ULTRA_${Math.floor(Math.random()*9999)}`;
  
  logInfo(`🚀 INICIANDO OMNI-AUDIT SOBERANO: ${sessionLabel}`);
  let satelliteToken = null;
  let workspaceId = null;

  try {
    // ─── FASE 1: CRISTALIZACIÓN SATELLITAL ───
    logInfo("\n[F1] Cristalizando Satélite Soberano...");
    const satRes = SYSTEM_SATELLITE_INITIALIZE({
      data: {
        name: `${sessionLabel}_Agent`,
        discovery_secret: "indra_satellite_omega",
        device_info: { type: "SONDE_ULTRA", core: "v14.0" }
      }
    });
    
    if (satRes.metadata.status !== 'OK') throw new Error(`Fallo en génesis satelital: ${satRes.metadata.error}`);
    satelliteToken = satRes.items[0].token;
    report.genesis = "✅ SATÉLITE CRISTALIZADO Y VINCULADO";
    logSuccess(report.genesis);

    // ─── FASE 2: OPERACIÓN VÍA BRIDGE (HONESTIDAD) ───
    logInfo("\n[F2] Ejecutando ATOM_CREATE vía Satélite...");
    const wsRes = handleSystem({
        protocol: 'ATOM_CREATE',
        satellite_token: satelliteToken,
        data: { class: 'WORKSPACE', handle: { label: `${sessionLabel}_Workspace` } },
        provider: 'system'
    });

    if (wsRes.metadata.status !== 'OK') throw new Error(`Fallo en creación vía Bridge: ${wsRes.metadata.error}`);
    workspaceId = wsRes.items[0].id;
    
    // Verificar si el Ledger se actualizó (responsabilidad del Orquestador L3)
    const ledgerMetadata = _ledger_get_batch_metadata_([workspaceId]);
    const ledgerEntry = ledgerMetadata[workspaceId];
    
    if (!ledgerEntry) throw new Error("Axiom Break: La infraestructura creó el archivo pero el Orquestador no sincronizó el Ledger.");
    
    report.resonance = "✅ RESONANCIA AXIOMÁTICA L2->L3 CONFIRMADA";
    logSuccess(report.resonance);

    // ─── FASE 3: ESTRÉS DE MUTACIÓN FÍSICA ───
    logInfo("\n[F3] Mutando Workspace (Prueba de ceguera infra)...");
    const updateLabel = `${sessionLabel}_RESONATED`;
    const upRes = handleSystem({
        protocol: 'ATOM_UPDATE',
        satellite_token: satelliteToken,
        context_id: workspaceId,
        data: { handle: { label: updateLabel } },
        provider: 'system'
    });

    if (upRes.metadata.status !== 'OK') throw new Error(`Fallo en mutación: ${upRes.metadata.error}`);
    
    Utilities.sleep(1500); // Drive sync
    const physicalFolder = DriveApp.getFolderById(workspaceId).getParents().next(); // Folder contenedor
    if (physicalFolder.getName() !== updateLabel) {
        throw new Error(`Desincronización: El Ledger dice '${updateLabel}' pero la carpeta se llama '${physicalFolder.getName()}'`);
    }
    
    report.purity = "✅ SINCRONÍA FÍSICO-LÓGICA PERFECTA";
    logSuccess(report.purity);

    // ─── FASE 4: PURGA TOTAL Y AUDITORÍA DE FANTASMAS ───
    logInfo("\n[F4] Ejecutando Purga Atómica Total...");
    const satAtomId = satRes.items[0].id || satRes.items[0].atom_id;
    
    // Eliminar Workspace
    handleSystem({ protocol: 'ATOM_DELETE', satellite_token: satelliteToken, context_id: workspaceId, provider: 'system' });
    
    // Eliminar Satélite (Suicidio Soberano)
    SYSTEM_KEYCHAIN_REVOKE({ context_id: satelliteToken });

    Utilities.sleep(1500);
    
    // ¿Quedan rastros en el Ledger?
    // Consultamos por ID exacto. Si el mapa tiene la llave, el fantasma existe.
    const finalGhostCheck = _ledger_get_batch_metadata_([workspaceId, satAtomId]);
    const ghostCount = Object.keys(finalGhostCheck).length;
    
    if (ghostCount > 0) {
        throw new Error(`Se detectaron ${ghostCount} fantasmas en el Ledger tras la purga.`);
    }

    report.purge = "✅ PURGA COMPLETA: ZERO TRACE POLICY";
    logSuccess(report.purge);

    // ─── FASE 5: ELIMINACIÓN DE BASURA ESPACIAL ───
    logInfo("\n[F5] Ejecutando Barrido de Basura Espacial...");
    _sonde_deep_cleanup_infra_();
    report.cleanup = "✅ INFRAESTRUCTURA PURIFICADA";
    logSuccess(report.cleanup);

    logInfo(`\n🏆 OMNI-AUDIT EXITOSO EN ${Date.now() - startTime}ms`);
    logInfo("ESTADO DE INDRA OS: V14.0 SOBERANO Y AXIOMÁTICAMENTE PURO.");

  } catch (err) {
    logError(`\n❌ FALLO CRÍTICO EN OMNI-AUDIT: ${err.message}`);
    // Cleanup de emergencia
    _sonde_deep_cleanup_infra_();
  }
}

/**
 * Barrido profundo de residuos físicos.
 */
function _sonde_deep_cleanup_infra_() {
    try {
        const root = _system_ensureHomeRoot();
        const satFolder = root.getFoldersByName('.satellites');
        if (satFolder.hasNext()) {
            const folder = satFolder.next();
            const files = folder.getFiles();
            while(files.hasNext()) {
                const f = files.next();
                if (f.getName().includes('ULTRA_')) f.setTrashed(true);
            }
        }
        
        // Limpiar Workspaces huérfanos de test
        const wsFolder = root.getFoldersByName('workspaces');
        if (wsFolder.hasNext()) {
            const folder = wsFolder.next();
            const subs = folder.getFolders();
            while(subs.hasNext()) {
                const s = subs.next();
                if (s.getName().includes('ULTRA_')) s.setTrashed(true);
            }
        }
        logInfo("[cleanup] Basura espacial incinerada con éxito.");
    } catch(e) {
        logWarn("[cleanup] Fallo parcial en barrido espacial: " + e.message);
    }
}

/**
 * OMNI-DIAGNOSTIC: PRUEBA DE STRESS LOCAL
 * Ejecuta esta función desde el editor de GAS para ver si el núcleo responde sin red.
 */
function OMNI_DIAGNOSTIC_LOCAL_TEST() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        protocol: 'SYSTEM_MANIFEST',
        provider: 'system',
        satellite_token: 'DIAGNOSTIC_BYPASS',
        environment: 'DIAGNOSTIC'
      })
    }
  };
  
  try {
    console.log("🚀 Iniciando Simulación de Petición Satelital...");
    const response = doPost(mockEvent);
    console.log("✅ Respuesta del Núcleo:", response.getContent());
  } catch (e) {
    console.error("❌ Fallo Crítico en el Núcleo:", e.toString());
  }
}
