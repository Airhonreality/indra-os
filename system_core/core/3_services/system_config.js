// =============================================================================
// ARTEFACTO: 3_services/system_config.gs
// CAPA: 3 — Services (Infraestructura de Soporte)
// RESPONSABILIDAD: Guardián de la persistencia del servidor. Abstrae el acceso a
//         PropertiesService para todos los demás componentes del Core.
//         Gestiona: tokens de providers por cuenta, workspace definitions,
//         SYSTEM_ROOT_FOLDER_ID, y el estado BOOTSTRAP del servidor.
//
// AXIOMAS (de DATA_CONTRACTS.md Parte VIII y VECTOR 6):
//   - PropertiesService es la ÚNICA fuente de verdad de la configuración del Core.
//   - Drive (.core_system/) es la ÚNICA fuente de verdad de los System Documents.
//   - Los tokens se almacenan con prefijo de provider para evitar colisiones.
//   - LockService garantiza escritura atómica en condiciones concurrentes.
//
// RESTRICCIONES:
//   - NO puede tener lógica de negocio. Solo CRUD de PropertiesService.
//   - NO puede leer/escribir archivos en Drive directamente.
//     Eso es responsabilidad de `provider_drive.gs` y `provider_system.gs`.
//   - NO puede crear ni verificar el Home Root. Eso lo hace `provider_system.gs`.
//
// CONVENCIONES DE CLAVES EN PropertiesService:
//   SYS_CORE_OWNER_UID          → Email del propietario del Core (Blood Right)
//   SYS_MASTER_LEDGER_ID        → ID de la Google Sheet Maestra de Registro (Index)
//   ACCOUNT_{provider}_{id}_KEY → API Key de una cuenta específica de un provider
//   ACCOUNT_{provider}_{id}_META→ Metadata JSON de la cuenta (label, created_at)
// =============================================================================

const HOME_ROOT_FOLDER_NAME_ = '.core_system';

/**
 * Timeout en milisegundos para adquirir el LockService.
 * @const {number}
 */
const LOCK_TIMEOUT_MS = 5000;

/**
 * Prefijos válidos de claves en PropertiesService.
 * Cualquier clave que no empiece con uno de estos será rechazada por `storeConfig`.
 * @const {string[]}
 */
const VALID_KEY_PREFIXES = Object.freeze(['SYS_', 'ACCOUNT_', 'SESS_']);

// ─── UTILIDADES INTERNAS ──────────────────────────────────────────────────────

/**
 * Valida que una clave de configuración tenga un prefijo autorizado.
 * @param {string} key - La clave a validar.
 * @throws {Error} Si el prefijo no es válido.
 * @private
 */
function _validateKey_(key) {
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error('system_config: La clave de configuración no puede estar vacía.');
  }
  const isValid = VALID_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
  if (!isValid) {
    throw new Error(
      `system_config: Prefijo de clave inválido para "${key}". ` +
      `Use uno de: ${VALID_KEY_PREFIXES.join(', ')}`
    );
  }
}

/**
 * Obtiene el PropertiesService de scope de script (compartido por todas las ejecuciones).
 * @returns {PropertiesService.Properties}
 * @private
 */
function _getStore_() {
  return PropertiesService.getScriptProperties();
}

// ─── API PÚBLICA: CRUD DE CONFIGURACIÓN ──────────────────────────────────────

/**
 * Guarda un valor de configuración de forma atómica (con lock).
 *
 * @param {string} key   - Clave con prefijo válido (ej: 'SYS_ROOT_FOLDER_ID').
 * @param {string} value - Valor a almacenar (siempre string en PropertiesService).
 * @returns {boolean} `true` si la escritura fue exitosa.
 * @throws {Error} Si no se puede adquirir el lock o la clave es inválida.
 */
function storeConfig(key, value) {
  _validateKey_(key);

  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
      throw new Error(`system_config: No se pudo adquirir el lock para escribir "${key}".`);
    }
    _getStore_().setProperty(key, String(value));
    logInfo(`[system_config] Clave guardada: ${key}`);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Lee un valor de configuración.
 *
 * @param {string} key              - Clave con prefijo válido.
 * @param {string} [defaultValue]   - Valor a retornar si la clave no existe.
 * @returns {string|null} El valor almacenado, `defaultValue`, o `null`.
 */
function readConfig(key, defaultValue) {
  _validateKey_(key);
  const value = _getStore_().getProperty(key);
  if (value === null || value === undefined) {
    return (defaultValue !== undefined) ? defaultValue : null;
  }
  return value;
}

/**
 * Elimina una clave de configuración de forma atómica.
 *
 * @param {string} key - Clave con prefijo válido.
 * @returns {boolean} `true` si la eliminación fue exitosa.
 */
function deleteConfig(key) {
  _validateKey_(key);

  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
      throw new Error(`system_config: No se pudo adquirir el lock para eliminar "${key}".`);
    }
    _getStore_().deleteProperty(key);
    logInfo(`[system_config] Clave eliminada: ${key}`);
    return true;
  } finally {
    lock.releaseLock();
  }
}

// ─── API PÚBLICA: ESTADO DE BOOTSTRAP ─────────────────────────────────────────

