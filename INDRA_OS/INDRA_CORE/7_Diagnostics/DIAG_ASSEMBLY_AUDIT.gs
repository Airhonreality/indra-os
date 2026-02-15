/**
 * 🔗 DIAG_ASSEMBLY_AUDIT.gs (ADP - Pillar 2)
 * Version: 1.0.0
 * Dharma: Verificar la integridad del ExecutionStack y el despacho polimórfico.
 */

function diag_Assembly_Stack_Audit() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   🔗  AUDITORÍA DE ENSAMBLAJE Y DESPACHO (Capa 1/2)        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const report = {
    stackInjection: true,
    publicApiExposure: [],
    guardAuthorization: true,
    mcepCoherence: 0
  };

  const assembler = createSystemAssembler();
  const stack = assembler.assembleServerStack();

  // 1. Verificar Inyección Atómica
  // 1. Verificar Inyección Atómica
  console.log('🧪 [PASO 1] Verificando Inyección de Dependencias...');
  // CORRECCIÓN: Nombres actualizados para reflejar Arquitectura V12
  const criticalMap = {
    'public': 'public',
    'coreOrchestrator': 'coreOrchestrator',
    'validator': 'validator',
    'configurator': 'configurator',
    'errorHandler': 'errorHandler',
  };

  Object.keys(criticalMap).forEach(label => {
    const id = criticalMap[label];
    const exists = !!stack[id] || !!stack.nodes[id];
    if (!exists) {
      report.stackInjection = false;
      console.log(`   ❌ [${label}] (id: ${id}) NO inyectado en el stack.`);
    } else {
      console.log(`   ✅ [${label}] Inyectado.`);
    }
  });


  // 2. Verificar PublicAPI y Gateway
  console.log('\n🧪 [PASO 2] Verificando PublicAPI (Polymorphic Gateway)...');
  const publicApi = stack.public;
  if (typeof publicApi.executeAction !== 'function') {
    report.publicApiExposure.push('MISSING_EXECUTE_ACTION');
    console.log('   ❌ executeAction no disponible.');
  } else {
    console.log('   ✅ executeAction operativo.');
  }

  // Verificar exposición de capacidades via SovereignGuard
  const sampleMethod = 'drive:listContents';
  if (!publicApi.schemas[sampleMethod]) {
    report.publicApiExposure.push('CAPABILITY_NOT_EXPOSED');
    console.log(`   ⚠️ Capability ${sampleMethod} no expuesta en PublicAPI.`);
  }

  // 3. MCEP Manifest (AI-Ready Intelligence)
  console.log('\n🧪 [PASO 3] Auditoría de Manifiesto MCEP...');
  try {
    const manifest = publicApi.getMCEPManifest({ accountId: 'system' });
    const toolCount = manifest.tools ? (Array.isArray(manifest.tools) ? manifest.tools.length : Object.keys(manifest.tools).length) : 0;
    console.log(`   🧬 MCEP detectó ${toolCount} herramientas autorizadas.`);
    // AXIOMA: Umbral de Inteligencia Critica (>10 herramientas)
    report.mcepCoherence = toolCount >= 10 ? 100 : (toolCount / 10 * 100);
  } catch (e) {
    console.log(`   ❌ Error al obtener MCEP: ${e.message}`);
    report.mcepCoherence = 0;
  }

  const coherence = (report.stackInjection ? 40 : 0) + (report.publicApiExposure.length === 0 ? 30 : 0) + (report.mcepCoherence * 0.3);
  console.log(`\n📈 COHERENCIA DE ENSAMBLAJE: ${Math.round(coherence)}%`);
  return report;
}





