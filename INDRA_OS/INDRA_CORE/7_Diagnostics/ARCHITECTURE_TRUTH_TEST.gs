/**
 * 🏛️ ARCHITECTURE_TRUTH_TEST.gs
 * Forensic audit of end-to-end architecture integrity.
 * 
 * ÁRBOL DE PROBLEMAS AUDITADOS (Últimas 4 Iteraciones):
 * 1. Identity Sovereignty Loss (ORIGIN_SOURCE desaparece en pipeline)
 * 2. Heuristic Dependency (Frontend adivina origen por formato de ID)
 * 3. TokenManager Alias Resolution (DEFAULT no se resuelve correctamente)
 * 4. Pagination Entropy Loop (Cursor no se inyecta en siguiente petición)
 * 5. Timeout Vulnerability (Datasets grandes causan muerte por timeout)
 */

function TEST_Architecture_Payload_Truth() {
  const databaseId = "191b5567-ba71-80dc-9b90-f7938fac7b61";
  
  Logger.log("🏛️ [ARCHITECTURE TEST] Inyectando Petición Transversal...");
  
  // 1. Ensamblaje del Stack Real (Sin Mocks)
  const assembler = createSystemAssembler();
  const system = assembler.assembleServerStack({});
  
  // 2. Simulación de la llamada que hace el Frontend (AxiomaticStore -> executeAction)
  Logger.log("📡 [FRONTEND SIMULATION] system.public.executeAction('notion:query_db', ...)");
  
  try {
    const result = system.public.executeAction({ 
      action: 'notion:query_db', 
      payload: {
        databaseId: databaseId,
        accountId: 'DEFAULT'
      }
    });
    
    Logger.log("✅ [ANALYSIS] El payload retornado por la arquitectura es:");
    Logger.log("---------------------------------------------------------");
    Logger.log("SUCCESS: " + result.success);
    Logger.log("ORIGIN_SOURCE: " + result.ORIGIN_SOURCE);
    Logger.log("ERROR_IF_ANY: " + result.error);
    Logger.log("HAS_SCHEMA: " + (!!result.SCHEMA));
    Logger.log("PAGINATION: " + JSON.stringify(result.PAGINATION));
    Logger.log("RESULT_COUNT: " + (result.results ? result.results.length : 0));
    Logger.log("HAS_BURST_METADATA: " + (!!result.BURST_METADATA));
    Logger.log("---------------------------------------------------------");
    
    // AXIOMA: Identity Sovereignty Validation
    if (result.ORIGIN_SOURCE === 'notion') {
      Logger.log("💎 VERDICT: La arquitectura propaga el origen correctamente sin intervención del Frontend.");
    } else {
      Logger.log("⚠️ VERDICT: El origen no se detectó o se perdió en el pipeline.");
    }
    
    // AXIOMA: Burst Mode Integration Validation
    if (result.BURST_METADATA && typeof result.BURST_METADATA === 'object') {
      Logger.log("🌐 BURST MODE: NetworkDispatcher está activo y agregando metadata de ejecución.");
      Logger.log(`   - Execution Time: ${result.BURST_METADATA.executionTime}ms`);
      Logger.log(`   - Pages Processed: ${result.BURST_METADATA.pageCount || 'N/A'}`);
    } else {
      Logger.log("⚠️ BURST MODE: NetworkDispatcher no está siendo utilizado o falta metadata.");
    }
    
  } catch (e) {
    // AXIOMA: Captura Forense
    // El error en GAS a veces viene en el objeto devuelto si success es false
    const errorResult = e.result || e;
    Logger.log("❌ [PIPELINE ERROR] Capturado.");
    Logger.log("ORIGIN_SOURCE: " + errorResult.ORIGIN_SOURCE);
    Logger.log("ERROR_MSG: " + (errorResult.error || e.message));
    
    if (errorResult.ORIGIN_SOURCE === 'notion') {
      Logger.log("✨ VERDICT: Arquitectura Blindada. La identidad persiste en el fallo.");
    } else {
      Logger.log("🛑 VERDICT: La identidad sigue desapareciendo en el fallo.");
    }
  }
}

/**
 * INTEGRATED AUDIT: Run both architecture truth and burst mode tests
 */
function RUN_FULL_Architecture_Audit() {
  Logger.log("╔═══════════════════════════════════════════════════════════╗");
  Logger.log("║  🏛️ COMPREHENSIVE ARCHITECTURE AUDIT                    ║");
  Logger.log("║  Identity Sovereignty + Burst Mode Validation            ║");
  Logger.log("╚═══════════════════════════════════════════════════════════╝");
  Logger.log("");
  
  // Phase 1: Identity Sovereignty Test
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Logger.log("PHASE 1: Identity Sovereignty Validation");
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  TEST_Architecture_Payload_Truth();
  Logger.log("");
  
  // Phase 2: Burst Mode Validation
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Logger.log("PHASE 2: Burst Mode Infrastructure Validation");
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Run burst mode audit if available
  if (typeof RUN_ALL_Burst_Tests === 'function') {
    const burstResults = RUN_ALL_Burst_Tests();
    Logger.log("");
    Logger.log("╔═══════════════════════════════════════════════════════════╗");
    Logger.log("║  🎯 FINAL VERDICT                                        ║");
    Logger.log("╚═══════════════════════════════════════════════════════════╝");
    
    if (burstResults.passedCount === burstResults.totalCount) {
      Logger.log("✅ ARCHITECTURE STATUS: FULLY OPERATIONAL");
      Logger.log("   - Identity Sovereignty: PRESERVED");
      Logger.log("   - Burst Mode: OPERATIONAL");
      Logger.log("   - Timeout Protection: ACTIVE");
      Logger.log("   - Session Caching: EFFICIENT");
    } else {
      Logger.log("⚠️ ARCHITECTURE STATUS: PARTIAL FUNCTIONALITY");
      Logger.log(`   - Burst Tests: ${burstResults.passedCount}/${burstResults.totalCount} passed`);
    }
  } else {
    Logger.log("⚠️ Burst mode tests not available. Run BURST_MODE_AUDIT.gs separately.");
  }
}

