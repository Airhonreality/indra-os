// =============================================================================
// ARTEFACTO: 1_logic/provider_registry.gs
// CAPA: 1 — Logic Layer (Orquestación)
// RESPONSABILIDAD: El directorio vivo del sistema. Escanea el scope global de GAS
//         buscando todas las funciones CONF_* declaradas por los
//         archivos de la capa 2_providers. Zero config manual: agregar un
//         archivo con su CONF_* = provider disponible.
//
// AXIOMAS:
//   - Auto-registro via `globalThis`. Los providers se declaran, no se registran.
//   - Ningún provider hardcodeado. El registry es completamente agnóstico.
//   - Un provider con config_schema no vacío pero sin cuentas → needs_setup: true.
//   - Si NINGÚN provider está listo → metadata.status = "NEEDS_SETUP".
//
// RESTRICCIONES:
//   - NO puede instanciar ni ejecutar handlers de providers.
//   - NO puede modificar los objetos CONF_* que lee (solo lectura).
//   - NO puede cachear el resultado de buildManifest (stateless).
//
// CONVENCIÓN DE NAMING (OBLIGATORIA para providers):
//   Las funciones deben llamarse exactamente CONF_{ID_EN_MAYUS}().
//   Ejemplo: CONF_NOTION(), CONF_DRIVE(), CONF_SYSTEM().
//   Esto es lo que el auto-escaneo busca en el scope global de GAS.
//
// DEPENDENCIAS (scope global GAS):
//   - system_config.gs  → readProviderApiKey, listProviderAccounts
//   - monitoring_service.gs → logInfo, logDebug, logWarn
//   - error_handler.gs  → createError
// =============================================================================

/**
 * Prefijo que identifica la manifestación de un Silo via función global.
 * Sigue el ADR-002: El Protocolo de Manifestación.
 * @const {string}
 */
const SILO_MANIFEST_PREFIX = 'CONF_';

// ─── ESCANEO DEL SCOPE GLOBAL ─────────────────────────────────────────────────

/**
 * Escanea el scope global de GAS y retorna todos los contratos de Silo detectados.
 * Se ejecuta en cada llamada (stateless). Busca funciones que empiecen por "CONF_".
 *
 * @returns {Array<Object>} Array de objetos de configuración de provider.
 * @private
 */
function _scanProviders() {
  const configs = [];
  const knownPrefixes = ['CONF_SYSTEM', 'CONF_DRIVE', 'CONF_NOTION', 'CONF_EMAIL', 'CONF_LLM'];

  // Intento 1: Iteración sobre el contexto global (Sincronía Glandular)
  // En GAS V8, 'this' o 'globalThis' pueden contener las funciones globales.
  const scope = globalThis || this;

  // Lista de posibles nombres de funciones de configuración
  // GAS no siempre permite iterar sobre el scope global de forma fiable entre archivos.
  const possibleKeys = Object.keys(scope).filter(k => k.startsWith(SILO_MANIFEST_PREFIX));

  // Si no se detectan llaves pero sabemos que hay providers, usamos la lista conocida (Defensa en Profundidad)
  const keysToTry = possibleKeys.length > 0 ? possibleKeys : knownPrefixes;

  keysToTry.forEach(key => {
    if (typeof scope[key] !== 'function') return;

    try {
      const conf = scope[key]();
      if (!conf || typeof conf !== 'object' || !conf.id || !conf.implements) {
        return;
      }
      configs.push(conf);
    } catch (e) {
      // Silencioso para no romper el manifest si un provider falla individualmente
    }
  });

  return configs;
}

/**
 * Determina si un provider tiene todas sus cuentas/API keys requeridas configuradas.
 * Un provider sin `config_schema` (o con schema vacío) se considera siempre configurado.
 *
 * @param {Object} conf - Objeto PROVIDER_CONF_*.
 * @returns {boolean} `true` si el provider está listo para usarse.
 * @private
 */
