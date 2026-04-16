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

    // 2. Elementos de la Interfaz
    const btnLogin = document.getElementById('btn-login-google');
    const btnManualLink = document.getElementById('btn-manual-link');
    const inputCoreUrl = document.getElementById('input-core-url');
    const inputToken = document.getElementById('input-token');
    const authStatusChip = document.getElementById('auth-status-chip');

    // AUTO-RELLENAR: Si hay pacto previo, mostrarlo en pantalla
    if (bridge.coreUrl && bridge.coreUrl !== "https://airhonreality.github.io/indra-os") {
        inputCoreUrl.value = bridge.coreUrl;
    }
    if (bridge.satelliteToken) {
        inputToken.value = bridge.satelliteToken;
    } else {
        // AXIOMA DE INICIO: Token OMEGA por defecto para facilitar el enlace inicial
        inputToken.value = "OMEGA";
    }

    // 3. EVENTO: Ignición Automática (Google / Resonance)
    btnLogin.addEventListener('click', async () => {
        try {
            console.log("🚀 Solicitando ignición...");
            await bridge.ignite();
        } catch (error) {
            console.error("❌ Fallo en ignición:", error);
            alert("Resonancia fallida. Prueba el Pacto Manual.");
        }
    });

    // 4. EVENTO: Pacto Manual (Direct Link)
    btnManualLink.addEventListener('click', async () => {
        const url = inputCoreUrl.value.trim();
        const token = inputToken.value.trim();

        if (!url || !token) {
            alert("Se requiere URL y Token para firmar el pacto.");
            return;
        }

        try {
            btnManualLink.innerText = "FIRMANDO...";
            btnManualLink.disabled = true;
            
            await bridge.establishManualHandshake(url, token);
            
            btnManualLink.innerText = "PACTO FIRMADO";
            btnManualLink.style.background = "#34A853";
        } catch (error) {
            console.error("❌ Error en pacto manual:", error);
            alert("Error al vincular: " + error.message);
            btnManualLink.innerText = "REINTENTAR";
            btnManualLink.disabled = false;
        }
    });

    // 5. ESCUCHA: Actualizar UI cuando cambie el estado del Bridge
    bridge.on('sync', (data) => {
        if (data.status === 'CONNECTED') {
            authStatusChip.innerText = "CONECTADO";
            authStatusChip.style.background = "#34A853";
            authStatusChip.style.color = "white";
        }
    });

    // Reporte Técnico
    bridge.audit();
}

ignite().catch(err => console.error("❌ ERROR EN IGNICIÓN:", err));
