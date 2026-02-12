/**
 * 🌐 BURST_MODE_AUDIT.gs (Capa 7 - Diagnostics)
 * Version: 1.0.0
 * Dharma: Forensic audit of NetworkDispatcher burst execution capabilities.
 *         Validates timeout protection, session caching, ISR aggregation,
 *         and continuation token generation.
 * 
 * ÁRBOL DE PROBLEMAS AUDITADOS:
 * 1. Entropy Loop (Infinite pagination without cursor progression)
 * 2. Timeout Vulnerability (Execution exceeding 60s GAS limit)
 * 3. Identity Fragmentation (ORIGIN_SOURCE loss during burst)
 * 4. Session Overhead (Re-decryption on every page)
 * 5. ISR Contract Violation (Incomplete metadata in aggregated responses)
 */

/**
 * SUITE 1: Small Dataset Test (< 100 records)
 * Validates single-page optimization and minimal overhead.
 */
function TEST_Burst_SmallDataset() {
  Logger.log("🔬 [BURST AUDIT] Suite 1: Small Dataset Test");
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const system = _assembleTestSystem();
  const databaseId = "191b5567-ba71-80dc-9b90-f7938fac7b61"; // Small test DB
  
  try {
    const startTime = Date.now();
    
    const result = system.public.executeAction({
      action: 'notion:query_db',
      payload: {
        databaseId: databaseId,
        accountId: 'DEFAULT',
        enableBurst: true,
        maxRecords: 50
      }
    });
    
    const executionTime = Date.now() - startTime;
    
    // AXIOMA: Efficiency Validation
    Logger.log(`⏱️ Execution Time: ${executionTime}ms`);
    Logger.log(`📊 Records Fetched: ${result.results ? result.results.length : 0}`);
    Logger.log(`🔄 Pages Processed: ${result.PAGINATION?.pageCount || 1}`);
    
    // Assertions
    const assertions = {
      hasResults: !!result.results,
      hasOriginSource: result.ORIGIN_SOURCE === 'notion',
      hasPagination: !!result.PAGINATION,
      noContinuationToken: !result.CONTINUATION_TOKEN, // Should complete in one burst
      executionUnder15s: executionTime < 15000 // Realistic for GAS (network latency + decryption)
    };
    
    Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Logger.log("📋 ASSERTIONS:");
    for (const [key, value] of Object.entries(assertions)) {
      Logger.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    }
    
    const allPassed = Object.values(assertions).every(v => v);
    Logger.log(allPassed ? "✅ SUITE 1 PASSED" : "❌ SUITE 1 FAILED");
    
    return { suite: 'SmallDataset', passed: allPassed, assertions, executionTime };
    
  } catch (e) {
    Logger.log(`❌ SUITE 1 ERROR: ${e.message}`);
    return { suite: 'SmallDataset', passed: false, error: e.message };
  }
}

/**
 * SUITE 2: Large Dataset Test (1000+ records)
 * Validates multi-page aggregation and ISR consistency.
 */
function TEST_Burst_LargeDataset() {
  Logger.log("🔬 [BURST AUDIT] Suite 2: Large Dataset Test");
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const system = _assembleTestSystem();
  const databaseId = "191b5567-ba71-80dc-9b90-f7938fac7b61"; // Large test DB
  
  try {
    const startTime = Date.now();
    
    const result = system.public.executeAction({
      action: 'notion:query_db',
      payload: {
        databaseId: databaseId,
        accountId: 'DEFAULT',
        enableBurst: true,
        maxRecords: 500 // Force multi-page
      }
    });
    
    const executionTime = Date.now() - startTime;
    
    Logger.log(`⏱️ Execution Time: ${executionTime}ms`);
    Logger.log(`📊 Records Fetched: ${result.results ? result.results.length : 0}`);
    Logger.log(`🔄 Pages Processed: ${result.PAGINATION?.pageCount || 0}`);
    Logger.log(`🌐 Origin Source: ${result.ORIGIN_SOURCE}`);
    Logger.log(`📐 Has Schema: ${!!result.SCHEMA}`);
    
    // AXIOMA: ISR Structure Validation
    const assertions = {
      hasResults: !!result.results && result.results.length > 0,
      originPreserved: result.ORIGIN_SOURCE === 'notion',
      hasSchema: !!result.SCHEMA,
      hasPagination: !!result.PAGINATION,
      paginationComplete: result.PAGINATION?.hasMore === false || !!result.CONTINUATION_TOKEN,
      multiPage: (result.PAGINATION?.pageCount || 0) > 1,
      executionUnder50s: executionTime < 50000,
      burstMetadata: !!result.BURST_METADATA
    };
    
    Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Logger.log("📋 ASSERTIONS:");
    for (const [key, value] of Object.entries(assertions)) {
      Logger.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    }
    
    const allPassed = Object.values(assertions).every(v => v);
    Logger.log(allPassed ? "✅ SUITE 2 PASSED" : "❌ SUITE 2 FAILED");
    
    return { suite: 'LargeDataset', passed: allPassed, assertions, executionTime };
    
  } catch (e) {
    Logger.log(`❌ SUITE 2 ERROR: ${e.message}`);
    return { suite: 'LargeDataset', passed: false, error: e.message };
  }
}

