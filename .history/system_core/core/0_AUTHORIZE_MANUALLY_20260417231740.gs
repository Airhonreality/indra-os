/**
 * 🛰️ PROTOCOLO DE IGNICIÓN MANUAL - INDRA OS
 * ==========================================
 * 
 *    /$$$$$$ / /$$   /$$ /$$$$$$$  /$$$$$$$   /$$$$$$         /$$$$$$   /$$$$$$ 
 *   |_  $$_/|/| $$$ | $$| $$__  $$| $$__  $$ /$$__  $$       /$$__  $$ /$$__  $$
 *     | $$    | $$$$| $$| $$  \ $$| $$  \ $$| $$  \ $$      | $$  \__/| $$  \__/
 *     | $$    | $$ $$ $$| $$  | $$$$$$$/| $$$$$$$$      |  $$$$$$ |  $$$$$$ 
 *     | $$    | $$  $$$$| $$  | $$| $$__  $$| $$__  $$       \____  $$ \____  $$
 *     | $$    | $$\  $$$| $$  | $$| $$  \ $$| $$  | $$       /$$  \ $$ /$$  \ $$
 *    /$$$$$$ /| $$ \  $$| $$$$$$$/| $$  | $$| $$  | $$      |  $$$$$$/|  $$$$$$/
 *   |______/|/|__/  \__/|_______/ |__/  |__/|__/  |__/       \______/  \______/ 
 *                                                                             ☀️
 *   <<<< PASO CRÍTICO: HAZ CLIC EN EL BOTÓN [ ▶️ Ejecutar ] EN LA BARRA DE ARRIBA >>>>
 *   ( Protocolo de Despertar Manual - Soberanía Fractal )
 * 
 *ESTE ES EL NUCLEO DE TU INDRA OS*
 * Es en este proyecto GAS donde se aloja el codigo que orquesta los procesos de Indra gracias a la infraestructura de macros de Google Apps Script.   
 * 
 * COMO TU ERES EL DUEÑO DE TUS DATOS Y DE ESTE SISTEMA DEBES DESPERTAR A INDRA MANUALMENTE:
 * 1. Mira hacia arriba ↑. Selecciona la función 'INDRA_MANUAL_GENESIS' en el selector.
 * 2. Haz clic en el botón GRANDE [▶️ Ejecutar].
 * 3. Aparecerá un cuadro de "Revisar permisos". ACÉPTALOS TODOS.
 * 4. Espera a que termine la ejecución (verás el log de éxito abajo).
 * 5. Vuelve al Nexo (Frontend) y recarga la página.
 */

function INDRA_MANUAL_GENESIS() {
  console.log("☄️ Iniciando proceso de alta prioridad...");
  
  try {
    // 1. RECONOCIMIENTO DE SOBERANÍA (Anclaje Inmediato)
    const email = Session.getEffectiveUser().getEmail();
    PropertiesService.getScriptProperties().setProperty('SYS_CORE_OWNER_UID', email);
    console.log("✅ Soberanía de Sangre reconocida para: " + email);

    // 2. ACTIVACIÓN FÍSICA (Trigger de Permisos Google)
    console.log("🛰️ Sincronizando territorio en Drive...");
    DriveApp.getRootFolder(); // Fuerza el diálogo de permisos
    
    // 3. EJECUCIÓN DEL RENACIMIENTO
    console.log("🧬 Iniciando secuencia de Génesis (Renaissance)...");
    SystemOrchestrator.triggerRenaissance();
    
    console.log("\n✨ RESULTADO DE IGNICIÓN ✨");
    console.log("===========================");
    console.log("✅ INDRA HA DESPERTADO EXITOSAMENTE.");
    console.log("El Master Ledger ha sido cristalizado y el dueño ha sido coronado.");
    console.log("");
    console.log("🚀 PASO FINAL: Vuelve a tu Nexo (Frontend) y recarga la página.");
    console.log("===========================");

  } catch (e) {
    console.error("❌ ERROR CRÍTICO EN IGNICIÓN: " + e.message);
    if (e.message.indexOf('not authorized') !== -1 || e.message.indexOf('permission') !== -1) {
      console.error("⚠️ PERMISOS PENDIENTES: Debes aceptar los permisos en el cuadro emergente para que Indra pueda nacer.");
    } else {
      console.error("Stack Trace:\n" + e.stack);
    }
    throw e; // Lanzar el error para que GAS lo marque en rojo
  }
}