/**
 * Indica si el servidor ya ha sido inicializado con un password de acceso.
 * (ADR-019) Versión Blindada: Detecta conflictos de territorio en Drive.
 * @returns {boolean}
 */
function isBootstrapped() {
  const store = _getStore_();
  const rootMountId = store.getProperty('SYS_MOUNT_ROOT_ID');
  const isCerebroActive = store.getProperty('SYS_IS_BOOTSTRAPPED') === 'true';
  
  // AXIOMA DE SOBERANÍA (v4.61): Sin Mount ROOT no hay consciencia.
  if (!rootMountId && isCerebroActive) {
     console.error('[CRITICAL] El sistema está marcado como ACTIVO pero falta el MOUNT_ROOT.');
     return false;
  }

  return isCerebroActive && !!rootMountId;
}

/**
 * Escaneo preventivo de territorio físico en Drive.
 * @private
 */
function _system_checkForExistingTerritory() {
  try {
    const existing = DriveApp.getRootFolder().getFoldersByName(HOME_ROOT_FOLDER_NAME_);
    return existing.hasNext();
  } catch (e) {
    return false; // Error de permisos o Drive inalcanzable
  }
}

/**
 * Recupera el UID (email) del propietario del Core.
 * Si no existe (legacy), intenta autodescubrirlo si el usuario actual es el dueño.
 * @returns {string} El email del propietario o 'anonymous@indra-os.com' como fallback.
 */
function readCoreOwnerEmail() {
  const store = _getStore_();
  let email = store.getProperty('SYS_CORE_OWNER_UID');
  
  if (!email && isBootstrapped()) {
    // Identidad v4.1: si no hay email, es un fallo de bootstrap
    logWarn('[system_config] Identidad no encontrada. El Core está en modo anónimo.');
  }

  
  return email || 'anonymous@indra-os.com';
}

/**
 * Establece el password de acceso del servidor por primera y única vez.
 * Internamente guarda un HASH SHA-256 del password (nunca el texto plano).
 * Una vez ejecutado, marca el servidor como bootstrapped.
 *
 * @param {string} plainPassword - El password definido por el usuario.
 * @returns {boolean} `true` si el bootstrap fue exitoso.
 * @throws {Error} Si el servidor ya está bootstrapped.
 */
function bootstrapPassword(plainPassword) {
  // Doble verificación de territorio antes de la ignición
  if (isBootstrapped()) {
    throw new Error('system_config: El servidor ya fue inicializado. Bootstrap no permitido.');
  }
  if (!plainPassword || typeof plainPassword !== 'string' || plainPassword.length < 8) {
    throw new Error('system_config: El password debe tener al menos 8 caracteres.');
  }

  const hash = _sha256_(plainPassword);
  // Capturar la identidad del instalador para el anclaje del Core v4.1
  const userEmail = Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail();

  return _finishBootstrap_(hash, userEmail);
}

/**
 * Ignición programática vía Satellite Key (Indra v4.0 Installer).
 * @param {string} key - UUID v4 generado por el front-end.
 * @param {string} ownerEmail - Email del usuario autenticado.
 */
function bootstrapWithSatelliteKey(key, ownerEmail) {
  if (isBootstrapped()) {
    throw new Error('system_config: El servidor ya fue inicializado.');
  }
  if (!key || key.length < 32) {
    throw new Error('system_config: Satellite Key inválida.');
  }

  const hash = _sha256_(key);
  return _finishBootstrap_(hash, ownerEmail);
}

/**
 * Finaliza el proceso de bootstrap guardando el hash y anclando el motor.
 * @private
 */
function _finishBootstrap_(hash, userEmail) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
      throw new Error('system_config: No se pudo adquirir el lock para el bootstrap.');
    }
    const store = _getStore_();
    store.setProperty('SYS_ACCESS_PASSWORD_HASH', hash);
    if (userEmail) {
      store.setProperty('SYS_CORE_OWNER_UID', userEmail);
    }

    // ── CRISTALIZACIÓN FÍSICA (Indra v4.1) ──────────────────────────────────
    // El motor 'se traga' a sí mismo hacia su carpeta de sistema (.core_system)
    try {
      _system_anchorEngineToHome();
    } catch (e) {
      logWarn('[system_config] Error en anclaje físico (omitiendo): ' + e.message);
    }
    
    store.setProperty('SYS_IS_BOOTSTRAPPED', 'true');
    logInfo(`[system_config] Bootstrap completado. Core anclado a: ${userEmail || 'anon'}`);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Verifica si un password en texto plano coincide con el hash almacenado.
 * @param {string} plainPassword - El password a verificar.
 * @returns {boolean} `true` si el password es correcto.
 */
function verifyPassword(plainPassword) {
  if (!isBootstrapped()) return false;
  if (!plainPassword) return false; 
  
  // ── AXIOMA DE SESIÓN (Indra v4.1) ──
  // Si el password enviado coincide con un Ticket de Sesión activo, autorizar.
  if (validateSessionTicket(plainPassword)) return true;

  const storedHash = _getStore_().getProperty('SYS_ACCESS_PASSWORD_HASH');
  if (!storedHash) return false;
  return _sha256_(plainPassword) === storedHash;
}

