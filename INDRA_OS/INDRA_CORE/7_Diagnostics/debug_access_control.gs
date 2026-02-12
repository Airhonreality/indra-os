function debug_DiagnoseCosmosAccess() {
  console.log("🕵️‍♂️ [DIAGNOSTIC] Starting Forensic Analysis of 'cosmos' Node Access...");
  
  // 1. Ignite System
  try {
    const sys = SystemAssembler.assemble();
    console.log("✅ System Assembled.");
    
    // 2. Check Node Existence
    const cosmosNode = sys.nodes.cosmos;
    if (!cosmosNode) {
      console.error("❌ FATAL: 'cosmos' node is NOT present in system.nodes registry.");
      return "NODE_MISSING";
    }
    console.log("✅ 'cosmos' node found: " + (cosmosNode.label || "Unnamed"));

    // 3. Inspect Laws & Critical Systems
    const logic = (sys.laws && sys.laws.axioms) ? sys.laws.axioms : {};
    console.log("ℹ️ Logic Axioms detected.");
    console.log("   CRITICAL_SYSTEMS: " + JSON.stringify(logic.CRITICAL_SYSTEMS || "UNDEFINED"));
    
    // 4. Manual Logic Simulation (Replicating PublicAPI._isWhitelisted code v8.0)
    const nodeKey = 'cosmos';
    
    const criticalSystems = logic.CRITICAL_SYSTEMS || ['sensing', 'public'];
    
    // Exact line from PublicAPI check
    const hardcodedCheck = (criticalSystems.includes(nodeKey) || nodeKey === 'cosmos');
    
    console.log("🔍 Forensics on Authorization Logic:");
    console.log(`   Target Node: '${nodeKey}'`);
    console.log(`   Critical Systems Array: [${criticalSystems.join(', ')}]`);
    console.log(`   Does array include 'cosmos'? ${criticalSystems.includes('cosmos')}`);
    console.log(`   Is nodeKey === 'cosmos'? ${nodeKey === 'cosmos'}`);
    console.log(`   >>> HARDCODED CHECK RESULT: ${hardcodedCheck}`);

    if (hardcodedCheck) {
        console.log("✅ DIAGNOSIS: The code logic is CORRECT locally.");
        console.log("⚠️ VERDICT: If Exposure Block persists, the Live Web App is running OLDER CODE.");
        console.log("👉 ACTION: Run 'clasp deploy' to force a new version, or check ENV URL.");
    } else {
        console.log("❌ DIAGNOSIS: The logic fails locally. The comparison is flawed.");
    }

  } catch (e) {
    console.error("💥 SYSTEM FAILURE DURING DIAGNOSTIC: " + e.message);
    console.error(e.stack);
  }
}
