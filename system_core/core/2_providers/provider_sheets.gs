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
      TABULAR_STREAM: { sync: 'BLOCKING' },
      TABULAR_UPDATE: { sync: 'BLOCKING' },
      BATCH_UPDATE: { sync: 'BLOCKING' },
      ATOM_DELETE: { sync: 'BLOCKING' },
      SCHEMA_MUTATE: { sync: 'BLOCKING' },
      SEARCH_DEEP: { sync: 'BLOCKING' },
      SCHEMA_FIELD_OPTIONS: { sync: 'BLOCKING' }
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
    if (protocol === 'TABULAR_UPDATE') return _sheets_handleTabularUpdate(uqo); // Nueva Ley Canónica v17.6
    if (protocol === 'ATOM_UPDATE')    return _sheets_handleAtomUpdate(uqo);
    if (protocol === 'ATOM_DELETE')    return _sheets_handleAtomDelete(uqo);
    if (protocol === 'SCHEMA_MUTATE')  return _sheets_handleSchemaMutate(uqo);
    if (protocol === 'SEARCH_DEEP')    return _sheets_handleSearchDeep(uqo);
    if (protocol === 'SCHEMA_FIELD_OPTIONS') return _sheets_handleSchemaFieldOptions(uqo);
    
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
  
  // 2. POSICIONAMIENTO (Axioma del Ledger)
  const destFolderId = uqo.context_id || 'ROOT';
  logInfo(`[GPS_TRACE] Moviendo Silo a destino: ${destFolderId}`);
  
  if (destFolderId !== 'ROOT') {
    try {
      const folder = DriveApp.getFolderById(destFolderId);
      DriveApp.getFileById(ssId).moveTo(folder);
      logInfo(`[GPS_SUCCESS] Silo materializado en membrana: ${folder.getName()}`);
    } catch (e) {
      logError(`[GPS_FATAL] Error de posicionamiento para ${destFolderId}`, e);
      throw createError('STORAGE_POSITIONING_FAILED', `No se pudo mover el silo al destino indicado: ${e.message}`);
    }
  }

  // 3. IMPRESIÓN DE ADN (Cabeceras con Formato Ledger)
  if (fields.length > 0) {
    const sheet = ss.getSheets()[0];
    
    // AXIOMA DE IDENTIDAD INMUTABLE: Todo Silo Sheets debe iniciar con su columna mágica soberana y sus trazadores universales
    const headers = ['_indra_id', '_origin_id', '_origin_provider']; 
    
    fields.forEach(f => {
      const h = typeof f === 'string' ? f : (f.handle?.label || f.label || f.alias || f.id);
      if (!headers.includes(h)) headers.push(h); // Prevenir dobles inyecciones si el usuario lo mandó
    });
    
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    sheet.setFrozenRows(1);
    
    // Ocultamos las 3 Columnas Técnicas para proteger la pureza estética del Humano
    sheet.hideColumns(1, 3);
    
    // Estética de Precisión Indra (Tokens Sincronizados)
    range.setFontWeight("bold")
         .setBackground("#050505") // Negro profundo Indra
         .setFontColor("#ffffff")
         .setFontFamily("Outfit, Inter, Roboto, sans-serif")
         .setHorizontalAlignment("center")
         .setVerticalAlignment("middle");
    
    // Inyección de Acento Soberano (Borde Inferior Neon)
    range.setBorder(null, null, true, null, null, null, "#00ffc8", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    sheet.autoResizeColumns(1, headers.length);
    sheet.setRowHeight(1, 32); // Mayor holgura para legibilidad
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
      physical_id: ssId, // Crucial: Exportar el ID real de 44 chars
      mimetype: 'application/vnd.google-apps.spreadsheet'
    } 
  };
}

