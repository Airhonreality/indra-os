/**
 * DIAGNOSTIC: Purity Violation Forensics V3 (Integration Scan)
 * Intenta ensamblar el stack y captura el NUEVO error detallado de PublicAPI.
 */
function debug_PurityViolationForensics() {
  console.log('=== 🔬 INTEGRATION FORENSIC REPORT ===');
  try {
    const stack = _assembleExecutionStack(); // Esto invocará createPublicAPI -> Gatekeeper
    console.log('✅ Stack assembled successfully. No violations found during assembly.');
    
    // Si llegamos aquí, hacemos un doble chequeo manual del objeto final
    const audit = ContractGatekeeper.validateAllContracts(stack);
    console.log(`Audit Post-Assembly: Valid=${audit.isValid}`);
    
  } catch (e) {
    console.log('❌ FATAL ERROR DURING ASSEMBLY');
    console.log('---------------------------------------------------');
    // Ahora 'e.message' debería contener los detalles gracias al fix en PublicAPI
    console.log(e.message); 
    console.log('---------------------------------------------------');
  }
  console.log('=== END REPORT ===');
}
