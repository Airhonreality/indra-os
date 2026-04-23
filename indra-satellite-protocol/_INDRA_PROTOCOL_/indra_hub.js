/**
 * =============================================================================
 * 🏛️ INDRA AXIOMATIC MODULE: INDRA HUB (v17.5 OMEGA)
 * =============================================================================
 * DHARMA: Actuar como el punto de ignición único (Bootloader) para el 
 *         despertar del ecosistema Indra en el entorno local.
 * RESPONSABILIDADES:
 *   - Orquestación de la carga inicial de Identidad y Configuración.
 *   - Inyección del panel de control (BridgeHUD).
 *   - Despertar de la aplicación del satélite vía ignite().
 * ANTI-DHARMA: 
 *   - NO debe contener lógica de negocio específica.
 *   - NO debe manejar peticiones de red directas (debe usar el Bridge).
 * =============================================================================
 */

import IndraBridge from './core/IndraBridge.js';
import { IndraKernel } from './core/IndraKernel.js';
import { UI } from './IndraUI.js';

async function bootstrap() {
    console.log("%c 💎 [PROTOCOLO] INDRA HUB V17.0 - AXIOMATIC CARGADO ", "background: #000; color: #007AFF; font-weight: bold; padding: 10px; border: 1px solid #007AFF;");

    // 1. Instanciación
    console.log("🚀 [HUB] 1. Instanciando ecosistema...");
    const bridge = new IndraBridge();
    const kernel = new IndraKernel(bridge);
    kernel.UI = UI; // Inyectamos el catálogo dinámico
    window.indra = { bridge, kernel };

    // 2. HUD
    console.log("🚀 [HUB] 2. Inyectando panel de control...");
    try {
        await import('./ui/IndraBridgeHUD.js?v=V17_OMEGA_ZERO');
        const hud = document.createElement('indra-bridge-v17');
        // Obligamos a que sea un bloque visible sobre todo
        hud.style = "position: fixed; top: 0; left: 0; z-index: 1000000; display: block; width: 100%; height: 100%; pointer-events: none;";
        document.body.appendChild(hud);
        hud.bridge = bridge;

        // Escuchamos la acción principal del HUD (Botón Connect)
        hud.addEventListener('indra-master-action', async () => {
            console.log("⚡ [HUB] Acción maestra recibida del HUD. Iniciando Bridge...");
            await bridge.init();
            hud.sync(); // Forzamos actualización visual
        });

        console.log("✅ [HUB] 2.1. Panel inyectado y vinculado.");
    } catch(e) {
        console.error("❌ [HUB] 2.2. ERROR cargando HUD:", e);
    }

    // 3. Ignición y Carga de ADN (Manifiesto)
    let hubConfig = { active_satellite: '../src/app.js' };
    let manifestData = {};

    try {
        const manifestRes = await fetch('../satellite.manifest.json');
        manifestData = await manifestRes.json();
        console.log("🧬 [HUB] ADN del Satélite cargado:", manifestData.metadata?.name);
    } catch (e) {
        console.log("ℹ️ [HUB] 3. Usando configuración por defecto (Inercia detectada).");
    }

    try {
        console.log("🚀 [HUB] 4. Sincronizando puente con el Core...");
        
        // Identidad básica del manifiesto
        bridge.contract = { 
            ...(bridge.contract || {}), 
            satellite_name: manifestData.metadata?.name || "Indra Nodo",
            version: manifestData.metadata?.version 
        };

        // El Bridge se encarga de su propia hidratación física vía Cortex
        await bridge.init();
        
        if (bridge.status === 'READY') {
            console.log("✅ [HUB] 4.1. Puente RESONANTE (Conexión establecida).");
            window.dispatchEvent(new CustomEvent('indra-core-synced'));
        } else if (bridge.status === 'ORPHAN') {
            console.log("🟡 [HUB] 4.1. Puente HUÉRFANO (Operando en Modo Local).");
            window.dispatchEvent(new CustomEvent('indra-core-synced'));
        }
        
        console.log("🚀 [HUB] 5. Despertando Satélite:", hubConfig.active_satellite);
        const satellite = await import(/* @vite-ignore */ hubConfig.active_satellite);
        
        if (satellite && typeof satellite.ignite === 'function') {
            console.log("🚀 [HUB] 6. Ejecutando ignite()...");
            await satellite.ignite(bridge, kernel);
            console.log("✅ [HUB] 6.1. Ignición exitosa.");
        } else {
            console.warn("⚠️ [HUB] 6.2. El satélite no exporta la función ignite().");
        }
    } catch (error) {
        console.error("❌ [HUB] CRASH EN LOGICA DE IGNICIÓN:", error);
    }
}

bootstrap();