function _sheets_handleTabularStream(uqo) {
  const ssId = uqo.context_id;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = _sheets_get_target_tab_(ss, uqo);
  
  logInfo(`[sheets:stream] Sonda de Territorio -> Archivo: "${ss.getName()}" | Pestaña: "${sheet.getName()}" | Filas Físicas: ${sheet.getLastRow()}`);
  
  const rangeData = sheet.getDataRange().getValues();
  const headers = rangeData.shift() || [];
  const fields = headers.map(h => ({ id: _system_slugify_(h), label: h }));

  const pkName = _sheets_discover_primary_key_(headers);
  const pkIdx = headers.map(h => _system_slugify_(h)).indexOf(_system_slugify_(pkName));

  const items = rangeData.map((row, idx) => {
    return _sheets_row_to_atom_(row, headers, ssId, sheet.getName(), pkIdx, idx);
  });

  return { items, metadata: { status: 'OK', schema: { fields }, _anchor_used: pkName } };
}

/**
 * Convierte una fila física en un Átomo Indra Soberano.
 * @private
 */
function _sheets_row_to_atom_(row, headers, ssId, sheetName, pkIdx, rowIdx) {
    const obj = {};
    headers.forEach((h, i) => { 
        if (h) obj[_system_slugify_(h)] = row[i]; 
    });

    // AXIOMA DE IDENTIDAD SOBERANA (v19.0)
    // El ID del átomo es el valor de su llave primaria, no su posición física.
    const sovereignId = (pkIdx !== -1 && row[pkIdx]) ? String(row[pkIdx]) : `${ssId}_row_${rowIdx}`;

    return {
      ...obj,
      id: sovereignId,
      handle: { 
          label: obj.handle || obj.label || obj.name || `Fila ${rowIdx + 1}`,
          alias: obj.alias || _system_slugify_(obj.handle || obj.label || obj.name || sovereignId)
      },
      class: obj.class || obj.clase || (sheetName === 'Entidades' ? 'IDENTITY' : 'TABULAR_ROW'),
      provider: 'sheets',
      _physical: {
          ss_id: ssId,
          sheet: sheetName,
          row_index: rowIdx + 2 // Basado en 1 y saltando cabecera
      }
    };
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

/**
 * TABULAR_UPDATE: Escribe o actualiza celdas masivamente (Inserción y UPSERT Real).
 */
/**
 * TABULAR_UPDATE: Escribe o actualiza celdas masivamente (Inserción y UPSERT Real).
 * v19.0: SINCERIDAD AXIAL Y SOBERANÍA DE ESQUEMA.
 */
function _sheets_handleTabularUpdate(uqo) {
  const ssId = uqo.data?.silo_id || uqo.context_id;
  const actions = uqo.data?.actions || [];
  
  if (!ssId) throw createError('INVALID_INPUT', 'TABULAR_UPDATE requiere silo_id o context_id.');
  if (actions.length === 0) return { items: [], metadata: { status: 'OK', records_mutated: 0 } };

  const ss = SpreadsheetApp.openById(ssId);
  const sheet = _sheets_get_target_tab_(ss, uqo);
  
  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(1, sheet.getLastColumn());
  
  // AXIOMA DE SOSTENIBILIDAD: Descargamos la cuadrícula para Merge quirúrgico
  const fullGrid = lastRow > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
  const headers = fullGrid.length > 0 ? fullGrid[0] : sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  const headerMap = {};
  headers.forEach((h, idx) => { 
    if (h) headerMap[_system_slugify_(h)] = idx + 1; 
  });

  // --- DESCUBRIMIENTO DE ANCLAJE SOBERANO (v19.0) ---
  const pkColumnName = _sheets_discover_primary_key_(headers);
  const pkIdx = headerMap[pkColumnName] - 1;
  
  logInfo(`[sheets:v19] Anclaje de Soberanía detectado: '${pkColumnName}' (Col: ${pkIdx + 1})`);

  const existingIds = {};
  if (lastRow > 1 && pkIdx !== -1) {
     fullGrid.forEach((row, idx) => {
         if (idx === 0) return; // Skip headers
         const idVal = String(row[pkIdx] || '').trim();
         if (idVal !== '') existingIds[idVal] = idx;
     });
  }

  const rowsToAppend = [];
  const orphans = new Set();
  let updatedCount = 0;
  
  actions.forEach(action => {
    if (action.type === 'CREATE' || action.type === 'UPDATE') {
      const flatData = action.data || {};
      const targetId = String(action.id || '');
      
      let isUpdate = targetId && existingIds[targetId] !== undefined;
      const rowArr = isUpdate ? [...fullGrid[existingIds[targetId]]] : new Array(headers.length).fill('');
      let mappedInThisRow = 0;
      
      // Inyección del ID en la columna de anclaje
      if (pkIdx !== -1 && targetId) {
          rowArr[pkIdx] = targetId;
      }

      Object.entries(flatData).forEach(([key, val]) => {
        const slugKey = _system_slugify_(key);
        const colIdx = headerMap[key] || headerMap[slugKey];
        
        if (colIdx) {
          // No sobreescribir el anclaje si ya lo pusimos, a menos que venga explícitamente
          if (colIdx - 1 === pkIdx && targetId) return; 
          
          rowArr[colIdx - 1] = val !== null && val !== undefined ? String(val) : '';
          mappedInThisRow++;
        } else {
           orphans.add(key); 
        }
      });
      
      if (mappedInThisRow > 0 || isUpdate) {
          if (isUpdate) {
              const rIdxLocal = existingIds[targetId];
              fullGrid[rIdxLocal] = rowArr;
              sheet.getRange(rIdxLocal + 1, 1, 1, rowArr.length).setValues([rowArr]);
              updatedCount++;
          } else {
              rowsToAppend.push(rowArr);
          }
      } else {
          logError(`[sheets:v19] Error de Mapeo: No se encontró ninguna columna para los datos de '${targetId}'`);
          throw createError('MAPPING_FAILED', `Imposible escribir fila '${targetId}'. Ningún campo coincide con las cabeceras: [${headers.join(', ')}]`);
      }
    }
  });

  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  }

  // AXIOMA DE CRISTALIZACIÓN FÍSICA (v19.0)
  SpreadsheetApp.flush();

  return { 
    items: [], 
    metadata: { 
      status: 'OK', 
      records_mutated: updatedCount + rowsToAppend.length, 
      primary_key_used: pkColumnName,
      ignored_fields: Array.from(orphans),
      _engine: 'SHEETS_SOVEREIGN_v19'
    } 
  };
}

