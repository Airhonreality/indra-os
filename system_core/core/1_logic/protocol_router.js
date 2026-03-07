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

/**
 * SHADOW IDENTITY PROTOCOL (v3.0)
 * Hidrata un átomo legacy con la estructura IUH (v3.0).
 * @private
 */
function _hydrateIUH_(item, providerId) {
  if (item.handle && item.handle.alias && item.handle.label) return item;

  // Fallback de Label: Prioridad 1. name -> 2. label -> 3. account_id -> 4. id -> 5. "Recurso"
  let label = item.name || item.label || item.account_id || item.id || 'Recurso';
  
  // Sanitización de IDs como labels (ej: 'notion' -> 'NOTION')
  if (label === item.id && typeof label === 'string' && label.length < 20) {
      label = label.toUpperCase();
  }

  const alias = item.alias || item.id || _system_slugify_(label);

  item.handle = {
    ns: item.handle?.ns || `com.indra.system.${item.class?.toLowerCase() || 'item'}`,
    alias: alias || 'unnamed_slot',
    label: label
  };

  return item;
}

/**
 * Valida que cada ítem del array retornado por el provider cumple el
 * contrato mínimo del Átomo Universal (v3.0 IUH).
 * Campos obligatorios: `id`, `handle`, `class`.
 *
 * @param {Array} items       - Array de ítems retornado por el provider.
 * @param {string} providerId - ID del provider que generó los ítems.
 * @throws {Object} Error estructurado `CONTRACT_VIOLATION` si algún átomo es inválido.
 * @private
 */
function _validateAtomContract_(items, providerId) {
  if (!items || !Array.isArray(items)) {
    throw createError(
      'CONTRACT_VIOLATION',
      `Provider "${providerId}" violó la Ley de Retorno: "items" debe ser un Array (aunque esté vacío).`,
      { received: typeof items }
    );
  }

  const REQUIRED_FIELDS = ['id', 'class']; // 'name' ahora es opcional/deprecado, 'handle' es vital

  items.forEach((item, index) => {
    // 1. Aplicar Shadow Identity Protocol (Hidratación)
    _hydrateIUH_(item, providerId);

    // 2. Validar campos estructurales
    const missing = REQUIRED_FIELDS.filter(field => !item[field]);
    if (missing.length > 0 || !item.handle) {
      throw createError(
        'CONTRACT_VIOLATION',
        `ContractViolation v3.0: El provider "${providerId}" entregó materia no canónica. Faltan campos: [${missing.join(', ')}].`,
        { item_index: index, item }
      );
    }
  });
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
  _validateAtomContract_(result.items, providerId);

  // Garantizar que metadata siempre tiene al menos { status }
  result.metadata = result.metadata || {};
  if (!result.metadata.status) {
    result.metadata.status = 'OK';
  }

  logInfo(`[protocol_router] Despacho completado. Items: ${result.items.length}`);
  return result;
}
