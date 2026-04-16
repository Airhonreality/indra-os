/**
 * =============================================================================
 * MAIN SATELLITE ENTRY POINT (Consolidated v2.3)
 * =============================================================================
 */
import IndraBridge from '../_INDRA_PROTOCOL_/core/IndraBridge.js';
import '../_INDRA_PROTOCOL_/ui/IndraBridgeHUD.js';

async function ignite() {
    console.log("🚀 Ignición Axial...");

    // 1. Inicializar el motor consolidado
    const bridge = new IndraBridge({
        // coreUrl: '...', 
        // satelliteToken: '...'
    });

    // 2. Inicialización Automática
    await bridge.init();

    // 3. Emparejamiento Directo con el HUD
    const hud = document.getElementById('main-hud');
    if (hud) hud.bridge = bridge;

    // 4. Lógica de Identidad (Capa Satélite)
    const loginBtn = document.getElementById('btn-login-google');
    if (loginBtn) {
        loginBtn.onclick = () => {
             console.log("🔑 Simulando Google Auth...");
             // En un entorno real, aquí usarías google.accounts.id.prompt()
             // Por ahora, inyectamos una identidad de prueba para validar el HUD
             bridge.satelliteToken = "ya29.a0AfH6SMC..."; 
             
             // Forzamos la notificación al HUD
             bridge._notify(); 
             alert("Sincronización de Identidad Exitosa.");
        };
    }

    // Reporte Técnico
    bridge.audit();
}

ignite().catch(err => console.error("❌ ERROR EN IGNICIÓN:", err));
