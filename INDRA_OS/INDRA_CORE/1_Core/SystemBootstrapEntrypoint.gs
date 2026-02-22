/**
 * @file run_bootstrap.gs
 * @dharma Materializar la infraestructura física del sistema (Carpetas y Sheets) de forma idempotente.
 */

function runSystemBootstrap() {
  const stack = _assembleExecutionStack();
  const { systemInitializer } = stack;
  
  console.log('========================================');
  Logger.log('🏗️ AXIOM SYSTEM BOOTSTRAP PROTOCOL');
  console.log('========================================');
  
  if (!systemInitializer) {
    Logger.log('❌ ERROR CRÍTICO: SystemInitializer no está disponible en el stack.');
    return;
  }
  
  try {
    Logger.log('🚀 Iniciando secuencia de materialización...');
    Logger.log('ℹ️ Esto puede tomar unos segundos...');
    
    // Ejecutar el bootstrap
    const result = systemInitializer.runBootstrap();
    
    Logger.log('========================================');
    Logger.log(`✅ BOOTSTRAP FINALIZADO: ${result.status}`);
    Logger.log('========================================');
    
    if (result.actionsTaken && result.actionsTaken.length > 0) {
      Logger.log('📝 Acciones realizadas:');
      result.actionsTaken.forEach(action => {
        Logger.log(`   - ${action}`);
      });
    } else {
      Logger.log('✨ El sistema ya estaba correctamente materializado (Idempotencia).');
    }
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('💥 FALLO CRÍTICO EN BOOTSTRAP');
    Logger.log('========================================');
    Logger.log(`Error: ${error.message}`);
    if (error.stack) Logger.log(error.stack);
  }
}







