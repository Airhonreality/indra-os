/**
 * =============================================================================
 * MAIN SATELLITE ENTRY POINT (Sovereign Ignition v3.5)
 * =============================================================================
 */
import IndraBridge from '../_INDRA_PROTOCOL_/core/IndraBridge.js';
import '../_INDRA_PROTOCOL_/ui/IndraBridgeHUD.js';

let bridge;

/**
 * Dharma: El motor no arranca si la realidad está rota.
 */
async function startEngine() {
    console.log("🚀 Ignición Axial Iniciada...");
    const authStatusChip = document.getElementById('auth-status-chip');

    try {
        // 1. Inicializar el motor
        if (!bridge) bridge = new IndraBridge();

        // 2. Vincular con el HUD (Sincronía UI)
        const hud = document.getElementById('main-hud');
        if (hud) hud.bridge = bridge;

        // 3. Ejecutar Protocolo Semilla (Validación Síncrona)
        await bridge.init();

    } catch (error) {
        console.error("🚨 Fallo de Ignición:", error.message);
        if (authStatusChip) {
            authStatusChip.innerText = "FALLO SISTÉMICO";
            authStatusChip.style.background = "#EA4335";
        }
    }
}

/**
 * Inicialización de Listeners y UI
 */
function setupUI() {
    const btnPacto = document.getElementById('btn-manual-link');
    const inputUrl = document.getElementById('input-core-url');
    const inputToken = document.getElementById('input-token');
    const authStatusChip = document.getElementById('log-layer'); // Redirigir al log layer por ahora

    // --- HIDRATACIÓN AXIAL ---
    // Buscar pacto existente en el archivo de memoria local
    const savedLink = localStorage.getItem('INDRA_SATELLITE_LINK');
    if (savedLink) {
        try {
            const parsed = JSON.parse(savedLink);
            if (inputUrl && parsed.coreUrl) inputUrl.value = parsed.coreUrl;
            if (inputToken && parsed.token) inputToken.value = parsed.token;
            console.log("🧬 Realidad recuperada del localStorage.");
        } catch (e) {
            console.warn("⚠️ Fallo al leer memoria sobeana.");
        }
    }

    if (btnPacto) {
        btnPacto.addEventListener('click', async () => {
            const url = inputUrl.value?.trim();
            const token = inputToken.value?.trim();

            if (!url || !token) {
                alert("Se requiere URL y Token para firmar el pacto.");
                return;
            }

            btnPacto.innerText = "VALIDANDO...";
            btnPacto.disabled = true;

            // Inyectar credenciales en el puente
            bridge.coreUrl = url;
            bridge.satelliteToken = token;

            // Persistencia del Pacto (Soberanía Pura)
            localStorage.setItem('INDRA_SATELLITE_LINK', JSON.stringify({
                coreUrl: url,
                token: token
            }));

            try {
                await bridge.init();
                btnPacto.innerText = "PACTO FIRMADO";
            } catch (err) {
                btnPacto.innerText = "PACTO FIRMADO";
                btnPacto.disabled = false;
            }
        });
    }

    // Escuchas de Eventos de Resonancia
    window.addEventListener('indra-resonance-sync', (e) => {
        const { mode, error } = e.detail || {};
        
        if (authStatusChip) {
            if (mode === 'STABLE') {
                authStatusChip.innerText = "// STATUS: RESONANCIA_ESTABLE";
            } else if (mode === 'ERROR_LEDGER') {
                authStatusChip.innerText = "// STATUS: FALLO_DE_NUCLEO";
            } else if (mode === 'DISCOVERY') {
                authStatusChip.innerText = "// STATUS: EXPLORANDO_TERRITORIO";
            } else if (mode === 'GHOST') {
                authStatusChip.innerText = error ? `// STATUS: IGNICIÓN_FALLIDA [${error.substring(0,20)}]` : "// STATUS: MODO_GHOST";
            }
        }

        if (error) {
            showErrorBanner(error);
        }
    });
}

function showErrorBanner(msg) {
    const existing = document.getElementById('indra-error-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'indra-error-banner';
    banner.style = "position: fixed; bottom: 20px; left: 20px; background: #EA4335; color: white; padding: 10px 20px; border-radius: 8px; font-family: monospace; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);";
    banner.innerText = `⚠️ INDRA: ${msg}`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
}

// Arranque Maestro
bridge = new IndraBridge();
setupUI();
startEngine();
