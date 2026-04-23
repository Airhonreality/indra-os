/**
 * INDRA SATELLITE ENTRY POINT
 * Este es tu lienzo. Aquí comienza la lógica de tu negocio.
 */

import { appState } from './score/app_state.js';

export async function ignite(bridge, kernel) {
    console.log("🧬 [Satélite] Ignición recibida. Sistema listo para operación.");

    // 1. VÍNCULO PERISTÁLTICO (Cero Entropía)
    // Conectamos la consciencia de la UI con la memoria persistente del Core
    appState.linkVault(bridge.vault);

    // 2. Gestión del Loader (Agnóstico)
    const hideLoader = () => {
        const loader = document.getElementById('indra-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
    };

    // Reactividad al motor
    if (bridge.status === 'READY') hideLoader();
    window.addEventListener('indra-resonance-sync', (e) => {
        if (['STABLE', 'READY', 'LOCAL_READY'].includes(e.detail?.mode)) hideLoader();
    });

    // 2. Tu código aquí (Ejemplo):
    // bridge.vault.subscribe('mi_esquema', (data) => console.log("Datos recibidos:", data));
}
