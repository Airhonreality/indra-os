/**
 * =============================================================================
 * ARTEFACTO: 6_audit/maintenance_genesis.gs
 * RESPONSABILIDAD: Re-Génesis Ontológica (SOLO PARA DESARROLLO / ACCESO GAS).
 * AXIOMA: RESET DE MATERIA, CONSERVACIÓN DE CONCIENCIA.
 * 
 * !!! ATENCIÓN !!!: Este archivo está en .gitignore. Solo debe existir en 
 * entornos de desarrollo controlado. NO EXPONER EN GATEWAY.
 * =============================================================================
 */

/**
 * Ejecuta un reset total de la materia (objetos) conservando la estructura (keys).
 * DEBE SER EJECUTADA MANUALMENTE DESDE EL EDITOR DE APPS SCRIPT.
 */
function SYSTEM_GENESIS_RESET() {
  logWarn('!!! INICIANDO RE-GÉNESIS ONTOLÓGICA !!!');


  try {
    // 1. LIMPIEZA DE PROPIEDADES (REFERENCIAS LÓGICAS)
    const store = PropertiesService.getScriptProperties();
    const allProps = store.getProperties();
    const keysToKeep = [
      'SYS_CORE_URL',
      'SYS_CORE_ID',
      'SYS_CORE_OWNER_UID',
      'SYS_CORE_OWNER_EMAIL',
      'LLM_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'GOOGLE_API_KEY',
      'NOTION_TOKEN'
      // No incluimos SYS_IS_BOOTSTRAPPED para permitir re-bootstrap
    ];

    let purgeCount = 0;
    for (const key in allProps) {
      if (!keysToKeep.includes(key)) {
        store.deleteProperty(key);
        purgeCount++;
      }
    }
    logInfo(`[genesis] Purga de Propiedades completada. Removidas: ${purgeCount}`);

    // 2. LIMPIEZA DE DRIVE (MATERIA FÍSICA)
    // Buscamos la carpeta .core_system y sus subcarpetas de materia
    const rootFolder = _system_getOrCreateRootFolder_();
    const subfolders = rootFolder.getFolders();
    
    let filePurgeCount = 0;
    while (subfolders.hasNext()) {
      const folder = subfolders.next();
      const folderName = folder.getName();
      
      // SOLO BORRAMOS CARPETAS DE MATERIA ACCIONABLE
      // Conservamos carpetas de Logs, Vault o Configuración si existieran.
      const MATERIA_FOLDERS = ['Workspaces', 'Artifacts', 'Schemas', 'Bridges', 'Workflows', 'Documents'];
      
      if (MATERIA_FOLDERS.includes(folderName) || folderName.includes('silo:')) {
        const files = folder.getFiles();
        while (files.hasNext()) {
          const file = files.next();
          file.setTrashed(true);
          filePurgeCount++;
        }
        logInfo(`[genesis] Carpeta purgada: ${folderName}`);
      }
    }
    logInfo(`[genesis] Purga de Materia completada. Archivos enviados a papelera: ${filePurgeCount}`);

    // 3. RE-INICIALIZACIÓN DE LEDGERS
    // El Ledger de Pulsos y el Hub de Triggers deben limpiarse.
    _genesis_clearLedgers_();

    logInfo('!!! RE-GÉNESIS COMPLETADA CON ÉXITO !!! Indra está en estado virginal.');
    return "SUCCESS: Indra Purified.";

  } catch (err) {
    logError('[genesis] FALLO CRÍTICO DURANTE EL RESET.', err);
    return "ERROR: " + err.message;
  }
}

/**
 * Limpia las hojas de registro sin borrar el archivo.
 * @private
 */
function _genesis_clearLedgers_() {
  const store = PropertiesService.getScriptProperties();
  const ledgerId = store.getProperty('PULSE_LEDGER_ID');
  if (ledgerId) {
    try {
      const ss = SpreadsheetApp.openById(ledgerId);
      const sheets = ss.getSheets();
      sheets.forEach(sheet => {
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }
      });
      logInfo('[genesis] Ledger de Pulsos reseteado.');
    } catch (e) {
      logWarn('[genesis] No se pudo acceder al Ledger para limpieza.');
    }
  }
}

/**
 * Helper para obtener la carpeta raíz .core_system
 * Re-implementado aquí para independencia absoluta durante el reset.
 * @private
 */
function _system_getOrCreateRootFolder_() {
  const FOLDER_NAME = '.core_system';
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(FOLDER_NAME);
}
