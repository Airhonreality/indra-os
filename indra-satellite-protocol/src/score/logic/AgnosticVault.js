/**
 * ARTEFACTO: AgnosticVault.js
 * CAPA: Data Persistence (Cache & State)
 * ARCHITECTURE v16.0: Peristaltic Memory & Intelligent Eviction
 * 
 * RESPONSABILIDAD:
 * Centros de datos reactivo con políticas de persistencia diferenciadas.
 * Implementa un motor LRU para evitar la saturación del LocalStorage.
 */

export const PersistencePolicy = {
    CRITICAL: 'PERMANENT', // No se elimina nunca (Ej: Configuración, Identidad)
    VOLATILE: 'TRANSIENT'  // Sujeto a limpieza por antigüedad/LRU (Ej: Datos masivos)
};

const STORAGE_LIMIT_BYTES = 4 * 1024 * 1024; // 4MB (Límite prudente)

export class AgnosticVault {
    constructor(bridge) {
        this.bridge = bridge;
        this.listeners = new Map();
        
        // Memoria volátil (Cache en RAM)
        this.cache = new Map();
        
        // Registro de acceso para LRU { key: timestamp }
        this.accessRegistry = {};
        
        // Políticas por esquema { schema_alias: policy }
        this.policies = {};

        this._hydrateFromStorage();
    }

    /**
     * @standard Suscribe un componente a un esquema o clave específica.
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        // Push inicial si hay datos
        const currentData = this.get(key);
        if (currentData) callback(currentData);
        
        return () => this.listeners.get(key).delete(callback);
    }

    /**
     * @standard Inyecta datos en el Vault aplicando políticas de persistencia.
     */
    commit(key, value, policy = PersistencePolicy.VOLATILE) {
        this.cache.set(key, value);
        this.policies[key] = policy;
        this.accessRegistry[key] = Date.now();

        if (policy === PersistencePolicy.CRITICAL) {
            this._persistToStorage(key, value);
        } else {
            // Gestión Peristáltica: Intentar persistir pero validar límites
            this._managedPersistence(key, value);
        }

        this._notify(key, value);
    }

    get(key) {
        this.accessRegistry[key] = Date.now();
        return this.cache.get(key);
    }

    _notify(key, value) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(cb => cb(value));
        }
        window.dispatchEvent(new CustomEvent(`indra-vault-change:${key}`, { detail: value }));
    }

    /**
     * Persistencia Controlada con motor de Evicción LRU
     */
    _managedPersistence(key, value) {
        try {
            this._persistToStorage(key, value);
            this._checkStorageLimits();
        } catch (e) {
            console.warn(`⚠️ [Vault] LocalStorage lleno. Iniciando Evicción de materia vieja...`);
            this._evictOldest();
            try { this._persistToStorage(key, value); } catch (err) { console.error("❌ [Vault] Fallo crítico de persistencia."); }
        }
    }

    _persistToStorage(key, value) {
        const storageKey = `INDRA_V16_${key}`;
        localStorage.setItem(storageKey, JSON.stringify(value));
        localStorage.setItem('INDRA_VAULT_REGISTRY', JSON.stringify(this.accessRegistry));
    }

    _checkStorageLimits() {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            totalSize += localStorage.getItem(localStorage.key(i)).length;
        }
        
        if (totalSize > STORAGE_LIMIT_BYTES) {
            this._evictOldest();
        }
    }

    /**
     * Algoritmo LRU: Elimina el elemento TRANSIENTE menos usado recientemente.
     */
    _evictOldest() {
        const transientes = Object.keys(this.accessRegistry).filter(k => 
            this.policies[k] === PersistencePolicy.VOLATILE
        );

        if (transientes.length === 0) return;

        const oldestKey = transientes.reduce((a, b) => 
            this.accessRegistry[a] < this.accessRegistry[b] ? a : b
        );

        console.log(`🧹 [Vault:Eviction] Liberando espacio: Eliminando "${oldestKey}"`);
        localStorage.removeItem(`INDRA_V16_${oldestKey}`);
        delete this.accessRegistry[oldestKey];
        // Nota: Mantenemos en RAM (cache) pero liberamos disk
    }

    _hydrateFromStorage() {
        try {
            const registry = JSON.parse(localStorage.getItem('INDRA_VAULT_REGISTRY') || '{}');
            this.accessRegistry = registry;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('INDRA_V16_')) {
                    const cleanKey = key.replace('INDRA_V16_', '');
                    const data = JSON.parse(localStorage.getItem(key));
                    this.cache.set(cleanKey, data);
                }
            }
        } catch (e) {
            console.warn("[Vault] Error en hidratación inicial.");
        }
    }
}
