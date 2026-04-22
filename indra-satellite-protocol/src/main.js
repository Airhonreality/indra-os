/**
 * =============================================================================
 * MAIN SATELLITE ENTRY POINT (Zero-Config Ignition v16.0)
 * =============================================================================
 */
import IndraBridge from '../_INDRA_PROTOCOL_/core/IndraBridge.js';
import { IndraKernel } from './score/IndraKernel.js';

// 1. Instanciación del Ecosistema
const bridge = new IndraBridge();
const kernel = new IndraKernel(bridge);

/**
 * Dharma: El Satélite se auto-configura si detecta un pacto previo.
 */
async function bootstrap() {
    console.log("🧬 [Seed] Iniciando secuencia de auto-configuración...");


    try {
        // Ignición Silenciosa (Usa localStorage internamente si existe)
        await bridge.init();
        console.log("✨ [Seed] Resonancia establecida.");
    } catch (error) {
        console.warn("🌙 [Seed] El modo GHOST está activo. Esperando firma de pacto...");
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

/**
 * Exportamos el bridge por si el dev quiere hacer debugging en consola
 */
window.indra = { bridge, kernel };
