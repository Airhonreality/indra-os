/**
 * @file debug_purity_forensics_v2.gs
 * @dharma Auditar la integridad de la configuración crítica y la salud de los entrypoints.
 */

function runPurityForensicsV2() {
  const stack = _assembleExecutionStack();
  const { configurator, manifest } = stack;
  
  console.log('========================================');
  Logger.log('🔍 INDRA CORE: PURITY FORENSICS V2');
  console.log('========================================');
  
  // 1. Verificar URLs críticas
  const deploymentUrl = configurator.retrieveParameter({ key: 'DEPLOYMENT_URL' });
  const workerUrl = configurator.retrieveParameter({ key: 'ORBITAL_WORKER_URL' });
  const systemToken = configurator.retrieveParameter({ key: 'SYSTEM_TOKEN' });
  const satelliteApiKey = configurator.retrieveParameter({ key: 'ORBITAL_CORE_SATELLITE_API_KEY' });
  
  Logger.log(`📍 DEPLOYMENT_URL: ${deploymentUrl || '❌ NO CONFIGURADA'}`);
  Logger.log(`🤖 ORBITAL_WORKER_URL: ${workerUrl || '❌ NO CONFIGURADA'}`);
  Logger.log(`🔑 SYSTEM_TOKEN: ${systemToken || '❌ NO CONFIGURADO'}`);
  Logger.log(`🛰️ SATELLITE_API_KEY: ${satelliteApiKey || '❌ NO CONFIGURADA'}`);
  
  // 2. Verificar Salud de los MCEPs
  const mcepStats = stack.public.getSystemStatus();
  Logger.log(`🧬 MCEP Capability Count: ${Object.keys(mcepStats?.contracts || {}).length}`);
  
  // 3. Verificar Salud de la Cola
  const queueStats = stack.adminTools.getQueueStats();
  Logger.log(`📋 Queue Status: Total=${queueStats.total}, Pending=${queueStats.pending}`);
  
  console.log('========================================');
  Logger.log('✅ AUDITORÍA COMPLETADA. REVISA LOS LOGS.');
  console.log('========================================');
}
