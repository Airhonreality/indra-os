/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/protocol_resonance_sonde.gs
 * RESPONSABILIDAD: Auditoría de Resonancia Global para Cristalización Estática.
 * =============================================================================
 */

function SONDE_PROTOCOL_MAPPING_AUDIT() {
  const scope = globalThis || this;
  const registry = ProtocolRegistry.getRegistry();
  const protocols = Object.keys(registry);
  
  const report = {
    discovered: {},
    orphans: [],
    aliased: []
  };

  logInfo(`🚀 Iniciando Auditoría de Cristalización para ${protocols.length} protocolos...`);

  protocols.forEach(protocol => {
    // 1. Verificar si existe función global con nombre exacto
    if (typeof scope[protocol] === 'function') {
      report.discovered[protocol] = protocol;
    } 
    // 2. Verificar si es un protocolo heredado con alias en Orchestrator
    else {
      // Estos los mapearemos manualmente basándonos en el conocimiento del Orquestador
      report.orphans.push(protocol);
    }
  });

  // --- GENERACIÓN DEL MAPA ESTÁTICO (LOG PARA COPIAR) ---
  console.log("\n--- [ MAPA DE CRISTALIZACIÓN PROPUESTO ] ---");
  console.log("const PROTOCOL_MAP = Object.freeze({");
  
  protocols.forEach(p => {
    const handler = report.discovered[p] || "/* REQUIERE_ALIAS_MANUAL */";
    console.log(`  '${p}': ${handler},`);
  });
  
  console.log("});\n");

  logInfo(`✅ Auditoría finalizada.`);
  logInfo(`- Detectados: ${Object.keys(report.discovered).length}`);
  logInfo(`- Huérfanos/Aliados: ${report.orphans.length}`);
  
  if (report.orphans.length > 0) {
    logWarn(`⚠️ Protocolos huérfanos detectados: ${report.orphans.join(', ')}`);
  }
}
