/**
 * =============================================================================
 * SONDA: 5_diagnostics/PROBE_SYNC_HYDRATION.gs
 * RESPONSABILIDAD: Rastrear exactamente el flujo de Sincronización y Resonancia.
 * =============================================================================
 */

function PROBE_SYNC_GPS_MIGRATION() {
  console.log("🚀 [PROBE:SYNC] Iniciando Simulacro de Transferencia (Hydration)...");
  
  const MOCK_SOURCE_ID = "18db5567-ba71-81eb-beec-eb3357b54863"; // Notion
  const MOCK_SILO_ID = "1-p-6OqnAz2g55YFRLrmpo10rphGv5ZnJEOi26KBQ-uc"; // Sheets

  const uqo = {
    provider: 'automation',
    protocol: 'INDUSTRIAL_SYNC',
    data: {
      source_id: MOCK_SOURCE_ID,
      source_provider: 'notion',
      silo_id: MOCK_SILO_ID,
      target_provider: 'sheets',
      bridge_atom: {
        id: 'adhoc-bridge',
        class: 'BRIDGE',
        payload: {
          mappings: { 
            [MOCK_SILO_ID]: {
               // Mapeo Alineado a los Encabezados Reales Físicos (Slugificados)
               "descripcion": "source.Tipos de Productos/Servicios",
               "precio_directo": "source.Precio directo",
               "precio_publico": "source.Precio Publico"
            }
          },
          targets: [MOCK_SILO_ID],
          target_provider: 'sheets',
          policy: { conflict_strategy: 'MERGE' }
        }
      }
    }
  };

  console.log("📡 [PROBE:SYNC] UQO Armado para la Sincronización.", JSON.stringify(uqo.data.bridge_atom.payload));

  try {
    const startTime = Date.now();
    
    // 1. Ejecutar como si fuera la UI
    const response = route(uqo);
    
    const duration = Date.now() - startTime;
    console.log(`\n=========================================`);
    console.log(`✅ [PROBE:SYNC] Motor ejecutado en ${duration}ms.`);
    console.log(`📦 Respuesta Status: ${response.metadata?.status}`);
    console.log(`📦 Resumen Resonancia: ${JSON.stringify(response.metadata?.resonance?.stats || {})}`);
    
    // Análisis Forense
    if (response.metadata?.resonance?.actions?.length === 0) {
      console.warn("⚠️ [PROBE:SYNC] El motor de resonancia decidió que NO HAY ACCIONES que realizar (0 inserts).");
      console.warn("💡 Diagnóstico: Esto sucede si los datos del satélite (Notion) llegaron vacíos, o si ATOM_READ en lugar de TABULAR_STREAM produjo solo la metadata.");
    } else {
      console.log(`🎯 [PROBE:SYNC] Todo correcto, se mapearon ${response.metadata?.resonance?.actions?.length} acciones.`);
    }

  } catch (err) {
     console.error(`🚨 [PROBE:SYNC] CRASH MASIVO DEL SISTEMA: ${err.message}`);
  }
}
