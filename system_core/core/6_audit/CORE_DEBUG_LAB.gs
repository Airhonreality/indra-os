/**
 * =============================================================================
 * ARTEFACTO: 6_audit/CORE_DEBUG_LAB.gs
 * RESPONSABILIDAD: Diagnóstico profundo de estado interno y soberanía.
 * =============================================================================
 */

function SONDA_INTERNA_IDENTIDAD() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const activeEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  const systemState = SystemStateManager.getState();
  
  console.log("=== 🧪 SONDA DE IDENTIDAD INDRA v7.1 ===");
  console.log("1. INTERFAZ DE SESIÓN:");
  console.log("   - Email Ejecutor: " + activeEmail);
  console.log("   - Rol detectado: " + (activeEmail === props['SYS_CORE_OWNER_UID'] ? "SOVEREIGN" : "EXTERNAL"));
  
  console.log("\n2. ANCLAJE SOBERANO:");
  console.log("   - SYS_CORE_OWNER_UID: " + (props['SYS_CORE_OWNER_UID'] || "⚠️ NO REGISTRADO"));
  console.log("   - SYS_CORE_STATE:     " + systemState + " (" + SystemStateManager.getLabel(systemState) + ")");
  
  console.log("\n3. INFRAESTRUCTURA:");
  console.log("   - Master Ledger ID:   " + (props['SYS_MOUNT_ROOT_ID'] || "⚠️ SIN CRISTALIZAR"));
  console.log("   - WebApp URL (HEAD):  " + ScriptApp.getService().getUrl());
  
  console.log("\n4. DIAGNÓSTICO ESTRUCTURAL:");
  if (!props['SYS_CORE_OWNER_UID']) {
    console.error("❌ ERROR: El sistema es un huérfano digital. Ejecuta INDRA_MANUAL_GENESIS.");
  } else if (!props['SYS_MOUNT_ROOT_ID']) {
    console.error("❌ ERROR: El sistema no tiene territorio (Ledger). Ejecuta INDRA_MANUAL_GENESIS.");
  } else {
    console.log("✅ SISTEMA NOMINAL: El núcleo está listo para sincronizar con el Nexo.");
  }
  console.log("========================================");
}
