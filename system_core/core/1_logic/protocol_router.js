// =============================================================================
// ARTEFACTO: 1_logic/protocol_router.gs
// CAPA: 1 — Logic Layer (Orquestación)
// RESPONSABILIDAD: El enrutador ciego. Traduce { provider, protocol } del UQO a una
//         ejecución de función de handler. Valida el retorno contra el contrato
//         de átomo antes de retornarlo al gateway.
//
// AXIOMAS:
//   - El campo `query` del UQO es un tubo opaco: se pasa sin modificar al provider.
//   - Cada función de handler está prefijada con el ID del provider en el scope
//     global de GAS para evitar colisiones de nombres.
//     Convención: `{provider_id}_{NombreDeFuncion}`.
//     Ejemplo: `notion_executeTabularStream`, `drive_executeHierarchyTree`.
//   - AXIOMA DE DEFENSA (DATA_CONTRACTS §2.4): Si el provider retorna ítems
//     sin `id`, `name` o `class` → CONTRACT_VIOLATION antes de llegar al cliente.
//   - El router nunca conoce la implementación de ningún protocolo.
//
// RESTRICCIONES:
//   - NO puede tener lógica de ningún protocolo específico.
//   - NO puede modificar el campo `query` del UQO.
//   - NO puede retornar datos sin pasar la validación de contrato de átomo.
//   - NO puede cachear el resultado de ninguna ejecución.
//
// DEPENDENCIAS (scope global GAS):
//   - provider_registry.gs  → getProviderConf
//   - error_handler.gs      → createError
//   - monitoring_service.gs → logInfo, logDebug, logWarn, logError
// =============================================================================

// ─── VALIDACIÓN DE CONTRATO (AXIOMA DE DEFENSA) ────────────────────────────────

// ─── VALIDACIÓN DE CONTRATO (AXIOMA DE DEFENSA) ────────────────────────────────

/**
 * Valida que cada ítem del array retornado por el provider cumple el
 * contrato mínimo del Átomo Universal (v3.0 IUH).
 * Campos obligatorios: `id`, `handle`, `class`.
 *
 * @param {Array} items       - Array de ítems retornado por el provider.
 * @param {string} providerId - ID del provider que generó los ítems.
 * @param {string} protocol   - El protocolo ejecutado (para modular rigor de validación).
 * @throws {Object} Error estructurado `CONTRACT_VIOLATION` si algún átomo es inválido.
 * @private
 */
function _validateAtomContract_(items, providerId, protocol) {
  if (!items || !Array.isArray(items)) {
    throw createError(
      'CONTRACT_VIOLATION',
      `Provider "${providerId}" violó la Ley de Retorno: "items" debe ser un Array (aunque esté vacío).`,
      { received: typeof items }
    );
  }

  // Lista de protocolos "ligeros" que devuelven punteros o vistas parciales (no átomos completos)
  const LIGHTWEIGHT_PROTOCOLS = ['SYSTEM_PINS_READ', 'SYSTEM_PIN', 'ATOM_CREATE', 'SCHEMA_FIELD_OPTIONS', 'HIERARCHY_TREE', 'REVISIONS_LIST', 'SCHEMA_MUTATE'];
  const isFullDataProtocol = !LIGHTWEIGHT_PROTOCOLS.includes(protocol);

  items.forEach((item, index) => {
    // 1. SINCERIDAD DE IDENTIDAD (ADR-001): Zero Pity Validation
    // El ítem debe venir con su handle completo desde el origen.
    const handle = item.handle;

    if (!handle || !handle.ns || !handle.alias || !handle.label) {
      throw createError(
        'CONTRACT_VIOLATION',
        `LEY_DE_ADUANA: El provider "${providerId}" entregó materia sin identidad sincera (handle.ns/alias/label requeridos).`,
        { providerId, atomId: item.id, proto: protocol, handle }
      );
    }

    // 2. Validar campos estructurales obligatorios (Capa 2)
    const REQUIRED_BASE = ['id', 'class'];
    const missing = REQUIRED_BASE.filter(field => !item[field]);
    if (missing.length > 0) {
      throw createError(
        'CONTRACT_VIOLATION',
        `LEY_DE_ADUANA: El provider "${providerId}" entregó materia no canónica. Faltan campos base: [${missing.join(', ')}].`,
        { item_index: index, item }
      );
    }

    // 3. ADR_008: VALIDACIÓN COERCITIVA ESTRUCTURAL (Capa 3 - Payload)
    if (isFullDataProtocol) {
      if (item.class === 'DATA_SCHEMA' || item.class === 'TABULAR') {
        const fields = item.payload?.fields;
        if (!fields || !Array.isArray(fields)) {
          throw createError(
            'CONTRACT_VIOLATION',
            `LEY_DE_ADUANA: El provider "${providerId}" entregó un ${item.class} inválido (payload.fields es requerido).`,
            { providerId, atomId: item.id, proto: protocol }
          );
        }
      }
    }

    // 4. PROHIBICIÓN DE MATERIA OSCURA (LEGACY)
    if (item.columns || (item.payload && item.payload.columns)) {
      throw createError(
        'CONTRACT_VIOLATION',
        `LEY_DE_ADUANA_LEGACY: El provider "${providerId}" intentó cruzar la aduana con "columns". Materia contaminada.`,
        { atomId: item.id }
      );
    }
  });
}

