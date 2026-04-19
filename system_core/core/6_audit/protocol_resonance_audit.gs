/**
 * =============================================================================
 * ARTEFACTO: 6_audit/protocol_resonance_audit.gs
 * RESPONSABILIDAD: Auditoría de Coherencia Nominal (PAD).
 * AXIOMA: Si el protocolo existe, la función debe existir. 
 * =============================================================================
 */

/**
 * Ejecuta la auditoría de resonancia protocolaria.
 * Imprime en consola un reporte detallado del estado de "sinceridad" del sistema.
 */
function AUDITORIA_RESONANCIA_PROTOCOLARIA() {
  console.log('🔍 [auditor] Iniciando Auditoría de Resonancia Protocolaria (v1.0)...');
  
  const registry = ProtocolRegistry.getRegistry(); // Asumiendo que existe un getter
  const protocols = Object.keys(registry || {});
  
  if (protocols.length === 0) {
    console.error('❌ [auditor] Error: El ProtocolRegistry está vacío o no es accesible.');
    return;
  }

  const results = {
    total: protocols.length,
    resonating: 0,
    silent: 0,
    details: []
  };

  protocols.forEach(p => {
    const handler = _resolveDynamicHandler_locally_(p);
    const resonating = (typeof handler === 'function');
    
    if (resonating) {
      results.resonating++;
    } else {
      results.silent++;
    }

    results.details.push({
      protocol: p,
      status: resonating ? '✅ RESONANTE' : '❌ SORDO',
      dispatcher: registry[p].dispatcher
    });
  });

  // --- REPORTE FINAL ---
  console.log('--- REPORTE DE RESONANCIA ---');
  console.log(`📊 Total Protocolos: ${results.total}`);
  console.log(`✅ Resonantes: ${results.resonating}`);
  console.log(`❌ Sordos (Faltan): ${results.silent}`);
  console.log('-----------------------------');

  results.details.forEach(d => {
    if (d.status.includes('❌')) {
      console.warn(`[!] ${d.status}: ${d.protocol} (Dispatcher: ${d.dispatcher})`);
    } else {
      console.log(`[ ] ${d.status}: ${d.protocol}`);
    }
  });

  return results;
}

/**
 * Intento local de resolución para la auditoría.
 * @private
 */
function _resolveDynamicHandler_locally_(protocol) {
  const scope = globalThis || this;
  
  // 1. Acceso directo
  if (typeof scope[protocol] === 'function') return scope[protocol];
  
  // 2. Acceso vía this
  if (typeof this[protocol] === 'function') return this[protocol];
  
  // 3. Casos especiales (Encapsulados)
  const specialCases = [
    'SYSTEM_NEXUS_HANDSHAKE_INIT',
    'SYSTEM_NEXUS_HANDSHAKE_ACCEPT',
    'SYSTEM_IDENTITY_CREATE',
    'SYSTEM_IDENTITY_READ',
    'SYSTEM_IDENTITY_VERIFY'
  ];
  
  if (specialCases.includes(protocol)) return () => "ENCAPSULADO";

  return null;
}
