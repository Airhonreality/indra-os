/**
 * ═══════════════════════════════════════════════════════════════════════
 * SYSTEM_HEALTH_AUDIT (V12.0) - "EL JUICIO DE LA MATERIA"
 * ═══════════════════════════════════════════════════════════════════════
 * DHARMA: Auditoría Integral de Sincronía, Dependencias y Salud Atómica.
 * 
 * PROPÓSITO:
 *   - Detectar "Código Zombie" (lógica obsoleta).
 *   - Verificar integridad de inyectores de Capa 8.
 *   - Validar normalización de retornos de Sincronía (_revisionHash).
 *   - Asegurar salud del "Nuevo Orden" post-unificación.
 */

function runSystemHealthAudit() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   🛡️  SYSTEM HEALTH AUDIT V12.0 - "EL JUICIO DE LA MATERIA"  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const audit = {
    zombies: [],
    dependencies: [],
    temporal_health: [],
    coherence: 0
  };

  const assembler = createSystemAssembler();
  const stack = assembler.assembleServerStack();

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 1: DETECCIÓN DE NIGROMANCIA (ZOMBIES)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('🧪 [FASE 1] Detección de Nigromancia...\n');

  // 1.1 Verificación de SchemaRegistry (Obsoleto)
  const hasGhostRegistry = (typeof SchemaRegistry !== 'undefined');
  _logStatus('ZOMBIE_REGISTRY', !hasGhostRegistry, 
    hasGhostRegistry ? 'DETECTADO: SchemaRegistry aún vive en el scope global.' : 'Limpio: SchemaRegistry no detectado.');
  if (hasGhostRegistry) audit.zombies.push("SchemaRegistry persists in global scope.");

  // 1.2 Verificación de Nomenclatura en PublicAPI
  const publicApi = stack.public;
  const legacyMethods = Object.keys(publicApi.schemas).filter(k => k.includes('SchemaRegistry'));
  _logStatus('LEGACY_SCHEMAS', legacyMethods.length === 0, 
    legacyMethods.length === 0 ? 'Limpio: No hay esquemas de registro legacy.' : `DETECTADO: ${legacyMethods.length} métodos legacy en API.`);

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 2: FRACTURAS DE ACOPLAMIENTO
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n🔌 [FASE 2] Fracturas de Acoplamiento...\n');

  // 2.1 Blindaje del Engine Cosmos
  const cosmosValidator = stack.nodes.cosmos && stack.nodes.cosmos.validator;
  _logStatus('COSMOS_BLINDAJE', !!cosmosValidator, 
    cosmosValidator ? 'Alineado: CosmosEngine tiene acceso al Validador (L8).' : 'FRACTURA: CosmosEngine está CIEGO ante el Validador.');

  // 2.2 Blindaje del ISK (Spatial)
  const iskValidator = stack.nodes.isk && stack.nodes.isk.validator;
  _logStatus('ISK_BLINDAJE', !!iskValidator, 
    iskValidator ? 'Alineado: ISK Proyector tiene acceso al Validador (L8).' : 'FRACTURA: ISK Proyector está CIEGO (Sin validación espacial).');

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 3: PULSO DEL NUEVO ORDEN (TEMPORAL)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n⏳ [FASE 3] Pulso del Nuevo Orden...\n');

  // 3.1 Verificación de Retornos Sincrónicos
  const cosmos = stack.nodes.cosmos;
  const testResponse = cosmos.deleteCosmos ? { success: true } : null; // Simulación lógica
  
  // Verificamos si los métodos clave están preparados para devolver _revisionHash
  // Nota: No ejecutamos delete real, solo validamos la firma y contrato si fuera posible, 
  // pero ya los refactorizamos. Aquí auditamos que los esquemas reflejen el cambio.
  const patchSchema = cosmos.schemas.applyPatch;
  const hasHashOutput = patchSchema && patchSchema.io_interface && patchSchema.io_interface.outputs && 
                        (patchSchema.io_interface.outputs._revisionHash || patchSchema.io_interface.outputs.new_revision_hash);
  
  _logStatus('SYNC_CONTRACT_VALID', !!hasHashOutput, 
    hasHashOutput ? 'Alineado: Contrato de Patch contempla el sello de revisión.' : 'DESALINEADO: El contrato no expone el hash de revisión.');


  // ═══════════════════════════════════════════════════════════════════════
  // RESUMEN
  // ═══════════════════════════════════════════════════════════════════════
  const total = 5;
  const passed = [!hasGhostRegistry, legacyMethods.length === 0, !!cosmosValidator, !!iskValidator, !!hasHashOutput].filter(v => v).length;
  const coherence = Math.round((passed / total) * 100);

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log(`║   📈 ÍNDICE DE SALUD: ${coherence}%                             ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // ═══════════════════════════════════════════════════════════════════════
  // FASE 4: BURST MODE INFRASTRUCTURE (V8.4+)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n🌐 [FASE 4] Burst Mode Infrastructure Audit...\n');
  
  // Run comprehensive burst mode tests
  if (typeof RUN_ALL_Burst_Tests === 'function') {
    const burstResults = RUN_ALL_Burst_Tests();
    const burstCoherence = Math.round((burstResults.passedCount / burstResults.totalCount) * 100);
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log(`║   🌐 BURST MODE COHERENCE: ${burstCoherence}%                        ║`);
    console.log(`║   Tests Passed: ${burstResults.passedCount}/${burstResults.totalCount}                                  ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    // Update overall coherence
    const overallCoherence = Math.round((coherence + burstCoherence) / 2);
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log(`║   🎯 OVERALL SYSTEM COHERENCE: ${overallCoherence}%                    ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  } else {
    console.log('   ⚠️  Burst Mode tests not available. Run BURST_MODE_AUDIT.gs separately.');
  }
}

function _logStatus(id, passed, msg) {
  console.log(`   ${passed ? '✅' : '❌'} [${id}] ${msg}`);
}
