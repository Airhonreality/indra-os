// =============================================================================
// ARTEFACTO: 2_providers/provider_system_ledger.gs
// CAPA: 2 — Providers (Almacenamiento)
// RESPONSABILIDAD: El único guardián de la Google Sheet Maestra (El Ledger).
//         Implementa el Axioma 1: Fallo Ruidoso ante inconsistencias.
// =============================================================================

const LEDGER_SHEET_NAME = 'ATOMS';
const KEYCHAIN_SHEET_NAME = 'KEYCHAIN';
const INFRA_SHEET_NAME = 'INFRASTRUCTURE';
const MASTER_LEDGER_COLUMNS = ['gid', 'drive_id', 'class', 'alias', 'label', 'owner_id', 'updated_at', 'payload_json'];
const KEYCHAIN_COLUMNS = ['token', 'name', 'status', 'class', 'parent_id', 'can_delegate', 'created_at', 'scopes_json'];
const INFRA_COLUMNS = ['key', 'drive_id', 'label', 'updated_at'];

/**
 * Obtiene la Sheet del Ledger. Lanza error fatal si no existe o no es accesible.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 * @private
 */
function _ledger_get_sheet_(allowMissing = false) {
  const ledgerId = readMasterLedgerId();
  if (!ledgerId) {
    if (allowMissing) return null; // Tolerancia durante el Bootstrap/Génesis
    
    // AXIOMA DE RESILIENCIA: Si el Ledger falta y lo necesitamos para escribir, lo creamos JIT.
    logWarn('[ledger] MASTER_LEDGER_ID_MISSING. Iniciando creación de emergencia (JIT Genesis)...');
    return _ledger_get_sheet_(true) || SpreadsheetApp.openById(ledger_initialize_new()).getSheetByName(LEDGER_SHEET_NAME);
  }

  try {
    const ss = SpreadsheetApp.openById(ledgerId);
    let sheet = ss.getSheetByName(LEDGER_SHEET_NAME);
    if (!sheet && allowMissing) {
      // Si estamos reconstruyendo, nos aseguramos de que la pestaña exista
      sheet = ss.insertSheet(LEDGER_SHEET_NAME);
      sheet.appendRow(MASTER_LEDGER_COLUMNS);
      sheet.setFrozenRows(1);
    }
    if (!sheet) {
      throw new Error(`RED_ALERT: La pestaña "${LEDGER_SHEET_NAME}" no existe en el Ledger.`);
    }
    return sheet;
  } catch (e) {
    if (allowMissing) return null;
    throw new Error(`CRITICAL_INFRASTRUCTURE_FAILURE: El Ledger es inaccesible. ${e.message}`);
  }
}

/**
 * Registra o actualiza un átomo en el Ledger.
 * @param {Object} atom - El objeto átomo según ADR-001.
 * @param {string} driveId - El ID físico en Google Drive.
 */
