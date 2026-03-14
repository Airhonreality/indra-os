// =============================================================================
// ARTEFACTO: 5_diagnostics/identity_repair.gs
// CAPA: 5 — Diagnostics
// RESPONSABILIDAD: El Cirujano de Identidades. Escanea el sistema de archivos buscando
//         discrepancias entre el ID real de Drive y el ID interno de los átomos.
//         Corrige los punteros, inyecta protocolos faltantes y actualiza los PINS.
// =============================================================================

/**
 * REPARADOR SOBERANO: Sincroniza identidades falsas con IDs de Drive.
 * Además, inyecta los protocolos necesarios para cumplir con el ADR-008.
 */
function runSystemIdentityRepair() {
  console.log("🚀 Iniciando Operación de Reparación de Identidades (Deep Scan + Evolution)...");

  const root = _system_ensureHomeRoot();
  const idMap = {}; // { falseId: realDriveId }

  // Mapeo de protocolos por clase para evolución ADR-008
  const PROTOCOL_MAP = {
    'WORKSPACE': ['SYSTEM_PIN', 'SYSTEM_UNPIN', 'SYSTEM_PINS_READ', 'SYSTEM_WORKSPACE_REPAIR', 'ATOM_READ', 'ATOM_UPDATE', 'ATOM_DELETE'],
    'DATA_SCHEMA': ['ATOM_READ', 'ATOM_UPDATE', 'ATOM_DELETE', 'TABULAR_STREAM', 'SCHEMA_SUBMIT'],
    'WORKFLOW': ['ATOM_READ', 'ATOM_UPDATE', 'ATOM_DELETE', 'WORKFLOW_EXECUTE'],
    'DOCUMENT': ['ATOM_READ', 'ATOM_UPDATE', 'ATOM_DELETE'],
    'FORMULA': ['ATOM_READ', 'ATOM_UPDATE', 'ATOM_DELETE']
  };

  // FASE 1: Escaneo Global de Átomos
  console.log("\n[FASE 1] Escaneo Global y Evolución de Átomos...");
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

        // --- 1. Sinceridad Ontológica (IDs) ---
        const oldId = content.id;
        if (!oldId || oldId !== realId) {
          if (oldId) {
            console.log(`    🔧 Corrigiendo ID: ${file.getName()} [${oldId} -> ${realId}]`);
            idMap[oldId] = realId;
          }
          content.id = realId;
          changed = true;
        }

        // --- 2. Salud Axiomática IUH (v3.0) ---
        if (!content.handle || !content.handle.alias) {
          console.log(`    🧬 Inyectando IUH v3.0 en: ${file.getName()}`);
          const label = content.handle?.label || content.label || content.name || file.getName().replace('.json', '');
          const alias = _system_slugify_(label) || 'slot_recovered';

          content.handle = {
            ns: content.handle?.ns || `com.indra.system.${(content.class || 'item').toLowerCase()}`,
            alias: alias,
            label: label
          };
          changed = true;
        }

        // --- 3. Inyección de Protocolos (ADR-008 Law of Customs) ---
        if (!content.protocols || !Array.isArray(content.protocols) || content.protocols.length === 0) {
          const atomClass = (content.class || '').toUpperCase();
          const defaultProtos = PROTOCOL_MAP[atomClass] || ['ATOM_READ'];
          console.log(`    🛡️ Inyectando protocolos para ${atomClass}: [${defaultProtos.join(', ')}]`);
          content.protocols = defaultProtos;
          changed = true;
        }

        // --- 4. Limpieza de Legacy ---
        if (content.name) {
          console.log(`    🧹 Deprecando campo legacy 'name' en ${file.getName()}`);
          delete content.name;
          changed = true;
        }
        if (content.label && content.handle) {
          delete content.label;
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
      if (ws.pins && Array.isArray(ws.pins)) {
        let changed = false;
        ws.pins = ws.pins.map(pin => {
          // Si el ID del pin está en nuestro mapa de IDs corregidos
          if (idMap[pin.id]) {
            console.log(`    📍 Actualizando PIN en "${ws.handle?.label || ws.name}": ${pin.id} -> ${idMap[pin.id]}`);
            pin.id = idMap[pin.id];
            changed = true;
          }
          // Asegurar que el pin también tenga integridad básica
          if (!pin.provider) {
            pin.provider = 'system';
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

  console.log("\n✅ EVOLUCIÓN DE INFRAESTRUCTURA COMPLETADA.");
  console.log(`Total Átomos Sincerados: ${Object.keys(idMap).length}`);
}

/**
 * Función diagnóstica para ser llamada desde el editor de Apps Script.
 */
function DIAGNOSTIC_REPAIR_SYSTEM() {
  runSystemIdentityRepair();
}