/**
 * Inteligencia de Descubrimiento de Esquema.
 * Determina cuál es la columna "ancla" de la hoja.
 * @private
 */
function _sheets_discover_primary_key_(headers) {
    const slugHeaders = headers.map(h => _system_slugify_(h));
    
    // Prioridad 1: La columna sagrada de Indra (si existe)
    if (slugHeaders.includes('indra_id')) return 'indra_id';
    
    // Prioridad 2: La columna de identidad universal
    if (slugHeaders.includes('id')) return 'id';
    if (slugHeaders.includes('uid')) return 'uid';
    if (slugHeaders.includes('email')) return 'email';
    
    // Prioridad 3: La primera columna que no esté vacía
    for (let i = 0; i < headers.length; i++) {
        if (headers[i]) return slugHeaders[i];
    }
    
    return slugHeaders[0] || 'id';
}

/**
 * RESOLUCIÓN DE MEMBRANA TABULAR (v18.0)
 * Busca la pestaña correcta por nombre o prioridad.
 */
function _sheets_get_target_tab_(ss, uqo) {
    const sheets = ss.getSheets();
    const priorityNames = [uqo.data?.sheet_name, uqo.sheet_name, 'entidades', 'identity', 'atoms'];
    logInfo(`[sheets:trace] Buscando pestaña (Case-Insensitive). Prioridades: ${priorityNames.filter(n => !!n).join(', ')}`);
    
    for (let name of priorityNames) {
        if (!name) continue;
        const targetLower = name.toLowerCase();
        const found = sheets.find(s => s.getName().toLowerCase() === targetLower);
        if (found) {
            logInfo(`[sheets:trace] Pestaña detectada: ${found.getName()}`);
            return found;
        }
    }
    
    // AXIOMA DE GÉNESIS TABULAR (v18.0)
    const requestedName = uqo.data?.sheet_name || uqo.sheet_name;
    if (requestedName && uqo.protocol === 'TABULAR_UPDATE') {
        logInfo(`[sheets:genesis] Creando santuario tabular: ${requestedName}`);
        const newSheet = ss.insertSheet(requestedName);
        const baseHeaders = ['_indra_id', 'class', 'email', 'name', 'role', 'updated_at'];
        newSheet.getRange(1, 1, 1, baseHeaders.length).setValues([baseHeaders]);
        return newSheet;
    }
    
    logWarn(`[sheets:trace] Ninguna pestaña coincidente. Usando Hoja 1: ${sheets[0].getName()}`);
    return sheets[0];
}

