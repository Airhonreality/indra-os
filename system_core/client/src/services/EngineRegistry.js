/**
 * =============================================================================
 * SERVICIO: EngineRegistry.js
 * RESPONSABILIDAD: Registro dinámico de Macro-Motores.
 *
 * INDUSTRIALIZACIÓN (PA-17):
 *   - Cada motor registra su componente + manifiesto visual.
 *   - ActionRail y otros consumidores llaman getAll() para
 *     descubrir motores sin ningún hardcoding.
 * =============================================================================
 */

class EngineRegistry {
    constructor() {
        this._entries = new Map(); // atomClass → { component, manifest }
    }

    /**
     * Registra un motor con su componente React.
     * Forma simple: sin manifiesto explícito (compatibilidad hacia atrás).
     * @param {string} atomClass
     * @param {React.Component} component
     * @param {Object} [manifest] - Opcional: { icon, label, color, canCreate }
     */
    register(atomClass, component, manifest = null) {
        if (this._entries.has(atomClass)) {
            const existing = this._entries.get(atomClass);
            if (existing.component !== component) {
                console.warn(`[EngineRegistry] Overwriting engine for class: ${atomClass}`);
            }
        }
        this._entries.set(atomClass, {
            component,
            manifest: manifest || this._entries.get(atomClass)?.manifest || null
        });
    }

    /**
     * Registra un motor con manifiesto completo de capacidades.
     * @param {string} atomClass
     * @param {React.Component} component
     * @param {Object} manifest - { icon, label, color, canCreate, description }
     */
    registerWithManifest(atomClass, component, manifest) {
        this._entries.set(atomClass, { component, manifest });
    }

    /**
     * Recupera el componente motor para una clase de átomo.
     * @param {string} atomClass
     * @returns {React.Component|null}
     */
    get(atomClass) {
        return this._entries.get(atomClass)?.component || null;
    }

    /**
     * Devuelve todos los motores registrados con sus manifiestos.
     * Usado por ActionRail para descubrimiento dinámico.
     * @returns {Array<{ atomClass, component, manifest }>}
     */
    getAll() {
        return Array.from(this._entries.entries()).map(([atomClass, entry]) => ({
            atomClass,
            component: entry.component,
            manifest: entry.manifest,
        }));
    }

    /**
     * Lista todas las clases de átomos con motor registrado.
     * @returns {string[]}
     */
    getSupportedClasses() {
        return Array.from(this._entries.keys());
    }
}

export const registry = new EngineRegistry();
