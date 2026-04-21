/**
 * INDRA INFRASTRUCTURE SILO: infra_connectivity.gs
 * Responsabilidad: Gestión de enlaces externos y soberanía de red.
 */

/**
 * SERVICE_PAIR: Vincula un servicio externo al Core.
 */
function _system_handleServicePair(uqo) {
  const serviceId = uqo.context_id;
  const data = uqo.data || {};
  if (!serviceId) throw createError('INVALID_INPUT', 'SERVICE_PAIR requiere context_id (service_id).');

  logInfo(`[connectivity] Emparejando servicio: ${serviceId}`);
  
  // AXIOMA DE SINCERIDAD: Usar el motor oficial de cuentas para que sea detectable por SYSTEM_MANIFEST.
  const accountId = data.account_id || 'default';
  const label = data.label || `Conexión ${serviceId}`;
  
  // Guardamos las credenciales (payload completo) en la bóveda oficial.
  storeProviderAccount(serviceId, accountId, JSON.stringify(data.secrets || {}), label);

  return { items: [], metadata: { status: 'OK', service_paired: serviceId, account_id: accountId } };
}

/**
 * SERVICE_UNPAIR: Desvincula un servicio externo.
 */
function _system_handleServiceUnpair(uqo) {
  const serviceId = uqo.context_id;
  if (!serviceId) throw createError('INVALID_INPUT', 'SERVICE_UNPAIR requiere context_id.');

  PropertiesService.getScriptProperties().deleteProperty(`SVC_PAIR_${serviceId}`);
  logInfo(`[connectivity] Servicio desemparejado: ${serviceId}`);

  return { items: [], metadata: { status: 'OK', service_unpaired: serviceId } };
}

/**
 * SYSTEM_CORE_DISCOVERY: Retorna la URL soberana de este Core.
 */
function _system_handleCoreDiscovery(uqo) {
  if (!uqo) throw createError('INVALID_INPUT', 'SYSTEM_CORE_DISCOVERY requiere UQO.');
  const coreUrl = ScriptApp.getService().getUrl();
  const ownerEmail = PropertiesService.getScriptProperties().getProperty('SYS_CORE_OWNER_EMAIL');

  return {
    items: [{
      id: ownerEmail,
      class: 'CORE_ENDPOINT',
      payload: { core_url: coreUrl, owner: ownerEmail }
    }],
    metadata: { status: 'OK' }
  };
}

/**
 * ACCOUNT_RESOLVE: Identifica la cuenta soberana activa.
 */
function _system_handleAccountResolve(uqo) {
    if (!uqo) throw createError('INVALID_INPUT', 'ACCOUNT_RESOLVE requiere UQO.');
    const email = Session.getActiveUser().getEmail();
    return {
        items: [{
            id: email,
            class: 'USER_ACCOUNT',
            handle: { label: email, alias: email.split('@')[0] }
        }],
        metadata: { status: 'OK' }
    };
}
