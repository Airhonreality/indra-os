/**
 * =============================================================================
 * ARTEFACTO: 3_services/nexus_service.gs
 * RESPONSABILIDAD: Orquestación de confianza entre nodos Indra (P2P).
 * AXIOMA: Soberanía Multinodal. Handshake de Confianza.
 * =============================================================================
 */

const NexusService = (function() {

  /**
   * INICIA UN HANDSHAKE (Axioma de Reconocimiento entre Pares).
   * Genera un puente de confianza asimétrico. El nodo iniciador queda en estado PENDING_OUTGOING.
   * 
   * @axiom SOBERANÍA: Un nodo solo se conecta si el dueño firma la intención.
   * @param {string} remoteCoreUrl - Endpoint SOAP/REST del Indra remoto.
   * @param {string} alias - Alias local para mapeo espacial (Mounting).
   */
  function initiateHandshake(remoteCoreUrl, alias) {
    logInfo(`[nexus] Iniciando Handshake con nodo remoto: ${alias} (${remoteCoreUrl})`);
    
    // 1. Crear identidad local para el apretón de manos
    const handoverId = Utilities.getUuid();
    
    // AXIOMA: Usar el Router para asegurar persistencia en el Mount ROOT
    const response = route({
      provider: 'system',
      protocol: 'ATOM_CREATE',
      data: {
        class: 'BRIDGE',
        handle: { ns: 'indra.system.bridge', alias: alias, label: `Conexión con ${alias}` },
        payload: {
          remote_url: remoteCoreUrl,
          status: 'PENDING_OUTGOING',
          handover_id: handoverId,
          created_at: new Date().toISOString()
        }
      }
    });

    return {
      metadata: { status: 'OK', message: 'Handshake iniciado. Esperando respuesta del nodo remoto.' },
      items: response.items || []
    };
  }

  /**
   * ACEPTA UN HANDSHAKE (Axioma de Consonancia).
   * Eleva un puente pendiente a estado ACTIVE. Crea una relación de reciprocidad.
   * 
   * @param {Object} uqo - El UQO con el handover_id original.
   */
  function acceptHandshake(uqo) {
    const remoteData = uqo.data;
    if (!remoteData.remote_url || !remoteData.handover_id) {
       throw new Error('nexus_service: Datos de handshake incompletos.');
    }
 
    const response = route({
      provider: 'system',
      protocol: 'ATOM_CREATE',
      data: {
        class: 'BRIDGE',
        handle: { ns: 'indra.system.bridge', alias: remoteData.alias || 'remote_node', label: `Nodo Remoto Autorizado` },
        payload: {
          remote_url: remoteData.remote_url,
          status: 'ACTIVE',
          handover_id: remoteData.handover_id,
          connected_at: new Date().toISOString()
        }
      }
    });
    
    return { metadata: { status: 'OK', message: 'Handshake aceptado. Nodo vinculado.', bridge_id: response.items?.[0]?.id } };
  }

  /**
   * Ejecuta un UQO en un nodo remoto si existe un puente activo.
   * @param {string} bridgeAlias - Alias del nodo remoto.
   * @param {Object} uqo - El UQO a ejecutar remotamente.
   */
  function remoteExecute(bridgeAlias, uqo) {
    // CORRECCIÓN: Usar list_by_class para encontrar el puente por alias
    const activeBridges = ledger_list_by_class('BRIDGE');
    const bridge = activeBridges.find(b => b.handle?.alias === bridgeAlias);
    
    if (!bridge) throw new Error(`nexus_service: No existe un puente configurado para "${bridgeAlias}".`);
    if (bridge.payload?.status !== 'ACTIVE') throw new Error(`nexus_service: El puente "${bridgeAlias}" no está activo.`);

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
