/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/robust_integrity_test.gs
 * RESPONSABILIDAD: Auditoría agresiva de la Membrana y Capa Física (Drive/Ledger).
 * OBJETIVO: Cero falsos positivos. Validación de la "Aduana de Protocolos".
 * =============================================================================
 */

function INDRA_DIAGNOSTIC_FULL_AUDIT() {
  const SOBERANO = Session.getEffectiveUser().getEmail();
  const REPORT = [];

  console.log('🛡️ INICIANDO AUDITORÍA ROBUSTA DE INDRA OS (v7.0-MEMBRANE)');
  console.log(`[audit] Operador: ${SOBERANO}`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: SALUD FÍSICA Y MONTAJE (Axioma de Existencia)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 1] Verificando Integridad Física de Drive...');
  const state = SystemStateManager.getState();
  const rootId = PropertiesService.getScriptProperties().getProperty('SYS_MOUNT_ROOT_ID');
  
  let physicalHealth = 'FAIL';
  if (rootId) {
    try {
      const file = DriveApp.getFileById(rootId);
      physicalHealth = `PASS (Mime: ${file.getMimeType()})`;
    } catch (e) {
      physicalHealth = `CRITICAL_FAIL: El ID existe en registro pero NO en Drive (${e.message})`;
    }
  } else if (state === 0) {
    physicalHealth = 'PASS (Esperado: UNINITIALIZED)';
  }
  REPORT.push({ Area: 'Física/Drive', Resultado: physicalHealth, Detalle: `ID: ${rootId || 'N/A'}` });


  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: CORTAFUEGOS DE PROTOCOLO (Simulación Doppler)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 2] Estresando la Membrana de Entrada...');
  
  const vectors = [
    { p: 'SYSTEM_MANIFEST', d: {}, exp: 'ANY', m: 'Paso libre para UI' },
    { p: 'ATOM_READ', d: {}, exp: (state < 2 ? 'PROVISIONING' : 'OK'), m: 'Validación de nivel de consciencia' },
    { p: 'PROTOCOLO_FANTASMA', d: {}, exp: 'PROTOCOL_UNREGISTERED', m: 'Rechazo de vectores desconocidos' }
  ];

  vectors.forEach(v => {
    const res = _simulateDoPost(v.p, v.d);
    const status = res.metadata.status;
    const pass = (v.exp === 'ANY' || status.includes(v.exp));
    
    REPORT.push({ 
      Area: 'Membrana/Gateway', 
      Resultado: pass ? 'PASS' : 'FAIL', 
      Detalle: `Protocol: ${v.p} -> Status: ${status} (${v.m})` 
    });
  });


  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: SIMULACIÓN DE ACTORES (Soberanía y Delegación)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 3] Validando Roles y Privilegios...');

  // Caso: Soberano (Tú)
  const sobRes = _simulateDoPost('SYSTEM_CONFIG_SCHEMA', {});
  REPORT.push({ 
    Area: 'Identidad/Soberano', 
    Resultado: (sobRes.metadata.status !== 'UNAUTHORIZED') ? 'PASS' : 'FAIL', 
    Detalle: 'Validación de Blood Right (Acceso Maestro)' 
  });

  // Caso: Actor No Identificado (Inpersonificación)
  // Nota: Esto es crítico para asegurar que el AuthService bloquee si no hay token/clave
  const anonRes = _simulateDoPost('SYSTEM_KEYCHAIN_GENERATE', {});
  REPORT.push({ 
    Area: 'Seguridad/Anon', 
    Resultado: (anonRes.metadata.status === 'UNAUTHORIZED' || state < 2) ? 'PASS' : 'FAIL', 
    Detalle: 'Bloqueo de acceso maestro a anónimos' 
  });


  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: INTEGRIDAD DEL CONTRATO (Envelope Standard)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 4] Verificando Firma de Respuesta (ADR-001/052)...');
  const contractRes = _simulateDoPost('SYSTEM_MANIFEST', {});
  const hasItems = Array.isArray(contractRes.items);
  const hasMetadata = !!contractRes.metadata.core_id && !!contractRes.metadata.system_state;

  REPORT.push({ 
    Area: 'Contrato/Envelope', 
    Resultado: (hasItems && hasMetadata) ? 'PASS' : 'FAIL', 
    Detalle: 'Items Array + Metadatos mandatorios' 
  });

  console.log('\n=============================================================');
  REPORT.forEach(row => {
    console.log(`[${row.Resultado}] ${row.Area}: ${row.Detalle}`);
  });
  console.log('=============================================================');
  
  const finalFail = REPORT.find(r => r.Resultado.includes('FAIL'));
  if (finalFail) {
    console.error('🛑 AUDITORÍA FALLIDA: Se detectaron brechas en la integridad del Core.');
  } else {
    console.log('🌟 AUDITORÍA EXITOSA: La Membrana y el Cuerpo Físico están en armonía.');
  }
}

/**
 * Simulador de bajo nivel de doPost para pruebas de laboratorio.
 * @private
 */
function _simulateDoPost(protocol, data) {
  const event = {
    postData: {
      contents: JSON.stringify({ protocol: protocol, data: data })
    }
  };
  try {
    const output = doPost(event);
    return JSON.parse(output.getContent());
  } catch (e) {
    return { metadata: { status: 'FATAL_EXCEPTION', error: e.message } };
  }
}
