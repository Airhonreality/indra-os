/**
 * DIAGNÓSTICO: SIMULACIÓN DE DEV CONSOLE
 * debug_console_simulation.gs
 * 
 * Ejecuta el flujo real de backend y muestra los logs que vería el Frontend
 * AXIOMA: "Si no está en el log, no sucedió"
 */

function debug_SimulateAvailableCosmos() {
  // 1. Ensamblar Sistema
  const assembler = createSystemAssembler();
  const stack = assembler.assembleServerStack(); // Obtener stack completo
  
  // 2. Extraer dependencias canónicas
  // const fcm = stack.frontContextManager;
  const fcm = null; // Deprecated
  // const monitor = stack.monitoringService; // No necesario, fcm lo usa internamente
  
  console.log('🐞 [DEBUG] Iniciando Simulación de DevConsole...');
  console.log('🎯 [TARGET] FrontContextManager (DEPRECATED)');
  
  try {
    // 3. Ejecutar la función como lo haría el frontend
    // const response = fcm.listAvailableCosmos({ includeAll: false });
    const response = { message: "FrontContextManager is deprecated. Use CosmosEngine." };
    
    // 4. Renderizar "Dev Console" en terminal
    console.log('\n' + '='.repeat(60));
    console.log('📡 [BACKEND RESPONSE LOGS]');
    console.log('='.repeat(60));
    
    if (response._logs && response._logs.length > 0) {
      response._logs.forEach(log => {
        const emoji = {
          DEBUG: '🔍',
          INFO: 'ℹ️',
          WARN: '⚠️',
          ERROR: '❌',
          FATAL: '💀',
          USER: '👤'
        }[log.level] || '📝';
        
        console.log(`${emoji} [${log.component}] ${log.message}`);
        if (log.data) {
          console.log(`   └─ DATA: ${JSON.stringify(log.data).substring(0, 200)}...`);
        }
      });
    } else {
      console.log('⚠️ No logs returned via _logs channel!');
    }
    
    console.log('='.repeat(60));
    console.log('📦 ARTIFACTS RETURNED: ' + (response.artifacts ? response.artifacts.length : 0));
    response.artifacts.forEach(a => {
        console.log(`   - ${a.name} (Schema: ${a.indx_schema})`);
    });
    console.log('='.repeat(60));
    
  } catch (e) {
    console.error('💀 FATAL ERROR IN EXECUTION:', e.message);
    if (e.stack) console.error(e.stack);
  }
}