/**
 * SUITE 3: Timeout Resilience Test
 * Simulates extreme dataset to verify graceful stop at 50s threshold.
 */
function TEST_Burst_TimeoutResilience() {
  Logger.log("🔬 [BURST AUDIT] Suite 3: Timeout Resilience Test");
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const system = _assembleTestSystem();
  const databaseId = "191b5567-ba71-80dc-9b90-f7938fac7b61";
  
  try {
    const startTime = Date.now();
    
    // Force timeout scenario with very low maxTime
    const result = system.networkDispatcher.executeBurst({
      adapter: system.notion,
      method: 'queryDatabase',
      payload: {
        databaseId: databaseId,
        accountId: 'DEFAULT'
      },
      burstConfig: system.notion.BURST_CONFIG,
      maxTime: 5000, // 5 second limit to force early stop
      maxRecords: 10000 // Unrealistic limit
    });
    
    const executionTime = Date.now() - startTime;
    
    Logger.log(`⏱️ Execution Time: ${executionTime}ms`);
    Logger.log(`📊 Records Fetched: ${result.results ? result.results.length : 0}`);
    Logger.log(`🔄 Pages Processed: ${result.PAGINATION?.pageCount || 0}`);
    Logger.log(`⏸️ Stopped Early: ${result.BURST_METADATA?.stoppedEarly}`);
    Logger.log(`🎫 Has Continuation Token: ${!!result.CONTINUATION_TOKEN}`);
    
    // AXIOMA: Timeout Protection Validation
    const assertions = {
      stoppedBeforeTimeout: executionTime < 6000, // Should stop before 6s
      hasPartialResults: !!result.results && result.results.length > 0,
      hasContinuationToken: !!result.CONTINUATION_TOKEN,
      originPreserved: result.ORIGIN_SOURCE === 'notion',
      stoppedEarlyFlag: result.BURST_METADATA?.stoppedEarly === true,
      cursorPresent: !!result.CONTINUATION_TOKEN?.cursor
    };
    
    Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Logger.log("📋 ASSERTIONS:");
    for (const [key, value] of Object.entries(assertions)) {
      Logger.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    }
    
    const allPassed = Object.values(assertions).every(v => v);
    Logger.log(allPassed ? "✅ SUITE 3 PASSED" : "❌ SUITE 3 FAILED");
    
    return { suite: 'TimeoutResilience', passed: allPassed, assertions, executionTime };
    
  } catch (e) {
    Logger.log(`❌ SUITE 3 ERROR: ${e.message}`);
    return { suite: 'TimeoutResilience', passed: false, error: e.message };
  }
}

/**
 * SUITE 4: Session Cache Efficiency Test
 * Validates that credentials are not re-decrypted on every page.
 */
function TEST_Burst_SessionCaching() {
  Logger.log("🔬 [BURST AUDIT] Suite 4: Session Cache Efficiency Test");
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const system = _assembleTestSystem();
  
  try {
    // Test session lifecycle
    const sessionId = system.tokenManager.startSession({
      provider: 'notion',
      accountId: 'DEFAULT'
    });
    
    Logger.log(`🔑 Session Started: ${sessionId}`);
    
    // Retrieve cached credentials (should be fast)
    const startRetrieve = Date.now();
    const credentials1 = system.tokenManager.getSessionToken({ sessionId });
    const retrieveTime1 = Date.now() - startRetrieve;
    
    // Retrieve again (should be even faster - no decryption)
    const startRetrieve2 = Date.now();
    const credentials2 = system.tokenManager.getSessionToken({ sessionId });
    const retrieveTime2 = Date.now() - startRetrieve2;
    
    // End session
    system.tokenManager.endSession({ sessionId });
    
    Logger.log(`⏱️ First Retrieve: ${retrieveTime1}ms`);
    Logger.log(`⏱️ Second Retrieve: ${retrieveTime2}ms`);
    Logger.log(`🔐 Credentials Match: ${credentials1.apiKey === credentials2.apiKey}`);
    
    // Try to retrieve after session end (should fail)
    let sessionExpiredCorrectly = false;
    try {
      system.tokenManager.getSessionToken({ sessionId });
    } catch (e) {
      sessionExpiredCorrectly = e.message.includes('not found') || e.message.includes('expired');
    }
    
    // AXIOMA: Session Cache Validation
    const assertions = {
      sessionCreated: !!sessionId,
      credentialsRetrieved: !!credentials1 && !!credentials1.apiKey,
      credentialsConsistent: credentials1.apiKey === credentials2.apiKey,
      retrieveFast: retrieveTime1 < 100 && retrieveTime2 < 100,
      sessionCleanedUp: sessionExpiredCorrectly
    };
    
    Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Logger.log("📋 ASSERTIONS:");
    for (const [key, value] of Object.entries(assertions)) {
      Logger.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    }
    
    const allPassed = Object.values(assertions).every(v => v);
    Logger.log(allPassed ? "✅ SUITE 4 PASSED" : "❌ SUITE 4 FAILED");
    
    return { suite: 'SessionCaching', passed: allPassed, assertions };
    
  } catch (e) {
    Logger.log(`❌ SUITE 4 ERROR: ${e.message}`);
    return { suite: 'SessionCaching', passed: false, error: e.message };
  }
}

