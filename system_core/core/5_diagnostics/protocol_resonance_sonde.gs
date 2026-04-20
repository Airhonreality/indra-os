/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/protocol_resonance_sonde.gs
 * RESPONSABILIDAD: Auditoría de Resonancia Global para Cristalización Estática.
 * =============================================================================
 */

function SONDE_PROTOCOL_RESONANCE_AUDIT() {
  const registry = ProtocolRegistry.getRegistry();
  const protocols = Object.keys(registry);
  const routing = PROTOCOL_ROUTING_TABLE;
  
  const report = {
    total: protocols.length,
    crystallized: [],
    orphans: [],
    dead_links: []
  };

  logInfo(`🚀 Iniciando Auditoría de Resonancia Axiomática (${report.total} protocolos)...`);

  protocols.forEach(protocol => {
    const handler = routing[protocol];
    
    if (!handler) {
      report.orphans.push(protocol);
    } else if (typeof handler !== 'function') {
      report.dead_links.push(protocol);
    } else {
      report.crystallized.push(protocol);
    }
  });

  // --- RESULTADOS ---
  console.log("\n--- [ REPORTE DE CRISTALIZACIÓN ] ---");
  console.log(`✅ CRISTALIZADOS: ${report.crystallized.length}`);
  console.log(`❌ HUÉRFANOS:      ${report.orphans.length}`);
  console.log(`⚠️ LINKS MUERTOS:  ${report.dead_links.length}`);

  if (report.orphans.length > 0) {
    logError("🚨 ALERTA: Protocolos registrados pero no cristalizados:");
    report.orphans.forEach(p => console.log(`   - ${p}`));
  }

  if (report.dead_links.length > 0) {
    logError("🚨 ALERTA: Referencias corruptas en el mapa estático:");
    report.dead_links.forEach(p => console.log(`   - ${p}`));
  }

  if (report.orphans.length === 0 && report.dead_links.length === 0) {
    logSuccess("🏆 INDRA OS: RESONANCIA PERFECTA. La soberanía ha sido cristalizada.");
  }
}
