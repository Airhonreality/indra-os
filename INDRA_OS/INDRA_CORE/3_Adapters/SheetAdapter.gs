// ======================================================================
// ARTEFACTO: 3_Adapters/SheetAdapter.gs (VERSIÓN ROBUSTA FINAL)
// NOTA: Incluye SpreadsheetApp.flush() en TODOS los métodos de escritura
//       para garantizar la atomicidad en cualquier contexto de ejecución.
// ======================================================================

function createSheetAdapter({ errorHandler }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('SheetAdapter requiere un errorHandler válido.');
  }

  function _getSheet(payload) {
    const { sheetId, sheetName = null } = payload;
    try {
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const sheet = sheetName ? spreadsheet.getSheetByName(sheetName) : spreadsheet.getSheets()[0];
      if (!sheet) {
        const message = sheetName ? `La hoja '${sheetName}' no se encontró.` : 'El Spreadsheet no contiene hojas.';
        throw errorHandler.createError('RESOURCE_NOT_FOUND', message, { sheetId, sheetName });
      }
      return sheet;
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Fallo al acceder a la hoja de cálculo con ID: ${sheetId}`, { originalError: e.message });
    }
  }

  // --- INDRA CANON: Normalización Semántica ---

  function _mapDataEntry(item, collectionId = 'google_sheet') {
    return {
      id: item.__id || Utilities.getUuid(),
      collection: collectionId,
      fields: item,
      timestamp: new Date().toISOString(),
      raw: item
    };
  }


  /**
   * Convierte datos tabulares (Array<Array>) a objetos (Array<Object>).
   * 
   * @param {Array<string>} headers - Array de nombres de columnas (primera fila)
   * @param {Array<Array>} values - Array de filas (cada fila es un array de valores)
   * @returns {Array<Object>} Array de objetos donde cada objeto tiene propiedades según headers
   * 
   * COMPORTAMIENTO:
   * - Celdas vacías (undefined, null) se convierten a string vacío ''
   * - Filas incompletas se rellenan con string vacío para columnas faltantes
   * - Headers define el orden y nombres de las propiedades
   * 
   * @example
   * _mapArrayToObject(['ID', 'Nombre'], [['001', 'Alpha'], ['002', 'Beta']])
   * // Returns: [{ ID: '001', Nombre: 'Alpha' }, { ID: '002', Nombre: 'Beta' }]
   */
  function _mapArrayToObject(headers, values) {
    if (!Array.isArray(headers) || !Array.isArray(values)) {
      throw errorHandler.createError('INVALID_INPUT', 
        '_mapArrayToObject requiere arrays en headers y values.');
    }

    return values.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Convertir undefined/null a string vacío (normalización)
        obj[header] = (row[index] !== undefined && row[index] !== null) ? row[index] : '';
      });
      return obj;
    });
  }

  /**
   * Convierte objetos (Array<Object>) a datos tabulares (Array<Array>).
   * 
   * @param {Array<string>} headers - Array de nombres de columnas (define el orden)
   * @param {Array<Object>} objects - Array de objetos a convertir
   * @returns {Array<Array>} Array de filas donde cada fila es un array de valores
   * 
   * COMPORTAMIENTO:
   * - Propiedades faltantes en objetos se convierten a string vacío ''
   * - Propiedades extra en objetos (no en headers) se ignoran
   * - Orden de columnas determinado por headers
   * 
   * @example
   * _mapObjectToArray(['ID', 'Nombre'], [{ ID: '001', Nombre: 'Alpha' }])
   * // Returns: [['001', 'Alpha']]
   */
  function _mapObjectToArray(headers, objects) {
    if (!Array.isArray(headers) || !Array.isArray(objects)) {
      throw errorHandler.createError('INVALID_INPUT', 
        '_mapObjectToArray requiere arrays en headers y objects.');
    }

    return objects.map(obj => {
      return headers.map(header => {
        // Convertir undefined/null a string vacío (normalización)
        return (obj[header] !== undefined && obj[header] !== null) ? obj[header] : '';
      });
    });
  }

  function createSheet(payload) {
    const { name, header } = payload;
    try {
      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw errorHandler.createError('INVALID_INPUT', 'El nombre para createSheet debe ser un string no vacío.');
      }
      const spreadsheet = SpreadsheetApp.create(name);
      if (header && Array.isArray(header) && header.length > 0) {
        const sheet = spreadsheet.getSheets()[0];
        sheet.getRange(1, 1, 1, header.length).setValues([header]);
        // Flush después de la creación inicial y escritura de cabecera.
        SpreadsheetApp.flush();
      }
      return { sheetId: spreadsheet.getId() };
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Fallo al crear la hoja de cálculo '${name}'.`, { originalError: e.message });
    }
  }

  function verifyHeader(payload) {
    const { sheetId, expectedHeader } = payload;
    try {
      const sheet = _getSheet({ sheetId });
      if (!expectedHeader || expectedHeader.length === 0) return { updated: false };

      const currentHeader = sheet.getRange(1, 1, 1, expectedHeader.length).getValues()[0];
      
      const isMatch = currentHeader.length === expectedHeader.length && currentHeader.every((value, index) => value === expectedHeader[index]);

      if (!isMatch) {
        sheet.getRange(1, 1, 1, expectedHeader.length).setValues([expectedHeader]);
        // Flush después de actualizar la cabecera.
        SpreadsheetApp.flush();
        return { updated: true };
      }
      return { updated: false };
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', 'Fallo al verificar la cabecera.', { originalError: e.message });
    }
  }

  function appendRow(payload) {
    const { sheetId, sheetName, rowData } = payload;
    try {
      if (!rowData || !Array.isArray(rowData)) {
        throw errorHandler.createError('INVALID_INPUT', 'appendRow requiere un array en rowData.');
      }
      const sheet = _getSheet({ sheetId, sheetName });
      sheet.appendRow(rowData);
      
      // Forzar la aplicación inmediata de la escritura.
      SpreadsheetApp.flush();
      
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', 'Fallo al añadir la fila.', { originalError: e.message });
    }
  }

  function findRowByValue(payload) {
    const { sheetId, sheetName, columnIndex, value } = payload;
    try {
        if (!value || typeof columnIndex !== 'number' || columnIndex < 1) {
            throw errorHandler.createError('INVALID_INPUT', 'findRowByValue requiere un valor y un columnIndex válido (>= 1).');
        }
        const sheet = _getSheet({ sheetId, sheetName });
        if (sheet.getLastRow() === 0) return null;

        const searchRange = sheet.getRange(1, columnIndex, sheet.getLastRow());
        const finder = searchRange.createTextFinder(String(value));
        const cell = finder.findNext();
        
        if (!cell) return null;
        
        const rowNumber = cell.getRow();
        const rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
        return { rowNumber, rowData };
    } catch (e) {
        if (e.code) throw e;
        throw errorHandler.createError('EXTERNAL_API_ERROR', 'Fallo al buscar la fila.', { originalError: e.message });
    }
  }

  function updateCell(payload) {
    const { sheetId, sheetName, rowNumber, columnIndex, value } = payload;
    try {
      console.log(`[SheetAdapter] updateCell: sheetId=${sheetId}, row=${rowNumber}, col=${columnIndex}`);
      
      if (typeof rowNumber !== 'number' || rowNumber < 1 || typeof columnIndex !== 'number' || columnIndex < 1) {
        throw errorHandler.createError('INVALID_INPUT', 'updateCell requiere rowNumber y columnIndex válidos (>= 1).');
      }
      const sheet = _getSheet({ sheetId, sheetName });
      sheet.getRange(rowNumber, columnIndex).setValue(value);
      // Flush después de actualizar una celda.
      SpreadsheetApp.flush();
      
      console.log(`[SheetAdapter] ✅ updateCell exitoso`);
    } catch (e) {
      // ✅ INSTRUMENTACIÓN: Logging del Error Nativo de SpreadsheetApp
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ [SheetAdapter] ERROR NATIVO DE SPREADSHEETAPP');
      console.error('═══════════════════════════════════════════════════════');
      console.error('Operación: updateCell');
      console.error('SheetId:', sheetId);
      console.error('SheetName:', sheetName);
      console.error('Row:', rowNumber);
      console.error('Column:', columnIndex);
      console.error('Value:', typeof value === 'string' ? value.substring(0, 100) : value);
      console.error('Error Name:', e.name);
      console.error('Error Message:', e.message);
      console.error('Error Stack:', e.stack);
      console.error('═══════════════════════════════════════════════════════');
      
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', 'Fallo al actualizar la celda.', { 
        originalError: e.message,
        originalName: e.name,
        sheetId, 
        rowNumber, 
        columnIndex 
      });
    }
  }

  function updateRow(payload) {
    const { sheetId, sheetName, rowNumber, rowData } = payload;
    try {
        if (typeof rowNumber !== 'number' || rowNumber < 1 || !Array.isArray(rowData)) {
            throw errorHandler.createError('INVALID_INPUT', 'updateRow requiere un rowNumber válido y un array en rowData.');
        }
        const sheet = _getSheet({ sheetId, sheetName });
        if (rowData.length > 0) {
            sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
            SpreadsheetApp.flush();
        }
    } catch (e) {
        if (e.code) throw e;
        throw errorHandler.createError('EXTERNAL_API_ERROR', 'Fallo al actualizar la fila.', { originalError: e.message });
    }
  }


  /**
   * Lee todas las filas de datos de una hoja como objetos.
   * 
   * @param {Object} payload
   * @param {string} payload.sheetId - ID del spreadsheet
   * @param {string} [payload.sheetName] - Nombre de la hoja (opcional, usa primera si no se especifica)
   * @returns {Array<Object>} Array de objetos donde cada objeto representa una fila
   * 
   * COMPORTAMIENTO:
   * - Fila 1 se usa como headers (nombres de propiedades)
   * - Filas 2+ se convierten a objetos usando _mapArrayToObject
   * - Si la hoja está vacía o solo tiene header, retorna []
   * - Usa SpreadsheetApp.getRange().getValues() (batch, no Sheets API v4 aún)
   * 
   * PERFORMANCE:
   * - 1 llamada getRange + 1 llamada getValues (batch)
   * - Para 1000 rows: ~2-5s (vs ~15s con 1000 llamadas individuales)
   * 
   * @example
   * getRows({ sheetId: 'abc123' })
   * // Returns: [{ ID: '001', Nombre: 'Alpha' }, { ID: '002', Nombre: 'Beta' }]
   */
  function getRows(payload) {
    const { sheetId, sheetName } = payload;
    try {
      const sheet = _getSheet({ sheetId, sheetName });
      const lastRow = sheet.getLastRow();
      
      // Si la hoja está vacía o solo tiene header (1 fila)
      if (lastRow <= 1) {
        return [];
      }
      
      const lastCol = sheet.getLastColumn();
      
      // Leer todas las filas de una vez (batch)
      const allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      
      // Primera fila son los headers
      const headers = allData[0];
      
      // Resto son los datos
      const dataRows = allData.slice(1);
      
      // Convertir a objetos usando helper
      const rows = _mapArrayToObject(headers, dataRows);

      // AXIOMA: Reducción de Entropía (Inferencia de Esquema)
      const schema = {
          columns: headers.map(h => ({
              id: h,
              label: h.toUpperCase(),
              type: 'STRING' // Default a string por seguridad en Sheets
          }))
      };

      // Normalizar a ISR (Indra Standard Response)
      return {
          results: rows.map(r => _mapDataEntry(r, sheetName || 'primary')),
          ORIGIN_SOURCE: 'drive',
          SCHEMA: schema,
          PAGINATION: {
              hasMore: false,
              nextToken: null,
              total: rows.length,
              count: rows.length
          },
          IDENTITY_CONTEXT: {
              accountId: null, // To be hydrated by controller
              permissions: {
                  canEdit: true, // Default if we have access to the script
                  role: 'editor'
              }
          }
      };
      
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', 
        'Fallo al leer filas de la hoja.', 
        { originalError: e.message, sheetId, sheetName });
    }
  }

  /**
   * Inserta múltiples filas en batch (operación optimizada)
   * 
   * PERFORMANCE: Usa setValues() en lugar de múltiples appendRow() para reducir API calls.
   * - Individual: 1000 rows = 1000 API calls (~15s)
   * - Batch: 1000 rows = 1 API call (<3s)
   * 
   * @param {Object} payload - Payload con sheetId/sheetName y rows
   * @param {string} payload.sheetId - ID del spreadsheet
   * @param {string} [payload.sheetName] - Nombre de la hoja (opcional, usa primera si no se especifica)
   * @param {Array<Object>} payload.rows - Array de objetos a insertar
   * 
   * @returns {Object} - { rowsInserted: number }
   * 
   * @throws {Error} Si payload no es válido, sheet no existe, o rows no es array
   * 
   * @example
   * const result = sheetAdapter.insertRowsBatch({
   *   sheetId: 'abc123',
   *   rows: [
   *     { ID: '001', Nombre: 'Alpha', Estado: 'Activo' },
   *     { ID: '002', Nombre: 'Beta', Estado: 'Inactivo' }
   *   ]
   * });
   * // result: { rowsInserted: 2 }
   */


  /**
   * Inserta múltiples filas (arrays de valores) en batch.
   * 
   * @param {Object} payload
   * @param {string} payload.sheetId
   * @param {string} [payload.sheetName]
   * @param {Array<Array>} payload.rows - Array de arrays con los valores
   */
  function insertRows(payload) {
    const { sheetId, sheetName, rows } = payload;
    try {
      if (!rows || !Array.isArray(rows)) {
        throw errorHandler.createError('INVALID_INPUT', 'insertRows requiere un array de arrays en rows.');
      }
      
      if (rows.length === 0) return;

      const sheet = _getSheet({ sheetId, sheetName });
      
      // Encontrar la longitud máxima de fila para uniformidad
      const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
      
      if (maxCols === 0) return; // Filas vacías
      
      // Normalizar filas para que tengan la misma longitud (rellenar con null/empty)
      // SpreadsheetApp.setValues requiere matriz rectangular perfecta
      const normalizedRows = rows.map(row => {
        if (row.length === maxCols) return row;
        const newRow = [...row];
        while (newRow.length < maxCols) newRow.push('');
        return newRow;
      });

      const startRow = sheet.getLastRow() + 1;
      
      sheet.getRange(startRow, 1, normalizedRows.length, maxCols).setValues(normalizedRows);
      
      SpreadsheetApp.flush();
      
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', 'Fallo al insertar filas.', { originalError: e.message });
    }
  }

  function insertRowsBatch(payload) {
    if (!payload || typeof payload !== 'object') {
      throw errorHandler.createError('INVALID_INPUT', 
        'El payload debe ser un objeto válido.');
    }

    const { sheetId, sheetName, rows } = payload;

    if (!rows || !Array.isArray(rows)) {
      throw errorHandler.createError('INVALID_INPUT', 
        'El campo "rows" debe ser un array de objetos.');
    }

    // Si el array está vacío, no hacer nada
    if (rows.length === 0) {
      return { rowsInserted: 0 };
    }

    try {
      const sheet = _getSheet({ sheetId, sheetName });
      
      // Obtener headers de la primera fila
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        throw errorHandler.createError('INVALID_INPUT', 
          'La hoja no tiene headers definidos. Use createSheet primero.');
      }
      
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      
      // Convertir objetos a arrays usando el mapeo de objetos
      const dataArrays = _mapObjectToArray(headers, rows);
      
      // Calcular posición de inicio (después de la última fila)
      const startRow = sheet.getLastRow() + 1;
      const numRows = dataArrays.length;
      const numCols = dataArrays[0].length;
      
      // ESCRITURA BATCH: Una sola llamada setValues() para todas las filas
      sheet.getRange(startRow, 1, numRows, numCols).setValues(dataArrays);
      
      // Flush para asegurar escritura inmediata
      SpreadsheetApp.flush();
      
      return { rowsInserted: numRows };
      
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', 
        'Fallo al insertar filas en batch.', 
        { originalError: e.message, sheetId, sheetName, rowCount: rows.length });
    }
  }



  function injectFormula(payload) {
    const { sheetId, sheetName, cell, formula } = payload;
    try {
      if (!cell || typeof cell !== 'string' || !formula || typeof formula !== 'string' || !formula.startsWith('=')) {
        throw errorHandler.createError('INVALID_INPUT', "injectFormula requires a valid cell (e.g., 'A1') and a formula starting with '='.");
      }
      
      const sheet = _getSheet({ sheetId, sheetName });
      sheet.getRange(cell).setFormula(formula);
      
      // Atomic flush to ensure calculation triggers immediately in the Google Engine
      SpreadsheetApp.flush();
      
      return { status: "COMPUTED", cell, formula };
      
    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('EXTERNAL_API_ERROR', 'Failed to inject formula.', { originalError: e.message });
    }
  }


  function verifyConnection() {
    try {
      SpreadsheetApp.getActiveSpreadsheet(); // Probe
      return { status: "ACTIVE" };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

    // --- SOVEREIGN CANON V8.0 (Poly-Archetype Composition) ---
    const CANON = {
        LABEL: "Sheets Interface",
        
        // AXIOMA: Identidad Compuesta. Sheet es la base de datos industrial.
        // Frontend renderiza: Tab General (Adapter) + Tab Datos (Grid).
        ARCHETYPES: ["ADAPTER", "GRID"], 
        ARCHETYPE: "DATAGRID", // Fallback Legacy
        
        DOMAIN: "DATA",
        SEMANTIC_INTENT: "BRIDGE",
        MATH_CAPABILITIES: {
            "engine": "NATIVE_GS_FORMULA",
            "injectable": true,
            "constructs": {
                "sum": { "syntax": "=SUM({{range}})", "desc": "Summation of range" },
                "average": { "syntax": "=AVERAGE({{range}})", "desc": "Mean value" },
                "vlookup": { "syntax": "=VLOOKUP({{value}}, {{range}}, {{col}}, FALSE)", "desc": "Exact match search" },
                "if": { "syntax": "=IF({{condition}}, {{true}}, {{false}})", "desc": "Conditional logic" },
                "query": { "syntax": "=QUERY({{range}}, \"{{sql_like_string}}\")", "desc": "Powerful SQL-like filter" }
            }
        },
        CAPABILITIES: {
            "create": { 
                "io": "WRITE", "desc": "Init spreadsheet", 
                "inputs": {
                    "name": { type: "string", desc: "Display identifier." },
                    "header": { type: "array", desc: "Column definitions." }
                } 
            },
            "read": { 
                "io": "READ", "desc": "Fetch rows", 
                "inputs": {
                    "sheetId": { type: "string", desc: "Target ID." },
                    "sheetName": { type: "string", desc: "Optional tab name." }
                },
                "outputs": {
                    "items": { type: "array", desc: "Collection of data objects." }
                }
            },
            "append": { 
                "io": "WRITE", "desc": "Insert batch rows", 
                "inputs": {
                    "sheetId": { type: "string", desc: "Target ID." },
                    "rows": { type: "array", desc: "Data objects to insert." }
                }
            },
            "update": { 
                "io": "WRITE", "desc": "Modify cell/row", 
                "inputs": {
                    "sheetId": { type: "string", desc: "Target ID." },
                    "rowNumber": { type: "number", desc: "Row index." },
                    "columnIndex": { type: "number", desc: "Column index." },
                    "value": { type: "any", desc: "New content." }
                } 
            },
            "query": { 
                "io": "READ", "desc": "Find by value", 
                "inputs": {
                    "sheetId": { type: "string", desc: "Target ID." },
                    "columnIndex": { type: "number", desc: "Search column." },
                    "value": { type: "any", desc: "Search term." }
                } 
            },
            "compute": {
                "io": "WRITE", 
                "desc": "Inject native formula (V8 Optimized)", 
                "inputs": {
                    "sheetId": { "type": "string" },
                    "sheetName": { "type": "string", "optional": true },
                    "cell": { "type": "string", "desc": "A1 Notation cell reference" }, 
                    "formula": { "type": "string", "desc": "Formula starting with =" } 
                }
            }
        },
        VITAL_SIGNS: {
            "SHEETS_API": { "criticality": "NOMINAL", "value": "ACTIVE", "trend": "flat" },
            "CALC_TIME": { "criticality": "NOMINAL", "value": "<200ms", "trend": "stable" }
        },
        UI_LAYOUT: {
            "SIDE_PANEL": "ENABLED",
            "TERMINAL_STREAM": "ENABLED"
        }
    };

  return {
    // Identidad Canónica
    CANON: CANON,

    // Sovereign Aliases
    create: createSheet,
    read: getRows,
    append: insertRowsBatch,
    update: updateCell,
    query: findRowByValue,
    compute: injectFormula,
    
    // Legacy Bridge
    get schemas() {
        const s = {};
        for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
            s[key] = {
                description: cap.desc,
                io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
            };
        }
        return s;
    },

    // Technical Methods
    id: "sheet", // Override
    createSheet,
    insertRows,
    verifyHeader,
    appendRow,
    findRowByValue,
    updateCell,
    updateRow,
    getRows,
    insertRowsBatch,
    injectFormula, // Technical Access
    verifyConnection,
    deleteRows: function(payload) {
      const { sheetId, sheetName, startRow, numRows } = payload;
      try {
        const sheet = _getSheet({ sheetId, sheetName });
        sheet.deleteRows(startRow, numRows || 1);
        SpreadsheetApp.flush();
      } catch (e) {
        if (e.code) throw e;
        throw errorHandler.createError('EXTERNAL_API_ERROR', 'Fallo al eliminar filas.', { originalError: e.message });
      }
    },
    clearRows: function(payload) {
      const { sheetId, sheetName, startRow } = payload;
      try {
        const sheet = _getSheet({ sheetId, sheetName });
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow >= startRow) {
          sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).clearContent();
          SpreadsheetApp.flush();
        }
      } catch (e) {
        if (e.code) throw e;
        throw errorHandler.createError('EXTERNAL_API_ERROR', 'Fallo al limpiar filas.', { originalError: e.message });
      }
    },
    _mapArrayToObject,
    _mapObjectToArray
  };
}

