/**
 * ARTEFACTO: 6_audit/CORE_DEBUG_LAB.gs
 * RESPONSABILIDAD: Pruebas de integración atómica directamente en GAS.
 * AXIOMA: Si funciona en el laboratorio, funciona en el universo.
 */

function DEV_DEBUG_AtomicIgnitionTest() {
  console.info('--- 🔥 INICIANDO PRUEBA DE IGNICIÓN ATÓMICA (v4.84) ---');
  
  try {
    // 1. TEST DE REGISTRO
    console.log('1. [TEST] Verificando Visibilidad de Motores...');
    const configs = _scanProviders();
    const hasSystem = configs.find(c => c.id === 'system');
    console.log('   > Motores detectados:', configs.map(c => c.id).join(', '));
    if (!hasSystem) throw new Error('EL MOTOR SYSTEM NO ES VISIBLE.');
    console.log('   ✅ Registro OK.');

    // 2. TEST DE SOBERANÍA FÍSICA
    console.log('2. [TEST] Verificando Soberanía Física (.core_system)...');
    const rootId = _system_ensureHomeRoot();
    console.log('   > ID Carpeta Raíz:', rootId);
    if (!rootId) throw new Error('NO SE PUDO ESTABLECER SOBERANÍA FÍSICA.');
    console.log('   ✅ Carpeta Raíz OK.');

    // 3. TEST DE LEDGER
    console.log('3. [TEST] Verificando Cristalización del Ledger...');
    let ledgerId = readMasterLedgerId();
    if (!ledgerId) {
      console.warn('   > Ledger no encontrado. Intentando inicialización fresca...');
      ledgerId = ledger_initialize_new();
    }
    console.log('   > ID Master Ledger:', ledgerId);
    if (!ledgerId) throw new Error('EL LEDGER NO PUDO SER CRISTALIZADO.');
    console.log('   ✅ Ledger OK.');

    // 4. TEST DE CREACIÓN DE ÁTOMO (WORKSPACE)
    console.log('4. [TEST] Intentando creación de Átomo de Workspace Debug...');
    const mockUqo = {
      protocol: 'ATOM_CREATE',
      provider: 'system',
      data: {
        class: 'WORKSPACE',
        handle: {
          alias: 'debug_workspace_' + Date.now(),
          label: 'Espacio de Trabajo de Diagnóstico'
        },
        payload: {
          description: 'Este es un átomo creado durante una prueba de ignición directa en GAS.',
          test_mode: true
        }
      },
      effective_owner: Session.getActiveUser().getEmail(),
      is_master_access: true
    };

    console.log('   > Petición Enviada (Payload):', JSON.stringify(mockUqo, null, 2));
    
    // AXIOMA DE INTEGRACIÓN: Usamos el enrutador real (protocol_router.gs)
    const response = route(mockUqo);
    
    console.log('   > Respuesta Recibida (Atomic Payload):', JSON.stringify(response, null, 2));

    if (response.metadata.status === 'ERROR') {
      throw new Error('EL ÁTOMO FALLÓ AL NACER: ' + response.metadata.error);
    }

    console.log('   ✅ Átomo Creado OK.');
    console.info('--- 🏅 PRUEBA DE IGNICIÓN COMPLETADA CON ÉXITO ---');

  } catch (e) {
    console.error('--- ❌ FALLO CRÍTICO EN LA PRUEBA ---');
    console.error('Mensaje: ' + e.message);
    console.error('Stack: ' + e.stack);
  }
}

/**
 * FASE II: Test de Lógica y Descubrimiento Profundo.
 */
function DEV_DEBUG_DeepIntegrationTest() {
  console.info('--- ⚡ INICIANDO PRUEBA DE INTEGRACIÓN PROFUNDA (v4.87) ---');
  
  try {
    // 1. TEST DE LÓGICA (LOGIC_EXECUTE)
    console.log('1. [TEST] Probando Motor de Lógica (LogicBridge)...');
    const logicUqo = {
      protocol: 'LOGIC_EXECUTE',
      data: {
        bridge_id: 'internal_echo',
        payload: [{ message: 'Hola Indra', value: 42 }] // Vectorial: Array requerido
      }
    };
    const logicRes = route(logicUqo);
    console.log('   > Respuesta Logic:', JSON.stringify(logicRes, null, 2));
    if (logicRes.metadata.status === 'ERROR') throw new Error('LÓGICA FALLÓ: ' + logicRes.metadata.error);
    console.log('   ✅ Lógica OK.');

    // 2. TEST DE DESCUBRIMIENTO (MCEP)
    console.log('2. [TEST] Probando Sensado Profundo (GETMCEPMANIFEST)...');
    const mcepUqo = {
      protocol: 'GETMCEPMANIFEST',
      provider: 'system',
      data: { mode: 'RAW_MAP' }
    };
    const mcepRes = route(mcepUqo);
    const capsFound = Object.keys(mcepRes.metadata.capabilities || {}).length;
    console.log('   > Motores con capacidades detectados:', capsFound);
    if (capsFound === 0) throw new Error('EL MANIFIESTO MCEP ESTÁ VACÍO EN METADATA.');
    console.log('   ✅ MCEP OK.');

    console.info('--- 🏅 INTEGRACIÓN PROFUNDA COMPLETADA ---');

  } catch (e) {
    console.error('--- ❌ FALLO EN FASE II ---');
    console.error('Causa: ' + e.message);
  }
}

/**
 * FASE III: Simulador de Gateway (doPost).
 * Prueba el flujo exacto por el que pasa el navegador.
 */
function DEV_DEBUG_SimulateGateway() {
  console.info('--- 🏢 INICIANDO SIMULADOR DE GATEWAY (v4.89) ---');
  
  const mockPayload = {
    protocol: 'ATOM_CREATE',
    provider: 'system',
    password: 'MASTER_DEBUG_KEY', // Simular un password si es necesario
    data: {
      class: 'WORKSPACE',
      handle: {
        alias: 'gateway_test_' + Date.now(),
        label: 'Workspace desde Simulador'
      },
      payload: { origin: 'Gateway Simulator' }
    }
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(mockPayload)
    }
  };

  try {
    console.log('   > Llamando a doPost con Payload Simulado...');
    const httpResponse = doPost(mockEvent); // Ejecutamos el punto de entrada oficial
    
    // El retorno de doPost es un TextOutput, extraemos el contenido
    const content = httpResponse.getContent();
    console.log('   > Respuesta del Servidor (JSON):', content);
    
    const res = JSON.parse(content);
    if (res.metadata.status === 'OK') {
      console.log('   ✅ GATEWAY OK: El flujo browser -> core es funcional.');
    } else {
      console.error('   ❌ GATEWAY FALLO: ' + res.metadata.error);
    }

  } catch (e) {
    console.error('   ❌ ERROR CRÍTICO EN SIMULADOR: ' + e.message);
  }
}
