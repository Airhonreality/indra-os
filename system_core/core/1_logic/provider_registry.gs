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
  const knownPrefixes = ['CONF_SYSTEM', 'CONF_DRIVE', 'CONF_SHEETS', 'CONF_NOTION', 'CONF_EMAIL', 'CONF_LLM', 'CONF_INTELLIGENCE', 'CONF_AUTOMATION', 'CONF_COMPUTE'];

  const scope = globalThis || this;

  const keysToTry = Array.from(new Set([
    ...knownPrefixes, // PRIORIDAD 0: Inyección explícita para superar falta de enumeración en V8
    ...Object.keys(scope).filter(k => k.startsWith(SILO_MANIFEST_PREFIX))
  ]));

  logInfo(`[provider_registry] Iniciando escaneo. Llaves potenciales: ${keysToTry.length}`);
  
  // LOG DE AUDITORÍA (v4.84)
  console.log('[provider_registry] Iniciando escaneo. Prefijos conocidos:', keysToTry.join(', '));
  console.log('[provider_registry] ¿CONF_SYSTEM es función?:', typeof CONF_SYSTEM === 'function');
  
  keysToTry.forEach(key => {
    // AXIOMA DE PERSALENCIA: Intentamos resolver la función incluso si no es enumerable
    let fn = scope[key];
    
    // Cascada de resolución para GAS V8
    if (!fn && typeof this[key] === 'function') fn = this[key];
    if (!fn && typeof eval === 'function') {
       try { fn = eval(key); } catch(e) {}
    }

    if (typeof fn !== 'function') {
      logInfo(`[provider_registry] Saltando "${key}": No se pudo resolver como función.`);
      return;
    }

    try {
      const conf = fn();
      // AXIOMA ESTRUCTURAL: Todo proveedor debe usar el mapa enriquecido "capabilities" (Estándar Moderno).
      // Ya no se aceptan contratos antiguos ('implements' / 'protocols' planos).
      if (!conf || typeof conf !== 'object' || !conf.id || !conf.capabilities) {
        logInfo(`[provider_registry] Rechazando "${key}": Contrato inválido o incompleto (Falta id o capabilities)`);
        return;
      }
      logInfo(`[provider_registry] Provider detectado con éxito: ${conf.id}`);
      configs.push(conf);
    } catch (e) {
      logError(`[provider_registry] Error fatal al ejecutar "${key}": ${e.message}`);
    }
  });

  // FALLBACK ABSOLUTO (v4.91): Si el sistema no aparece, lo inyectamos por fuerza bruta.
  // Es Vital para superar la opacidad de Google en modo WebApp.
  const coreIds = ['system', 'automation', 'compute', 'drive', 'sheets', 'notion', 'intelligence', 'calendar_universal', 'pipeline'];
  
  coreIds.forEach(id => {
    if (!configs.find(c => c.id === id)) {
      const funcName = `CONF_${id.toUpperCase()}`;
      try {
        // AXIOMA DE RESOLUCIÓN RESILIENTE (Turn 47)
        let fn = scope[funcName];
        if (!fn && typeof this[funcName] === 'function') fn = this[funcName];
        if (!fn && typeof eval === 'function') {
          try { fn = eval(funcName); } catch(e) {}
        }
        
        if (typeof fn === 'function') {
          logInfo(`[provider_registry] Registro forzado JIT exitoso para: ${id}`);
          configs.push(fn());
        }
      } catch(e) {
        logError(`[provider_registry] No se pudo inyectar el motor ${id}: ${e.message}`);
      }
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
function SYSTEM_MANIFEST() {
  // AXIOMA DE CRISTALIZACIÓN: En versiones futuras aquí consultaremos el Ledger KERNEL.
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
    // AXIOMA DE SINCERIDAD (Nivel Suh): El Core proyecta toda su realidad detectada.
    // El filtrado por 'exposure' o 'class' es responsabilidad de la Capa de Presentación.

    const accounts = listProviderAccounts(conf.id);
    const hasSchema = conf.config_schema && conf.config_schema.length > 0;

    if (accounts.length === 0) {
      // Caso 1: Provider configurado pero sin cuentas específicas (o no requiere config)
      const protocols = conf.protocols || (conf.capabilities ? Object.keys(conf.capabilities) : []);
      const implementsMap = conf.implements || (conf.capabilities ? Object.keys(conf.capabilities).reduce((acc, p) => {
        acc[p] = conf.capabilities[p].handler || 
                 conf.default_handler || 
                 `handle${conf.id.charAt(0).toUpperCase() + conf.id.slice(1)}`;
        return acc;
      }, {}) : {});

      // AXIOMA DE EXISTENCIA: Si el provider es 'system', su ID de cuenta es 'internal'
      const finalSiloId = conf.id === 'system' ? 'system' : conf.id;
      
      manifestItems.push({
        id: finalSiloId,
        handle: {
          ns: `com.indra.system.silo`,
          alias: conf.id,
          label: conf.handle?.label || conf.id,
          icon: conf.handle?.icon || null,
          entry_point: conf.handle?.entry_point || null
        },
        class: (conf.class || 'SILO').toUpperCase(),
        protocols: protocols.map(p => p.toUpperCase()),
        implements: implementsMap,
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
        const protocols = conf.protocols || (conf.capabilities ? Object.keys(conf.capabilities) : []);
        const implementsMap = conf.implements || (conf.capabilities ? Object.keys(conf.capabilities).reduce((acc, p) => {
          acc[p] = conf.capabilities[p].handler || 
                   conf.default_handler || 
                   `handle${conf.id.charAt(0).toUpperCase() + conf.id.slice(1)}`;
          return acc;
        }, {}) : {});

        manifestItems.push({
          id: `${conf.id}:${acc.account_id}`,
          handle: {
            ns: `com.indra.system.silo`,
            alias: `${conf.id}_${acc.account_id}`,
            label: `${conf.handle?.label || conf.id} (${accountLabel})`,
            icon: conf.handle?.icon || null,
            entry_point: conf.handle?.entry_point || null
          },
          class: (conf.class || 'SILO').toUpperCase(),
          protocols: protocols.map(p => p.toUpperCase()),
          implements: implementsMap,
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
function SYSTEM_CONFIG_SCHEMA() {
  const allConfigs = _scanProviders();

  // Filtrar solo providers que requieren configuración de usuario y son públicos.
  const items = allConfigs
    .filter(conf => conf.exposure !== 'internal' && conf.config_schema && conf.config_schema.length > 0)
    .map(conf => ({
      id: conf.id,
      handle: {
        ns: 'com.indra.system.config',
        alias: `config_${conf.id}`,
        label: `Configuración de ${conf.handle?.label || conf.id}`,
        icon: conf.handle?.icon || 'SERVICE'
      },
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
  
  // AXIOMA DE RESOLUCIÓN RESILIENTE (v4.86)
  let manifestFunc = globalThis[funcName];
  if (!manifestFunc && typeof this[funcName] === 'function') manifestFunc = this[funcName];
  if (!manifestFunc && typeof eval === 'function') {
    try { manifestFunc = eval(funcName); } catch(e) {}
  }

  if (typeof manifestFunc !== 'function') {
    logWarn(`[provider_registry] Silo no encontrado o no manifestado: "${baseId}" (buscado: ${funcName})`);
    return null;
  }

  try {
    const rawConf = manifestFunc();
    // AXIOMA DE SÍNTESIS (Evolución): Clonamos el objeto para poder enriquecerlo aunque esté congelado.
    const conf = JSON.parse(JSON.stringify(rawConf));
    
    // Si el provider es parsimonioso (modelo nuevo), el registry lo enriquece al vuelo.
    if (conf.capabilities) {
      // 1. Sintetizar protocolos (si no existen)
      conf.protocols = conf.protocols || Object.keys(conf.capabilities);
      
      // 2. Sintetizar mapa de implementación
      if (!conf.implements) {
        conf.implements = {};
        Object.keys(conf.capabilities).forEach(p => {
          // Prioridad: handler explícito en capacidad > default_handler > handleNombreProvider
          conf.implements[p] = conf.capabilities[p].handler || 
                              conf.default_handler || 
                              `handle${conf.id.charAt(0).toUpperCase() + conf.id.slice(1)}`;
        });
      }
    }
    
    return conf;
  } catch (e) {
    logError(`[provider_registry] Error al resolver configuración del Silo "${baseId}"`, e);
    return null;
  }
}
