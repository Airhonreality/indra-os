/**
 * 6_Tests/Sovereignty_Tests.gs
 * Version: 1.0.0-STARK
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
    const seeds = stack.public.getSimulationSeeds();
    
    // En entorno de ejecución de tests (_monitor.isTestEnv debe ser true), getSimulationSeeds debe devolver data
    if (!seeds.genotype || !seeds.genotype.IS_SIMULATION) {
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

/**
 * Entry point for Law Suite
 */
function RunSovereigntyTests() {
    testSovereignLaws_Availability();
    testSovereignStack_Hydration();
    testSovereignSeeds_SimulationSecurity();
    testSovereignLaws_Hierarchy();
}
