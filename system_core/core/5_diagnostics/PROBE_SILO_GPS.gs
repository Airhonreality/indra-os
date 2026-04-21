/**
 * =============================================================================
 * SONDA: 5_diagnostics/PROBE_SILO_GPS.gs
 * RESPONSABILIDAD: Rastrear exactamente el flujo de creación de un Silo y su posicionamiento en Google Drive.
 * =============================================================================
 */

function PROBE_SILO_GPS_MIGRATION() {
  console.log("🚀 [PROBE:GPS] Iniciando Simulacro de Creación de Silo...");
  
  // 1. CARPETA DE DESTINO DE PRUEBA (Debe ser un Workspace real o usar la carpeta artifacts)
  // El ID "103MitQudDSMinRzzMLuzkWKmPN7UaDNr" es el que mostró la UI en tus logs.
  const TEST_PARENT_ID = "103MitQudDSMinRzzMLuzkWKmPN7UaDNr"; 

  // 2. ESQUEMA DE PRUEBA (Ficticio para la simulación)
  const TEST_DNA_ID = "PROBE_ADN_MOCK_" + Math.random().toString(36).substring(7);

  console.log(`📍 Destino configurado (parent_id): ${TEST_PARENT_ID}`);

  // Simular la ejecución exacta de la UI (SchemaNexusControl.jsx -> PathIgnite)
  const uqo = {
    provider: 'system',
    protocol: 'SYSTEM_SCHEMA_IGNITE',
    context_id: TEST_DNA_ID, // ID del esquema ficticio
    data: { 
      target_provider: 'sheets',
      parent_id: TEST_PARENT_ID,
      blueprint: {
        id: TEST_DNA_ID,
        class: 'DATA_SCHEMA',
        handle: { label: 'Sonda GPS Test Schema' },
        payload: {
          fields: [
            { id: 'f1', type: 'STRING', handle: { label: 'Columna Sonda' } }
          ]
        }
      }
    }
  };

  console.log("📡 [PROBE:GPS] Disparando SYSTEM_SCHEMA_IGNITE con UQO:", JSON.stringify(uqo));

  try {
    const startTime = Date.now();
    
    // Llamada directa al orquestador como si entrara por IndraCore.postMessage
    const response = route(uqo);
    
    const duration = Date.now() - startTime;

    console.log(`\n=========================================`);
    console.log(`✅ [PROBE:GPS] Ejecución del motor completada en ${duration}ms.`);
    console.log(`📦 Status Respuesta: ${response.metadata?.status}`);
    
    if (response.metadata?.status === 'OK') {
      const universe = response.metadata.universe || {};
      const siloId = universe.silo_id;
      console.log(`🧱 Silo ID Devuelto: ${siloId}`);
      
      if (siloId) {
        // VERIFICACIÓN FÍSICA A NIVEL DE DRIVE API
        console.log(`\n🔍 [PROBE:GPS] Verificando ubicación física en DriveApp del Silo ${siloId}...`);
        try {
          const driveFile = DriveApp.getFileById(siloId);
          console.log(`   - Nombre del Archivo: ${driveFile.getName()}`);
          
          const parents = driveFile.getParents();
          let parentNameList = [];
          while (parents.hasNext()) {
            let parentFolder = parents.next();
            parentNameList.push({ id: parentFolder.getId(), name: parentFolder.getName() });
          }
          
          console.log(`   - Carpetas Padre (Parents):`, JSON.stringify(parentNameList));
          
          const inTargetFolder = parentNameList.some(p => p.id === TEST_PARENT_ID);
          if (inTargetFolder) {
             console.log(`\n🎯 ¡ÉXITO! El Silo FUE MOVIDO correctamente a la carpeta seleccionada.`);
          } else {
             console.log(`\n❌ ¡FALLO DE MOVIMIENTO! El Silo sigue en una carpeta diferente.`);
             console.log(`   La carpeta raíz (Mi Unidad) probablemente retuvo el archivo.`);
          }

          // Limpieza del archivo basura
          console.log(`\n🧹 [PROBE:GPS] Limpiando Silo de prueba...`);
          driveFile.setTrashed(true);
          console.log(`✅ Archivo movido a la papelera.`);

        } catch (e) {
          console.error(`❌ [PROBE:GPS] Error al leer el File en Drive: ${e.message}`);
        }
      }
    } else {
      console.error(`❌ [PROBE:GPS] Error en protocolo: ${response.metadata?.error}`);
    }

  } catch (err) {
     console.error(`🚨 [PROBE:GPS] CRASH MASIVO DEL SISTEMA: ${err.stack || err.message}`);
  }
}
