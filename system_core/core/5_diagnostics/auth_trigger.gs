/**
 * FUNCIÓN DE FUERZA BRUTA DE AUTORIZACIÓN (ADR-018)
 * Ejecuta esto desde el editor de Google Apps Script para forzar el diálogo de permisos OAuth.
 */
function INDRA_FORCE_AUTHORIZE_V2() {
  console.log("--- INICIANDO PROTOCOLO DE AUTORIZACIÓN INDRA ---");
  
  try {
    // 1. Forzar Scope de Triggers
    const triggers = ScriptApp.getProjectTriggers();
    console.log("Llave de Triggers: OK (Encontrados: " + triggers.length + ")");
    
    // 2. Forzar Scope de Drive
    const root = DriveApp.getRootFolder();
    console.log("Llave de Drive: OK (Acceso a " + root.getName() + ")");
    
    // 3. Forzar Scope de Identity
    const email = Session.getActiveUser().getEmail();
    console.log("Llave de Identidad: OK (" + email + ")");
    
    console.log("--- PROTOCOLO COMPLETADO: TODAS LAS CLAVES ESTÁN ACTIVAS ---");
  } catch (e) {
    console.error("--- ERROR DE AUTORIZACIÓN ---");
    console.error(e.message);
    throw e;
  }
}
