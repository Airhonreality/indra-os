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
    
    // Ejecutamos directamente el orquestador de sistema
    const response = SystemOrchestrator.dispatch(mockUqo);
    
    console.log('   > Respuesta Recibida (Atomic Payload):', JSON.stringify(response, null, 2));

    if (response.metadata.status === 'ERROR') {
      throw new Error('EL ÁTOMO FALLÓ AL NACER: ' + response.metadata.error);
    }

    console.log('   ✅ Átomo Creado OK.');
    console.info('--- 🏅 PRUEBA DE IGNICIÓN COMPLETADA CON ÉXITO ---');
    console.log('Indra está sana y soberana en su núcleo.');

  } catch (e) {
    console.error('--- ❌ FALLO CRÍTICO EN LA PRUEBA ---');
    console.error('Mensaje: ' + e.message);
    console.error('Stack: ' + e.stack);
  }
}
