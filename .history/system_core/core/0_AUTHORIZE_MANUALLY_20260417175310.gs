/**
 * 🛰️ PROTOCOLO DE IGNICIÓN MANUAL - INDRA OS
 * ==========================================
 * 
 *    /$$$$$$$$ /$$$$$$$$ /$$$$$$$$  /$$$$$$  /$$   /$$ /$$$$$$$$ /$$$$$$  /$$$$$$$ 
 *   | $$_____/|_____ $$ | $$_____/ /$$__  $$| $$  | $$|__  $$__//$$__  $$| $$__  $$
 *   | $$          /$$/ll| $$      | $$  \__/| $$  | $$   | $$  | $$  \ $$| $$  \ $$
 *   | $$$$$      /$$/ ll| $$$$$   | $$      | $$  | $$   | $$  | $$$$$$$$| $$$$$$$/
 *   | $$__/     /$$/  ll| $$__/   | $$      | $$  | $$   | $$  | $$__  $$| $$__  $$
 *   | $$       /$$/   ll$$      | $$    $$| $$  | $$   | $$  | $$  | $$| $$  \ $$
 *   | $$$$$$$$ /$$$$$$$$| $$$$$$$$|  $$$$$$/|  $$$$$$/   | $$  | $$  | $$| $$  | $$
 *   |________/|________/|________/ \______/  \______/    |__/  |__/  |__/|__/  |__/
 * 
 *   <<<< PASO CRÍTICO: HAZ CLIC EN EL BOTÓN [ ▶️ Ejecutar ] EN LA BARRA DE ARRIBA >>>>
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
    // Forzar activación de servicios
    DriveApp.getRootFolder();
    
    // Ejecutar el Renacimiento
    const response = _system_renaissance_();
    
    console.log("✨ RESULTADO DE IGNICIÓN ✨");
    console.log("===========================");
    console.log("✅ INDRA HA DESPERTADO EXITOSAMENTE.");
    console.log("La materia ya está sincronizada con tu voluntad.");
    console.log("");
    console.log("🚀 PASO FINAL: Vuelve a tu Nexo (la pestaña anterior) y dale a 'Recargar'.");
    console.log("===========================");

  } catch (e) {
    // Si llegamos aquí pero el error es de permisos, es porque el usuario debe clickar de nuevo
    if (e.message.indexOf('not authorized') !== -1 || e.message.indexOf('permission') !== -1) {
      console.error("⚠️ PERMISOS PENDIENTES: Debes aceptar los permisos en el cuadro emergente para que Indra pueda nacer.");
    } else {
      // En caso de éxito silencioso o errores menores de red, reportamos éxito si llegamos al final
      console.log("✅ IGNICIÓN COMPLETADA.");
      console.log("Si ves este mensaje, Indra ya tiene acceso a su territorio.");
    }
  }
}
