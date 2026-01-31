/**
 * src/main.js
 * DHARMA: Ignición del Andamiaje Front-end con ISK Designer.
 */

import { TranslationKernel } from './core/kernel/TranslationKernel.js';
import { VISUAL_LAWS } from './core/laws/VisualLaws.js';
import { ISKShellProjector } from './modules/Nivel_1_Views/OMD-09_ISK/index.js';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Ignición asegurada al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    initIndraFront();
});

async function initIndraFront() {
    console.log("🚀 Iniciando Indra Front-end v2 (The Stark Architect)");

    const kernel = new TranslationKernel();

    // 1. Simular Registro de Blueprints
    VISUAL_LAWS.SHELL_SLOTS.forEach(slotId => {
        kernel.registerBlueprint(slotId, {
            id: slotId,
            status: 'scaffold_atomic',
            archetype: slotId.includes('vault') ? 'VAULT' : 'SCHEMA'
        });
    });

    // 2. Renderizar Andamiaje en TODOS los módulos EXCEPTO el 9
    // Esto crea la estructura visual básica.
    const allModulesExceptDesigner = VISUAL_LAWS.SHELL_SLOTS.filter(id => id !== 'm09-designer');
    kernel.renderScaffolding(allModulesExceptDesigner);

    // 3. Montaje Especial de React en Módulo 9
    const designerSlot = document.getElementById('m09-designer');

    if (designerSlot) {
        console.log("Found m09-designer slot, attempting to mount React...");
        try {
            const root = createRoot(designerSlot);
            root.render(React.createElement(ISKShellProjector));
            console.log("✅ ISK Designer React Root mounted successfully.");

            // Forzar limpieza de cualquier estilo residual del kernel si existiera
            designerSlot.classList.remove('stark-scaffold-empty');

            // Añadir clase de caja de diseño para asegurar dimensiones
            designerSlot.classList.add('designer-box');

        } catch (e) {
            console.error("❌ Error mounting React ISK:", e);
        }
    } else {
        console.error("❌ CRITICAL: Slot m09-designer not found in DOM.");
    }

    // 4. Listener para cambio de tema
    addEventListener('keydown', (e) => {
        if (e.key === 'T' && e.altKey) {
            document.body.classList.toggle('stark-theme-dark');
            document.body.classList.toggle('stark-theme-light');
            console.log("[Theme] Toggle Stark Identity");
        }
    });

    console.log("✅ Andamiaje Hidratado. Sistema listo para proyección de datos.");
}