/**
 * Genera un Ticket de Sesión efímero para evitar enviar la contraseña maestra.
 * @returns {string} El ticket de sesión generado.
 */
function generateSessionTicket() {
  const ticket = Utilities.getUuid();
  const expiresAt = Date.now() + (1000 * 60 * 60 * 24); // 24 horas
  
  const ticketData = JSON.stringify({
    ticket: ticket,
    expires_at: expiresAt,
    created_at: new Date().toISOString()
  });

  // Guardamos el ticket con un prefijo especial SESS_
  // Nota: En una implementación de alta carga usaríamos CacheService, 
  // pero para Soberanía Individual PropertiesService es más persistente ante reinicios.
  storeConfig(`SESS_${ticket}`, ticketData);
  
  return ticket;
}

/**
 * Valida si un string es un ticket de sesión válido y no expirado.
 * @param {string} ticketId 
 * @returns {boolean}
 */
function validateSessionTicket(ticketId) {
  if (!ticketId) return false;
  
  const rawData = _getStore_().getProperty(`SESS_${ticketId}`);
  if (!rawData) return false;

  try {
    const data = JSON.parse(rawData);
    if (Date.now() > data.expires_at) {
      deleteConfig(`SESS_${ticketId}`);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ─── API PÚBLICA: CUENTAS DE PROVIDERS ───────────────────────────────────────

/**
 * Registra las credenciales de una cuenta de un provider.
 * Las credenciales se almacenan con la clave ACCOUNT_{provider}_{accountId}_KEY.
 *
 * @param {string} providerId - ID del provider (ej: 'notion').
 * @param {string} accountId  - ID único de la cuenta (ej: 'acc_001').
 * @param {string} apiKey     - La API Key o token de acceso.
 * @param {string} [label]    - Nombre legible de la cuenta (ej: 'Empresa A').
 * @returns {boolean} `true` si se guardó correctamente.
 */
function storeProviderAccount(providerId, accountId, apiKey, name) {
  const keyForKey  = `ACCOUNT_${providerId}_${accountId}_KEY`;
  const keyForMeta = `ACCOUNT_${providerId}_${accountId}_META`;

  const meta = JSON.stringify({
    label:      name || accountId,
    provider:   providerId,
    account_id: accountId,
    created_at: new Date().toISOString(),
  });


  // Escribir ambas propiedades bajo el mismo lock
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
      throw new Error(`system_config: Lock timeout al guardar cuenta "${accountId}" de "${providerId}".`);
    }
    const store = _getStore_();
    store.setProperty(keyForKey, apiKey);
    store.setProperty(keyForMeta, meta);
    logInfo(`[system_config] Cuenta guardada: ${providerId}:${accountId} (${name || accountId})`);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Recupera la API Key de una cuenta de provider.
 * @param {string} providerId - ID del provider.
 * @param {string} accountId  - ID de la cuenta.
 * @returns {string|null} La API Key o `null` si no existe.
 */
function readProviderApiKey(providerId, accountId) {
  return _getStore_().getProperty(`ACCOUNT_${providerId}_${accountId}_KEY`) || null;
}

/**
 * Lista todas las cuentas registradas para un provider.
 * @param {string} providerId - ID del provider.
 * @returns {Array<Object>} Array de objetos de metadata de cuenta.
 */
function listProviderAccounts(providerId) {
  const allProps = _getStore_().getProperties();
  const prefix   = `ACCOUNT_${providerId}_`;
  const accounts = [];

  Object.keys(allProps).forEach(key => {
    if (key.startsWith(prefix) && key.endsWith('_META')) {
      try {
        accounts.push(JSON.parse(allProps[key]));
      } catch (e) {
        logWarn(`[system_config] Meta inválido para clave: ${key}`);
      }
    }
  });

  return accounts;
}

// ─── API PÚBLICA: HOME ROOT ───────────────────────────────────────────────────

/**
 * Guarda el ID de la carpeta raíz del sistema en Drive.
 * @param {string} folderId - El ID de la carpeta .core_system de Drive.
 * @returns {boolean}
 */
function storeRootFolderId(folderId) {
  return storeConfig('SYS_ROOT_FOLDER_ID', folderId);
}

/**
 * Recupera el ID de la carpeta raíz del sistema.
 * @returns {string|null}
 */
function readRootFolderId() {
  return _getStore_().getProperty('SYS_ROOT_FOLDER_ID') || null;
}


// ─── UTILIDADES CRIPTOGRÁFICAS ────────────────────────────────────────────────

/**
 * Calcula el hash SHA-256 de un string usando las utilidades nativas de GAS.
 * GAS provee `Utilities.computeDigest` con el motor V8. No requiere librerías externas.
 *
 * @param {string} input - El string a hashear.
 * @returns {string} El hash en formato hexadecimal.
 * @private
 */
function _sha256_(input) {
  if (!input) return null;
  const rawBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );
  // Convertir el array de bytes con signo a hex
  return rawBytes.map(b => {
    const hex = (b < 0 ? b + 256 : b).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
