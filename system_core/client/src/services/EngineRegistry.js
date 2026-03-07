/**
 * =============================================================================
 * SERVICIO: EngineRegistry.js
 * RESPONSABILIDAD: Registro dinámico de Macro-Motores (Agisticidad).
 * =============================================================================
 */

class EngineRegistry {
    constructor() {
        this.engines = new Map();
    }

    /**
     * Registra un motor para una clase específica de átomo.
     * @param {string} atomClass - Ej: 'DOCUMENT', 'BRIDGE', 'SCHEMA'
     * @param {React.Component} component - El componente del motor.
     */
    register(atomClass, component) {
        if (this.engines.has(atomClass) && this.engines.get(atomClass) !== component) {
            console.warn(`[EngineRegistry] Overwriting engine for class: ${atomClass} with a DIFFERENT component.`);
        }
        this.engines.set(atomClass, component);
        // console.log(`[EngineRegistry] Registered engine for: ${atomClass}`); 
    }

    /**
     * Recupera el motor para una clase.
     * @param {string} atomClass 
     * @returns {React.Component|null}
     */
    get(atomClass) {
        return this.engines.get(atomClass) || null;
    }

    /**
     * Lista todas las clases registradas.
     */
    getSupportedClasses() {
        return Array.from(this.engines.keys());
    }
}

export const registry = new EngineRegistry();
