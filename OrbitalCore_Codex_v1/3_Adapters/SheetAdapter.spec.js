// ======================================================================
// ARTEFACTO: 3_Adapters/SheetAdapter.spec.js (REPARADO Y CONFORME)
// NOTA: Verifica que SpreadsheetApp.flush() es llamado en operaciones de escritura.
// ======================================================================

function _setupSheetAdapterTests() {
  const originals = {
    SpreadsheetApp: globalThis.SpreadsheetApp
  };

  let _spreadsheetsDB = {}; // Base de datos en memoria

  // ✅ PATRÓN SPY OBJECT DE NIVEL SUPERIOR (FIX BASADO EN FOROS)
  // Fuente de verdad externa para contadores - evita pérdida de referencia en closures
  const spyRegistry = {
    setValues: 0,        // Contador global de llamadas a setValues()
    appendRow: 0         // Contador global de llamadas a appendRow()
  };

  const mocks = {
    mockErrorHandler: {
      createError: (code, msg, details) => {
        const e = new Error(msg);
        e.code = code;
        e.details = details;
        return e;
      }
    }
  };

  const flushSpy = { _callLog: [] };

  function _createMockRange(sheetData, startRow, startCol, numRows, numCols, spyRef) {
    return {
      getValues: () => {
        const result = [];
        for (let r = 0; r < numRows; r++) {
          const row = sheetData[startRow - 1 + r] || [];
          result.push(row.slice(startCol - 1, startCol - 1 + numCols));
        }
        return result;
      },
      setValues: (values) => {
        // ✅ INCREMENTAR SPY EXTERNO (no adjunto a sheetObj)
        if (spyRef && typeof spyRef.setValues !== 'undefined') {
          spyRef.setValues++;
        }

        values.forEach((rowData, r) => {
          rowData.forEach((cellData, c) => {
            if (!sheetData[startRow - 1 + r]) sheetData[startRow - 1 + r] = [];
            sheetData[startRow - 1 + r][startCol - 1 + c] = cellData;
          });
        });
      },
      setValue: (value) => {
        if (!sheetData[startRow - 1]) sheetData[startRow - 1] = [];
        sheetData[startRow - 1][startCol - 1] = value;
      },
      createTextFinder: (value) => ({
        findNext: () => {
          for (let r = startRow - 1; r < (startRow - 1 + numRows); r++) {
            if (sheetData[r] && sheetData[r][startCol - 1] == value) {
              return { getRow: () => r + 1, getColumn: () => startCol };
            }
          }
          return null;
        }
      })
    };
  }

  function _createMockSheet(sheetObj, spyRef) {
    return {
      appendRow: (rowData) => {
        spyRef.appendRow++;  // ✅ Incrementar spy externo
        sheetObj.data.push(rowData);
      },
      getRange: (r, c, nr, nc) => _createMockRange(sheetObj.data, r, c, nr || 1, nc || 1, spyRef),
      getLastRow: () => sheetObj.data.length,
      getLastColumn: () => sheetObj.data.length > 0 ? Math.max(...sheetObj.data.map(row => row.length)) : 0,
    };
  }

  function _createMockSpreadsheet(ssObj, spyRef) {
    return {
      getId: () => ssObj.id,
      getSheets: () => ssObj.sheets.map(s => _createMockSheet(s, spyRef)),
      getSheetByName: (name) => {
        const sheetObj = ssObj.sheets.find(s => s.name === name);
        return sheetObj ? _createMockSheet(sheetObj, spyRef) : null;
      }
    };
  }

  globalThis.SpreadsheetApp = {
    create: (name) => {
      const id = 'mock-ss-id-' + Date.now();
      _spreadsheetsDB[id] = { id, name, sheets: [{ name: 'Sheet1', data: [] }] };
      return _createMockSpreadsheet(_spreadsheetsDB[id], spyRegistry);
    },
    openById: (id) => {
      if (!_spreadsheetsDB[id]) throw new Error("Mock Spreadsheet not found");
      return _createMockSpreadsheet(_spreadsheetsDB[id], spyRegistry);
    },
    flush: function () {
      flushSpy._callLog.push(1);
    }
  };

  // ✅ RETORNAR SPY REGISTRY PARA ACCESO EN TESTS
  return { mocks, originals, _db: _spreadsheetsDB, flushSpy, spyRegistry };
}

