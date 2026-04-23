/**
 * =============================================================================
 * 🏛️ INDRA AXIOMATIC MODULE: AGNOSTIC VAULT (v17.5 OMEGA)
 * =============================================================================
 * DHARMA: Garantizar la permanencia de la materia estructural (Memoria T=0).
 * RESPONSABILIDADES:
 *   - Gestión de persistencia local (LocalStorage).
 *   - Implementación de algoritmos de evicción (LRU) e integridad (TTL).
 *   - Sincronización transparente con el Bridge.
 * ANTI-DHARMA: 
 *   - NO debe contener lógica de negocio ni validación de esquemas.
 *   - NO debe emitir eventos de UI (solo eventos de sinapsis de estado).
 * =============================================================================
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
     * @standard Inyecta datos en el Vault aplicando políticas de persistencia y TTL opcional.
     */
    commit(key, value, policy = PersistencePolicy.VOLATILE, ttlMs = null) {
        this.cache.set(key, value);
        this.policies[key] = policy;
        this.accessRegistry[key] = Date.now();

        const expires = ttlMs ? Date.now() + ttlMs : null;

        if (policy === PersistencePolicy.CRITICAL) {
            this._persistToStorage(key, value, expires);
        } else {
            this._managedPersistence(key, value, expires);
        }

        this._notify(key, value);
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Validación de Integridad Temporal
        if (entry.expires && Date.now() > entry.expires) {
            console.log(`⏳ [Vault] Expulsando materia caducada: ${key}`);
            this.delete(key);
            return null;
        }

        this.accessRegistry[key] = Date.now();
        return entry.data !== undefined ? entry.data : entry;
    }

    delete(key) {
        this.cache.delete(key);
        delete this.accessRegistry[key];
        localStorage.removeItem(`INDRA_V16_${key}`);
        this._notify(key, null);
    }

    _persistToStorage(key, value, expires = null) {
        const storageKey = `INDRA_V16_${key}`;
        const entry = {
            data: value,
            expires: expires,
            timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(entry));
        localStorage.setItem('INDRA_VAULT_REGISTRY', JSON.stringify(this.accessRegistry));
    }

    _managedPersistence(key, value, expires = null) {
        try {
            this._persistToStorage(key, value, expires);
            this._checkStorageLimits();
        } catch (e) {
            console.warn(`⚠️ [Vault] LocalStorage lleno. Iniciando Evicción...`);
            this._evictOldest();
            try { this._persistToStorage(key, value, expires); } catch (err) { console.error("❌ [Vault] Fallo crítico."); }
        }
    }

    _hydrateFromStorage() {
        try {
            const registry = JSON.parse(localStorage.getItem('INDRA_VAULT_REGISTRY') || '{}');
            this.accessRegistry = registry;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('INDRA_V16_')) {
                    const cleanKey = key.replace('INDRA_V16_', '');
                    const entry = JSON.parse(localStorage.getItem(key));
                    
                    // Si ha caducado durante el letargo, lo purgamos
                    if (entry.expires && Date.now() > entry.expires) {
                        localStorage.removeItem(key);
                        continue;
                    }
                    
                    this.cache.set(cleanKey, entry);
                }
            }
        } catch (e) {
            console.warn("[Vault] Error en hidratación.");
        }
    }
}
