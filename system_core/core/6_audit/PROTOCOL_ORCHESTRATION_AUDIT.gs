/**
 * =============================================================================
 * ARTEFACTO: 6_audit/PROTOCOL_ORCHESTRATION_AUDIT.gs
 * RESPONSABILIDAD: Mapeo de la Jerarquía de Mando de Indra.
 * OBJETIVO: Identificar protocolos que puentean el Orquestador (Bypass).
 * =============================================================================
 */

function RUN_PROTOCOL_HEALTH_AUDIT() {
  const router = PROTOCOL_ROUTING_TABLE; // Accedemos al mapeo real del router
  const protocols = Object.keys(router);
  const report = [];

  logInfo(`\n🚀 INICIANDO AUDITORÍA DE JERARQUÍA (Protocolos: ${protocols.length})`);
  logInfo("------------------------------------------------------------------");

  protocols.forEach(protoCode => {
    const handler = router[protoCode];
    const handlerStr = handler.toString();
    
    // Análisis estático del despachador
    let orchestrationStatus = "❌ BYPASS (DIRECT)";
    let targetFunction = handlerStr.trim();

    if (handlerStr.includes("SystemOrchestrator.dispatch")) {
      orchestrationStatus = "✅ ORQUESTADO";
    }

    // Limpiar el string de la función (quitar flechas, paréntesis y espacios)
    targetFunction = targetFunction
      .replace(/^\(p\)\s*=>\s*/, "")
      .replace(/\(p\)$/, "")
      .replace(/^function\s*.*?\((.*?)\)\s*\{/, "")
      .trim();

    report.push({
      protocol: protoCode,
      status: orchestrationStatus,
      target: targetFunction
    });
  });

  // --- IMPRESIÓN DEL TABLERO DE SALUD ---
  console.log("==============================================================================");
  console.log("   ID PROTOCOLO             | ESTADO ORQUESTACIÓN     | DESTINO REAL         ");
  console.log("==============================================================================");
  
  report.forEach(r => {
    const p = r.protocol.padEnd(25);
    const s = r.status.padEnd(25);
    const t = r.target;
    console.log(`${p} | ${s} | ${t}`);
  });

  console.log("==============================================================================");
  
  const bypassCount = report.filter(r => r.status.includes("BYPASS")).length;
  const orchestratedCount = report.length - bypassCount;

  logInfo(`\n🏁 AUDITORÍA FINALIZADA`);
  logInfo(`- Protocolos Orquestados: ${orchestratedCount}`);
  logInfo(`- Protocolos en Bypass: ${bypassCount}`);
  
  if (bypassCount > 0) {
    logWarn(`⚠️ Se han detectado ${bypassCount} vectores de entropía (Bypass del Orquestador).`);
  } else {
    logSuccess("✨ Coherencia Axial Total: Todos los protocolos pasan por el Orquestador.");
  }
}
