function debug_DiagnoseProjectionTruth() {
  console.log("🕵️‍♂️ [TRUTH] Starting Forensic Analysis of HTTP Projection Gatekeeper...");
  
  try {
    // 1. Replicate HttpEntrypoint Assembly
    // We assume SystemAssembler is exposed globally now based on previous steps
    if (typeof SystemAssembler === 'undefined' || !SystemAssembler.assemble) {
       console.error("❌ FATAL: SystemAssembler not found globally.");
       return;
    }

    const executionStack = SystemAssembler.assemble();
    const { projectionKernel, configurator } = executionStack;
    
    // 2. Locate the Suspect (Cosmos Node)
    // HttpEntrypoint searches in stack[executor] OR stack.nodes[executor]
    let executorInstance = executionStack['cosmos'];
    if (!executorInstance && executionStack.nodes && executionStack.nodes['cosmos']) {
      executorInstance = executionStack.nodes['cosmos'];
      console.log("ℹ️ Found 'cosmos' via executionStack.nodes['cosmos']");
    } else if (executorInstance) {
       console.log("ℹ️ Found 'cosmos' directly on executionStack['cosmos']");
    } else {
       console.error("❌ FATAL: 'cosmos' executor NOT found in stack.");
       return;
    }

    // 3. Interrogate the Object Structure
    console.log("🔎 Inspecting Cosmos Node Structure:");
    console.log("   - ID: " + (executorInstance.id || 'undefined'));
    
    const hasSchemas = !!executorInstance.schemas;
    console.log("   - Has 'schemas' property? " + (hasSchemas ? "✅ YES" : "❌ NO (This is the culprit)"));
    
    if (hasSchemas) {
       const methods = Object.keys(executorInstance.schemas);
       console.log("   - Registered Schemas: " + methods.join(', '));
       
       const targetMethod = 'listAvailableCosmos';
       const schema = executorInstance.schemas[targetMethod];
       
       if (schema) {
         console.log(`   - Schema for '${targetMethod}':`);
         console.log(`     - Exposure: '${schema.exposure}'`);
         console.log(`     - Semantic Intent: '${schema.semantic_intent}'`);
         
         const isExposed = schema ? schema.exposure !== 'internal' : false;
         console.log(`   - Is Exposed (!= internal)? ${isExposed}`);
       } else {
         console.error(`❌ Method '${targetMethod}' missing from schemas.`);
       }
    }

    // 4. Run the Actual Gatekeeper Logic
    const verdict = projectionKernel.isMethodExposed(executionStack, 'cosmos', 'listAvailableCosmos');
    console.log("⚖️ PROJECTION KERNEL VERDICT: " + verdict);
    
    if (verdict === true) {
        console.log("✅ LOGIC DIAGNOSIS: The server code IS correct. Any failure is strictly deployment staleness.");
    } else {
        console.log("❌ LOGIC DIAGNOSIS: The server code logic FAILS locally.");
    }

  } catch (e) {
    console.error("💥 SYSTEM FAILURE DURING DIAGNOSTIC: " + e.message);
    console.error(e.stack);
  }
}