function ledger_sync_atom(atom, driveId) {
  const sheet = _ledger_get_sheet_();
  const lock = LockService.getScriptLock();
  
  try {
    if (!lock.tryLock(5000)) throw new Error('LEDGER_LOCK_TIMEOUT: No se pudo sincronizar el átomo.');

    const rowData = _ledger_build_row_(atom, driveId);
    const data = sheet.getDataRange().getValues();
    
    // Buscar si ya existe por drive_id (Columna B / Index 1)
    const index = data.findIndex(row => row[1] === driveId);

    if (index === -1) {
      sheet.appendRow(rowData);
    } else {
      // Actualización atómica de la fila (Rango desde col 1, 1 fila, N columnas)
      sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Crea la estructura de fila canónica de Indra para el Ledger.
 * @private
 */
function _ledger_build_row_(atom, driveId) {
  return [
    atom.gid || `GID-${driveId.substring(0,8)}`,
    driveId,
    atom.class || 'UNKNOWN',
    atom.handle?.alias || '',
    atom.handle?.label || '',
    atom.owner_id || readCoreOwnerEmail(),
    atom.updated_at || new Date().toISOString(),
    JSON.stringify(atom.payload || {})
  ];
}

/**
 * Busca átomos por clase directamente en el Ledger.
 * @param {string} atomClass 
 * @returns {Array<Object>}
 */
function ledger_list_by_class(atomClass) {
  const sheet = _ledger_get_sheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Solo cabeceras

  return data
    .filter(row => row[2] === atomClass)
    .map(row => ({
      gid: row[0],
      id: row[1], // drive_id
      class: row[2],
      handle: { alias: row[3], label: row[4] },
      owner_id: row[5],
      updated_at: row[6],
      payload: row[7] ? JSON.parse(row[7]) : {}
    }));
}

/**
 * Elimina un átomo del Ledger.
 * @param {string} driveId 
 */
function ledger_remove_atom(driveId) {
  const sheet = _ledger_get_sheet_();
  const data = sheet.getDataRange().getValues();
  const index = data.findIndex(row => row[1] === driveId);
  
  if (index !== -1) {
    sheet.deleteRow(index + 1);
  } else {
    console.warn(`[ledger] Intento de eliminar átomo inexistente en Ledger: ${driveId}`);
  }
}

/**
 * Inicializa un nuevo Master Ledger desde cero.
 * @returns {string} El ID de la nueva Google Sheet.
 */
function ledger_initialize_new() {
  const ss = SpreadsheetApp.create('INDRA_MASTER_LEDGER');
  
  // 1. Átomos
  const atomSheet = ss.getSheets()[0];
  atomSheet.setName(LEDGER_SHEET_NAME);
  atomSheet.appendRow(MASTER_LEDGER_COLUMNS);
  atomSheet.setFrozenRows(1);

  // 2. Llavero
  const keySheet = ss.insertSheet(KEYCHAIN_SHEET_NAME);
  keySheet.appendRow(KEYCHAIN_COLUMNS);
  keySheet.setFrozenRows(1);

  // 3. Infraestructura (Mapeo de carpetas)
  const infraSheet = ss.insertSheet(INFRA_SHEET_NAME);
  infraSheet.appendRow(INFRA_COLUMNS);
  infraSheet.setFrozenRows(1);
  
  const ledgerId = ss.getId();
  storeMasterLedgerId(ledgerId);
  return ledgerId;
}

/**
 * PROTOCOLO DE RECONSTRUCCIÓN (EL BOTÓN ROJO)
 * Escanea recursivamente la carpeta de Indra en Drive y repuebla el Ledger.
 * @returns {Object} Resumen de la reconstrucción.
 */
function ledger_rebuild_from_drive() {
  logInfo('☢️ INICIANDO RECONSTRUCCIÓN TOTAL DEL LEDGER (MODO BATCH)...');
  
  const homeRoot = _system_ensureHomeRoot();
  const rows = [];
  
  // Función recursiva para recolectar todo antes de tocar la Sheet
  function collectFiles(folder) {
    const files = folder.getFiles(); // Escanear todo (el parser validará contenido)
    while (files.hasNext()) {
      const f = files.next();
      if (f.getName().endsWith('.json')) {
        try {
          const content = JSON.parse(f.getBlob().getDataAsString());
          if (content.class) rows.push(_ledger_build_row_(content, f.getId()));
        } catch (e) {
          // Ignoramos silenciosamente archivos sin alma de átomo
        }
      }
    }
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) collectFiles(subfolders.next());
  }

  collectFiles(homeRoot);
  logInfo(`[ledger] Datos recolectados en memoria: ${rows.length} átomos. Volcando al Ledger...`);

  if (rows.length === 0) return { status: 'OK', total_rebuilt: 0 };

  // OPERACIÓN PERISTÁLTICA (ADR-043 Industrial): Escribir mucho, pedir turno una sola vez.
  const sheet = _ledger_get_sheet_(true); // allowMissing=true para reconstrucción pura
  const lock = LockService.getScriptLock();
  
  try {
    if (!lock.tryLock(30000)) throw new Error('REBUILD_LOCK_TIMEOUT: No se pudo obtener control del Ledger.');
    
    // Limpiar y Volcar (SetValues es O(1) en Google Sheets API interna)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, MASTER_LEDGER_COLUMNS.length).clearContent();
    
    sheet.getRange(2, 1, rows.length, MASTER_LEDGER_COLUMNS.length).setValues(rows);
    
  } finally {
    lock.releaseLock();
  }

  logSuccess(`[ledger] Reconstrucción BULK completada: ${rows.length} átomos.`);
  return { status: 'OK', total_rebuilt: rows.length };
}

/**
 * Obtiene un metadato rápido del Ledger sin abrir el JSON.
 */
function ledger_get_by_drive_id(driveId) {
  const sheet = _ledger_get_sheet_();
  const data = sheet.getDataRange().getValues();
  const index = data.findIndex(row => row[1] === driveId);
  if (index === -1) return null;
  
  const row = data[index];
  return {
    gid: row[0],
    id: row[1],
    class: row[2],
    updated_at: row[6]
  };
}

/**
 * Obtiene metadatos de múltiples IDs de un solo golpe (v4.39).
 * @param {string[]} ids
 * @returns {Object} Mapa de { id: { label, class, updated_at } }
 */
function _ledger_get_batch_metadata_(ids) {
  const sheet = _ledger_get_sheet_();
  const data = sheet.getDataRange().getValues();
  const results = {};
  
  if (!ids || ids.length === 0) return results;

  data.forEach(row => {
    const driveId = row[1];
    if (ids.indexOf(driveId) !== -1) {
      results[driveId] = {
        gid: row[0],
        id: driveId,
        class: row[2],
        alias: row[3],
        label: row[4],
        updated_at: row[6]
      };
    }
  });

  return results;
}

/**
 * Retorna TODOS los registros del Ledger totalmente hidratados.
 * AXIOMA: Úselo solo para operaciones de impacto/auditoría masiva.
 * @returns {Array<Object>}
 */
function ledger_list_all_records() {
  const sheet = _ledger_get_sheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  return data.slice(1).map(row => ({
    gid: row[0],
    id: row[1],
    class: row[2],
    handle: { alias: row[3], label: row[4] },
    owner_id: row[5],
    updated_at: row[6],
    payload: row[7] ? JSON.parse(row[7]) : {}
  }));
}
/**
 * Lee todo el llavero desde el Ledger.
 * @returns {Object} Mapa de tokens { [token]: entry }
 */
function ledger_keychain_read_all() {
  const ssId = readMasterLedgerId();
  if (!ssId) return {};
  
  const ss = SpreadsheetApp.openById(ssId);
  let sheet = ss.getSheetByName(KEYCHAIN_SHEET_NAME);
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {};

  const ledger = {};
  data.slice(1).forEach(row => {
    ledger[row[0]] = {
      name: row[1],
      status: row[2],
      class: row[3],
      parent_id: row[4],
      can_delegate: row[5] === true || row[5] === 'TRUE',
      created_at: row[6],
      scopes: row[7] ? JSON.parse(row[7]) : []
    };
  });
  return ledger;
}

/**
 * Sincroniza una entrada individual en el Llavero del Ledger.
 */
function ledger_keychain_sync(token, entry) {
  const ssId = readMasterLedgerId();
  if (!ssId) ledger_initialize_new();
  
  const ss = SpreadsheetApp.openById(readMasterLedgerId());
  let sheet = ss.getSheetByName(KEYCHAIN_SHEET_NAME) || ss.insertSheet(KEYCHAIN_SHEET_NAME);
  
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error('KEYCHAIN_LOCK_TIMEOUT');

    const data = sheet.getDataRange().getValues();
    const rowData = [
      token,
      entry.name,
      entry.status,
      entry.class,
      entry.parent_id || '',
      entry.can_delegate,
      entry.created_at || new Date().toISOString(),
      JSON.stringify(entry.scopes || [])
    ];

    const index = data.findIndex(row => row[0] === token);
    if (index === -1) {
      sheet.appendRow(rowData);
    } else {
      sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Obtiene el ID de Drive de un componente de infraestructura (v4.40).
 * @param {string} key - La clave del componente (ej: 'workspaces', 'schemas').
 * @returns {string|null} El ID de Drive o null si no está mapeado.
 */
function ledger_infra_get(key) {
  const ssId = readMasterLedgerId();
  if (!ssId) return null;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(INFRA_SHEET_NAME);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const index = data.findIndex(row => row[0] === key);
  return index === -1 ? null : data[index][1];
}

/**
 * Registra o actualiza el mapeo de una carpeta de infraestructura (v4.40).
 */
function ledger_infra_sync(key, driveId, label) {
  const ssId = readMasterLedgerId() || ledger_initialize_new();
  const ss = SpreadsheetApp.openById(readMasterLedgerId());
  const sheet = ss.getSheetByName(INFRA_SHEET_NAME) || ss.insertSheet(INFRA_SHEET_NAME);
  
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(5000)) return;
    const data = sheet.getDataRange().getValues();
    const rowData = [key, driveId, label || key, new Date().toISOString()];
    const index = data.findIndex(row => row[0] === key);
    if (index === -1) sheet.appendRow(rowData);
    else sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
  } finally {
    lock.releaseLock();
  }
}
