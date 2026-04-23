/**
 * =============================================================================
 * 🕵️ INDRA DIAGNOSTIC PROBE: ATOM IDENTITY AUDIT & REPAIR (v1.1)
 * =============================================================================
 * PROPÓSITO: Analizar y REPARAR etiquetas corruptas en el Workspace.
 * DETERMINISMO: Realiza una curación manual de una sola vez hacia el Workspace.
 * =============================================================================
 */

function AUDIT_SATELLITE_PINS() {
  const WORKSPACE_ID = "103MitQudDSMinRzzMLuzkWKmPN7UaDNr"; // Tu contexto actual
  const AUTO_FIX_LEGACY_NAMES = true; // <--- SEGUNDA OPORTUNIDAD: SANAR MATERIA
  
  console.log("🚀 [Sonda:Auditoría] Iniciando escaneo y REPARACIÓN en Workspace: " + WORKSPACE_ID);
  
  try {
    const wsFile = _system_findAtomFile(WORKSPACE_ID);
    const wsDoc = JSON.parse(wsFile.getBlob().getDataAsString());
    const pins = wsDoc.pins || [];
    let needsRepair = false;
    
    console.log("📊 [Sonda] Total de PINES detectados: " + pins.length);
    const pinIds = pins.map(p => p.id);
    const ledgerSnapshot = _ledger_get_batch_metadata_(pinIds) || {};
    
    console.log("--- REPORTE DE INTERVENCIÓN ---");
    
    pins.forEach((pin, index) => {
      const lMeta = ledgerSnapshot[pin.id];
      let currentLabel = pin.handle ? pin.handle.label : 'N/A';
      const ledgerLabel = lMeta ? lMeta.label : 'NO_EN_LEDGER';
      
      const isTechnical = (currentLabel === pin.id) || (currentLabel && currentLabel.length > 20 && !currentLabel.includes(' '));
      
      console.log(`[${index + 1}] ID-CORE: ${pin.id.substring(0, 8)}...`);
      
      if (isTechnical && AUTO_FIX_LEGACY_NAMES) {
        console.log(`    ⚠️ [!] Nombre detectado como ID. Iniciando Recuperación de ADN...`);
        try {
          const f = DriveApp.getFileById(pin.id);
          const dna = JSON.parse(f.getBlob().getDataAsString());
          const realName = dna.handle?.label || dna.label;
          
          if (realName && realName !== currentLabel) {
            console.log(`    ✅ [!] ADN RECONSTRUIDO: "${realName}"`);
            pin.handle = pin.handle || {};
            pin.handle.label = realName;
            needsRepair = true;
          }
        } catch(e) {
          console.log(`    ❌ [!] ADN IRRECUPERABLE: ${e.message}`);
        }
      } else {
        console.log(`    ✅ MATERIA ESTABLE: "${currentLabel}"`);
      }
      console.log("-----------------------------------------");
    });

    if (needsRepair) {
      console.log("💾 [Sonda] Sellando cambios de reparación en el Workspace...");
      wsFile.setContent(JSON.stringify(wsDoc, null, 2));
      console.log("✨ [Sonda] ¡Materia sanada con éxito! Ya puedes borrar esta sonda.");
    } else {
      console.log("💎 [Sonda] No se encontraron contaminaciones. Equilibrio total.");
    }
    
  } catch (err) {
    console.error("❌ [Sonda] FALLO CRÍTICO: " + err.message);
    console.error(err.stack);
  }
}
