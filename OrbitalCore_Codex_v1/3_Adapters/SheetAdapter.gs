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

  // ======================================================================
  // FASE 1D.3 - INTERACCIÓN 9: Helpers de Mapeo de Datos
  // Propósito: Transformación bidireccional Array<Array> ↔ Array<Object>
  // ======================================================================

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

  // ======================================================================
  // FASE 1D.3 - INTERACCIÓN 10: Lectura Batch con SpreadsheetApp
  // ======================================================================

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
      return _mapArrayToObject(headers, dataRows);
      
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
      
      // Convertir objetos a arrays usando helper de Interacción 9
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

  const schemas = {
    createSheet: {
      description: "Initializes a new industrial Google Spreadsheet circuit with optional canonical header configuration.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          name: { type: "string", io_behavior: "STREAM", description: "The display identifier for the new spreadsheet asset." },
          header: { type: "array", io_behavior: "SCHEMA", description: "Technical definition of canonical column headers." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for resource ownership routing." }
        }, 
        outputs: {
          sheetId: { type: "string", io_behavior: "PROBE", description: "Unique industrial spreadsheet identifier." },
          url: { type: "string", io_behavior: "BRIDGE", description: "Direct access URL for the asset." }
        } 
      }
    },
    insertRows: {
      description: "Appends industrial tabular data arrays to the terminal end of a target sheet circuit.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          sheetId: { type: "string", io_behavior: "GATE", description: "Target spreadsheet identifier." },
          sheetName: { type: "string", io_behavior: "GATE", description: "Specific technical sheet/tab identifier." },
          rows: { type: "array", io_behavior: "STREAM", description: "Outer collection of row data arrays." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
        }, 
        outputs: {
          rowsReaded: { type: "number", io_behavior: "PROBE", description: "Count of processed industrial data points." }
        } 
      }
    },
    insertRowsBatch: {
      description: "Orchestrates complex object-to-row mapping and high-integrity batch record insertion into the institutional registry.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          sheetId: { type: "string", io_behavior: "GATE", description: "Target spreadsheet identifier." },
          sheetName: { type: "string", io_behavior: "GATE", description: "Target technical sheet name." },
          rows: { type: "array", io_behavior: "STREAM", description: "Array of structured industrial data objects." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          rowsInserted: { type: "number", io_behavior: "PROBE", description: "Total count of successfully persisted industrial records." }
        } 
      }
    },
    getRows: {
      description: "Extracts an industrial sheet dataset and transforms it into structured object streams based on canonical headers.",
      semantic_intent: "SENSOR",
      io_interface: { 
        inputs: {
          sheetId: { type: "string", io_behavior: "GATE", description: "Source institutional spreadsheet identifier." },
          sheetName: { type: "string", io_behavior: "GATE", description: "Specific technical sheet name." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          rows: { type: "array", io_behavior: "STREAM", description: "Collection of data objects with technical metadata." }
        } 
      }
    },
    findRowByValue: {
      description: "Executes a technical scan for a specific value across a target institutional column index.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          sheetId: { type: "string", io_behavior: "GATE", description: "Target spreadsheet identifier." },
          columnIndex: { type: "number", io_behavior: "GATE", description: "1-based industrial column index for the scan." },
          value: { type: "any", io_behavior: "STREAM", description: "Exact technical value to locate." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          rowNumber: { type: "number", io_behavior: "PROBE", description: "The technical row index of the first industrial match." },
          rowData: { type: "array", io_behavior: "STREAM", description: "Complete linguistic contents of the discovered row." }
        } 
      }
    }
  };

  return Object.freeze({
    label: "Sheet Orchestrator",
    description: "Industrial processor for tabular data persistence, structural scaling, and high-performance registry management.",
    semantic_intent: "BRIDGE",
    archetype: "ADAPTER",
    schemas: schemas,
    createSheet,
    insertRows,
    verifyHeader,
    appendRow,
    findRowByValue,
    updateCell,
    updateRow,
    getRows,
    insertRowsBatch,
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
    // Exponer funciones privadas para testing
    _mapArrayToObject,
    _mapObjectToArray
  });
}

