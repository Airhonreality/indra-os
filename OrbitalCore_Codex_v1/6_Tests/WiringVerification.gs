/**
 * 🧪 6_Tests/WiringVerification.gs
 * 
 * DHARMA: Test de Verificación de Cableado Total (End-to-End).
 *         Valida el Handshake, la recuperación de Leyes y la validación L5.
 */

function testIntegration_Wiring() {
  console.log('='.repeat(80));
  console.log('🛰️  INDRA SYSTEM: TOTAL WIRING VERIFICATION (V11.0)');
  console.log('='.repeat(80));

  const stack = _assembleExecutionStack();
  const publicApi = stack.public;

  try {
    // 1. PHASE L1: Neural Handshake (Disponibilidad básica)
    console.log('\n📡 [Phase L1] Testing Neural Handshake...');
    const status = publicApi.getSystemStatus();
    assert.areEqual('healthy', status.status, 'Handshake must result in healthy status.');
    console.log('   ✅ Status: Healthy');
    console.log(`   ✅ Version: ${status.version}`);

    // 2. PHASE L2: Structural Laws (Handshake de Diseño)
    console.log('\n🏗️  [Phase L2] Testing Structural Laws Retrieval...');
    const laws = publicApi.getSovereignLaws();
    assert.isDefined(laws.laws, 'Sovereign laws must be defined.');
    assert.isDefined(laws.laws.SPATIAL_ENGINE, 'Spatial laws missing - Front-end will fail to render.');
    assert.isDefined(laws.laws.VISUAL_GRAMMAR, 'Phenotype laws missing - Styling will fail.');
    console.log('   ✅ Laws recovered: ' + Object.keys(laws.laws).join(', '));

    // 3. PHASE L3: Morphism Validation (L5+ Wiring)
    console.log('\n🧬 [Phase L3] Testing Morphism Validation (Dry Run)...');
    const sampleFlow = {
      nodes: {
        "n1": { instanceOf: "drive", method: "retrieve", label: "Source" },
        "n2": { instanceOf: "sheet", method: "store", label: "Sink" }
      },
      connections: [
        { from: "n1", to: "n2", fromPort: "content", toPort: "data" } // Conexión hipotética válida
      ]
    };

    const validation = publicApi.validateTopology({ flow: sampleFlow });
    assert.isDefined(validation.isValid, 'Validation must return isValid field.');
    
    if (!validation.isValid) {
      throw new Error(`[Phase L3] Topology Validation FAILED: ${validation.error}`);
    }
    console.log('   ✅ Topology Validation: NOMINAL (Step sequence generated)');
    console.log(`   ✅ Compiled Steps: ${validation.steps.length}`);

    // 4. PHASE L4: Front-end Discovery Manifest
    console.log('\n🛠️  [Phase L4] Testing Front-end Distribution Site...');
    const distribution = publicApi.getDistributionSite();
    assert.isDefined(distribution.site, 'Distribution site must be defined.');
    assert.isDefined(distribution.site.perspectives, 'Site must provide UI perspectives.');
    console.log('   ✅ UI Perspectives: ' + Object.keys(distribution.site.perspectives).join(', '));

    console.log('\n' + '='.repeat(80));
    console.log('✅ SYSTEM CABLED: Total Wiring Verified.');
    console.log('='.repeat(80));
    return true;

  } catch (error) {
    console.error('\n❌ CABLE FAIL: ' + error.message);
    if (error.stack) console.error(error.stack);
    return false;
  }
}
