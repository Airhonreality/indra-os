/**
 * @file debug_notion_hydration.gs
 * @description DIAGNÓSTICO PROFUNDO: Verifica la "Ley de Soberanía Lexical" en NotionAdapter.
 * Simula una consulta a una base de datos real y verifica si los IDs de relaciones se hidratan.
 */

function debug_notion_hydration() {
  const assembler = SystemAssembler.assembleServerStack();
  const monitor = assembler.monitoringService;
  const notionAdapter = assembler.notionAdapter;
  const configurator = assembler.configurator;

  monitor.logInfo("🔍 [HYDRATION_PROBE] Iniciando diagnóstico de Soberanía Lexical...");

  // 1. Obtener una Database ID Real desde la configuración (o usar una conocida de prueba)
  // Intentamos obtener la base de datos de PROYECTOS o COTIZACIONES que suelen tener relaciones
  let targetDbId = configurator.retrieveParameter({ key: 'NOTION_DB_PROJECTS_ID' }); 
  
  if (!targetDbId) {
      // Fallback: Intentar buscar una base de datos cualquiera si no hay config específica
      monitor.logWarn("⚠️ No se encontró NOTION_DB_PROJECTS_ID. Buscando la primera base de datos disponible...");
      const searchResult = notionAdapter.search({ query: '', filter: { property: 'object', value: 'database' } });
      if (searchResult.results.length > 0) {
          targetDbId = searchResult.results[0].id;
          monitor.logInfo(`✅ Base de datos encontrada para prueba: ${searchResult.results[0].title || targetDbId}`);
      } else {
          monitor.logError("❌ No se encontraron bases de datos en Notion para realizar la prueba.");
          return;
      }
  }

  monitor.logInfo(`🎯 Target Database ID: ${targetDbId}`);

  try {
    // 2. Ejecutar Query (Limit 5 para no saturar)
    const startTime = new Date().getTime();
    const response = notionAdapter.queryDatabase({
      databaseId: targetDbId,
      pageSize: 5
    });
    const endTime = new Date().getTime();

    monitor.logInfo(`✅ Query ejecutada en ${endTime - startTime}ms. Resultados: ${response.results.length}`);

    if (response.results.length === 0) {
        monitor.logWarn("⚠️ La base de datos está vacía. No se puede verificar hidratación.");
        return;
    }

    // 3. Inspeccionar Resultados en busca de Relaciones
    const firstRow = response.results[0];
    const schema = response.SCHEMA; // El adaptador debería devolver el schema usado
    
    monitor.logInfo("🔬 Inspeccionando primera fila...");
    
    // Buscar propiedades tipo 'relation' en el esquema (si está disponible en la respuesta o inferido)
    // O inspeccionar directamente los valores
    let relationFound = false;
    let hydrationSuccess = false;

    Object.keys(firstRow).forEach(key => {
        const val = firstRow[key];
        
        // Verificamos si parece una relación
        // Criterio Ley Lexical: Debe ser un Array de Objetos con { id, name }
        if (Array.isArray(val) && val.length > 0) {
            const firstItem = val[0];
            
            // Si es un simple string ID, FALLÓ LA HIDRATACIÓN
            if (typeof firstItem === 'string' && firstItem.length > 30) {
                monitor.logError(`❌ FALLO DE SOBERANÍA: La propiedad '${key}' contiene IDs crudos: ${firstItem}`);
                relationFound = true;
            } 
            // Si es un objeto { id, name }, ÉXITO
            // Si es un objeto { id, name }, VERIFICAR QUE EL NOMBRE NO SEA EL ID
            else if (typeof firstItem === 'object' && firstItem.id && firstItem.name) {
                if (firstItem.id === firstItem.name) {
                    monitor.logError(`❌ FALLO DE HIDRATACIÓN: La propiedad '${key}' retornó un objeto {id, name} pero el nombre es igual al ID (Fallback activado).`);
                    relationFound = true;
                } else {
                    monitor.logInfo(`✅ SOBERANÍA VALIDADA: La propiedad '${key}' está hidratada: [${firstItem.name}] (${firstItem.id})`);
                    relationFound = true;
                    hydrationSuccess = true;
                }
            }
        }
    });

    if (!relationFound) {
        monitor.logWarn("⚠️ No se detectaron propiedades de relación con datos en la primera fila. Prueba no concluyente.");
    } else if (hydrationSuccess) {
        monitor.logInfo("🎉 DIAGNÓSTICO EXITOSO: El NotionAdapter respeta la Ley de Soberanía Lexical.");
    } else {
        monitor.logError("💀 DIAGNÓSTICO FALLIDO: Se detectaron relaciones sin hidratar.");
    }

  } catch (e) {
    monitor.logError(`💀 EXCEPCIÓN CRÍTICA: ${e.message} \n ${e.stack}`);
  }
}
