/**
 * =============================================================================
 * STATE VAULT (v1.0)
 * =============================================================================
 * Responsabilidad: Persistencia local y resonancia de estado de sesión.
 * Axioma: Ninguna sesión se pierde por un cierre de pestaña.
 * =============================================================================
 */

class StateVault {
    constructor(config = {}) {
        this.bridge = config.bridge;
        this.namespace = config.namespace || 'indra-session';
        this.storage = window.localStorage;
    }

    /**
     * GUARDAR ESTADO (Local + Inmediato)
     */
    set(key, value) {
        const fullKey = `${this.namespace}:${key}`;
        const envelope = {
            data: value,
            timestamp: Date.now()
        };
        this.storage.setItem(fullKey, JSON.stringify(envelope));
    }

    /**
     * RECUPERAR ESTADO
     */
    get(key) {
        const fullKey = `${this.namespace}:${key}`;
        const raw = this.storage.getItem(fullKey);
        if (!raw) return null;
        try {
            return JSON.parse(raw).data;
        } catch (e) {
            return null;
        }
    }

    /**
     * SINCRONIZACIÓN CON EL CORE (Resonancia)
     * Empuja el estado local al Core como un átomo de clase SYSTEM_STATE.
     */
    async sync(key) {
        if (!this.bridge) return;
        const data = this.get(key);
        if (!data) return;

        try {
            await this.bridge.execute({
                provider: 'system',
                protocol: 'ATOM_UPDATE',
                context_id: `state_${this.namespace}_${key}`,
                data: {
                    handle: { alias: `${this.namespace}_${key}`, class: 'SYSTEM_STATE' },
                    payload: data
                }
            });
            console.info(`[StateVault] Resonancia exitosa para: ${key}`);
        } catch (error) {
            console.error("[StateVault] Fallo en la resonancia con el Core:", error);
        }
    }

    /**
     * LIMPIEZA
     */
    clear() {
        Object.keys(this.storage).forEach(key => {
            if (key.startsWith(this.namespace)) {
                this.storage.removeItem(key);
            }
        });
    }
}

export default StateVault;