/**
 * SUITE 5: Identity Persistence Test
 * Validates ORIGIN_SOURCE preservation across burst aggregation.
 */
function TEST_Burst_IdentityPersistence() {
  Logger.log("🔬 [BURST AUDIT] Suite 5: Identity Persistence Test");
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const system = _assembleTestSystem();
  const databaseId = "191b5567-ba71-80dc-9b90-f7938fac7b61";
  
  try {
    // Execute burst operation
    const result = system.networkDispatcher.executeBurst({
      adapter: system.notion,
      method: 'queryDatabase',
      payload: {
        databaseId: databaseId,
        accountId: 'DEFAULT'
      },
      burstConfig: system.notion.BURST_CONFIG,
      maxRecords: 200
    });
    
    Logger.log(`🌐 Origin Source: ${result.ORIGIN_SOURCE}`);
    Logger.log(`📐 Has Schema: ${!!result.SCHEMA}`);
    Logger.log(`🆔 Has Identity Context: ${!!result.IDENTITY_CONTEXT}`);
    Logger.log(`📊 Results Count: ${result.results ? result.results.length : 0}`);
    
    // AXIOMA: Identity Sovereignty Validation
    const assertions = {
      originSourcePresent: !!result.ORIGIN_SOURCE,
      originSourceCorrect: result.ORIGIN_SOURCE === 'notion',
      schemaPresent: !!result.SCHEMA,
      identityContextPresent: !!result.IDENTITY_CONTEXT,
      paginationPresent: !!result.PAGINATION,
      paginationHasOrigin: result.PAGINATION?.ORIGIN_SOURCE === undefined // Should not duplicate
    };
    
    Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Logger.log("📋 ASSERTIONS:");
    for (const [key, value] of Object.entries(assertions)) {
      Logger.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    }
    
    const allPassed = Object.values(assertions).every(v => v);
    Logger.log(allPassed ? "✅ SUITE 5 PASSED" : "❌ SUITE 5 FAILED");
    
    return { suite: 'IdentityPersistence', passed: allPassed, assertions };
    
  } catch (e) {
    Logger.log(`❌ SUITE 5 ERROR: ${e.message}`);
    Logger.log(`🔍 Error Origin: ${e.ORIGIN_SOURCE || 'UNKNOWN'}`);
    
    // Even in error, origin should be preserved
    const originPreservedInError = !!e.ORIGIN_SOURCE;
    
    return { 
      suite: 'IdentityPersistence', 
      passed: false, 
      error: e.message,
      originPreservedInError 
    };
  }
}

/**
 * MASTER SUITE: Run all burst mode tests
 */
function RUN_ALL_Burst_Tests() {
  Logger.log("╔═══════════════════════════════════════════════════════════╗");
  Logger.log("║  🌐 BURST MODE COMPREHENSIVE AUDIT                       ║");
  Logger.log("║  Forensic validation of NetworkDispatcher capabilities   ║");
  Logger.log("╚═══════════════════════════════════════════════════════════╝");
  Logger.log("");
  
  const results = [];
  
  // Run all suites
  results.push(TEST_Burst_SmallDataset());
  Logger.log("");
  
  results.push(TEST_Burst_LargeDataset());
  Logger.log("");
  
  results.push(TEST_Burst_TimeoutResilience());
  Logger.log("");
  
  results.push(TEST_Burst_SessionCaching());
  Logger.log("");
  
  results.push(TEST_Burst_IdentityPersistence());
  Logger.log("");
  
  // Summary
  Logger.log("╔═══════════════════════════════════════════════════════════╗");
  Logger.log("║  📊 AUDIT SUMMARY                                        ║");
  Logger.log("╚═══════════════════════════════════════════════════════════╝");
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    Logger.log(`${icon} ${result.suite}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    if (result.error) {
      Logger.log(`   Error: ${result.error}`);
    }
  });
  
  Logger.log("");
  Logger.log(`🎯 Overall: ${passedCount}/${totalCount} suites passed`);
  
  if (passedCount === totalCount) {
    Logger.log("✅ BURST MODE ARCHITECTURE: FULLY OPERATIONAL");
  } else {
    Logger.log("⚠️ BURST MODE ARCHITECTURE: REQUIRES ATTENTION");
  }
  
  return { passedCount, totalCount, results };
}

/**
 * Helper: Assemble test system
 * @private
 */
function _assembleTestSystem() {
  const assembler = createSystemAssembler();
  return assembler.assembleServerStack({});
}
