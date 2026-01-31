/**
 * 🔬 BRUTAL SYSTEM INTEGRITY & CONTRACT DISCOVERY TEST
 * --------------------------------------------------
 * This test identifies why nodes are missing from the Bridge Panel
 * and checks if contracts are actually fulfilled at runtime.
 */

function testSystemIntegrityAudit() {
    console.log("=== 🔬 BRUTAL SYSTEM INTEGRITY AUDIT ===");

    const stack = _assembleExecutionStack();
    const nodes = stack.nodes;
    const projectionKernel = stack.projectionKernel;
    const projection = projectionKernel.getProjection(stack);

    const results = {
        total_nodes: 0,
        has_schemas: 0,
        missing_schemas: [],
        broken_contracts: [],
        projection_coverage: 0,
        contract_keys: Object.keys(projection.contracts)
    };

    // 1. Audit the Nodes Registry
    const nodeKeys = Object.keys(nodes).filter(k =>
        typeof nodes[k] === 'object' &&
        nodes[k] !== null &&
        !Array.isArray(nodes[k]) &&
        k !== 'label' && k !== 'description' && k !== 'semantic_intent' && k !== 'schemas' && k !== 'getAllNodes'
    );

    results.total_nodes = nodeKeys.length;
    console.log(`Found ${nodeKeys.length} nodes in Registry`);

    nodeKeys.forEach(key => {
        const node = nodes[key];
        const hasSchemas = !!(node.schemas && Object.keys(node.schemas).length > 0);

        if (hasSchemas) {
            results.has_schemas++;
            // Check if methods in schema exist in object
            const missingMethods = Object.keys(node.schemas).filter(m => typeof node[m] !== 'function');
            if (missingMethods.length > 0) {
                results.broken_contracts.push({ node: key, missing: missingMethods });
            }
        } else {
            results.missing_schemas.push(key);
        }
    });

    // 2. Audit Projection Kernel Logic
    console.log("\n--- Projection Coverage Analysis ---");
    console.log(`Projection contains keys: ${JSON.stringify(results.contract_keys)}`);

    // 3. Audit PublicAPI getSystemContracts (The source for the UI)
    const contracts = stack.public.getSystemContracts();
    const contractKeys = Object.keys(contracts);
    console.log(`\nPublicAPI.getSystemContracts() returns ${contractKeys.length} items`);

    // Final Report
    console.log("\n=== FINAL REPORT ===");
    console.log(`✅ Nodes with Schemas: ${results.has_schemas}/${results.total_nodes}`);

    if (results.missing_schemas.length > 0) {
        console.log(`❌ NODES MISSING SCHEMAS: ${results.missing_schemas.join(", ")}`);
    }

    if (results.broken_contracts.length > 0) {
        console.log(`❌ BROKEN CONTRACTS (Schema defines method, but code is missing):`);
        results.broken_contracts.forEach(bc => {
            console.log(`  - ${bc.node}: missing [${bc.missing.join(", ")}]`);
        });
    }

    // Verification of why they are missing from UI
    const uiExcluded = ['public', 'config', 'monitoring', 'sensing', 'metabolism', 'adminTools', 'errorHandler', 'keyGenerator', 'sheetAdapter', 'driveAdapter', 'tokenManager', 'renderEngine', 'orchestrator', 'cipherAdapter', 'schemaregistry', 'calendaradapter', 'connectiontester'];
    const visible = contractKeys.filter(k => !uiExcluded.includes(k.toLowerCase()));
    console.log(`\nPotential visible nodes in UI: ${visible.length}`);
    console.log(`Actual UI visible nodes: ${visible.join(", ")}`);

    if (results.missing_schemas.length > 0) {
        throw new Error(`Integrity Audit Failed: ${results.missing_schemas.length} nodes missing schemas.`);
    }
}
