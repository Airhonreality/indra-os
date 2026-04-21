/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_sheets.gs
 * RESPONSABILIDAD: Motor Tabular Soberano (Google Sheets).
 * PROTOCOLO: TABULAR_STREAM, ATOM_READ, ATOM_CREATE, ATOM_UPDATE.
 * =============================================================================
 */

function CONF_SHEETS() {
  return Object.freeze({
    id: 'sheets',
    handle: {
      ns: 'com.indra.system.tabular',
      alias: 'sheets',
      label: 'Google Sheets',
      icon: 'TABLE'
    },
    class: 'SERVICE',
    capabilities: {
      ATOM_READ: { sync: 'BLOCKING' },
      ATOM_CREATE: { sync: 'BLOCKING' },
      ATOM_UPDATE: { sync: 'BLOCKING' },
      TABULAR_STREAM: { sync: 'BLOCKING' }
    }
  });
}

/**
 * Handler Principal del Provider de Sheets.
 */
function handleSheets(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();
  logInfo(`[provider_sheets] Dispatching: ${protocol}`, { id: uqo.context_id });

  try {
    if (protocol === 'ATOM_READ')      return _sheets_handleAtomRead(uqo);
    if (protocol === 'ATOM_CREATE')    return _sheets_handleAtomCreate(uqo);
    if (protocol === 'TABULAR_STREAM') return _sheets_handleTabularStream(uqo);
    if (protocol === 'ATOM_UPDATE')    return _sheets_handleAtomUpdate(uqo);
    
    throw createError('PROTOCOL_NOT_FOUND', `Sheets no soporta: ${protocol}`);
  } catch (err) {
    logError('[provider_sheets] Fallo crítico.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_READ: Extrae metadatos y esquema (cabeceras) de una Sheet.
 */
function _sheets_handleAtomRead(uqo) {
  const ssId = uqo.context_id;
  if (!ssId) throw createError('INVALID_INPUT', 'ATOM_READ requiere context_id (SS_ID).');

  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheets()[0];
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  
  const fields = headers.filter(h => !!h).map(h => ({
    id: _system_slugify_(h),
    handle: { label: String(h), alias: _system_slugify_(h) },
    type: 'STRING'
  }));

  const atom = {
    id: ssId,
    class: 'TABULAR',
    provider: 'sheets',
    handle: { label: ss.getName(), alias: _system_slugify_(ss.getName()) },
    payload: { fields: fields, row_count: sheet.getLastRow() - 1 },
    protocols: ['TABULAR_STREAM', 'ATOM_READ', 'ATOM_UPDATE'],
    raw: { url: ss.getUrl() }
  };

  return { items: [atom], metadata: { status: 'OK' } };
}

/**
 * ATOM_CREATE: Crea una Spreadsheet física con formateo premium.
 */
function _sheets_handleAtomCreate(uqo) {
  const data = uqo.data || {};
  const label = data.handle?.label || data.name || 'Nueva Base de Datos';
  const fields = data.fields || [];
  
  // 1. GÉNESIS FÍSICA
  const ss = SpreadsheetApp.create(label.trim());
  const ssId = ss.getId();
  const file = DriveApp.getFileById(ssId);
  logInfo(`[IDENTITY_AUDIT] sheets:ATOM_CREATE -> ID: ${ssId} (Len: ${ssId.length}) | Mime: ${file.getMimeType()}`);
  
  // 2. POSICIONAMIENTO (Mover a la carpeta de destino o raíz de Indra)
  const destFolderId = uqo.context_id || 'ROOT';
  const destFolder = (destFolderId === 'ROOT') ? DriveApp.getRootFolder() : DriveApp.getFolderById(destFolderId);
  destFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  // 3. IMPRESIÓN DE ADN (Cabeceras)
  if (fields.length > 0) {
    const sheet = ss.getSheets()[0];
    const headers = fields.map(f => (typeof f === 'object' ? (f.label || f.alias || f.id) : f));
    const range = sheet.getRange(1, 1, 1, headers.length);
    
    range.setValues([headers]);
    sheet.setFrozenRows(1);
    
    // Estética Premium (Axioma de la Belleza Técnica)
    range.setFontWeight("bold")
         .setBackground("#1a1a1a")
         .setFontColor("#ffffff")
         .setFontFamily("Inter, Roboto, sans-serif")
         .setHorizontalAlignment("center");
    
    sheet.autoResizeColumns(1, headers.length);
  }

  const atom = {
    id: ssId,
    class: 'TABULAR',
    provider: 'sheets',
    handle: { label: label, alias: _system_slugify_(label) },
    payload: { fields: fields },
    raw: { url: ss.getUrl() }
  };

  return { 
    items: [atom], 
    metadata: { 
      status: 'OK', 
      silo_url: ss.getUrl(),
      physical_id: ssId
    } 
  };
}

/**
 * TABULAR_STREAM: Stream de datos desde la Sheet.
 */
function _sheets_handleTabularStream(uqo) {
  const ssId = uqo.context_id;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheets()[0];
  const rangeData = sheet.getDataRange().getValues();
  
  const headers = rangeData.shift() || [];
  const fields = headers.map(h => ({ id: _system_slugify_(h), label: h }));

  const items = rangeData.map((row, idx) => {
    const obj = {};
    headers.forEach((h, i) => { obj[_system_slugify_(h)] = row[i]; });
    return {
      ...obj,
      id: `${ssId}_row_${idx}`,
      handle: { label: `Fila ${idx + 1}` },
      class: 'TABULAR_ROW',
      provider: 'sheets'
    };
  });

  return { items, metadata: { status: 'OK', schema: { fields } } };
}

/**
 * ATOM_UPDATE: Actualización de celdas o metadatos.
 */
function _sheets_handleAtomUpdate(uqo) {
  const ssId = uqo.context_id;
  const data = uqo.data || {};
  const ss = SpreadsheetApp.openById(ssId);

  if (data.name) ss.setName(data.name);
  
  // Aquí se podrían añadir protocolos de parcheo de celdas específicos
  
  return { items: [_sheets_handleAtomRead(uqo).items[0]], metadata: { status: 'OK' } };
}