// ─── VALIDACIÓN DE ENTRADA (MEMBRANA CELULAR - ADR_008) ───────────────────────

/**
 * Define los requisitos mínimos de estructura por clase de Átomo.
 * @const
 */
const INDRA_CLASS_INVARIANTS = {
  'DATA_SCHEMA': ['payload.fields'],
  'WORKFLOW': ['payload.stations'],
  'BRIDGE': ['payload.operators']
};

/**
 * Valida el UQO antes de que toque cualquier Provider.
 * Este es el escudo frontal contra la Materia Oscura.
 *
 * @param {Object} uqo - El UQO de entrada.
 * @private
 */
function _validateInputContract_(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();
  const data = uqo.data;

  // ── AXIOMA 1: Sinceridad de Identidad en Nacimiento (ATOM_CREATE) ──
  if (protocol === 'ATOM_CREATE') {
    if (!data) throw createError('INPUT_CONTRACT_VIOLATION', 'ATOM_CREATE requiere objeto "data".');

    // 1. Identidad Humana (Label)
    if (!data.handle?.label || data.handle.label.trim() === '') {
      throw createError('INPUT_CONTRACT_VIOLATION', 'LEY_DE_ADUANA: ATOM_CREATE requiere "handle.label" no vacío.');
    }

    // 2. Invariantes de Clase (ADR-008)
    const invariants = INDRA_CLASS_INVARIANTS[data.class];
    if (invariants) {
      invariants.forEach(path => {
        const parts = path.split('.');
        let val = data;
        for (const part of parts) { val = val ? val[part] : undefined; }

        if (val === undefined || !Array.isArray(val)) {
          throw createError(
            'INPUT_CONTRACT_VIOLATION',
            `Fallo de Invariante de Clase: "${data.class}" requiere que "${path}" sea un Array.`
          );
        }
      });
    }
  }

  // ── AXIOMA 2: Inmutabilidad de Identidad (ATOM_UPDATE) ──
  if (protocol === 'ATOM_UPDATE') {
    if (data && (data.class || data.id)) {
      throw createError(
        'SECURITY_VIOLATION',
        'ADR-001: ATOM_UPDATE no permite modificar "class" ni "id". Identidad Soberana es Inmutable.'
      );
    }
  }

  // ── AXIOMA 3: Aduana de Sincronía (Mirror vs Sovereign) ──
  const WRITE_PROTOCOLS = ['ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE', 'CALENDAR_BATCH', 'TABULAR_WRITE'];
  if (WRITE_PROTOCOLS.includes(protocol)) {
    // Si el UQO trae una instrucción de resonancia en modo Espejo, bloqueamos la escritura física.
    if (uqo.resonance_mode === 'MIRROR') {
      throw createError(
        'SECURITY_VIOLATION',
        'ADR-008 (LEY_DE_SINCRONIA): El origen está en MODO ESPEJO (Mirror). La escritura está bloqueada para preservar la Verdad del Origen.'
      );
    }
  }
}

