/**
 * @file Configurator.gs
 * @dharma Ser el Guardián del Almacén de Clave-Valor (PropertiesService).
 * @description Abstracción segura y agnóstica para leer y escribir 
 * la configuración persistente del sistema.
 * 
 * CONTRATO CANÓNICO (Alineado con Nodos Ejecutables):
 * - RF-M-1: Exporta fábrica createConfigurator({ errorHandler })
 * - RF-X-1: Método storeParameter(payload) donde payload = { key, value }
 * - RF-X-2: Método retrieveParameter(payload) donde payload = { key }, retorna null si no existe
 * - RF-X-3: Método deleteParameter(payload) donde payload = { key }
 * - RF-X-4: Método getConfigurationStatus(requiredKeys) [auxiliar interno]
 * 
 * DEPENDENCIAS:
 * - 4_Infra/ErrorHandler.gs
 */

/**
 * Factory para crear el Configurator
 * @param {Object} dependencies - Dependencias inyectadas
 * @param {Object} dependencies.errorHandler - ErrorHandler instance
 * @returns {Object} Instancia inmutable del Configurator
 */
function createConfigurator({ manifest, errorHandler }) {
    if (!errorHandler || typeof errorHandler.createError !== 'function') {
        throw new TypeError('createConfigurator: errorHandler contract not fulfilled');
    }

    const properties = PropertiesService.getScriptProperties();
    const VALID_PREFIXES = ['core:', 'skin:', 'adapter:', 'sys:', 'app:', 'flow:'];
    const LOCK_TIMEOUT_MS = 5000;

    const SYSTEM_PREFIX = 'ORBITAL_';

    /**
     * Asegura que toda clave tenga un prefijo para evitar colisiones.
     * @private
     */
    function _prefixKey(key) {
        if (typeof key !== 'string') return key;
        if (VALID_PREFIXES.some(prefix => key.startsWith(prefix))) return key;
        if (key.startsWith(SYSTEM_PREFIX)) return key;
        return SYSTEM_PREFIX + key;
    }

    /**
     * Valida que la clave tenga un prefijo autorizado (AXIOMA L9).
     * @private
     */
    function _validateKey(key) {
        if (typeof key !== 'string' || key.trim().length === 0) return false;
        
        // Validar que YA tenga un prefijo válido (no aplicar _prefixKey aquí)
        // Esto asegura que solo se acepten keys con namespace explícito
        return VALID_PREFIXES.some(prefix => key.startsWith(prefix)) || 
               key.startsWith(SYSTEM_PREFIX);
    }


    /**
     * Almacena un parámetro de configuración con BLOQUEO ATÓMICO y NAMESPACE.
     * @param {Object} payload - { key: string, value: string }
     */
    function storeParameter(payload) {
        let { key, value } = payload || {};
        
        if (!_validateKey(key)) {
            const displayKey = typeof key === 'string' ? key : JSON.stringify(key);
            throw errorHandler.createError(
                'NAMESPACE_ERROR', 
                `storeParameter: Key '${displayKey}' lacks a valid namespace prefix or is invalid.`, 
                { key }
            );
        }

        const finalKey = _prefixKey(key);

        if (typeof value !== 'string') {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR', 
                `storeParameter: value must be string. Found: ${typeof value}`, 
                { key }
            );
        }

        const lock = LockService.getScriptLock();
        try {
            if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
                throw errorHandler.createError('LOCK_TIMEOUT', 'Lock contention in Configurator.storeParameter');
            }
            properties.setProperty(finalKey, value);
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError('SYSTEM_FAILURE', `Failed to store parameter: ${e.message}`, { key });
        } finally {
            lock.releaseLock();
        }
    }

    let _tokenManager = null;

    /**
     * Permite registrar el TokenManager para la capa de compatibilidad.
     * @param {Object} tm - Instancia de TokenManager
     */
    function setTokenManager(tm) {
        _tokenManager = tm;
    }

    /**
     * Recupera un parámetro de configuración.
     * @param {Object} payload - { key: string }
     * @returns {string|null}
     */
    function retrieveParameter(payload) {
        let { key } = payload || {};
        const prefixedKey = _prefixKey(key);
        
        if (typeof key !== 'string' || key.trim().length === 0) {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR', 
                'retrieveParameter: payload debe contener una propiedad "key" (string no vacío).', 
                { payload }
            );
        }
        try {
            let value = properties.getProperty(prefixedKey);

            // --- AXIOMA: MIGRACIÓN AGNOSTICA (LLEGACY FALLBACK) ---
            // Si no existe con el prefijo, intentamos encontrar la versión legacy
            if (value === null) {
                // Posibilidad A: La clave se pasó sin prefijo (ej: 'SYSTEM_TOKEN')
                // Posibilidad B: La clave se pasó con prefijo (ej: 'ORBITAL_SYSTEM_TOKEN') pero existe como legacy
                const legacyKey = prefixedKey.startsWith(SYSTEM_PREFIX) 
                    ? prefixedKey.substring(SYSTEM_PREFIX.length) 
                    : key;

                if (legacyKey !== prefixedKey) {
                    value = properties.getProperty(legacyKey);
                    if (value !== null) {
                        console.log(`[Configurator] 🔄 Auto-migrando legacy '${legacyKey}' -> '${prefixedKey}'`);
                        const lock = LockService.getScriptLock();
                        if (lock.tryLock(LOCK_TIMEOUT_MS)) {
                            try {
                                properties.setProperty(prefixedKey, value);
                            } finally {
                                lock.releaseLock();
                            }
                        }
                    }
                }
            }

            // CAPA DE COMPATIBILIDAD AGNOSTICA (TokenManager fallback): 
            // Si no existe en PS, buscar en el Manifest si esta clave tiene un mapeo a TokenManager
            if (value === null && _tokenManager && manifest && manifest.requiredConnections) {
                // Buscar en las conexiones del manifest cuál coincide con esta 'key' vía legacyKey o ID
                const connectionEntry = Object.entries(manifest.requiredConnections).find(([id, config]) => {
                    return config.legacyKey === key;
                });

                if (connectionEntry) {
                    const [id, config] = connectionEntry;
                    const provider = config.provider || id.split('_')[0].toLowerCase(); // Inferencia agnóstica fallback
                    
                    try {
                        const tokenData = _tokenManager.getToken({ provider });
                        return tokenData ? tokenData.apiKey : null;
                    } catch (e) {
                        // Si falla TokenManager (ej: no inicializado), loggear y retornar null
                        console.warn(`[Configurator] Backward compatibility failed for ${key}: ${e.message}`);
                        return null;
                    }
                }
            }

            return value; 
        } catch (e) {
            throw errorHandler.createError('SYSTEM_FAILURE', `Failed to retrieve parameter: ${e.message}`, { key, originalError: e.message });
        }
    }
    // --- FIN DE INTERVENCIÓN ---

    function getConfigurationStatus(requiredKeys) {
    if (!requiredKeys || !Array.isArray(requiredKeys)) {
        console.warn('[Configurator.getConfigurationStatus] requiredKeys must be an array. Received:', typeof requiredKeys);
        return { isComplete: false, missingKeys: [], error: 'requiredKeys must be an array' };
    }
        // Usar la nueva firma de payload internamente
        const missingKeys = requiredKeys.filter(key => retrieveParameter({ key }) === null);
        return {
            isComplete: missingKeys.length === 0,
            missingKeys: missingKeys
        };
    }

    /**
     * Devuelve TODAS las propiedades almacenadas como un objeto clave-valor.
     * ⚠️ ADVERTENCIA: Este método expone secretos si no se usa con cuidado.
     * Usar getSafeParameters() para exposición pública.
     * @returns {Object} Un objeto con todas las propiedades.
     */
    function getAllParameters() {
        try {
            return properties.getProperties();
        } catch (e) {
            throw errorHandler.createError('SYSTEM_FAILURE', `Failed to retrieve all parameters: ${e.message}`, { originalError: e.message });
        }
    }

    /**
     * Devuelve parámetros filtrados, ocultando secretos. (Axioma #2: Sentinel Masking)
     * @returns {Object} Configuración segura para el Satélite.
     */
    function getSafeParameters() {
        const all = getAllParameters();
        const safe = {};
        
        // AXIOMA: El patrón de sensibilidad reside en Layer 0
        const sensitiveTerms = (typeof LOGIC_AXIOMS !== 'undefined' && LOGIC_AXIOMS.SENSITIVE_TERMS)
                               ? LOGIC_AXIOMS.SENSITIVE_TERMS 
                               : ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'CREDENTIAL', 'AUTH'];
        
        const SENSITIVE_PATTERN = new RegExp(`(${sensitiveTerms.join('|')})`, 'i');

        Object.keys(all).forEach(key => {
            if (SENSITIVE_PATTERN.test(key)) {
                safe[key] = "********"; // Mascarilla Fantasma
            } else {
                safe[key] = all[key];
            }
        });
        return safe;
    }

    /**
     * Verifica si el sistema está en modo seguro experimental.
     * @returns {boolean}
     */
    function isInSafeMode() {
        return properties.getProperty(SYSTEM_PREFIX + 'EXPERIMENTAL_SAFE_MODE') === 'TRUE';
    }

    /**
     * Elimina una única propiedad.
     * @param {Object} payload - { key: string }
     */
    function deleteParameter(payload) {
        let { key } = payload || {};
        key = _prefixKey(key);
        
        if (typeof key !== 'string' || key.trim().length === 0) {
            throw errorHandler.createError('CONFIGURATION_ERROR', 'deleteParameter: invalid key', { key });
        }

        const lock = LockService.getScriptLock();
        try {
            if (!lock.tryLock(LOCK_TIMEOUT_MS)) throw errorHandler.createError('LOCK_TIMEOUT', 'Lock contention in deleteParameter');
            properties.deleteProperty(key);
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError('SYSTEM_FAILURE', `Failed to delete parameter: ${e.message}`, { key });
        } finally {
            lock.releaseLock();
        }
    }

    const schemas = {
        storeParameter: {
            description: "Persists a technical configuration parameter in the secure system registry.",
            semantic_intent: "TRIGGER",
            io_interface: { 
                inputs: {
                    key: { type: "string", role: "GATE", description: "Technical key identifier with namespace." },
                    value: { type: "string", role: "STREAM", description: "Technical value to persist." },
                    accountId: { type: "string", role: "GATE", description: "Account selector for isolation." }
                }, 
                outputs: {
                    success: { type: "boolean", role: "PROBE", description: "Persistence confirmation." }
                } 
            }
        },
        retrieveParameter: {
            description: "Extracts a technical parameter from the registry, including backward compatibility resolution.",
            semantic_intent: "STREAM",
            io_interface: { 
                inputs: {
                    key: { type: "string", role: "GATE", description: "Unique key identifier." },
                    accountId: { type: "string", role: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    value: { type: "string", role: "STREAM", description: "The retrieved technical value." }
                } 
            }
        },
        deleteParameter: {
            description: "Permanently removes a technical parameter from the system registry.",
            semantic_intent: "INHIBIT",
            io_interface: { 
                inputs: {
                    key: { type: "string", role: "GATE", description: "Technical key to remove." },
                    accountId: { type: "string", role: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    success: { type: "boolean", role: "PROBE", description: "Inhibition status confirmation." }
                } 
            }
        },
        getConfigurationStatus: {
            description: "Assesses the presence of critical parameters across the technical registry.",
            semantic_intent: "PROBE",
            io_interface: { 
                inputs: {
                    requiredKeys: { type: "array", role: "SCHEMA", description: "List of key identifiers to audit." },
                    accountId: { type: "string", role: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    isComplete: { type: "boolean", role: "PROBE", description: "Global configuration readiness." },
                    missingKeys: { type: "array", role: "STREAM", description: "List of missing critical identifiers." }
                } 
            }
        },
        getAllParameters: {
            description: "Exports the full technical registry map (Warning: Includes secrets).",
            semantic_intent: "STREAM",
            io_interface: { 
                inputs: {
                    accountId: { type: "string", role: "GATE", description: "Account selector." }
                }, 
                outputs: {
                    parameters: { type: "object", role: "STREAM", description: "Full key-value map of system registry." }
                } 
            }
        }
    };

    return Object.freeze({
        label: "Registry Orchestrator",
        description: "Industrial parameter registry for high-integrity persistence and environment orchestration.",
        semantic_intent: "GUARD",
        archetype: "SYSTEM_CORE",
        schemas,
        storeParameter,
        retrieveParameter,
        getConfigurationStatus,
        getAllParameters,
        getSafeParameters,
        isInSafeMode,
        deleteParameter,
        setTokenManager
    });
}