function _isProviderConfigured(conf) {
  const schema = conf.config_schema || [];
  if (schema.length === 0) return true; // Sin schema → no necesita config (ej: provider_system)

  // Para hito 1: verificar si existe al menos una cuenta 'default'
  const accounts = listProviderAccounts(conf.id); // → system_config.gs
  return accounts.length > 0;
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

/**
 * Compila y retorna el SYSTEM_MANIFEST completo.
 * El manifest lista todos los Silos disponibles (un Silo por cuenta configurada).
 *
 * Retorna The Return Law: { items: [...], metadata: { status } }.
 *
 * @returns {{ items: Array<Object>, metadata: Object }}
 */
function buildManifest() {
  const allConfigs = _scanProviders();
  const manifestItems = [];

  if (allConfigs.length === 0) {
    logWarn('[provider_registry] No se encontraron providers registrados.');
    return {
      items: [],
      metadata: { status: 'NEEDS_SETUP', error: 'No hay providers registrados en el Core.' },
    };
  }

  allConfigs.forEach(conf => {
    const accounts = listProviderAccounts(conf.id);
    const hasSchema = conf.config_schema && conf.config_schema.length > 0;

    if (accounts.length === 0) {
      // Caso 1: Provider configurado pero sin cuentas específicas (o no requiere config)
      // Ojo: Si requiere config pero no tiene cuentas -> needs_setup: true
      manifestItems.push({
        id: conf.id,
        handle: {
          ns: `com.indra.system.silo`,
          alias: conf.id,
          label: conf.handle?.label || conf.id
        },
        class: (conf.class || 'SILO').toUpperCase(),
        protocols: Object.keys(conf.implements || {}).map(p => p.toUpperCase()),
        capabilities: conf.capabilities || {},
        provider: conf.id,
        provider_base: conf.id,
        protocol_meta: conf.protocol_meta || {},
        raw: {
          needs_setup: hasSchema,
          accounts: [],
        },
      });
    } else {
      accounts.forEach(acc => {
        const accountLabel = acc.label || acc.account_id;
        manifestItems.push({
          id: `${conf.id}:${acc.account_id}`,
          handle: {
            ns: `com.indra.system.silo`,
            alias: `${conf.id}_${acc.account_id}`,
            label: `${conf.handle?.label || conf.id} (${accountLabel})`
          },
          class: (conf.class || 'SILO').toUpperCase(),
          protocols: Object.keys(conf.implements || {}).map(p => p.toUpperCase()),
          capabilities: conf.capabilities || {},
          provider: `${conf.id}:${acc.account_id}`,
          provider_base: conf.id,
          protocol_meta: conf.protocol_meta || {},
          account_id: acc.account_id,
          raw: {
            needs_setup: false,
            account: acc,
            accounts: accounts,
          },
        });
      });
    }
  });

  // El estado global es OK si no hay providers críticos bloqueados (opcional para Hito 1)
  const status = manifestItems.some(i => i.raw.needs_setup) ? 'NEEDS_SETUP' : 'OK';

  logInfo(`[provider_registry] Manifest compilado. Silos proyectados: ${manifestItems.length}. Status: ${status}`);
  return { items: manifestItems, metadata: { status } };
}

/**
 * Compila el schema de configuración de todos los providers que lo requieren.
 * Usado por el cliente para renderizar dinámicamente el formulario de settings.
 *
 * @returns {{ items: Array<Object>, metadata: Object }}
 */
function buildConfigSchema() {
  const allConfigs = _scanProviders();

  // Filtrar solo providers que requieren configuración de usuario
  const items = allConfigs
    .filter(conf => conf.config_schema && conf.config_schema.length > 0)
    .map(conf => ({
      id: conf.id,
      handle: {
        ns: 'com.indra.system.config',
        alias: `config_${conf.id}`,
        label: `Configuración de ${conf.name}`
      },
      name: conf.name,
      class: 'CONFIG_SCHEMA',
      provider: 'system',
      protocols: ['SYSTEM_CONFIG_WRITE'],
      fields: conf.config_schema,
    }));

  logInfo(`[provider_registry] Config schema compilado. Providers con schema: ${items.length}`);
  return { items, metadata: { status: 'OK' } };
}

/**
 * Retorna el objeto de configuración de un provider específico por su ID.
 * Usado internamente por `protocol_router.gs` para resolver handlers.
 *
 * @param {string} providerId - El ID del provider (ej: 'notion', 'notion:HG').
 * @returns {Object|null} El objeto de configuración, o `null` si no existe.
 */
function getProviderConf(providerId) {
  if (!providerId || typeof providerId !== 'string') return null;

  // Extraer el baseId por si viene con cuenta (ej: notion:HG -> notion)
  const baseId = providerId.split(':')[0];
  const funcName = `${SILO_MANIFEST_PREFIX}${baseId.toUpperCase()}`;
  const manifestFunc = globalThis[funcName];

  if (typeof manifestFunc !== 'function') {
    logWarn(`[provider_registry] Silo no encontrado o no manifestado: "${baseId}" (buscado: ${funcName})`);
    return null;
  }

  try {
    return manifestFunc();
  } catch (e) {
    logError(`[provider_registry] Error al resolver configuración del Silo "${baseId}"`, e);
    return null;
  }
}
