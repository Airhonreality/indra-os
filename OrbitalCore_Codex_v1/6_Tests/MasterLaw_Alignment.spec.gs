/**
 * 🧪 MasterLaw_Alignment.spec.gs
 * 
 * Verifies the L2 Alignment Test by auditing the gap between MasterLaw and UIMasterLaw.
 */

function testMasterLaw_Alignment_Diagnostic() {
    console.log("--- 🧪 DIAGNÓSTICO L2: Alineamiento de Leyes ---");
    
    try {
        const audit = MasterLaw_Alignment.logReport();
        
        // Assertions para CI/CD
        if (audit.coverage < 50) {
            throw new Error(`CRITICAL: Cobertura de alineamiento inaceptable (${audit.coverage}%).`);
        }
        
        if (!audit.isAligned) {
            console.warn("⚠️ ALERTA: Existen brechas entre el Genotipo (Core) y el Fenotipo (UI).");
            console.log("Acción requerida: Actualizar UIMasterLaw.gs con los nuevos arquetipos.");
        } else {
            console.log("✅ Sistema 100% Alineado.");
        }
        
    } catch (e) {
        console.error("❌ FALLO EN EL TEST DE ALINEAMIENTO:", e.message);
        throw e;
    }
}
