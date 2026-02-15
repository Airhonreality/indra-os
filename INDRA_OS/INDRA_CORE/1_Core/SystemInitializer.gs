// ======================================================================
// ARTEFACTO: 1_Core/SystemInitializer.gs (VERSIÓN CORREGIDA)
// DHARMA: Ser el Mago del Bootstrap. Orquesta la creación y verificación
//         de la ESTRUCTURA FÍSICA del sistema (carpetas y Sheets)
//         de forma idempotente.
// ======================================================================

/**
 * Factory para crear una instancia del SystemInitializer.
 * 
 * @param {object} config - Configuración del inicializador
 * @param {object} config.manifest - SystemManifest (Constitución del sistema)
 * @param {object} config.driveAdapter - Adapter para interactuar con Google Drive
 * @param {object} config.sheetAdapter - Adapter para interactuar con Google Sheets
 * @param {object} config.configurator - Servicio de configuración (PropertiesService)
 * @param {object} config.errorHandler - Manejador de errores del sistema
 * @returns {object} Instancia congelada del SystemInitializer
 */
function createSystemInitializer({ 
  manifest,
  laws = {}, 
  driveAdapter, 
  sheetAdapter, 
  configurator, 
  tokenManager,
  cipherAdapter,
  errorHandler,
  monitoringService,
  keyGenerator
}) {
  const constitution = laws.constitution || manifest;
  
  // ============================================================
  // ============================================================
  
  if (!constitution || typeof constitution !== 'object') {
    throw errorHandler.createError('CONFIGURATION_ERROR', 'SystemInitializer: constitution dependency is required');
  }
  if (!driveAdapter) throw new Error('SystemInitializer: driveAdapter dependency is required');
  if (!sheetAdapter) throw new Error('SystemInitializer: sheetAdapter dependency is required');
  if (!configurator) throw new Error('SystemInitializer: configurator dependency is required');
  if (!tokenManager) throw new Error('SystemInitializer: tokenManager dependency is required');

  // AXIOMA: Resiliencia de Infraestructura (H7-RESILIENCE)
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {}, 
    logEvent: () => {}, sendCriticalAlert: () => {} 
  };
  if (!cipherAdapter) throw new Error('SystemInitializer: cipherAdapter dependency is required');
  if (!errorHandler) throw new Error('SystemInitializer: errorHandler dependency is required');
  
  // ============================================================
  // ============================================================
  
  function ensureSystemAnchor(actionsTaken) {
    const anchorPropertyKey = constitution.ANCHOR_PROPERTY;
    // --- INICIO DE CORRECCIÓN ---
    const existingRootId = configurator.retrieveParameter({ key: anchorPropertyKey });
    // --- FIN DE CORRECCIÓN ---
    
    if (existingRootId) {
      return existingRootId;
    }
    
    const rootFolderName = constitution.DRIVE_SCHEMA.ROOT.NAME;
    try {
      const result = driveAdapter.createFolder({
        parentFolderId: 'root',
        folderName: rootFolderName
      });
      const newFolderId = result.folderId;
      // --- INICIO DE CORRECCIÓN ---
      configurator.storeParameter({ key: anchorPropertyKey, value: newFolderId });
      // --- FIN DE CORRECCIÓN ---
      actionsTaken.push(`Created and anchored root folder '${rootFolderName}'`);
      return newFolderId;
    } catch (error) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `SystemInitializer: Failed to create root folder: ${error.message}`, { originalError: error });
    }
  }
  
  function ensureDriveSchema(rootFolderId, actionsTaken) {
    const driveSchema = constitution.DRIVE_SCHEMA;
    for (const folderKey in driveSchema) {
      if (folderKey === 'ROOT') continue;
      
      const folderConfig = driveSchema[folderKey];
      if (!folderConfig || !folderConfig.PATH) continue;
      
      try {
        // --- INICIO DE LA CURA ---
        // Siempre creamos/verificamos, y luego guardamos su ID.
        const resolveResult = driveAdapter.resolvePath({
          rootFolderId: rootFolderId,
          path: folderConfig.PATH,
          createIfNotExists: true
        });
        
        if (resolveResult && resolveResult.folderId) {
          // Guardar el ID de la subcarpeta en PropertiesService con una clave predecible.
          const propertyKey = `INDRA_FOLDER_${folderKey.toUpperCase()}_ID`;
          const existingId = configurator.retrieveParameter({ key: propertyKey });
          
          // Solo actuar (guardar y registrar acción) si hay cambios o falta la configuración
          if (resolveResult.created || resolveResult.folderId !== existingId) {
            configurator.storeParameter({ key: propertyKey, value: resolveResult.folderId });
            
            if (resolveResult.created) {
              actionsTaken.push(`Created folder '${folderConfig.PATH}' and stored its ID.`);
            } else {
              actionsTaken.push(`Linked existing folder '${folderConfig.PATH}' to system configuration.`);
            }
            _monitor.logDebug(`[SystemInitializer] Configurada carpeta '${folderKey}' -> ID: ${resolveResult.folderId} (Ruta: ${folderConfig.PATH})`);
          } else {
            // Silencioso: la carpeta existe y el ID coincide con lo guardado
            _monitor.logDebug(`[SystemInitializer] Verificada carpeta '${folderKey}' (ya configurada).`);
          }
        } else {
          _monitor.logWarn(`[SystemInitializer] ADVERTENCIA: No se pudo resolver ID para carpeta '${folderKey}' (Ruta: ${folderConfig.PATH})`);
        }
        // --- FIN DE LA CURA ---
      } catch (error) {
        throw errorHandler.createError('EXTERNAL_API_ERROR', `SystemInitializer: Failed to ensure folder structure for path '${folderConfig.PATH}': ${error.message}`, { originalError: error });
      }
    }
  }
  
  function ensureSheetSchema(rootFolderId, actionsTaken) {
    const sheetsSchema = constitution.SHEETS_SCHEMA;
    for (const sheetKey in sheetsSchema) {
      const sheetConfig = sheetsSchema[sheetKey];
      if (!sheetConfig || !sheetConfig.PROPERTY) continue;
      
      // --- INICIO DE CORRECCIÓN ---
      const sheetId = configurator.retrieveParameter({ key: sheetConfig.PROPERTY });
      // --- FIN DE CORRECCIÓN ---
      
      if (!sheetId) {
        try {
          const createResult = sheetAdapter.createSheet({
            name: sheetConfig.NAME,
            header: sheetConfig.HEADER
          });
          const newSheetId = createResult.sheetId;
          
          driveAdapter.move({
            targetId: newSheetId,
            destinationFolderId: rootFolderId
          });
          
          // --- INICIO DE CORRECCIÓN ---
          configurator.storeParameter({ key: sheetConfig.PROPERTY, value: newSheetId });
          // --- FIN DE CORRECCIÓN ---
          actionsTaken.push(`Created and anchored Google Sheet '${sheetConfig.NAME}' inside IndraCore folder.`);
          
        } catch (error) {
          throw errorHandler.createError('EXTERNAL_API_ERROR', `SystemInitializer: Failed to create or move Sheet '${sheetConfig.NAME}': ${error.message}`, { originalError: error });
        }
      } else {
        try {
          const verifyResult = sheetAdapter.verifyHeader({
            sheetId: sheetId,
            expectedHeader: sheetConfig.HEADER
          });
          if (verifyResult.updated) {
            actionsTaken.push(`Updated header for Google Sheet '${sheetConfig.NAME}'`);
          }
        } catch (error) {
          throw errorHandler.createError('EXTERNAL_API_ERROR', `SystemInitializer: Failed to verify header for Sheet '${sheetConfig.NAME}': ${error.message}`, { originalError: error });
        }
      }
    }
  }

  /**
   * Asegura que el sistema de tokens esté inicializado con su clave maestra y archivo.
   * @private
   */
  function ensureTokenSystem(rootFolderId, actionsTaken) {
    // 1. Verificar MASTER_ENCRYPTION_KEY
    let masterKey = configurator.retrieveParameter({ key: 'MASTER_ENCRYPTION_KEY' });
    if (!masterKey) {
      const uuid = keyGenerator ? keyGenerator.generate() : Utilities.getUuid();
      masterKey = uuid;
      configurator.storeParameter({ key: 'MASTER_ENCRYPTION_KEY', value: masterKey });
      actionsTaken.push('Generated new MASTER_ENCRYPTION_KEY');
    }

    // 2. Verificar INDRA_CORE_SATELLITE_API_KEY (Master Key del Sistema)
    let satelliteKey = configurator.retrieveParameter({ key: 'INDRA_CORE_SATELLITE_API_KEY' });
    if (!satelliteKey) {
      // AXIOMA: Eliminación de Aleatoriedad (Solicitud Usuario v12.1)
      // Se establece un token de setup inicial para permitir la primera conexión.
      satelliteKey = "INDRA_SETUP_CORE"; 
      configurator.storeParameter({ key: 'INDRA_CORE_SATELLITE_API_KEY', value: satelliteKey });
      configurator.storeParameter({ key: 'INDRA_SYSTEM_TOKEN', value: satelliteKey });
      actionsTaken.push('Initialized system with default setup token: INDRA_SETUP_CORE');
    }

    // 3. Verificar TOKENS_FILE_ID
    let tokensFileId = configurator.retrieveParameter({ key: 'TOKENS_FILE_ID' });
    if (!tokensFileId) {
      try {
        const initialTokens = { version: "1.0", accounts: {} };
        const plainContent = JSON.stringify(initialTokens, null, 2);
        
        // AXIOMA: Soberanía de Credenciales (L7/L9) - Usar CipherAdapter Real
        const encryptedContent = cipherAdapter.encrypt({ text: plainContent, key: masterKey });
        
        const createResult = driveAdapter.store({
          folderId: rootFolderId,
          fileName: ".tokens.json",
          content: encryptedContent,
          mimeType: "text/plain" // Cambiamos a plain porque ya no es JSON legible
        });
        
        tokensFileId = createResult.fileId;
        configurator.storeParameter({ key: 'TOKENS_FILE_ID', value: tokensFileId });
        actionsTaken.push('Created .tokens.json for multi-account support.');
      } catch (e) {
        throw errorHandler.createError('SYSTEM_FAILURE', `Failed to initialize token system: ${e.message}`, { originalError: e.message });
      }
    }
  }

  /**
   * Migra tokens legados desde PropertiesService a .tokens.json de forma segura.
   * @private
   */
  function migrateLegacyTokens(actionsTaken) {
    if (!constitution.CONNECTIONS) return;
    
    let migratedCount = 0;
    const connections = constitution.CONNECTIONS;
    
    for (const [id, config] of Object.entries(connections)) {
      const legacyKey = config.legacyKey;
      if (!legacyKey) continue;
      
      const val = configurator.retrieveParameter({ key: legacyKey });
      
      // Solo migrar si el valor existe y no es un mock de test
      if (val && !val.includes('MOCK_')) {
        const provider = config.provider || id.split('_')[0].toLowerCase();
        
        try {
          // Verificar si ya existe en TokenManager
          let existing = null;
          try {
            existing = tokenManager.getToken({ provider, accountId: 'default' });
          } catch (e) {
            // Si el proveedor no existe en TM, getToken lanza PROVIDER_NOT_FOUND, lo cual es normal aquí
          }

          if (!existing) {
            tokenManager.setToken({
              provider,
              accountId: 'default',
              tokenData: {
                apiKey: val,
                label: 'Migrated from Legacy',
                isDefault: true
              }
            });
            migratedCount++;
            actionsTaken.push(`Migrated legacy key '${legacyKey}' to TokenManager (${provider})`);
          }
        } catch (e) {
          _monitor.logError(`[SystemInitializer] Failed to migrate ${legacyKey}: ${e.message}`);
        }
      }
    }
    
    if (migratedCount > 0) {
      actionsTaken.push(`Successfully migrated ${migratedCount} legacy tokens.`);
    }
  }

  // ============================================================
  // ============================================================
  
  function runBootstrap() {
    // AXIOMA v11.0: Pre-Flight Vault Check (Resilience with Retry)
    let vaultHealthy = false;
    let lastError = null;
    const maxAttempts = 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (!cipherAdapter) throw new Error("Missing CipherAdapter Factory.");
        
        // Prueba de vida del vault: Encriptar y desencriptar un token dummy
        const testText = "VAULT_PROBE_" + Date.now();
        const testKey = "INTERNAL_BOOT_PROBE_" + attempt;
        const encrypted = cipherAdapter.encrypt({ text: testText, key: testKey });
        const decrypted = cipherAdapter.decrypt({ cipher: encrypted, key: testKey });
        
        if (decrypted !== testText) {
          throw new Error("Vault Integrity Check Failed: Payload mismatch.");
        }
        vaultHealthy = true;
        _monitor.logInfo(`[SystemInitializer] 🔒 Vault Pre-Flight Check: PASSED (Attempt ${attempt})`);
        break;
      } catch (e) {
        lastError = e;
        _monitor.logWarn(`[SystemInitializer] ⚠️ Vault Probe Attempt ${attempt}/${maxAttempts} failed: ${e.message}`);
        if (attempt < maxAttempts) {
          Utilities.sleep(Math.pow(2, attempt) * 100); // Exponential backoff
        }
      }
    }

    if (!vaultHealthy) {
      throw errorHandler.createError('VAULT_UNREACHABLE', `SystemInitializer: Cryptographic Vault is unreachable or compromised. Cause: ${lastError ? lastError.message : 'Unknown'}`, { fatal: true });
    }

    // AXIOMA: Inicialización Atómica (L9)
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      throw errorHandler.createError('SYSTEM_FAILURE', 'System already being initialized by another process.');
    }

    const actionsTaken = [];
    try {
      const rootFolderId = ensureSystemAnchor(actionsTaken);
      ensureDriveSchema(rootFolderId, actionsTaken);
      ensureSheetSchema(rootFolderId, actionsTaken);
      
      // Multi-Account Token System Support
      ensureTokenSystem(rootFolderId, actionsTaken);
      migrateLegacyTokens(actionsTaken);
      
      const status = actionsTaken.length === 0 ? 'verified_ok' : 'configured_ok';
      
      return {
        status: status,
        actionsTaken: actionsTaken
      };
      
    } catch (error) {
      if (error.code) throw error;

      throw errorHandler.createError('BOOTSTRAP_ERROR', `SystemInitializer: Bootstrap process failed: ${error.message}`, { 
          actionsTaken,
          originalError: error
      });
    }
  }
  
  const schemas = {
    runBootstrap: {
      description: "Executes an idempotent architectural bootstrap to initialize technical registries, containers, and cryptographic vaults.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for isolation." }
        }, 
        outputs: {
          status: { type: "string", io_behavior: "PROBE", description: "Final system readiness state." },
          actionsTaken: { type: "array", io_behavior: "STREAM", description: "Audit trail of technical transformations performed." }
        } 
      }
    }
  };
  
  return Object.freeze({
    id: "system_initializer",
    label: "Bootstrap Engine",
    description: "Industrial bootstrap engine for foundational resource allocation and identity sovereignty.",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    semantic_intent: "BOOT",
    schemas: schemas,
    runBootstrap
  });
}






