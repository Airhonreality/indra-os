/**
 * =============================================================================
 * SONDA: 5_diagnostics/PROBE_INDUSTRIAL_STRESS_IGNITION.gs
 * RESPONSABILIDAD: Test de Alto Estrés y Trazabilidad Atómica del Ciclo de Ignición.
 * VERSIÓN: Omega (Industrial v2.0)
 * =============================================================================
 */

function PROBE_STRESS_IGNITE_MASTER() {
  const TEST_SOURCE_ID = '18db5567-ba71-81eb-beec-eb3357b54863'; // Notion Catalog
  const TEST_TARGET_PROVIDER = 'sheets';
  const ITERATIONS = 3; // Nivel de estrés (Gas tiene límites de tiempo)

  const probeResults = [];
  const debris = []; // Almacén de basura espacial para purga final
  
  console.log("🚀 [PROBE:OMEGA] Iniciando Test de Estrés Ferroviario (Notion -> Core -> Sheets)");
  console.log("--------------------------------------------------------------------------------");

  for (let i = 1; i <= ITERATIONS; i++) {
    const iterationStart = Date.now();
    console.log(`\n💎 [ITERACIÓN ${i}/${ITERATIONS}] Disparando Ignición Soberana...`);

    try {
      const uqo = {
        provider: 'automation',
        protocol: 'INDUSTRIAL_IGNITE',
        data: {
          source_id: TEST_SOURCE_ID,
          target_provider: TEST_TARGET_PROVIDER,
          mode: 'PROBE_DEBUG_IGNITION',
          publish_immediately: true
        }
      };

      const startTime = Date.now();
      const response = route(uqo);
      const endTime = Date.now();

      const duration = endTime - startTime;
      const status = response.metadata?.status;
      const ticketId = response.metadata?.ticket_id;

      if (status === 'OK') {
        const universe = response.metadata.universe || {};
        console.log(`✅ [OK] Ignición lograda en ${duration}ms.`);
        console.log(`   🏗️ Universo: [Schema: ${universe.schema_id}] -> [Silo: ${universe.silo_id}]`);
        
        // Registrar para purga
        debris.push({ id: universe.schema_id, provider: 'system' });
        debris.push({ id: universe.bridge_id, provider: 'system' });
        debris.push({ id: universe.silo_id, provider: TEST_TARGET_PROVIDER });

        // Verificación de Integridad
        const bridgeCheck = route({ provider: 'system', protocol: 'ATOM_READ', context_id: universe.bridge_id });
        const mappings = bridgeCheck.items?.[0]?.payload?.mappings || {};
        const mappingCount = Object.keys(mappings[universe.silo_id] || {}).length;
        
        probeResults.push({ i, duration, status: 'SUCCESS', mappingCount });
      } else {
        console.error(`❌ [FAIL] Colapso en la ignición: ${response.metadata?.error}`);
        probeResults.push({ i, duration, status: 'FAILED', error: response.metadata?.error });
      }
    } catch (err) {
      console.error(`🚨 [CRASH] Error Fatal en la Sonda: ${err.message}`);
      probeResults.push({ i, duration: 0, status: 'CRASH', error: err.message });
    }
  }

  // --- REPORTE DE TELEMETRÍA FINAL ---
  console.log("\n================================================================================");
  console.log("📊 RESUMEN DE TELEMETRÍA INDUSTRIAL");
  console.log("================================================================================");
  const totalDuration = probeResults.reduce((acc, r) => acc + r.duration, 0);
  const avgDuration = (totalDuration / probeResults.length).toFixed(2);
  const successRate = (probeResults.filter(r => r.status === 'SUCCESS').length / ITERATIONS) * 100;

  console.log(`⚡ Tiempo Promedio de Ignición: ${avgDuration}ms`);
  console.log(`📈 Tasa de Éxito de Cristalización: ${successRate}%`);
  console.log(`🧱 Carga Total de Datos Procesada: ${probeResults.reduce((acc, r) => acc + (r.mappingCount || 0), 0)} ADN_FIELDS`);

  // --- FASE DE PURGA ATMOSFÉRICA (Zero Footprint) ---
  if (debris.length > 0) {
    console.log("\n🧹 [PROBE:PURGE] Iniciando limpieza de basura espacial...");
    debris.forEach(item => {
      try {
        route({
          provider: item.provider,
          protocol: 'ATOM_DELETE',
          context_id: item.id
        });
        console.log(`   🗑️  Eliminado: [${item.provider}] ${item.id}`);
      } catch (e) {
        console.warn(`   ⚠️  Fallo al purgar ${item.id}: ${e.message}`);
      }
    });
    console.log("✨ Sistema limpio. Sin rastro de entropía.");
  }
  console.log("\n================================================================================");
  console.log("📊 RESUMEN DE TELEMETRÍA INDUSTRIAL");
  console.log("================================================================================");
  const totalDuration = probeResults.reduce((acc, r) => acc + r.duration, 0);
  const avgDuration = (totalDuration / probeResults.length).toFixed(2);
  const successRate = (probeResults.filter(r => r.status === 'SUCCESS').length / ITERATIONS) * 100;

  console.log(`⚡ Tiempo Promedio de Ignición: ${avgDuration}ms`);
  console.log(`📈 Tasa de Éxito de Cristalización: ${successRate}%`);
  console.log(`🧱 Carga Total de Datos Procesada: ${probeResults.reduce((acc, r) => acc + (r.mappingCount || 0), 0)} ADN_FIELDS`);
  console.log("================================================================================");
}