function _teardownSheetAdapterTests(originals) {
  globalThis.SpreadsheetApp = originals.SpreadsheetApp;
}

// ============================================================
// SUITE DE TESTS PARA SHEETADAPTER
// ============================================================

function testSheetAdapter_CreateSheet_debeCrearYLlamarAFlush() {
  const setup = _setupSheetAdapterTests();
  try {
    // --- INICIO DE LA REPARACIÓN ---
    // Se actualiza la inyección para usar la ruta correcta al mock.
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    // --- FIN DE LA REPARACIÓN ---
    const result = sheetAdapter.createSheet({ name: 'Test', header: ['ID', 'Nombre'] });

    assert.isNotNull(result.sheetId, "Debe retornar un sheetId.");

    assert.isTrue(setup.flushSpy._callLog.length > 0, "SpreadsheetApp.flush() debió ser llamado al crear una hoja con cabecera.");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_CicloCompleto_debeLlamarAFlushEnAppendYUpdate() {
  const setup = _setupSheetAdapterTests();
  try {
    // --- INICIO DE LA REPARACIÓN ---
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    // --- FIN DE LA REPARACIÓN ---
    const { sheetId } = sheetAdapter.createSheet({ name: 'Ciclo Test', header: ['ID', 'Status'] });
    setup.flushSpy._callLog = []; // Limpiar el log del flush de la creación

    // Append
    sheetAdapter.appendRow({ sheetId, rowData: ['task-123', 'Pending'] });
    assert.arrayLength(setup.flushSpy._callLog, 1, "flush() debió ser llamado después de appendRow.");

    // Find
    const found = sheetAdapter.findRowByValue({ sheetId, columnIndex: 1, value: 'task-123' });

    // Update
    sheetAdapter.updateCell({ sheetId, rowNumber: found.rowNumber, columnIndex: 2, value: 'Done' });
    assert.arrayLength(setup.flushSpy._callLog, 2, "flush() debió ser llamado de nuevo después de updateCell.");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_VerifyHeader_debeLlamarAFlushSoloSiActualiza() {
  const setup = _setupSheetAdapterTests();
  try {
    // --- INICIO DE LA REPARACIÓN ---
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    // --- FIN DE LA REPARACIÓN ---
    const { sheetId } = sheetAdapter.createSheet({ name: 'Header Test', header: ['OldID'] });
    setup.flushSpy._callLog = []; // Limpiar log

    // Caso 1: Actualiza
    sheetAdapter.verifyHeader({ sheetId, expectedHeader: ['NewID'] });
    assert.arrayLength(setup.flushSpy._callLog, 1, "flush() debió ser llamado cuando la cabecera se actualiza.");

    // Caso 2: No actualiza
    sheetAdapter.verifyHeader({ sheetId, expectedHeader: ['NewID'] });
    assert.arrayLength(setup.flushSpy._callLog, 1, "flush() NO debió ser llamado de nuevo si la cabecera ya es correcta.");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_UpdateRow_debeLlamarAFlush() {
  const setup = _setupSheetAdapterTests();
  try {
    // --- INICIO DE LA REPARACIÓN ---
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    // --- FIN DE LA REPARACIÓN ---
    const { sheetId } = sheetAdapter.createSheet({ name: 'UpdateRow Test', header: ['A', 'B'] });
    sheetAdapter.appendRow({ sheetId, rowData: ['1', '2'] });
    setup.flushSpy._callLog = []; // Limpiar logs

    // Act
    sheetAdapter.updateRow({ sheetId, rowNumber: 2, rowData: ['x', 'y'] });

    // Assert
    assert.arrayLength(setup.flushSpy._callLog, 1, "flush() debió ser llamado después de updateRow.");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

// ======================================================================
// FASE 1D.3 - INTERACCIÓN 9: Tests de Helpers de Mapeo de Datos
// Propósito: Validar la conversión bidireccional Array<Array> ↔ Array<Object>
// ======================================================================

function testSheetAdapter_mapArrayToObject_happyPath() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Datos típicos de Sheets API (headers + values)
    const headers = ['ID', 'Nombre', 'Estado'];
    const values = [
      ['001', 'Proyecto Alpha', 'Activo'],
      ['002', 'Proyecto Beta', 'Inactivo']
    ];

    // Act: Convertir Array<Array> → Array<Object>
    const result = sheetAdapter._mapArrayToObject(headers, values);

    // Assert: Verificar estructura de objetos
    assert.areEqual(2, result.length, "Debe retornar 2 objetos");
    assert.areEqual('001', result[0].ID, "Primera fila: ID correcto");
    assert.areEqual('Proyecto Alpha', result[0].Nombre, "Primera fila: Nombre correcto");
    assert.areEqual('Activo', result[0].Estado, "Primera fila: Estado correcto");
    assert.areEqual('002', result[1].ID, "Segunda fila: ID correcto");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_mapArrayToObject_celdasVacias() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Datos con celdas vacías y undefined
    const headers = ['ID', 'Nombre', 'Opcional'];
    const values = [
      ['001', 'Proyecto Alpha', ''],           // Celda vacía (string vacío)
      ['002', 'Proyecto Beta', undefined],     // Celda undefined
      ['003', '', 'Valor']                     // Nombre vacío
    ];

    // Act
    const result = sheetAdapter._mapArrayToObject(headers, values);

    // Assert: Celdas vacías deben convertirse a string vacío
    assert.areEqual('', result[0].Opcional, "Celda vacía debe ser string vacío");
    assert.areEqual('', result[1].Opcional, "Celda undefined debe ser string vacío");
    assert.areEqual('', result[2].Nombre, "Nombre vacío debe preservarse");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_mapArrayToObject_filasIncompletas() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Filas con menos columnas que headers
    const headers = ['ID', 'Nombre', 'Estado', 'Fecha'];
    const values = [
      ['001', 'Proyecto Alpha'],                // Solo 2 columnas (faltan 2)
      ['002', 'Proyecto Beta', 'Activo']        // Solo 3 columnas (falta 1)
    ];

    // Act
    const result = sheetAdapter._mapArrayToObject(headers, values);

    // Assert: Columnas faltantes deben tener string vacío
    assert.areEqual('', result[0].Estado, "Columna faltante debe ser string vacío");
    assert.areEqual('', result[0].Fecha, "Columna faltante debe ser string vacío");
    assert.areEqual('', result[1].Fecha, "Columna faltante debe ser string vacío");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_mapObjectToArray_happyPath() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Objetos típicos
    const headers = ['ID', 'Nombre', 'Estado'];
    const objects = [
      { ID: '001', Nombre: 'Proyecto Alpha', Estado: 'Activo' },
      { ID: '002', Nombre: 'Proyecto Beta', Estado: 'Inactivo' }
    ];

    // Act: Convertir Array<Object> → Array<Array>
    const result = sheetAdapter._mapObjectToArray(headers, objects);

    // Assert: Verificar estructura de arrays
    assert.areEqual(2, result.length, "Debe retornar 2 arrays");
    assert.arrayEquals(['001', 'Proyecto Alpha', 'Activo'], result[0], "Primera fila correcta");
    assert.arrayEquals(['002', 'Proyecto Beta', 'Inactivo'], result[1], "Segunda fila correcta");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_mapObjectToArray_propiedadesFaltantes() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Objetos con propiedades faltantes
    const headers = ['ID', 'Nombre', 'Estado', 'Fecha'];
    const objects = [
      { ID: '001', Nombre: 'Proyecto Alpha' },              // Faltan Estado y Fecha
      { ID: '002', Estado: 'Activo' },                      // Falta Nombre y Fecha
      { ID: '003', Nombre: 'Proyecto Gamma', Fecha: '2025-11-06' }  // Falta Estado
    ];

    // Act
    const result = sheetAdapter._mapObjectToArray(headers, objects);

    // Assert: Propiedades faltantes deben ser string vacío
    assert.areEqual('', result[0][2], "Estado faltante debe ser string vacío");
    assert.areEqual('', result[0][3], "Fecha faltante debe ser string vacío");
    assert.areEqual('', result[1][1], "Nombre faltante debe ser string vacío");
    assert.areEqual('', result[2][2], "Estado faltante debe ser string vacío");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_mapObjectToArray_propiedadesExtra() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Objetos con propiedades que NO están en headers (deben ignorarse)
    const headers = ['ID', 'Nombre'];
    const objects = [
      { ID: '001', Nombre: 'Proyecto Alpha', Estado: 'Activo', Extra: 'Valor' }
    ];

    // Act
    const result = sheetAdapter._mapObjectToArray(headers, objects);

    // Assert: Solo las propiedades en headers deben incluirse
    assert.areEqual(2, result[0].length, "Debe tener solo 2 columnas (las del header)");
    assert.arrayEquals(['001', 'Proyecto Alpha'], result[0], "Propiedades extra ignoradas");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_mapArrayToObject_roundTrip() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Datos originales
    const headers = ['ID', 'Nombre', 'Estado'];
    const originalValues = [
      ['001', 'Proyecto Alpha', 'Activo'],
      ['002', 'Proyecto Beta', 'Inactivo']
    ];

    // Act: Conversión de ida y vuelta
    const objects = sheetAdapter._mapArrayToObject(headers, originalValues);
    const backToArrays = sheetAdapter._mapObjectToArray(headers, objects);

    // Assert: Debe ser idéntico al original
    assert.arrayEquals(originalValues[0], backToArrays[0], "Round-trip fila 1 preserva datos");
    assert.arrayEquals(originalValues[1], backToArrays[1], "Round-trip fila 2 preserva datos");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

// ======================================================================
// FASE 1D.3 - INTERACCIÓN 10: Tests para getRows() (Lectura Batch)
// Propósito: Validar lectura eficiente con SpreadsheetApp (NO Sheets API v4 aún)
// ======================================================================

function testSheetAdapter_getRows_happyPath() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Crear spreadsheet con datos
    const { sheetId } = sheetAdapter.createSheet({
      name: 'Test Sheet',
      header: ['ID', 'Nombre', 'Estado']
    });

    // Simular datos en sheet (las filas ya incluyen el header en posición 0)
    const mockSheet = setup._db[sheetId].sheets[0];
    mockSheet.data = [
      ['ID', 'Nombre', 'Estado'],           // Row 1: Header
      ['001', 'Proyecto Alpha', 'Activo'],  // Row 2
      ['002', 'Proyecto Beta', 'Inactivo'], // Row 3
      ['003', 'Proyecto Gamma', 'Activo']   // Row 4
    ];

    // Act: Leer todas las filas (incluyendo header automáticamente)
    const result = sheetAdapter.getRows({ sheetId });

    // Assert: Debe retornar objetos (sin header)
    assert.areEqual(3, result.length, "Debe retornar 3 objetos (3 filas de datos)");
    assert.areEqual('001', result[0].ID, "Primera fila: ID correcto");
    assert.areEqual('Proyecto Alpha', result[0].Nombre, "Primera fila: Nombre correcto");
    assert.areEqual('Activo', result[0].Estado, "Primera fila: Estado correcto");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_getRows_sheetVacia() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Crear spreadsheet vacío
    const { sheetId } = sheetAdapter.createSheet({
      name: 'Empty Sheet',
      header: ['ID', 'Nombre']
    });

    // Act: Leer de sheet vacío (solo header)
    const result = sheetAdapter.getRows({ sheetId });

    // Assert: Debe retornar array vacío
    assert.areEqual(0, result.length, "Sheet vacío debe retornar array vacío");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

function testSheetAdapter_getRows_conSheetName() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Crear spreadsheet
    const { sheetId } = sheetAdapter.createSheet({
      name: 'Test Sheet',
      header: ['ID', 'Nombre']
    });

    const mockSheet = setup._db[sheetId].sheets[0];
    mockSheet.data = [
      ['ID', 'Nombre'],
      ['001', 'Alpha']
    ];

    // Act: Leer especificando sheetName
    const result = sheetAdapter.getRows({ sheetId, sheetName: 'Sheet1' });

    // Assert
    assert.areEqual(1, result.length, "Debe leer correctamente con sheetName");
    assert.areEqual('001', result[0].ID, "Datos correctos");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

/**
 * TEST: insertRowsBatch - Happy Path
 * OBJETIVO: Validar inserción batch de múltiples filas desde objetos
 * PATTERN: Crear sheet → Insertar 10 objetos → Verificar conversión y escritura batch
 */
function testSheetAdapter_insertRowsBatch_happyPath() {
  const setup = _setupSheetAdapterTests();
  try {
    // Reset spy registry para test limpio
    setup.spyRegistry.setValues = 0;
    setup.spyRegistry.getValues = 0;

    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Crear sheet con headers
    const headers = ['ID', 'Nombre', 'Estado'];
    const { sheetId } = sheetAdapter.createSheet({
      name: 'TestInsertBatch',
      header: headers
    });

    // Reset spyRegistry.setValues porque createSheet con header llama a setValues una vez
    setup.spyRegistry.setValues = 0;

    const mockSheet = setup._db[sheetId].sheets[0];

    // Preparar datos a insertar (10 objetos)
    const rowsToInsert = [
      { ID: '001', Nombre: 'Proyecto Alpha', Estado: 'Activo' },
      { ID: '002', Nombre: 'Proyecto Beta', Estado: 'Inactivo' },
      { ID: '003', Nombre: 'Proyecto Gamma', Estado: 'Activo' },
      { ID: '004', Nombre: 'Proyecto Delta', Estado: 'Pendiente' },
      { ID: '005', Nombre: 'Proyecto Epsilon', Estado: 'Activo' },
      { ID: '006', Nombre: 'Proyecto Zeta', Estado: 'Cancelado' },
      { ID: '007', Nombre: 'Proyecto Eta', Estado: 'Activo' },
      { ID: '008', Nombre: 'Proyecto Theta', Estado: 'Inactivo' },
      { ID: '009', Nombre: 'Proyecto Iota', Estado: 'Activo' },
      { ID: '010', Nombre: 'Proyecto Kappa', Estado: 'Pendiente' }
    ];

    // Act: Insertar rows batch
    const result = sheetAdapter.insertRowsBatch({ sheetId, rows: rowsToInsert });

    // Assert: Verificar resultado
    assert.areEqual(10, result.rowsInserted, "Debe insertar 10 filas");

    // Verificar que se usó setValues (batch) en lugar de appendRow (individual)
    assert.areEqual(1, setup.spyRegistry.setValues, "Debe usar setValues UNA vez (batch)");

    // Verificar que los datos se escribieron correctamente en el mock
    assert.areEqual(11, mockSheet.data.length, "Debe tener header + 10 filas de datos");

    // Verificar primera fila de datos
    assert.areEqual('001', mockSheet.data[1][0], "Primera fila: ID correcto");
    assert.areEqual('Proyecto Alpha', mockSheet.data[1][1], "Primera fila: Nombre correcto");
    assert.areEqual('Activo', mockSheet.data[1][2], "Primera fila: Estado correcto");

    // Verificar última fila de datos
    assert.areEqual('010', mockSheet.data[10][0], "Última fila: ID correcto");
    assert.areEqual('Proyecto Kappa', mockSheet.data[10][1], "Última fila: Nombre correcto");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

/**
 * TEST: insertRowsBatch - Array Vacío
 * OBJETIVO: Validar comportamiento con array vacío (no debe escribir nada)
 * PATTERN: Intentar insertar [] → Debe retornar 0 rows insertadas
 */
function testSheetAdapter_insertRowsBatch_arrayVacio() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Crear sheet
    const { sheetId } = sheetAdapter.createSheet({
      name: 'TestEmpty',
      header: ['ID', 'Nombre']
    });

    const mockSheet = setup._db[sheetId].sheets[0];

    // Act: Insertar array vacío
    const result = sheetAdapter.insertRowsBatch({ sheetId, rows: [] });

    // Assert
    assert.areEqual(0, result.rowsInserted, "No debe insertar filas");
    assert.areEqual(1, mockSheet.data.length, "Solo debe existir el header");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

/**
 * TEST: insertRowsBatch - Validación de Headers
 * OBJETIVO: Validar que el método use los headers de la sheet para conversión
 * PATTERN: Insertar objetos con propiedades extras → Solo debe usar headers definidos
 */
function testSheetAdapter_insertRowsBatch_validaHeaders() {
  const setup = _setupSheetAdapterTests();
  try {
    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Crear sheet con headers específicos
    const headers = ['ID', 'Nombre'];
    const { sheetId } = sheetAdapter.createSheet({
      name: 'TestHeaders',
      header: headers
    });

    const mockSheet = setup._db[sheetId].sheets[0];

    // Objetos con propiedades extra (Estado no está en headers)
    const rowsToInsert = [
      { ID: '001', Nombre: 'Alpha', Estado: 'Extra' },
      { ID: '002', Nombre: 'Beta', Descripcion: 'Otra extra' }
    ];

    // Act
    const result = sheetAdapter.insertRowsBatch({ sheetId, rows: rowsToInsert });

    // Assert: Solo debe insertar las columnas definidas en headers
    assert.areEqual(2, result.rowsInserted, "Debe insertar 2 filas");
    assert.areEqual(2, mockSheet.data[1].length, "Fila debe tener solo 2 columnas (ID, Nombre)");
    assert.areEqual('001', mockSheet.data[1][0], "Primera columna: ID");
    assert.areEqual('Alpha', mockSheet.data[1][1], "Segunda columna: Nombre");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}

/**
 * TEST: insertRowsBatch - Performance con 100 Rows
 * OBJETIVO: Validar que el método maneje correctamente volúmenes grandes
 * PATTERN: Insertar 100 rows → Verificar batch único (no loops)
 */
function testSheetAdapter_insertRowsBatch_performance100Rows() {
  const setup = _setupSheetAdapterTests();
  try {
    // Reset spy registry para test limpio
    setup.spyRegistry.setValues = 0;
    setup.spyRegistry.getValues = 0;

    const sheetAdapter = createSheetAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Arrange: Crear sheet
    const { sheetId } = sheetAdapter.createSheet({
      name: 'TestPerformance',
      header: ['ID', 'Valor']
    });

    // Reset spyRegistry.setValues porque createSheet con header llama a setValues una vez
    setup.spyRegistry.setValues = 0;

    const mockSheet = setup._db[sheetId].sheets[0];

    // Generar 100 rows
    const rowsToInsert = [];
    for (let i = 1; i <= 100; i++) {
      rowsToInsert.push({
        ID: String(i).padStart(3, '0'),
        Valor: `Item ${i}`
      });
    }

    // Act
    const result = sheetAdapter.insertRowsBatch({ sheetId, rows: rowsToInsert });

    // Assert: Verificar batch único (performance)
    assert.areEqual(100, result.rowsInserted, "Debe insertar 100 filas");
    assert.areEqual(1, setup.spyRegistry.setValues, "Debe usar setValues UNA sola vez (no 100 veces)");
    assert.areEqual(101, mockSheet.data.length, "Debe tener header + 100 filas");

    // Verificar primera y última fila
    assert.areEqual('001', mockSheet.data[1][0], "Primera fila correcta");
    assert.areEqual('100', mockSheet.data[100][0], "Última fila correcta");

    return true;
  } finally {
    _teardownSheetAdapterTests(setup.originals);
  }
}