/**
 * 🛠️ INDRA INFRASTRUCTURE DIAGNOSTIC
 * Dharma: Revelar la visibilidad real del Core sobre el sistema de archivos de Google Drive.
 * RESPONSABILIDAD: Identificar por qué los Workspaces se vuelven 'inaccesibles'.
 */
function runInfraDiagnostic() {
  console.log("\n--- 🕵️ AUDITORÍA DE VISIBILIDAD DE DRIVE ---");
  
  try {
    // 1. Resolución de Identidad
    const identity = _system_getIdentity();
    console.log(`🔑 Identidad del Core: ${identity.core_name || 'Sin nombre'}`);
    console.log(`📂 Root Folder ID (desde infra_identity): ${identity.root_folder_id}`);

    if (!identity.root_folder_id) {
        throw new Error("El Core no tiene un root_folder_id configurado en infra_identity.gs");
    }

    // 2. Prueba de Acceso Físico
    const rootFolder = DriveApp.getFolderById(identity.root_folder_id);
    console.log(`📁 Nombre de Carpeta Raíz: ${rootFolder.getName()}`);
    console.log("---------------------------------------------------------");

    // 3. Escaneo de Sub-carpetas (Candidatos a Workspace)
    console.log("📡 Escaneando sub-carpetas en la raíz...");
    const folders = rootFolder.getFolders();
    let found = 0;
    
    while (folders.hasNext()) {
      const folder = folders.next();
      let hasManifest = "❌ Sin manifiesto";
      
      // Intentar buscar manifest.json
      const files = folder.getFilesByName('manifest.json');
      if (files.hasNext()) {
          hasManifest = "✅ MANIFEST.JSON DETECTADO";
      }
      
      console.log(`   📂 [${folder.getName()}]`);
      console.log(`      ID: ${folder.getId()}`);
      console.log(`      Estado: ${hasManifest}`);
      found++;
    }

    if (found === 0) {
        console.warn("⚠️ ADVERTENCIA: La carpeta raíz existe pero Indra no encuentra sub-carpetas dentro.");
    }

  } catch (e) {
    console.error("❌ COLAPSO DE DIAGNÓSTICO: " + e.message);
    console.log("Posibles causas:");
    console.log("- El ID en infra_identity.gs es incorrecto.");
    console.log("- El script no tiene permisos de Drive (Ejecuta una función de Drive para forzar el prompt).");
    console.log("- La carpeta raíz fue movida a la papelera.");
  }
  
  console.log("\n--- 🏁 FIN DE AUDITORÍA ---");
}
