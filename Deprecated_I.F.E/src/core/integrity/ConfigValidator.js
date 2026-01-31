import { VaultManager } from '../vault/VaultManager';

/**
 * 🛡️ INDRA CONFIG VALIDATOR (core/integrity/ConfigValidator.js)
 * Engineering: Validates critical environment configuration at startup.
 */

/**
 * Valida la configuración del entorno
 * @returns {Object} Estado de validación con errores, warnings y config
 */
export function validateConfig() {
  const errors = [];
  const warnings = [];

  // Validar URL del backend (Dual Mode: Vault or Seed)
  const isVaultConfigured = VaultManager.isConfigured();
  const seedUrl = import.meta.env.VITE_GAS_URL;

  let activeUrl = 'NOT_CONFIGURED';

  if (isVaultConfigured) {
    // Vault Mode (Preferred)
    const vaultConfig = VaultManager.getConfig();
    activeUrl = vaultConfig.deploymentUrl;
  } else if (seedUrl) {
    // Seed Mode (Bootstrap)
    activeUrl = seedUrl;
    warnings.push('⚡ Running in BOOTSTRAP MODE (Seed URL). Discovery will execute shortly.');

    if (!seedUrl.startsWith('https://script.google.com')) {
      warnings.push('VITE_GAS_URL no parece ser una URL válida de Google Apps Script');
    }
    if (seedUrl.includes('YOUR_DEPLOYMENT_ID_HERE')) {
      errors.push('VITE_GAS_URL contiene placeholder. Actualiza .env.');
    }
  } else {
    errors.push('CRITICAL: No connection configuration found (Vault empty, .env missing).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      backendUrl: activeUrl,
      source: isVaultConfigured ? 'VAULT' : 'SEED',
      appName: import.meta.env.VITE_APP_NAME || 'INDRA OS',
      version: import.meta.env.VITE_APP_VERSION || 'dev',
      environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
      debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
      offlineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true'
    }
  };
}

/**
 * Obtiene la URL del backend desde variables de entorno
 * @returns {string} URL del backend
 */
export function getBackendUrl() {
  return import.meta.env.VITE_GAS_URL;
}

/**
 * Verifica si la app está en modo debug
 * @returns {boolean}
 */
export function isDebugMode() {
  return import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true' ||
    import.meta.env.MODE === 'development';
}

/**
 * Obtiene metadata de la aplicación
 * @returns {Object} Metadata
 */
export function getAppMetadata() {
  return {
    name: import.meta.env.VITE_APP_NAME || 'INDRA OS',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0-beta',
    environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
  };
}
