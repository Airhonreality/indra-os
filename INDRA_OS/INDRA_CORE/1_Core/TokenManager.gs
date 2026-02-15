/**
 * 🔐 TOKEN MANAGER (1_Core/TokenManager.gs)
 * Version: 1.0.0
 * Dharma: Administrar múltiples cuentas de API keys por proveedor
 * 
 * AXIOMAS:
 * 1. Codificación obligatoria (Base64) - Pureza GAS
 * 2. Cuenta por defecto única por proveedor
 * 3. Fallback automático a cuenta default
 * 4. Atomicidad de escritura
 * 5. Conformidad de interfaz de nodo
 */

/**
 * Factory: Crea una instancia de TokenManager
 * @param {object} deps - Dependencias inyectadas
 * @param {object} deps.driveAdapter - Para leer/escribir .tokens.json
 * @param {object} deps.configurator - Para obtener TOKENS_FILE_ID y MASTER_ENCRYPTION_KEY
 * @param {object} deps.errorHandler - Para estandarizar errores
 * @param {object} deps.cipherAdapter - Para encriptación AES real
 * @returns {object} TokenManager instance
 */
function createTokenManager({ driveAdapter, configurator, errorHandler, cipherAdapter, monitoringService, laws = {} }) {
  
  if (!cipherAdapter) {
    throw new Error('TokenManager: cipherAdapter dependency is required for Credential Sovereignty.');
  }

  // AXIOMA: Resiliencia de Infraestructura (H7-RESILIENCE)
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, 
    logEvent: () => {}, sendCriticalAlert: () => {} 
  };

  // AXIOMA: Caché Metabólica (L9)
  let _tokensCache = null;
  let _nodesRegistry = null; // Para descubrimiento dinámico
  const WRITE_LOCK_TIMEOUT_MS = 10000;
  
  // AXIOMA: Session Caching for Burst Mode (L9)
  const _sessionCache = {}; // { sessionId: { provider, accountId, credentials, timestamp } }
  const SESSION_TIMEOUT_MS = 120000; // 2 minutes

  /**
   * Obtiene el ID del archivo .tokens.json desde PropertiesService
   * @private
   */
  function _getTokensFileId(context = {}) {
    // AXIOMA: Soberanía de Contexto (Estado de Gracia)
    const contextFileId = context.tokens_file_id || (context.cosmos && context.cosmos.tokens_file_id);
    if (contextFileId) return contextFileId;

    const fileId = configurator.retrieveParameter({ key: 'TOKENS_FILE_ID' });
    if (!fileId) {
      throw errorHandler.createError(
        'TOKEN_FILE_NOT_CONFIGURED',
        'TOKENS_FILE_ID not found. Run SystemInitializer or provide tokens_file_id in context.',
        { context: 'TokenManager._getTokensFileId' }
      );
    }
    return fileId;
  }
  
  /**
   * Obtiene la clave maestra de encriptación
   * @private
   */
  function _getMasterKey(context = {}) {
    const contextKey = context.encryption_key || (context.cosmos && context.cosmos.encryption_key);
    if (contextKey) return contextKey;

    const key = configurator.retrieveParameter({ key: 'MASTER_ENCRYPTION_KEY' });
    if (!key) {
      throw errorHandler.createError(
        'ENCRYPTION_KEY_NOT_FOUND',
        'MASTER_ENCRYPTION_KEY not found in PropertiesService or context.',
        { context: 'TokenManager._getMasterKey' }
      );
    }
    return key;
  }
  
  /**
   * Desencripta contenido usando el CipherAdapter
   * @private
   */
    function _decrypt(encryptedContent, context = {}) {
      if (!encryptedContent) return '';
      try {
        const masterKey = _getMasterKey(context);
        return cipherAdapter.decrypt({ cipher: encryptedContent, key: masterKey });
    } catch (error) {
      throw errorHandler.createError(
        'DECRYPTION_FAILED',
        `Failed to decrypt tokens file: ${error.message}`,
        { context: 'TokenManager._decrypt' }
      );
    }
  }
  
  /**
   * Encripta contenido usando el CipherAdapter
   * @private
   */
  function _encrypt(plainContent, context = {}) {
    try {
      const masterKey = _getMasterKey(context);
      return cipherAdapter.encrypt({ text: plainContent, key: masterKey });
    } catch (error) {
      throw errorHandler.createError(
        'ENCRYPTION_FAILED',
        `Failed to encrypt tokens: ${error.message}`,
        { context: 'TokenManager._encrypt' }
      );
    }
  }
  
  function clearCache() {
    _tokensCache = null;
  }

  /**
   * Carga y desencripta el archivo .tokens.json desde Drive con CACHÉ.
   * @returns {object} Estructura { version, accounts }
   */
  function loadTokens(context = {}) {
    // AXIOMA: Aislamiento Metabólico (L9)
    // Usamos el context para particionar el caché si fuera necesario, 
    // pero por ahora mantenemos el caché único para el proceso actual.
    if (_tokensCache) return _tokensCache;

    try {
      const fileId = _getTokensFileId(context);
      const result = driveAdapter.retrieve({ fileId: fileId });
      const encryptedContent = result.content.encrypted || result.content;
      const decryptedContent = _decrypt(encryptedContent, context);
      
      const tokens = JSON.parse(decryptedContent);
      
      // Validar estructura básica
      if (!tokens.version || !tokens.accounts) {
        throw new Error('Invalid tokens structure: missing version or accounts');
      }
      
      const providers = Object.keys(tokens.accounts);
      _monitor.logInfo(`[TokenManager] 📂 Bóveda cargada. Proveedores activos [${providers.length}]: ${providers.join(', ')}`);
      
      _tokensCache = tokens; // Hidratar caché
      return tokens;
    } catch (error) {
      // AXIOMA: Gracia Degradada ante Corrupción de Llaves
      // Si el error es de configuración o de desencriptación (llave inválida), 
      // permitimos retornar vacío para que el usuario pueda "reparar" seteando un nuevo token.
      const isDecryptionError = error.message.includes('AES') || error.message.includes('Decryption');
      
      if (error.code === 'TOKEN_FILE_NOT_CONFIGURED' || isDecryptionError) {
        _monitor.logWarn(`[TokenManager] ${isDecryptionError ? 'Decryption failed (Key mismatch?)' : 'No file found'}. Returning bootstrap structure.`);
        return { version: '1.0', accounts: {} };
      }
      
      throw errorHandler.createError(
        'TOKEN_LOAD_FAILED',
        `Failed to load tokens: ${error.message}`,
        { context: 'TokenManager.loadTokens', originalError: error }
      );
    }
  }
  
  /**
   * Encripta y guarda el objeto de tokens en Drive con BLOQUEO ATÓMICO.
   * @param {object} payload - { tokens: object }
   */
  function saveTokens({ tokens, systemContext = {} }) {
    if (!tokens) {
      _monitor.logWarn('[TokenManager] No tokens provided to save. Skipping.');
      return;
    }

    const lock = LockService.getScriptLock();
    try {
      // Intentar obtener el bloqueo para evitar Race Conditions (L7)
      if (!lock.tryLock(WRITE_LOCK_TIMEOUT_MS)) {
        throw errorHandler.createError('LOCK_TIMEOUT', 'Could not acquire lock for saving tokens.');
      }

      const fileId = _getTokensFileId(systemContext);
      const plainContent = JSON.stringify(tokens, null, 2);
      const encryptedContent = _encrypt(plainContent, systemContext);
      
      driveAdapter.store({ fileId, content: encryptedContent });
      
      _tokensCache = tokens; // Actualizar caché
      _monitor.logInfo('[TokenManager] ✅ Tokens saved successfully (Atomic)');
    } catch (error) {
      throw errorHandler.createError(
        'TOKEN_SAVE_FAILED',
        `Failed to save tokens: ${error.message}`,
        { context: 'TokenManager.saveTokens', originalError: error }
      );
    } finally {
      lock.releaseLock();
    }
  }
  
  /**
   * Obtiene los datos de una cuenta específica
   * @param {object} payload - { provider: string, accountId?: string }
   * @returns {object | null} Token data
   */
  function getToken({ provider, accountId = null, systemContext = {} }) {
    const tokens = loadTokens(systemContext);
    
    if (!tokens.accounts[provider]) {
      throw errorHandler.createError(
        'PROVIDER_NOT_FOUND',
        `Provider '${provider}' not configured in tokens. Available: [${Object.keys(tokens.accounts).join(', ')}]`,
        { context: 'TokenManager.getToken', provider }
      );
    }
    
    // AXIOMA: Resolución de Alias Semánticos (L8)
    // Tratamos la cadena 'DEFAULT' como null para activar el fallback a la cuenta primaria.
    const effectiveAccountId = (accountId && typeof accountId === 'string' && accountId.toUpperCase() === 'DEFAULT') ? null : accountId;

    // Si no se especifica accountId (o era el alias DEFAULT), buscar cuenta por defecto
    if (!effectiveAccountId) {
      const defaultAccount = Object.entries(tokens.accounts[provider])
        .find(([_, account]) => account.isDefault);
      
      if (!defaultAccount) {
        throw errorHandler.createError(
          'NO_DEFAULT_ACCOUNT',
          `No default account configured for provider '${provider}'`,
          { context: 'TokenManager.getToken', provider }
        );
      }
      _monitor.logDebug(`[TokenManager] Found default account for ${provider}: ${defaultAccount[0]}`);
      return defaultAccount[1];
    }
    
    // Buscar cuenta específica
    const account = tokens.accounts[provider][effectiveAccountId];
    
    if (!account) {
      _monitor.logWarn(`[TokenManager] Account '${effectiveAccountId}' not found for provider '${provider}'.`);
      return null;
    }
    
    // AXIOMA: Integridad de Credencial (Soberanía)
    if (!account.apiKey) {
      _monitor.logError(`[TokenManager] CRITICAL: Account '${accountId}' for '${provider}' lacks 'apiKey'. Structure: ${Object.keys(account).join(', ')}`);
    }

    _monitor.logDebug(`[TokenManager] Found specific account for ${provider}/${accountId}.`);
    return account;
  }
  
  /**
   * Crea o actualiza una cuenta
   * @param {object} payload - { provider: string, accountId: string, tokenData: object }
   */
  function setToken({ provider, accountId, tokenData, systemContext = {} }) {
    // Validar que tokenData tenga apiKey
    if (!tokenData || !tokenData.apiKey) {
      throw errorHandler.createError(
        'INVALID_TOKEN_DATA',
        '[TokenManager] tokenData must include apiKey',
        { provider, accountId }
      );
    }
    
    const tokens = loadTokens(systemContext);
    
    // Crear proveedor si no existe
    if (!tokens.accounts[provider]) {
      tokens.accounts[provider] = {};
    }
    
    // Si es la primera cuenta del proveedor, marcar como default
    const isFirstAccount = Object.keys(tokens.accounts[provider]).length === 0;
    if (isFirstAccount) {
      tokenData.isDefault = true;
    }
    
    // Si se marca como default, desmarcar las demás (AXIOMA #2)
    if (tokenData.isDefault === true || tokenData.isDefault === 'true') {
      Object.keys(tokens.accounts[provider]).forEach(id => {
        if (id !== accountId) {
          tokens.accounts[provider][id].isDefault = false;
        }
      });
    }
    
    // Añadir timestamp
    tokenData.updatedAt = new Date().toISOString();
    
    // Asignar cuenta
    tokens.accounts[provider][accountId] = tokenData;
    
    // Guardar
    saveTokens({ tokens, systemContext });
    
    _monitor.logInfo(`[TokenManager] ✅ Token set for ${provider}/${accountId}`);
  }
  
  /**
   * Lista todas las cuentas de un proveedor
   * @param {object} payload - { provider: string }
   * @returns {array} Array de { id, label, isDefault }
   */
  function listTokenAccounts({ provider, systemContext = {} }) {
    const tokens = loadTokens(systemContext);
    
    if (!tokens.accounts[provider]) {
      return [];
    }
    
    return Object.entries(tokens.accounts[provider]).map(([id, data]) => ({
      id,
      label: data.label || id,
      isDefault: data.isDefault || false
    }));
  }
  
  /**
   * Elimina una cuenta de token de un proveedor
   * @param {object} payload - { provider: string, accountId: string }
   * @returns {object} { success: boolean, message: string }
   */
  function deleteToken({ provider, accountId, systemContext = {} }) {
    // AXIOMA: Soberanía de Contexto (Estado de Gracia)
    const tokens = loadTokens(systemContext);
    
    if (!tokens.accounts[provider] || !tokens.accounts[provider][accountId]) {
      throw errorHandler.createError(
        'RESOURCE_NOT_FOUND',
        `Token account ${provider}/${accountId} not found`,
        { context: 'TokenManager.deleteToken' }
      );
    }
    
    // Verificar si era la cuenta por defecto
    const wasDefault = tokens.accounts[provider][accountId].isDefault;
    
    // Eliminar la cuenta
    delete tokens.accounts[provider][accountId];
    
    // Si era default y quedan otras cuentas, promover la primera
    if (wasDefault) {
      const remainingAccounts = Object.keys(tokens.accounts[provider]);
      if (remainingAccounts.length > 0) {
        tokens.accounts[provider][remainingAccounts[0]].isDefault = true;
        _monitor.logInfo(`[TokenManager] Promoted ${remainingAccounts[0]} to default for ${provider}`);
      }
    }
    
    // Si no quedan cuentas, eliminar el proveedor
    if (Object.keys(tokens.accounts[provider]).length === 0) {
      delete tokens.accounts[provider];
    }
    
    // Guardar cambios
    saveTokens({ tokens, systemContext });
    
    _monitor.logInfo(`[TokenManager] ✅ Token deleted for ${provider}/${accountId}`);
    return { success: true, message: `Token ${provider}/${accountId} deleted successfully` };
  }
  
  /**
   * Inyecta el registro de nodos para descubrimiento dinámico.
   * @param {object} nodes - El objeto nodes del sistema
   */
  function setNodesRegistry(nodes) {
    _nodesRegistry = nodes;
  }

  /**
   * Lista los proveedores disponibles de forma DINÁMICA.
   * AXIOMA: Descubrimiento Autónomo (L7)
   * @returns {string[]} Array of provider names
   */
  function listTokenProviders({ systemContext = {} }) {
    const tokens = loadTokens(systemContext);
    const existing = Object.keys(tokens.accounts || {});
    
    // Descubrimiento dinámico desde el registro de nodos si está disponible
    const discovered = [];
    if (_nodesRegistry) {
      Object.keys(_nodesRegistry).forEach(key => {
        const node = _nodesRegistry[key];
        // Si es un adaptador, es un candidato a proveedor de identidad
        if (node && (node.archetype === 'ADAPTER' || node.semantic_intent === 'BRIDGE')) {
          discovered.push(key.toLowerCase());
        }
      });
    }

    // AXIOMA: Descubrimiento Orgánico (Cero Ficción)
    const combined = [...new Set([...existing, ...discovered])];
    return combined.sort();
  }

  const schemas = {
    loadTokens: {
      description: "Loads and decrypts the complete token vault from persistent storage with caching.",
      semantic_intent: "STREAM",
      io_interface: {
        outputs: {
          tokens: { type: "object", io_behavior: "STREAM", description: "Complete decrypted token structure with version and accounts." }
        }
      }
    },
    saveTokens: {
      description: "Encrypts and atomically persists the token vault to secure storage.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: {
          tokens: { type: "object", io_behavior: "STREAM", description: "Complete token structure to encrypt and save." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Persistence operation status." }
        }
      }
    },
    listTokenProviders: {
        description: "Retrieves a comprehensive list of configured identity and service providers.",
        semantic_intent: "PROBE",
        io_interface: {
            outputs: {
                providers: { type: "array", io_behavior: "STREAM", description: "List of available provider identifiers." }
            }
        }
    },
    getToken: {
      description: "Extracts decrypted authentication credentials for a target provider and account.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          provider: { type: "string", io_behavior: "GATE", description: "Target service provider identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Specific account identifier (defaults to primary if null)." }
        }, 
        outputs: {
          tokenData: { type: "object", io_behavior: "STREAM", description: "Decrypted security payload including keys and metadata." }
        } 
      }
    },
    setToken: {
      description: "Securely persists encrypted authentication data for a target provider account.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          provider: { type: "string", io_behavior: "GATE", description: "Target service provider identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Unique account identifier." },
          tokenData: { type: "object", io_behavior: "STREAM", description: "Structured security payload (API keys, labels, etc.)." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Persistence status confirmation." }
        } 
      }
    },
    listTokenAccounts: {
      description: "Retrieves all configured accounts and their metadata for a specific provider.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          provider: { type: "string", io_behavior: "GATE", description: "Target provider identifier." }
        }, 
        outputs: {
          accounts: { type: "array", io_behavior: "STREAM", description: "Collection of account metadata objects." }
        } 
      }
    },
    deleteToken: {
      description: "Permanently removes an identity credential from the secure vault.",
      semantic_intent: "INHIBIT",
      io_interface: { 
        inputs: {
          provider: { type: "string", io_behavior: "GATE", description: "Target provider identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Target account identifier." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Deletion status confirmation." }
        } 
      }
    }
  };

  // Public API
  function verifyConnection() {
    return { status: "ACTIVE", vaultSecure: true };
  }

  // Public API
  
  /**
   * Starts a credential session for burst operations.
   * Caches decrypted credentials to avoid re-decryption overhead.
   * @param {object} payload - { provider, accountId }
   * @returns {string} Session ID
   */
  function startSession(payload) {
    const { provider, accountId = null } = payload || {};
    
    if (!provider) {
      throw errorHandler.createError('INVALID_INPUT', 'provider is required for startSession');
    }
    
    // Get credentials
    const credentials = getToken({ provider, accountId });
    
    // Generate session ID
    const sessionId = `session_${provider}_${accountId || 'default'}_${Date.now()}`;
    
    // Cache credentials
    _sessionCache[sessionId] = {
      provider,
      accountId,
      credentials,
      timestamp: Date.now()
    };
    
    _monitor.logDebug(`[TokenManager] Session started: ${sessionId}`);
    return sessionId;
  }
  
  /**
   * Retrieves cached credentials from an active session.
   * @param {object} payload - { sessionId }
   * @returns {object} Cached credentials
   */
  function getSessionToken(payload) {
    const { sessionId } = payload || {};
    
    if (!sessionId) {
      throw errorHandler.createError('INVALID_INPUT', 'sessionId is required for getSessionToken');
    }
    
    const session = _sessionCache[sessionId];
    
    if (!session) {
      throw errorHandler.createError('SESSION_NOT_FOUND', `Session ${sessionId} not found or expired`);
    }
    
    // Check session timeout
    const age = Date.now() - session.timestamp;
    if (age > SESSION_TIMEOUT_MS) {
      delete _sessionCache[sessionId];
      throw errorHandler.createError('SESSION_EXPIRED', `Session ${sessionId} expired after ${age}ms`);
    }
    
    return session.credentials;
  }
  
  /**
   * Ends a credential session and clears cache.
   * @param {object} payload - { sessionId }
   */
  function endSession(payload) {
    const { sessionId } = payload || {};
    
    if (!sessionId) {
      throw errorHandler.createError('INVALID_INPUT', 'sessionId is required for endSession');
    }
    
    if (_sessionCache[sessionId]) {
      delete _sessionCache[sessionId];
      _monitor.logDebug(`[TokenManager] Session ended: ${sessionId}`);
    }
  }
  
  return {
    id: "tokenManager",
    label: "Security Vault",
    archetype: "SERVICE",
    domain: "SYSTEM_CORE",
    description: "Secure industrial bridge for encrypted credential management and identity sovereignty.",
    semantic_intent: "GUARD",
    schemas: schemas,
    // Protocol mapping (SYS_V1)
    verifyConnection,
    // Original methods
    loadTokens,
    saveTokens, 
    getToken,
    setToken,
    listTokenAccounts,
    deleteToken,
    listTokenProviders,
    setNodesRegistry,
    // Burst mode session management
    startSession,
    getSessionToken,
    endSession
  };
}

// Export para tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTokenManager };
}






