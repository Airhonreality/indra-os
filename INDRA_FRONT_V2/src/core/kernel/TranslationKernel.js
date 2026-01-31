/**
 * src/core/kernel/TranslationKernel.js
 * DHARMA: Sintetizar Blueprints en Superficies UI.
 */

import { VISUAL_LAWS } from '../laws/VisualLaws.js';

export class TranslationKernel {
    constructor() {
        this.manifest = null;
        this.activeModules = new Map();
    }

    /**
     * Registra un blueprint (OMD) en el kernel.
     */
    registerBlueprint(moduleKey, definition) {
        this.activeModules.set(moduleKey, definition);
        console.log(`[Kernel] Registered Blueprint: ${moduleKey}`);
    }

    /**
     * Renderiza el andamiaje atómico (Cajas Vacías).
     * Mapea los Blueprints a los Slots de la Shell.
     * SKIP modules that already have React content mounted.
     */
    renderScaffolding(containerIds, skipModules = []) {
        containerIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            // Skip modules that already have content (e.g., React apps)
            if (skipModules.includes(id)) {
                console.log(`[Kernel] Skipping ${id} (already hydrated)`);
                return;
            }

            // Axioma: El contenedor existe antes que su lógica.
            this._hydrateBox(el, id);
        });
    }

    /**
     * Hidrata una caja con metadatos mínimos de visualización/medición.
     */
    _hydrateBox(element, moduleId) {
        const blueprint = this.activeModules.get(moduleId);

        element.innerHTML = `
            <div class="stark-module-header">
                <span class="stark-module-id">${moduleId.toUpperCase()}</span>
                <span class="stark-module-status">AWAITING_HYDRATION</span>
            </div>
            <div class="stark-module-body stark-scaffold-empty">
                <!-- Instrumento de Medición de Espacio -->
                <div class="stark-dim-checker">
                    ${element.clientWidth}px x ${element.clientHeight}px
                </div>
            </div>
            <div class="stark-module-footer">
                <span class="stark-blueprint-ver">BLUEPRINT: ${blueprint ? 'VERIFICADO' : 'NOT_FOUND'}</span>
            </div>
        `;

        // Aplicar estilos del arquetipo si el blueprint lo define
        if (blueprint && blueprint.archetype) {
            const visual = VISUAL_LAWS.ARCHETYPES[blueprint.archetype];
            if (visual) element.classList.add(visual.class);
        }
    }
}
