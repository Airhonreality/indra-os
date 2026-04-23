/**
 * ARTEFACTO: AgnosticVault.js
 * CAPA: Lógica de Negocio (Soberanía) / Dispatcher de Estado
 * AXIOMA APLICADO: Soberanía del Satélite
 * 
 * RESPONSABILIDAD:
 * Fuente de verdad única y proactiva. Permite suscripciones granulares
 * y gestiona la persistencia local automática.
 */

export class AgnosticVault {
    constructor(bridge) {
        this.bridge = bridge;
        this.listeners = new Map();
        this.data = this._loadFromStorage();
    }

    /**
     * @dharma Suscribe un componente a un esquema o átomo específico.
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        // Ejecución inmediata con datos actuales (si existen)
        if (this.data[key]) callback(this.data[key]);
        
        return () => this.listeners.get(key).delete(callback);
    }

    /**
     * @dharma Inyecta nuevos datos en el Vault y notifica a los suscriptores.
     */
    commit(key, value, options = { persist: true }) {
        this.data[key] = value;
        
        if (options.persist) {
            this._saveToStorage();
        }

        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => callback(value));
        }

        // Notificación de árbol (wildcard)
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => callback(key, value));
        }
    }

    /**
     * Recupera datos del Vault.
     */
    get(key) {
        return this.data[key];
    }

    _saveToStorage() {
        localStorage.setItem('INDRA_VAULT_SNAPSHOT', JSON.stringify(this.data));
    }

    _loadFromStorage() {
        try {
            const saved = localStorage.getItem('INDRA_VAULT_SNAPSHOT');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn("[AgnosticVault] Error cargando snapshot de memoria.");
            return {};
        }
    }
}