/**
 * Valida que el objeto retornado por un provider cumple The Return Law:
 * `{ items: Array, metadata: Object }`.
 *
 * @param {*} result          - El resultado retornado por el handler.
 * @param {string} providerId - ID del provider para mensajes de error.
 * @throws {Object} Error estructurado si el retorno viola The Return Law.
 * @private
 */
function _validateReturnLaw_(result, providerId) {
  if (!result || typeof result !== 'object') {
    throw createError(
      'CONTRACT_VIOLATION',
      `Provider "${providerId}" retornó un valor que no es un objeto.`,
      { received: typeof result }
    );
  }

  if (!Object.prototype.hasOwnProperty.call(result, 'items')) {
    throw createError(
      'CONTRACT_VIOLATION',
      `Provider "${providerId}" violó The Return Law: falta el campo "items".`
    );
  }

  if (!Object.prototype.hasOwnProperty.call(result, 'metadata')) {
    throw createError(
      'CONTRACT_VIOLATION',
      `Provider "${providerId}" violó The Return Law: falta el campo "metadata".`
    );
  }
}

// ─── DESPACHO PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Despacha un UQO al handler del provider correspondiente.
 * Punto de entrada único del router. Llamado por `api_gateway.gs`.
 *
 * Flujo:
 * 1. Validar que `provider` y `protocol` están presentes en el UQO.
 * 2. Resolver el PROVIDER_CONF_* del provider via `provider_registry`.
 * 3. Verificar que el provider implementa el protocolo solicitado.
 * 4. Resolver la función handler desde el scope global (globalThis).
 * 5. Invocar el handler con el UQO completo (opaco).
 * 6. Validar el retorno (The Return Law + contrato de átomo).
 * 7. Retornar el resultado validado.
 *
 * @param {Object} uqo - Universal Query Object con { provider, protocol, query, ... }.
 * @returns {{ items: Array, metadata: Object }} Resultado validado.
 * @throws {Object} Error estructurado de `error_handler.gs` en caso de fallo.
 */
