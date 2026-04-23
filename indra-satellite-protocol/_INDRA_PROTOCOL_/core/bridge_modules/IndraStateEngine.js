/**
 * =============================================================================
 * 🏛️ INDRA AXIOMATIC MODULE: STATE ENGINE (v17.5 OMEGA)
 * =============================================================================
 * DHARMA: Coordinar la resonancia de estado y la reactividad (Sistema Nervioso).
 * RESPONSABILIDADES:
 *   - Gestión de Proxies reactivos para el estado del satélite.
 *   - Orquestación de notificaciones de cambio (Sinapsis).
 *   - Hidratación automática vía Vínculo Peristáltico con el Vault.
 * ANTI-DHARMA: 
 *   - NO debe realizar persistencia directa (debe usar un Vault inyectado).
 *   - NO debe contener lógica de negocio (solo transporte de estado).
 * =============================================================================
 */

export class IndraStateEngine {
    constructor(initialState = {}, vault = null) {
        this.listeners = new Map();
        this.vault = vault;
        
        // El Corazón Reactivo
        this.state = new Proxy(initialState, {
            set: (target, prop, value) => {
                target[prop] = value;
                this.notify(prop, value);
                
                // Vínculo Peristáltico: Si el dato es persistente, informar al Vault
                if (this.vault && target._persistent?.includes(prop)) {
                    this.vault.commit(prop, value);
                }
                
                return true;
            }
        });

        // Hidratación Inicial desde el Vault
        if (this.vault) {
            this._hydrate();
        }
    }

    _hydrate() {
        if (!this.state._persistent) return;
        this.state._persistent.forEach(key => {
            const saved = this.vault.get(key);
            if (saved) {
                this.state[key] = saved; // Esto disparará la notificación inicial
            }
        });
    }

    subscribe(prop, callback) {
        if (!this.listeners.has(prop)) {
            this.listeners.set(prop, new Set());
        }
        this.listeners.get(prop).add(callback);
        
        // Push inicial
        callback(this.state[prop]);
        
        return () => this.listeners.get(prop).delete(callback);
    }

    notify(prop, value) {
        if (this.listeners.has(prop)) {
            this.listeners.get(prop).forEach(cb => cb(value));
        }
        // Notificación Global
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(cb => cb(prop, value));
        }
        // Evento de Sistema
        window.dispatchEvent(new CustomEvent(`indra-state-change:${prop}`, { detail: value }));
    }
}
