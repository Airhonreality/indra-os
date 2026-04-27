/**
 * INDRA SATELLITE ENTRY POINT (VIRGIN STATE)
 */
import { INDRA_NODAL_CONFIG } from '../indra_identity.js';

export async function ignite(bridge, kernel) {
    const root = document.getElementById('app-root');
    if (!root) return;

    // DETECCIÓN DE ESTADO VIRGEN
    const isVirgin = INDRA_NODAL_CONFIG.core_url.includes('TU_SCRIPT_ID');

    if (isVirgin) {
        root.innerHTML = `
            <div style="padding:20px; font-family:monospace;">
                <p>[ESTADO: VIRGEN]</p>
                <button onclick="location.href='architect.html'">CONFIGURAR SATÉLITE</button>
            </div>
        `;
    } else {
        root.innerHTML = `
            <div style="padding:20px; font-family:monospace;">
                <a href="architect.html" style="color:inherit; text-decoration:none; cursor:pointer;">[SATELLITE_READY]</a>
            </div>
        `;
    }
}
