/**
 * 6_Tests/Sovereignty_Tests.gs
 * Version: 14.5.0-SOVEREIGN
 * Dharma: Law Integrity Suite. Verifies the 0_Laws layer independently.
 */

function testSovereignLaws_Availability() {
    console.log("--- 🧪 TEST: Availability of 0_Laws ---");
    const requiredLaws = [
        'SYSTEM_CONSTITUTION', 
        'LOGIC_AXIOMS', 
        'SYSTEM_HIERARCHY'
    ];

    requiredLaws.forEach(law => {
        const exists = typeof globalThis[law] !== 'undefined';
        if (!exists) {
            throw new Error(`CRITICAL LAW MISSING: ${law}`);
        }
        console.log(`✅ Law [${law}] is present in global scope.`);
    });
}

function testSovereignStack_Hydration() {
    console.log("--- 🧪 TEST: Component Hydration Audit (L0 -> L1) ---");
    const stack = _assembleExecutionStack();
    const nodes = stack.nodes.getAllNodes();
    
    Object.keys(nodes).forEach(key => {
        const node = nodes[key];
        if (node && typeof node === 'object') {
            const hasCanon = !!node.canon;
            const hasId = !!node.id;
            if (!hasCanon || !hasId) {
                throw new Error(`SOVEREIGNTY VIOLATION: Node '${key}' is not properly decorated with identity. Hydration failed.`);
            }
            console.log(`✅ Node [${key}] hydrated as ${node.archetype} (${node.label}).`);
        }
    });
}

function testSovereignSeeds_SimulationSecurity() {
    console.log("--- 🧪 TEST: Simulation Seeds Security Circuit ---");
    const stack = _assembleExecutionStack();
    // AXIOMA: getSimulationSeeds ya no es un wrapper directo. Se invoca polimórficamente.
    const res = stack.public.executeAction({ action: 'public:getSimulationSeeds' });
    const seeds = res.success ? res.payload : null;
    
    // En entorno de ejecución de tests (_monitor.isTestEnv debe ser true), getSimulationSeeds debe devolver data
    if (!seeds || !seeds.genotype || !seeds.genotype.IS_SIMULATION) {
        throw new Error("SECURITY_BYPASS: Simulation seeds should be accessible and tagged as SIMULATION during tests.");
    }
    console.log("✅ Simulation seeds are correctly tagged and accessible in test scope.");
}

function testSovereignLaws_Hierarchy() {
    console.log("--- 🧪 TEST: Topology Hierarchy Verification ---");
    const h = SYSTEM_HIERARCHY.TYPES || SYSTEM_HIERARCHY;
    if (!h.ROOT || !h.DIRECTORY || !h.FILE) {
        throw new Error("Invalid topology hierarchy definition: Must contain ROOT, DIRECTORY and FILE.");
    }
    console.log("✅ Topology Hierarchy confirmed: Root > Directory > Subdirectory > File.");
}

function testSovereign_RiskBasedAccess() {
    console.log("--- 🧪 TEST: Phase 2 - Risk-Based Security Check ---");
    const stack = assembleGenericTestStack(); // Usamos el helper de MockFactory para un stack estable
    const publicApi = stack.public;

    // 1. RISK LEVEL 1 (Read) -> Should PASS
    console.log("   🔍 Testing Risk Level 1 (Read)...");
    const res1 = publicApi.executeAction({ action: 'drive:listContents', payload: { folderId: 'ROOT' } });
    if (!res1.success && res1.error && res1.error.includes('SECURITY_BLOCK')) {
        throw new Error("FAIL: Risk Level 1 should NOT be blocked.");
    }
    console.log("   ✅ Level 1 Pass.");

    // 2. RISK LEVEL 3 (Delete) -> Should FAIL without confirmation
    console.log("   🔍 Testing Risk Level 3 (Delete) - Unauthorized...");
    const res2 = publicApi.executeAction({ action: 'drive:deleteItem', payload: { id: 'some_id' } });
    if (res2.success || !res2.error || !res2.error.includes('CRITICAL_RISK_SHIELD')) {
        throw new Error("FAIL: Risk Level 3 should be BLOCKED without confirmHighRisk flag.");
    }
    console.log("   ✅ Level 3 Blocked correctly.");

    // 3. RISK LEVEL 3 (Delete) -> Should PASS with confirmation
    console.log("   🔍 Testing Risk Level 3 (Delete) - Authorized...");
    const res3 = publicApi.executeAction({ 
        action: 'drive:deleteItem', 
        payload: { id: 'some_id', confirmHighRisk: true } 
    });
    
    if (res3.error && res3.error.includes('CRITICAL_RISK_SHIELD')) {
        throw new Error("FAIL: Risk Level 3 should NOT be blocked with confirmHighRisk: true.");
    }
    console.log("   ✅ Level 3 Authorized correctly (Passed security shield).");
}

/**
 * Entry point for Law Suite
 */
function RunSovereigntyTests() {
    testSovereignLaws_Availability();
    testSovereignStack_Hydration();
    testSovereignSeeds_SimulationSecurity();
    testSovereignLaws_Hierarchy();
    testSovereign_RiskBasedAccess();
}





