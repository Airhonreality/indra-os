/**
 * =============================================================================
 * PROVISIONING SCRIPT: DemoWorkflow.gs
 * RESPONSABILIDAD: Crear los 4 átomos necesarios para el flujo de "Reporte Digital".
 * INSTRUCCIONES: Copiar este código en un nuevo archivo .gs en el Core de INDRA y ejecutar 'provisionDemo'.
 * =============================================================================
 */

function provisionDemo() {
  const provider = 'system';
  const workspaceId = 'default_workspace'; // Cambiar por ID real si es necesario

  console.log('--- INICIANDO PROVISIÓN DE FLUJO DEMO ---');

  // 1. CREAR DATA_SCHEMA (El Formulario del AEE)
  const schemaResult = route({
    provider: provider,
    protocol: 'ATOM_CREATE',
    data: {
      class: 'DATA_SCHEMA',
      handle: { label: 'Formulario de Reporte Industrial' },
      payload: {
        fields: [
            { id: 'f1', handle: { alias: 'output_name', label: 'Nombre de la Carpeta Destino' }, type: 'STRING' },
            { id: 'f2', handle: { alias: 'report_title', label: 'Título del Documento PDF' }, type: 'STRING' },
            { id: 'f3', handle: { alias: 'report_body', label: 'Contenido del Reporte' }, type: 'LONG_TEXT' },
            { id: 'f4', handle: { alias: 'report_image', label: 'Imagen de Cabecera' }, type: 'IMAGE' }
        ]
      }
    }
  });
  const schemaId = schemaResult.items[0].id;
  console.log('✅ SCHEMA Creado:', schemaId);

  // 2. CREAR DOCUMENT_DESIGNER (La Plantilla)
  const docResult = route({
    provider: provider,
    protocol: 'ATOM_CREATE',
    data: {
      class: 'DOCUMENT',
      handle: { label: 'Plantilla de Reporte Automático' },
      payload: {
        elements: [
            { type: 'HEADER', content: 'REPORTE GENERADO DESDE INDRA' },
            { type: 'IMAGE', source_alias: 'report_image' },
            { type: 'TITLE', content_alias: 'report_title' },
            { type: 'PARAGRAPH', content_alias: 'report_body' },
            { type: 'FOOTER', content: 'Generado automáticamente por el motor AEE.' }
        ]
      }
    }
  });
  const templateId = docResult.items[0].id;
  console.log('✅ DOCUMENT TEMPLATE Creado:', templateId);

  // 3. CREAR BRIDGE (La Lógica de Conexión)
  const bridgeResult = route({
    provider: provider,
    protocol: 'ATOM_CREATE',
    data: {
      class: 'BRIDGE',
      handle: { label: 'Lógica: Del Formulario al PDF' },
      payload: {
        sources: [schemaId],
        targets: [templateId],
        mappings: {
            [templateId]: {
                'report_title': 'source.report_title',
                'report_body': 'source.report_body',
                'report_image': 'source.report_image'
            }
        },
        operators: [
            {
                id: 'op_folder',
                class: 'DRIVE_DIR_CREATE',
                inputs: { name: 'source.output_name' }
            }
        ]
      }
    }
  });
  const bridgeId = bridgeResult.items[0].id;
  console.log('✅ BRIDGE Creado:', bridgeId);

  // 4. CREAR WORKFLOW (El Proceso de Negocio)
  const workflowResult = route({
    provider: provider,
    protocol: 'ATOM_CREATE',
    data: {
      class: 'WORKFLOW',
      handle: { label: 'Flujo: Generación de Reporte Con Imagen' },
      payload: {
        stations: [
            {
                id: 'st_1',
                label: 'Captura de Datos (AEE)',
                engine: 'AEE_RUNNER',
                schema_id: schemaId
            },
            {
                id: 'st_2',
                label: 'Creación de Carpeta',
                engine: 'DRIVE_ENGINE',
                bridge_id: bridgeId,
                operator_id: 'op_folder'
            },
            {
                id: 'st_3',
                label: 'Generación de PDF',
                engine: 'DOCUMENT_ENGINE',
                template_id: templateId,
                bridge_id: bridgeId
            }
        ]
      }
    }
  });
  const workflowId = workflowResult.items[0].id;
  console.log('✅ WORKFLOW Creado:', workflowId);

  // 5. ANCLAR AL WORKSPACE (SYSTEM_PIN)
  if (workspaceId) {
      route({ provider: 'system', protocol: 'SYSTEM_PIN', workspace_id: workspaceId, data: { atom: workflowResult.items[0] } });
      console.log('✅ WORKFLOW Anclado al Workspace.');
  }

  // 6. GENERAR URL PARA EL AEE
  const aeeUrl = `https://script.google.com/macros/s/.../exec?artifact_id=${schemaId}&mode=AEE_RUNNER`;
  console.log('\n🚀 PROVISIÓN COMPLETADA EXITOSAMENTE');
  console.log('URL DEL FORMULARIO (AEE):', aeeUrl);
  
  return { schemaId, templateId, bridgeId, workflowId, aeeUrl };
}
