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
    if (bridge.coreUrl && bridge.coreUrl.includes("github.io")) {
        // AUTO-HEALING: Purgar localStorage si se infectó con la URL estática de GitHub
        // Esto previene los horribles errores 405 y fallos de JSON de forma automática.
        console.warn("⚠️ URL venenosa detectada en LocalStorage. Purgando y Reiniciando motor...");
        localStorage.removeItem('INDRA_SATELLITE_LINK');
        bridge.coreUrl = null;
        inputCoreUrl.value = '';
    } else if (bridge.coreUrl) {
        inputCoreUrl.value = bridge.coreUrl;
    }

    if (bridge.satelliteToken) {
        inputToken.value = bridge.satelliteToken;
    } else {
        // AXIOMA DE INICIO: Token Maestro Real (ADR-041)
        inputToken.value = "indra_satellite_omega";
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

    // 4. EVENTO: Pacto Manual (Direct Link - CANON ISP v2.5)
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
            
            // 1. Escribir directamente en la memoria operativa
            bridge.coreUrl = url;
            bridge.satelliteToken = token;
            
            // 2. Persistir en el Almacenamiento Soberano
            localStorage.setItem('INDRA_SATELLITE_LINK', JSON.stringify({
                coreUrl: url,
                token: token
            }));
            
            // 3. Re-ignición forzada del Motor
            await bridge.init();
            
            btnManualLink.innerText = "PACTO FIRMADO";
            btnManualLink.style.background = "#34A853";
        } catch (error) {
            console.error("❌ Error en pacto manual:", error);
            alert("Error al vincular: " + error.message);
            btnManualLink.innerText = "REINTENTAR";
            btnManualLink.disabled = false;
        }
    });

    // 5. ESCUCHA: Actualizar UI cuando cambie el estado del Bridge (ISP v2.5 Canon)
    window.addEventListener('indra-ready', (e) => {
        const data = e.detail || {};
        if (data.status === 'CONNECTED' || bridge.status === 'CONNECTED') {
            authStatusChip.innerText = "CONECTADO";
            authStatusChip.style.background = "#34A853";
            authStatusChip.style.color = "white";
        }
    });

    // Reporte Técnico
    bridge.audit();
}

ignite().catch(err => console.error("❌ ERROR EN IGNICIÓN:", err));
