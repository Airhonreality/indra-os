/**
 * Script de Diagnóstico Profundo: Carpeta FLOWS
 * Objetivo: Verificar qué hay realmente en la carpeta FLOWS y por qué no se listan los Cosmos
 */

function debug_FlowsFolder() {
  console.log("🔍 [DIAGNÓSTICO] Iniciando auditoría de carpeta FLOWS...\n");
  
  try {
    // 1. Verificar que existe la propiedad
    const flowsFolderId = PropertiesService.getScriptProperties().getProperty('ORBITAL_FOLDER_FLOWS_ID');
    
    if (!flowsFolderId) {
      console.error("❌ CRÍTICO: ORBITAL_FOLDER_FLOWS_ID no está configurado.");
      console.log("   Ejecuta el script de bootstrap primero.");
      return;
    }
    
    console.log(`✅ FLOWS Folder ID encontrado: ${flowsFolderId}\n`);
    
    // 2. Intentar acceder a la carpeta
    let folder;
    try {
      folder = DriveApp.getFolderById(flowsFolderId);
      console.log(`✅ Carpeta accesible: "${folder.getName()}"\n`);
    } catch (e) {
      console.error(`❌ ERROR al acceder a la carpeta: ${e.message}`);
      return;
    }
    
    // 3. Listar TODO el contenido (sin filtros)
    console.log("📂 Contenido COMPLETO de la carpeta FLOWS:");
    console.log("─".repeat(80));
    
    const allFiles = folder.getFiles();
    const allFolders = folder.getFolders();
    
    let fileCount = 0;
    let folderCount = 0;
    let jsonCount = 0;
    
    // Listar carpetas
    while (allFolders.hasNext()) {
      const subfolder = allFolders.next();
      console.log(`📁 [CARPETA] ${subfolder.getName()} (ID: ${subfolder.getId()})`);
      folderCount++;
    }
    
    // Listar archivos
    const jsonFiles = [];
    while (allFiles.hasNext()) {
      const file = allFiles.next();
      const mimeType = file.getMimeType();
      const name = file.getName();
      const id = file.getId();
      
      console.log(`📄 [ARCHIVO] ${name}`);
      console.log(`   MimeType: ${mimeType}`);
      console.log(`   ID: ${id}`);
      
      if (mimeType === 'application/json' || name.endsWith('.json')) {
        jsonCount++;
        jsonFiles.push({ id, name, file });
        console.log(`   ✅ Es JSON - Será analizado`);
      }
      
      console.log("");
      fileCount++;
    }
    
    console.log("─".repeat(80));
    console.log(`📊 RESUMEN:`);
    console.log(`   Total Carpetas: ${folderCount}`);
    console.log(`   Total Archivos: ${fileCount}`);
    console.log(`   Archivos JSON: ${jsonCount}\n`);
    
    // 4. Analizar cada JSON
    if (jsonCount === 0) {
      console.warn("⚠️ No se encontraron archivos JSON en la carpeta FLOWS.");
      console.log("   Esto significa que no se ha creado ningún Cosmos, o están en otra ubicación.\n");
      return;
    }
    
    console.log("🔬 ANÁLISIS DE ARCHIVOS JSON:");
    console.log("─".repeat(80));
    
    jsonFiles.forEach((item, index) => {
      console.log(`\n[${index + 1}/${jsonCount}] Analizando: ${item.name}`);
      
      try {
        const content = item.file.getBlob().getDataAsString();
        console.log(`   ✅ Contenido legible (${content.length} chars)`);
        
        try {
          const parsed = JSON.parse(content);
          console.log(`   ✅ JSON válido`);
          console.log(`   Schema: ${parsed.indx_schema || 'NO DEFINIDO'}`);
          console.log(`   ID: ${parsed.id || 'NO DEFINIDO'}`);
          console.log(`   Label: ${parsed.identity?.label || 'NO DEFINIDO'}`);
          
          if (parsed.indx_schema === 'COSMOS_V1') {
            console.log(`   ✅ ES UN COSMOS VÁLIDO`);
          } else {
            console.log(`   ⚠️ NO es un Cosmos (schema incorrecto)`);
          }
          
        } catch (parseErr) {
          console.error(`   ❌ ERROR al parsear JSON: ${parseErr.message}`);
          console.log(`   Primeros 200 chars: ${content.substring(0, 200)}`);
        }
        
      } catch (readErr) {
        console.error(`   ❌ ERROR al leer archivo: ${readErr.message}`);
      }
    });
    
    console.log("\n" + "─".repeat(80));
    console.log("🏁 Diagnóstico completado.\n");
    
  } catch (e) {
    console.error(`💥 ERROR CATASTRÓFICO: ${e.message}`);
    console.error(e.stack);
  }
}
