// =============================================================================
// ARTEFACTO: 5_diagnostics/identity_repair.gs
// CAPA: 5 — Diagnostics
// RESPONSABILIDAD: El Cirujano de Identidades. Escanea el sistema de archivos buscando
//         discrepancias entre el ID real de Drive y el ID interno de los átomos.
//         Corrige los punteros y actualiza los PINS para restaurar la coherencia.
// =============================================================================

/**
 * REPARADOR SOBERANO: Sincroniza identidades falsas con IDs de Drive.
 * Escanea todos los átomos del sistema, corrige sus IDs internos y
 * luego actualiza todos los PINS en todos los Workspaces para que apunten
 * a las identidades reales de Drive.
 */
function runSystemIdentityRepair() {
  console.log("🚀 Iniciando Operación de Reparación de Identidades (Deep Scan)...");
  
  const root = _system_ensureHomeRoot();
  const idMap = {}; // { falseId: realDriveId }
  
  // FASE 1: Escaneo Global de Átomos (Búsqueda en TODAS las subcarpetas del root)
  console.log("\n[FASE 1] Escaneo Global de Átomos...");
  const subFolders = root.getFolders();
  
  while (subFolders.hasNext()) {
    const subFolder = subFolders.next();
    console.log(`  📂 Escaneando carpeta: ${subFolder.getName()}...`);
    const files = subFolder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() !== 'application/json') continue;
      
      const realId = file.getId();
      try {
        let content = JSON.parse(file.getBlob().getDataAsString());
        let changed = false;

        // 1. Sinceridad Ontológica (IDs)
        const oldId = content.id;
        if (oldId && oldId !== realId) {
          console.log(`    🔧 Corrigiendo ID: ${file.getName()} [${oldId} -> ${realId}]`);
          idMap[oldId] = realId;
          content.id = realId;
          changed = true;
        }

        // 2. Salud Axiomática IUH (v3.0)
        if (!content.handle || !content.handle.alias) {
          console.log(`    🧬 Inyectando IUH v3.0 en: ${file.getName()}`);
          const label = content.handle?.label || content.label || content.name || file.getName().replace('.json', '');
          const alias = content.handle?.alias || label.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
          
          content.handle = {
            ns: content.handle?.ns || `com.indra.repair.${content.class?.toLowerCase() || 'item'}`,
            alias: alias || 'slot_recovered',
            label: label
          };
          changed = true;
        }

        // Deprecar campo legacy 'name' si existe y tenemos handle
        if (content.name && content.handle) {
          delete content.name;
          changed = true;
        }

        if (changed) {
          file.setContent(JSON.stringify(content, null, 2));
        }
      } catch (e) {
        console.warn(`    ⚠️ Error al procesar ${file.getName()}: ${e.message}`);
      }
    }
  }

  // FASE 2: Sincronización de Referencias (Pins en Workspaces)
  console.log("\n[FASE 2] Sincronizando Referencias en Workspaces...");
  const wsFolderName = _system_getFolderForClass('WORKSPACE');
  const wsFolder = _system_getOrCreateSubfolder_(wsFolderName);
  const wsFiles = wsFolder.getFiles();
  
  while (wsFiles.hasNext()) {
    const wsFile = wsFiles.next();
    if (wsFile.getMimeType() !== 'application/json') continue;
    
    try {
      const ws = JSON.parse(wsFile.getBlob().getDataAsString());
      if (Array.isArray(ws.pins)) {
        let changed = false;
        ws.pins = ws.pins.map(pin => {
          if (idMap[pin.id]) {
            console.log(`    📍 Actualizando PIN en "${ws.name}": ${pin.id} -> ${idMap[pin.id]}`);
            pin.id = idMap[pin.id];
            changed = true;
          }
          return pin;
        });
        
        if (changed) {
          wsFile.setContent(JSON.stringify(ws, null, 2));
        }
      }
    } catch (e) {
      console.warn(`    ⚠️ Error en Workspace ${wsFile.getName()}: ${e.message}`);
    }
  }

  console.log("\n✅ REPARACIÓN DE IDENTIDAD COMPLETADA.");
  console.log(`Total Átomos Sincerados: ${Object.keys(idMap).length}`);
}
