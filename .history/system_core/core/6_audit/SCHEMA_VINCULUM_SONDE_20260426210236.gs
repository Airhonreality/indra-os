/**
 * 🛰️ SONDA DE VINCULACIÓN DE ESQUEMAS (v1.0)
 * Responsabilidad: Probar el protocolo ATOM_CREATE con un payload canónico.
 * Ejecutar manualmente desde el editor de GAS.
 */
function SONDE_TEST_SCHEMA_IGNITION() {
  const componentSchemaPayload = {
    class: 'DATA_SCHEMA',
    handle: {
        alias: 'NOMON_COMPONENT_SONDE',
        label: 'Sonda: Biblioteca de Proyectores',
        icon: 'VIEW_QUILT'
    },
    payload: {
        fields: [
            { id: 'id', label: 'ID del Proyector', type: 'string', required: true },
            { 
                id: 'type', 
                label: 'Tipo de Proyección', 
                type: 'enum', 
                options: ['hero_projection', 'data_grid', 'agnostic_form', 'markdown_block'] 
            },
            { id: 'props_schema', label: 'Contrato de Props (JSON)', type: 'json' },
            { 
                id: 'actions', 
                label: 'Capacidades de Acción', 
                type: 'enum', 
                options: ['NAVIGATE', 'SUBMIT', 'TRIGGER_WORKFLOW'] 
            }
        ],
        target_provider: 'json_manifest'
    }
  };

  const uqo = {
    protocol: 'ATOM_CREATE',
    provider: 'drive',
    data: componentSchemaPayload
  };

  console.log("🚀 [SONDA] Iniciando Ignición de Esquema...");
  
  try {
    const result = SystemOrchestrator.dispatch(uqo);
    console.log("✅ [SONDA] Resultado del Core:", JSON.stringify(result, null, 2));
    
    if (result.items && result.items[0]) {
      const created = result.items[0];
      console.log(`💎 [SONDA] Esquema creado con ID: ${created.id}`);
      console.log(`💎 [SONDA] Alias detectado: ${created.handle.alias}`);
      
      if (created.handle.alias === 'sin_titulo') {
         console.error("❌ [SONDA] ERROR DE ANATOMÍA: El Core no reconoció el handle y asignó 'sin_titulo'.");
      } else {
         console.log("🌟 [SONDA] ÉXITO: El Core ha reconocido la anatomía canónica.");
      }
    }
  } catch (err) {
    console.error("❌ [SONDA] ERROR CRÍTICO EN DISPATCH:", err);
  }
}
