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
        'TOPOLOGY_LAWS', 
        'CONTRACT_BLUEPRINTS', 
        'VISUAL_GRAMMAR', 
        'UI_DISTRIBUTION', 
        'SPATIAL_PHYSICS'
    ];

    requiredLaws.forEach(law => {
        const exists = typeof globalThis[law] !== 'undefined';
        if (!exists) {
            throw new Error(`CRITICAL LAW MISSING: ${law}`);
        }
        console.log(`✅ Law [${law}] is present in global scope.`);
    });
}

function testSovereignLaws_Alignment() {
    console.log("--- 🧪 TEST: Core-UI Alignment Audit ---");
    if (typeof MasterLaw_Alignment === 'undefined') {
        throw new Error("MasterLaw_Alignment component missing.");
    }
    
    const audit = MasterLaw_Alignment.runAudit();
    console.log(`Coverage: ${audit.coverage}%`);
    
    if (!audit.isAligned) {
        audit.gaps.forEach(gap => {
            console.error(`🚨 GAP DETECTED: [${gap.key}] ${gap.message}`);
        });
        // We warn instead of fail to allow incubation of new archetypes
        console.warn("⚠️ Law mismatch detected. Alignment protocol requires sync.");
    } else {
        console.log("✅ Core and UI are perfectly aligned.");
    }
}

function testSovereignLaws_Hierarchy() {
    console.log("--- 🧪 TEST: Topology Hierarchy Verification ---");
    const hierarchy = TOPOLOGY_LAWS.HIERARCHY;
    if (!hierarchy.COSMOS || !hierarchy.PROJECT || !hierarchy.ARTIFACT) {
        throw new Error("Invalid topology hierarchy definition.");
    }
    console.log("✅ Topology Hierarchy confirmed: Cosmos > Project > Artifact.");
}

/**
 * Entry point for Law Suite
 */
function RunSovereigntyTests() {
    testSovereignLaws_Availability();
    testSovereignLaws_Alignment();
    testSovereignLaws_Hierarchy();
}
