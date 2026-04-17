/**
 * =============================================================================
 * ARTEFACTO: 3_services/nexus_service.gs
 * RESPONSABILIDAD: Orquestación de confianza entre nodos Indra (P2P).
 * AXIOMA: Soberanía Multinodal. Handshake de Confianza.
 * =============================================================================
 */

const NexusService = (function() {

  /**
   * Inicia una solicitud de conexión con otro Core de Indra.
   * Genera un átomo de clase 'BRIDGE' que queda pendiente de aceptación.
   * @param {string} remoteCoreUrl - URL del endpoint del otro Indra Core.
   * @param {string} alias - Nombre amigable para el nodo remoto.
   */
  function initiateHandshake(remoteCoreUrl, alias) {
    logInfo(`[nexus] Iniciando Handshake con nodo remoto: ${alias} (${remoteCoreUrl})`);
    
    // 1. Crear identidad local para el apretón de manos
    const handoverId = Utilities.getUuid();
    
    const bridgeAtom = {
      id: `bridge_${handoverId}`,
      handle: { ns: 'indra.system.bridge', alias: alias, label: `Conexión con ${alias}` },
      class: 'BRIDGE',
      payload: {
        remote_url: remoteCoreUrl,
        status: 'PENDING_OUTGOING',
        handover_id: handoverId,
        created_at: new Date().toISOString()
      }
    };

    // 2. Persistir en el Ledger (Mount ROOT)
    _system_createAtom('BRIDGE', `Bridge to ${alias}`, bridgeAtom);

    // 3. Enviar señal de pulso al remoto (PULSE_B2B)
    // El remoto recibirá la petición y decidirá si acepta.
    return {
      metadata: { status: 'OK', message: 'Handshake iniciado. Esperando respuesta del nodo remoto.' },
      items: [bridgeAtom]
    };
  }

  /**
   * Procesa una petición de conexión entrante de otro Core.
   * @param {Object} uqo - El UQO de tipo SYSTEM_HANDSHAKE_REQUEST.
   */
  function acceptHandshake(uqo) {
    const remoteData = uqo.data;
    if (!remoteData.remote_url || !remoteData.handover_id) {
       throw new Error('nexus_service: Datos de handshake incompletos.');
    }

    const bridgeAtom = {
      id: `bridge_${Utilities.getUuid()}`,
      handle: { ns: 'indra.system.bridge', alias: remoteData.alias || 'remote_node', label: `Nodo Remoto Autorizado` },
      class: 'BRIDGE',
      payload: {
        remote_url: remoteData.remote_url,
        status: 'ACTIVE',
        handover_id: remoteData.handover_id,
        connected_at: new Date().toISOString()
      }
    };

    _system_createAtom('BRIDGE', `Bridge Accepted`, bridgeAtom);
    
    return { metadata: { status: 'OK', message: 'Handshake aceptado. Nodo vinculado.' } };
  }

  /**
   * Ejecuta un UQO en un nodo remoto si existe un puente activo.
   * @param {string} bridgeAlias - Alias del nodo remoto.
   * @param {Object} uqo - El UQO a ejecutar remotamente.
   */
  function remoteExecute(bridgeAlias, uqo) {
    // 1. Resolver el puente en el Ledger
    const bridges = _ledger_get_batch_metadata_(['BRIDGE']);
    const bridge = bridges.find(b => b.alias === bridgeAlias && b.status === 'ACTIVE');
    
    if (!bridge) throw new Error(`nexus_service: No existe un puente activo para "${bridgeAlias}".`);

    // 2. Firmar y enviar al remoto (Implementación futura con Fetch)
    logInfo(`[nexus] Redirigiendo UQO a nodo remoto: ${bridge.payload.remote_url}`);
    
    // Aquí se usaría urlFetchApp para enviar el UQO con el token del bridge
    return { metadata: { status: 'PENDING_REMOTE', detail: 'Redirección multinodal en proceso.' } };
  }

  return {
    initiateHandshake: initiateHandshake,
    acceptHandshake: acceptHandshake,
    remoteExecute: remoteExecute
  };

})();
