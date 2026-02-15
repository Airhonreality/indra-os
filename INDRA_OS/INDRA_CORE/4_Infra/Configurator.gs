/**
 * @file Configurator.gs
 * @dharma Ser el Guardián del Almacén de Clave-Valor (PropertiesService).
 * @description Abstracción segura para leer y escribir 
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

    // AXIOMA: Soberanía Técnica - Nomenclatura Agnóstica
    const SYSTEM_PREFIX = 'SYS_';
    const CORE_PREFIX = 'CORE_';

    /**
     * @private
     * AXIOMA: Migración de Soberanía Técnica (Big Bang)
     * Transforma llaves de branding (Indra/Orbital) en llaves técnicas (CORE/SYS).
     */
    (function _runAgnosticMigration() {
        const MIGRATION_KEY = 'SYS_MIGRATION_V16';
        if (properties.getProperty(MIGRATION_KEY) === 'DONE') return;
        
        console.log("[Configurator] 🏛️ Iniciando Migración Técnica Agnóstica...");
        const all = properties.getProperties();
        const legacyPrefixes = ['INDRA_', 'ORBITAL_'];
        
        // Mapeo Estándar de Infraestructura (Normalización Forzada)
        const INFRA_MAP = {
          'CORE_ROOT_ID': 'CORE_ROOT',
          'ROOT_ID': 'CORE_ROOT',
          'ROOT': 'CORE_ROOT',
          'FOLDER_FLOWS_ID': 'CORE_FLOWS_ID',
          'FOLDER_TEMPLATES_ID': 'CORE_TEMPLATES_ID',
          'FOLDER_ASSETS_ID': 'CORE_ASSETS_ID',
          'FOLDER_OUTPUT_ID': 'CORE_OUTPUT_ID',
          'FOLDER_SYSTEM_ID': 'SYS_SYSTEM_ID',
          'JOB_QUEUE_ID': 'SYS_JOB_QUEUE_ID',
          'AUDIT_LOG_ID': 'SYS_AUDIT_LOG_ID'
        };

        Object.keys(all).forEach(key => {
            legacyPrefixes.forEach(prefix => {
                if (key.startsWith(prefix)) {
                    let baseKey = key.substring(prefix.length);
                    // Si la baseKey ya empezaba con CORE_, removerlo para normalizar
                    if (baseKey.startsWith('CORE_')) baseKey = baseKey.substring(5);

                    // Si la baseKey es ROOT o termina en _ID, normalizar a ROOT
                    if (baseKey === 'ROOT' || baseKey === 'ROOT_ID' || baseKey === 'CORE_ROOT_ID') baseKey = 'CORE_ROOT_ID';

                    let newKey = INFRA_MAP[baseKey] || INFRA_MAP['CORE_' + baseKey];
                    
                    if (!newKey) {
                        const isCore = baseKey.includes('ROOT') || baseKey.includes('API_KEY') || baseKey.includes('TOKEN');
                        newKey = isCore ? CORE_PREFIX + baseKey : SYSTEM_PREFIX + baseKey;
                    }
                    
                    if (!properties.getProperty(newKey)) {
                        properties.setProperty(newKey, all[key]);
                        console.log(`[Configurator] 🔄 Autoinstalación: ${key} -> ${newKey}`);
                    }
                }
            });
        });
        properties.setProperty(MIGRATION_KEY, 'DONE');
        console.log("[Configurator] ✅ Migración Técnica completada.");
    })();

    /**
     * Asegura que toda clave tenga un prefijo técnico para evitar colisiones.
     * @private
     */
    function _prefixKey(key) {
        if (typeof key !== 'string') return key;
        if (VALID_PREFIXES.some(prefix => key.startsWith(prefix))) return key;
        if (key.startsWith(SYSTEM_PREFIX) || key.startsWith(CORE_PREFIX)) return key;
        
        // Regla de Prefijación por Naturaleza
        const isCore = key.includes('ROOT') || key.includes('API_KEY') || key.includes('TOKEN');
        return isCore ? CORE_PREFIX + key : SYSTEM_PREFIX + key;
    }

    /**
     * Valida que la clave tenga un prefijo autorizado (AXIOMA L9).
     * @private
     */
    function _validateKey(key) {
        if (typeof key !== 'string' || key.trim().length === 0) return false;
        
        return VALID_PREFIXES.some(prefix => key.startsWith(prefix)) || 
               key.startsWith(SYSTEM_PREFIX) || 
               key.startsWith(CORE_PREFIX);
    }


    /**
     * Almacena un parámetro de configuración con BLOQUEO ATÓMICO y NAMESPACE.
     * @param {Object} payload - { key: string, value: string }
     */
    function storeParameter(payload) {
        let { key, value } = payload || {};
        
        if (typeof value !== 'string') {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR', 
                `storeParameter: value must be string. Found: ${typeof value}`, 
                { key }
            );
        }

        const finalKey = _prefixKey(key);

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
        if (typeof key !== 'string' || key.trim().length === 0) {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR', 
                'retrieveParameter: payload debe contener una propiedad "key" (string no vacío).', 
                { payload }
            );
        }

        const prefixedKey = _prefixKey(key);
        
        try {
            let value = properties.getProperty(prefixedKey);

            // CAPA DE COMPATIBILIDAD EXTERNA (TokenManager fallback): 
            // Si no existe tras migración, buscar en el Manifest si esta clave tiene un mapeo a TokenManager
            if (value === null && _tokenManager && manifest && (manifest.CONNECTIONS || manifest.requiredConnections)) {
                const connections = manifest.CONNECTIONS || manifest.requiredConnections;
                
                let connectionId = null;
                let connectionConfig = null;

                if (Array.isArray(connections)) {
                  connectionId = connections.find(id => id === key);
                  connectionConfig = {};
                } else {
                  const entry = Object.entries(connections).find(([id, conf]) => {
                    return id === key || (conf && conf.legacyKey === key);
                  });
                  if (entry) {
                    connectionId = entry[0];
                    connectionConfig = entry[1];
                  }
                }

                if (connectionId) {
                    const provider = connectionConfig.provider || connectionId.split('_')[0].toLowerCase();
                    try {
                        const tokenData = _tokenManager.getToken({ provider });
                        return tokenData ? tokenData.apiKey : null;
                    } catch (e) {
                        console.warn(`[Configurator] TokenManager resolution failed for ${key}: ${e.message}`);
                        return null;
                    }
                }
            }
            return value;
        } catch (e) {
            throw errorHandler.createError('SYSTEM_FAILURE', `Failed to retrieve parameter: ${e.message}`, { key, originalError: e.message });
        }
    }

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

    function verifyConnection() {
      // Light probe: check if PropertiesService is accessible
      try {
        const keys = properties.getKeys();
        return { status: "ACTIVE", keyCount: keys.length };
      } catch (e) {
        return { status: "BROKEN", error: e.message };
      }
    }

    return {
        description: "Industrial parameter registry for high-integrity persistence and environment orchestration.",
        semantic_intent: "GUARD",
        schemas,
        // Capability Discovery
        verifyConnection,
        // Original methods
        storeParameter,
        retrieveParameter,
        getConfigurationStatus,
        getAllParameters,
        getSafeParameters,
        isInSafeMode,
        deleteParameter,
        setTokenManager
    };
}