/**
 * ATOM_DELETE: Archiva el Silo (Mueve a Papelera de Drive).
 */
function _sheets_handleAtomDelete(uqo) {
  const ssId = uqo.context_id;
  if (!ssId) throw createError('INVALID_INPUT', 'ATOM_DELETE requiere context_id.');
  try {
    DriveApp.getFileById(ssId).setTrashed(true);
    return { items: [], metadata: { status: 'OK' } };
  } catch (e) {
    throw createError('SYSTEM_FAILURE', 'No se pudo eliminar el silo.');
  }
}

/**
 * SCHEMA_MUTATE: Añade nuevas columnas físicas a la Sheet.
 */
function _sheets_handleSchemaMutate(uqo) {
  const ssId = uqo.context_id;
  const data = uqo.data || {};
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheets()[0];
  
  if (data.action === 'ADD_FIELD') {
    const newFieldLabel = data.field?.handle?.label || data.field?.id || 'Nueva Columna';
    const lastCol = Math.max(1, sheet.getLastColumn());
    sheet.getRange(1, lastCol + 1).setValue(newFieldLabel)
         .setFontWeight("bold")
         .setBackground("#050505")
         .setFontColor("#ffffff");
    sheet.autoResizeColumn(lastCol + 1);
  }
  
  return { items: [_sheets_handleAtomRead(uqo).items[0]], metadata: { status: 'OK' } };
}

/**
 * SEARCH_DEEP: Busca un término transversalmente en la hoja.
 */
function _sheets_handleSearchDeep(uqo) {
  const ssId = uqo.context_id;
  const query = uqo.query?.text || uqo.data?.query;
  if (!ssId || !query) return { items: [], metadata: { status: 'OK' } };

  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheets()[0];
  const textFinder = sheet.createTextFinder(query).matchCase(false);
  const matches = textFinder.findAll();
  
  const rowsFound = new Set();
  matches.forEach(m => rowsFound.add(m.getRow()));
  
  return { items: [], metadata: { status: 'OK', records_found: rowsFound.size } };
}

/**
 * SCHEMA_FIELD_OPTIONS: Detecta Menús Desplegables (Data Validation).
 */
function _sheets_handleSchemaFieldOptions(uqo) {
  const ssId = uqo.context_id;
  const fieldId = uqo.data?.field_id;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheets()[0];
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  
  let colIndex = -1;
  headers.forEach((h, idx) => {
    if (_system_slugify_(h) === fieldId) colIndex = idx + 1;
  });
  
  if (colIndex === -1) return { items: [], metadata: { status: 'OK', options: [] } };
  
  const rule = sheet.getRange(2, colIndex).getDataValidation();
  let options = [];
  if (rule && rule.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
    options = rule.getCriteriaValues()[0] || [];
  }
  
  return { items: [], metadata: { status: 'OK', options: options.map(o => ({ value: o, label: o })) } };
}