function route(uqo) {
  // ── AXIOMA DE PERÍMETRO: Lo que entra debe ser sincero o no entra (ADR_008) ──
  _validateInputContract_(uqo);

  const protocol = (uqo.protocol || '').toUpperCase();

  // ── DESPACHO ESPECIAL: WORKFLOW_EXECUTE ───────────────────────────────────
  // El motor de workflow no pasa por el provider_registry (no tiene provider).
  // Retorna items:[] vacío intencionalmente — el payload está en metadata.execution.
  // DATA_CONTRACTS §7.1: el workflow es un protocolo del sistema, no de un provider.
  if (protocol === 'WORKFLOW_EXECUTE') {
    logInfo('[protocol_router] Despachando WORKFLOW_EXECUTE al motor de workflows.');
    return handleWorkflowExecute(uqo);
  }

  // ── DESPACHO ESPECIAL: LOGIC_EXECUTE ──────────────────────────────────────
  // El motor de lógica es un servicio del sistema, no depende de un provider externo.
  // Ejecuta transformaciones puras sobre el payload del UQO.
  if (protocol === 'LOGIC_EXECUTE') {
    logInfo('[protocol_router] Despachando LOGIC_EXECUTE al LogicEngine.');
    return LogicEngine.executeLogicBridge(uqo);
  }

  const providerId = uqo.provider;

  // --- Validar presencia de campos obligatorios del UQO ---
  if (!providerId || typeof providerId !== 'string') {
    throw createError('INVALID_INPUT', 'El UQO no incluye el campo "provider".');
  }
  if (!protocol || typeof protocol !== 'string') {
    throw createError('INVALID_INPUT', 'El UQO no incluye el campo "protocol".');
  }

  logInfo(`[protocol_router] Despachando: ${providerId} → ${protocol}`);

  // --- Resolver el manifiesto del provider ---
  // AXIOMA: Para IDs compuestos (p.ej 'notion:HG'), resolvemos el handler 'notion'
  // pero pasamos el ID completo al handler para que sepa qué cuenta usar.
  const baseId = providerId.split(':')[0];
  const providerConf = getProviderConf(providerId);

  if (!providerConf) {
    throw createError(
      'PROVIDER_NOT_FOUND',
      `El provider "${providerId}" (base: "${baseId}") no está registrado o manifestado.`
    );
  }

  // AXIOMA DE IDENTIDAD: El contrato devuelto DEBE ser el del baseId.
  if (providerConf.id !== baseId) {
    throw createError(
      'SYSTEM_FAILURE',
      `Colisión de identidad: Se buscó "${baseId}" pero se resolvió "${providerConf.id}". Verifica CONF_${baseId.toUpperCase()}.`
    );
  }

  // --- Verificar que el provider implementa el protocolo ---
  const handlerFnName = providerConf.implements && providerConf.implements[protocol];
  if (!handlerFnName) {
    throw createError(
      'PROTOCOL_NOT_FOUND',
      `El provider "${baseId}" no implementa el protocolo "${protocol}".`,
      { available_protocols: Object.keys(providerConf.implements || {}) }
    );
  }

  // --- Valla de Seguridad: Verificar capacidades declaradas (Zero-Fallback) ---
  const hasCapability = providerConf.capabilities && providerConf.capabilities[protocol];
  if (!hasCapability) {
    throw createError(
      'PROTOCOL_NOT_SUPPORTED',
      `El provider "${baseId}" no declara políticas de ejecución para "${protocol}". Operación bloqueada por integridad de contrato.`
    );
  }

  logDebug(`[protocol_router] Despachando a handler "${handlerFnName}" para provider "${providerId}"`);

  // --- Resolver la función en el scope global de GAS ---
  const handlerFn = globalThis[handlerFnName];
  if (typeof handlerFn !== 'function') {
    throw createError(
      'SYSTEM_FAILURE',
      `Handler "${handlerFnName}" declarado en CONF_${baseId.toUpperCase()} no existe como función global.`
    );
  }

  // --- Invocar el handler con el UQO completo (opaco) ---
  let result;
  try {
    result = handlerFn(uqo);
  } catch (handlerError) {
    logError(`[protocol_router] Fallo crítico en provider "${providerId}" ejecutando "${protocol}".`, handlerError);

    // Axioma de Visibilidad (Error-as-Data):
    // Convertimos la excepción física en un Átomo de Error proyectable.
    return {
      items: [{
        id: `err_${Date.now()}`,
        handle: {
          ns: `com.indra.error.${providerId}`,
          alias: 'execution_error',
          label: 'Error de Ejecución'
        },
        class: 'ERROR_REPORT',
        protocols: ['ATOM_READ'],
        payload: {
          message: handlerError.message || 'Error desconocido',
          stack: handlerError.stack || '',
          severity: 'CRITICAL',
          provider: providerId,
          protocol: protocol
        }
      }],
      metadata: {
        status: 'ERROR_FLOW',
        error: handlerError.message,
        update_type: 'SNAPSHOT',
        trace: uqo ? _sanitizeTrace_(uqo) : null
      }
    };
  }

  // --- Validar retorno: The Return Law y contrato de átomo ---
  _validateReturnLaw_(result, providerId);
  _validateAtomContract_(result.items, providerId, protocol);

  // ADR-008: VALIDACIÓN RADICAL DE SCHEMAS EN STREAMS
  if (protocol === 'TABULAR_STREAM') {
    const schema = result.metadata?.schema;
    if (!schema || !schema.fields || !Array.isArray(schema.fields)) {
      throw createError(
        'CONTRACT_VIOLATION',
        `LEY_DE_ADUANA: El provider "${providerId}" violó el contrato TABULAR_STREAM. Se requiere metadata.schema.fields (Array).`,
        { providerId, proto: protocol }
      );
    }
    // PROHIBICIÓN DE LEGACY
    if (schema.columns) {
      throw createError(
        'CONTRACT_VIOLATION',
        `LEY_DE_ADUANA_LEGACY: El provider "${providerId}" intentó cruzar la aduana con "columns". Bloqueado.`
      );
    }
  }

  // Garantizar que metadata siempre tiene al menos { status }
  result.metadata = result.metadata || {};
  if (!result.metadata.status) {
    result.metadata.status = 'OK';
  }

  logInfo(`[protocol_router] Despacho completado. Items: ${result.items.length}`);
  return result;
}
