/**
 * SONDA TÉCNICA: Verificación de Ignición y Vinculación.
 * Ejecutar este script desde el Debugger de GAS para verificar la trazabilidad.
 */
function TEST_SYSTEM_SCHEMA_IGNITE() {
  const schemaId = "1iEreLyspsHbhz2q5rVxoglmJPx-5C2FH"; // ID del esquema del usuario
  const uqo = {
    provider: 'system',
    protocol: 'SYSTEM_SCHEMA_IGNITE',
    context_id: schemaId,
    data: {
      target_provider: 'drive',
      parent_id: '1RxM94Lcql7-pUfEL2W5SW8Pl1dV8ZcSP'
    }
  };

  console.log("--- INICIANDO SONDA TÉCNICA DE CONFIGURACIÓN ---");
  try {
    const response = _system_handleSchemaIgnite(uqo);
    console.log("RESPUESTA CORE (JSON):", JSON.stringify(response, null, 2));
    
    if (response.items?.[0]) {
      const atom = response.items[0];
      console.log("DATO_RETORNADO_ID:", atom.id);
      console.log("DATO_RETORNADO_CLASE:", atom.class);
      console.log("DATO_RETORNADO_PROVIDER:", atom.provider);
      
      // Verificación de Honestidad Atómica
      if (atom.id === schemaId && atom.class === 'DATA_SCHEMA') {
        console.log("✅ TRAZABILIDAD CONFIRMADA: Se retornó el Esquema Origen.");
        if (atom.payload?.target_silo_id) {
           console.log("✅ VÍNCULO FÍSICO DETECTADO:", atom.payload.target_silo_id);
        } else {
           console.log("❌ FALLO: El esquema se retornó pero NO tiene el vínculo en su payload.");
        }
      } else if (atom.class === 'TABULAR') {
        console.log("⚠️ ALERTA: Se está retornando el Silo (TABULAR) en lugar del Esquema. Flujo inconsistente.");
      } else {
        console.log("❌ ERROR: Clase desconocida retornada:", atom.class);
      }
    }
  } catch (e) {
    console.error("❌ FALLO CRÍTICO EN SONDA:", e.message);
    if (e.stack) console.log(e.stack);
  }
}
