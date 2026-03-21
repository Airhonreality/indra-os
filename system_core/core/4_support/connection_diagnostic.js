/**
 * =============================================================================
 * ARTEFACTO: 4_support/connection_diagnostic.gs
 * RESPONSABILIDAD: Pruebas de salud internas del núcleo (Health Check).
 * AXIOMA: Si el diagnóstico falla, el sistema debe considerarse en entropía.
 * =============================================================================
 */

function ejecutarDiagnosticoIndra() {
  console.log('--- INICIANDO DIAGNÓSTICO DE NÚCLEO INDRA ---');
  
  // 1. Verificar Persistencia (Aduana de Configuración)
  try {
    const bootstrapped = isBootstrapped(); // system_config.gs
    console.log(`✅ Persistencia: ${bootstrapped ? 'Sincronizada' : 'Pendiente de Ignición'}`);
  } catch(e) {
    console.error('❌ Error en Persistencia: No se encuentra isBootstrapped().');
  }

  // 2. Verificar Soberanía Física (Google Drive)
  try {
    const root = _system_ensureHomeRoot(); // provider_system_infrastructure.gs
    console.log(`✅ Soberanía Física: Directorio "${root.getName()}" localizado.`);
  } catch(e) {
    console.error('❌ Error de Drive: No se pudo acceder a .core_system.');
  }

  // 3. Verificar Membrana (API Gateway)
  try {
    const url = ScriptApp.getService().getUrl();
    console.log(`✅ Membrana: URL de Despliegue activa: ${url}`);
  } catch(e) {
    console.log('⚠️ Aviso: Despliega como Web App para obtener URL.');
  }

  console.log('--- DIAGNÓSTICO COMPLETADO ---');
}
