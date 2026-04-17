/**
 * =============================================================================
 * ARTEFACTO: 4_support/pulse_ledger.gs
 * RESPONSABILIDAD: Gestión física del Pulse Ledger (Google Sheets).
 * AXIOMA: Soberanía Tabular. La cola debe ser legible por el usuario.
 * =============================================================================
 */

const LEDGER_FILE_NAME_ = 'PulseLedger';
const LEDGER_SHEET_NAME_ = 'QUEUE';

/**
 * Esquema robusto del Ledger (ADR-018 + Modelo Micelar)
 * @const {string[]}
 */
const LEDGER_COLUMNS = [
  'pulse_id',       // ID único (UUID)
  'timestamp',      // Creación (ISO)
  'scheduled_at',   // Ejecución prevista (ISO)
  'owner_id',       // Email del ejecutor (Micela)
  'trigger_source', // MANUAL, WEBHOOK, CRON
  'protocol',       // Protocolo Indra
  'provider',       // Provider Indra
  'status',         // PENDING, IGNITED, EXECUTING, COMPLETED, FAILED
  'uqo_payload',    // JSON completo de la intención
  'trace_id',       // Rastro para auditoría
  'result_summary'  // Resumen de ejecución
];

/**
 * Obtiene o crea el archivo físico del Ledger en .core_system.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function _pulse_getLedger() {
  const root = _system_ensureHomeRoot(); // → provider_system_infrastructure.gs
  const files = root.getFilesByName(LEDGER_FILE_NAME_);
  
  let ss;
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(LEDGER_FILE_NAME_);
    const file = DriveApp.getFileById(ss.getId());
    root.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    
    const sheet = ss.getSheets()[0];
    sheet.setName(LEDGER_SHEET_NAME_);
    sheet.appendRow(LEDGER_COLUMNS);
    sheet.setFrozenRows(1);
  }
  return ss;
}

/**
 * Registra un nuevo pulso en el Ledger.
 * @param {Object} pulseData - Datos del pulso según LEDGER_COLUMNS.
 */
function pulse_ledger_append(pulseData) {
  const ss = _pulse_getLedger();
  const sheet = ss.getSheetByName(LEDGER_SHEET_NAME_);
  
  const row = LEDGER_COLUMNS.map(col => {
    let val = pulseData[col];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val || '';
  });
  
  sheet.appendRow(row);
  logInfo(`[pulse_ledger] Pulso registrado: ${pulseData.pulse_id} (${pulseData.status})`);
}

/**
 * Actualiza el estado de un pulso existente.
 * @param {string} pulseId - ID único del pulso.
 * @param {string} status - Nuevo estado.
 * @param {Object} [extraFields] - Otros campos a actualizar (result_summary, etc).
 */
function pulse_ledger_updateStatus(pulseId, status, extraFields = {}) {
  const ss = _pulse_getLedger();
  const sheet = ss.getSheetByName(LEDGER_SHEET_NAME_);
  const data = sheet.getDataRange().getValues();
  
  const idIdx = LEDGER_COLUMNS.indexOf('pulse_id');
  const statusIdx = LEDGER_COLUMNS.indexOf('status');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === pulseId) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      
      // Actualizar campos extra si existen
      Object.keys(extraFields).forEach(key => {
        const colIdx = LEDGER_COLUMNS.indexOf(key);
        if (colIdx !== -1) {
          let val = extraFields[key];
          if (typeof val === 'object') val = JSON.stringify(val);
          sheet.getRange(i + 1, colIdx + 1).setValue(val);
        }
      });
      
      return true;
    }
  }
  return false;
}

/**
 * Lee pulsos pendientes de ejecución (PENDING y scheduled_at <= now).
 * @param {string} [ownerId] - Opcional: filtrar por dueño (ADR-019).
 * @returns {Array<Object>}
 */
function pulse_ledger_getPending(ownerId) {
  const ss = _pulse_getLedger();
  const sheet = ss.getSheetByName(LEDGER_SHEET_NAME_);
  
  // Validación defensiva: si la hoja fue deletada o renombrada, retornar vacío
  if (!sheet) {
    logWarn('[pulse_ledger] LEDGER_SHEET_NAME_ "' + LEDGER_SHEET_NAME_ + '" no encontrada.');
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  
  const statusIdx = LEDGER_COLUMNS.indexOf('status');
  const scheduledIdx = LEDGER_COLUMNS.indexOf('scheduled_at');
  const ownerIdx = LEDGER_COLUMNS.indexOf('owner_id');
  
  const pending = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Filtrado por dueño si se solicita (Micela)
    if (ownerId && row[ownerIdx] !== ownerId) continue;

    if (row[statusIdx] === 'PENDING') {
      const sched = row[scheduledIdx];
      if (!sched || sched <= now) {
        const pulse = {};
        LEDGER_COLUMNS.forEach((col, idx) => {
          pulse[col] = row[idx];
          if (col === 'uqo_payload') {
            try { pulse[col] = JSON.parse(row[idx]); } catch(e) {}
          }
        });
        pulse.row_idx = i + 1;
        pending.push(pulse);
      }
    }
  }
  return pending;
}

/**
 * Elimina pulsos antiguos (COMPLETED/FAILED) para mantener el Ledger ligero.
 */
function pulse_ledger_purge() {
  const ss = _pulse_getLedger();
  const sheet = ss.getSheetByName(LEDGER_SHEET_NAME_);
  const data = sheet.getDataRange().getValues();
  const statusIdx = LEDGER_COLUMNS.indexOf('status');
  
  // Iterar de abajo hacia arriba para no alterar índices al borrar
  for (let i = data.length - 1; i >= 1; i--) {
    const status = data[i][statusIdx];
    if (status === 'COMPLETED' || status === 'FAILED') {
      sheet.deleteRow(i + 1);
    }
  }
}
