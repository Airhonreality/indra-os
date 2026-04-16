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

    // 4. Lógica de Identidad Real (Resonancia Proactiva)
    const loginBtn = document.getElementById('btn-login-google');
    if (loginBtn) {
        loginBtn.onclick = async () => {
             try {
                 const originalText = loginBtn.innerText;
                 loginBtn.innerText = "RESONANDO...";
                 loginBtn.disabled = true;

                 await bridge.ignite();

                 loginBtn.innerText = "CONECTADO";
                 console.log("💎 Resonancia Establecida.");
             } catch (e) {
                 console.error("❌ Fallo de Resonancia:", e);
                 loginBtn.innerText = "ERROR DE IGNICIÓN";
                 loginBtn.disabled = false;
                 alert(`Error: ${e.message}`);
             }
        };
    }

    // Reporte Técnico
    bridge.audit();
}

ignite().catch(err => console.error("❌ ERROR EN IGNICIÓN:", err));
