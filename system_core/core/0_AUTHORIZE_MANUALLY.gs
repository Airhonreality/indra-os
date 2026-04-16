/**
 * 🛰️ PROTOCOLO DE IGNICIÓN MANUAL - INDRA OS
 * ==========================================
 * Si estás aquí es porque Google bloqueó el acceso automático (CORS/403) desde el Nexo.
 * Esto sucede usualmente cuando tienes múltiples sesiones de Google abiertas.
 * 
 * PARA DESPERTAR A INDRA MANUALMENTE:
 * 1. Selecciona la función 'INDRA_MANUAL_GENESIS' en el selector de arriba.
 * 2. Haz clic en el botón [▶️ Ejecutar].
 * 3. Aparecerá un cuadro de "Revisar permisos". ACÉPTALOS TODOS.
 * 4. Espera a que termine la ejecución (verás el log de éxito abajo).
 * 5. Vuelve al Nexo (Frontend) y recarga la página.
 */

function INDRA_MANUAL_GENESIS() {
  console.log("☄️ Iniciando Génesis Manual de Indra...");
  
  try {
    // Forzar activación de servicios en el scope actual
    DriveApp.getRootFolder();
    
    // Ejecutar el Renacimiento (Crea Ledger y Primer Workspace)
    const response = _system_renaissance_();
    
    if (response.metadata.status === 'BOOTSTRAP') {
      console.log("✅ INDRA HA DESPERTADO EXITOSAMENTE.");
      console.log("Materia Primordial forjada. Tu identidad ya tiene un núcleo activo.");
      console.log("👉 PASO FINAL: Vuelve al Nexo y recarga la página.");
    } else {
      console.log("⚠️ Respuesta inesperada del Core:", JSON.stringify(response.metadata));
    }
  } catch (e) {
    if (e.message.indexOf('not authorized') !== -1 || e.message.indexOf('permission') !== -1) {
      console.error("❌ ERROR: No aceptaste los permisos. Indra no puede nacer sin acceso a su territorio.");
    } else {
      console.error("❌ ERROR CRÍTICO EN GÉNESIS:", e.message);
      console.log("Stack:", e.stack);
    }
  }
}
