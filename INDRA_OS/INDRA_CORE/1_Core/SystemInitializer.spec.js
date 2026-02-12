// ======================================================================
// ARTEFACTO: 1_Core/SystemInitializer.spec.js (SINCRONIZADO)
// ======================================================================

function _setupSystemInitializerTests() {
  const originals = {};

  const mocks = {
    mockManifest: {
      ANCHOR_PROPERTY: 'ORBITAL_CORE_ROOT_ID',
      DRIVE_SCHEMA: {
        ROOT: { NAME: 'OrbitalCore' },
        JSON_FLOWS_FOLDER: { PATH: 'Flows' },
      },
      SHEETS_SCHEMA: {
        JOB_QUEUE: { PROPERTY: 'JOB_QUEUE_ID', NAME: 'JobQueue', HEADER: ['id'] },
      },
      CONNECTIONS: { // Requerido para migración de tokens
        NOTION_API_KEY: { provider: 'notion', legacyKey: 'NOTION_API_KEY' }
      }
    },
    mockDriveAdapter: {
      _callLog: [],
      createFolder: function (p) { this._callLog.push({ method: 'createFolder', args: [p] }); return { folderId: 'new-root-id' }; },
      resolvePath: function (p) { this._callLog.push({ method: 'resolvePath', args: [p] }); return { created: true, folderId: `mock-path-${p.path}-id` }; },
      move: function (p) { this._callLog.push({ method: 'move', args: [p] }); },
      store: function (p) { this._callLog.push({ method: 'store', args: [p] }); return { fileId: 'mock-file-id' }; }
    },
    mockSheetAdapter: {
      _callLog: [],
      createSheet: function (p) { this._callLog.push({ method: 'createSheet', args: [p] }); return { sheetId: 'new-sheet-id' }; },
      verifyHeader: function (p) { this._callLog.push({ method: 'verifyHeader', args: [p] }); return { updated: false }; }
    },
    mockConfigurator: {
      _callLog: [],
      retrieveParameter: function (payload) {
        this._callLog.push({ method: 'retrieveParameter', args: [payload] });
        return mocks._state.storedProperties[payload.key] || null;
      },
      storeParameter: function (payload) {
        this._callLog.push({ method: 'storeParameter', args: [payload] });
        mocks._state.storedProperties[payload.key] = payload.value;
      }
    },
    mockTokenManager: {
      _callLog: [],
      getToken: function (p) { this._callLog.push({ method: 'getToken', args: [p] }); return null; },
      setToken: function (p) { this._callLog.push({ method: 'setToken', args: [p] }); },
      loadTokens: function () { return { version: '1.0', accounts: {} }; }
    },
    mockErrorHandler: {
      createError: (code, msg, details) => { const e = new Error(msg); e.code = code; e.details = details; return e; }
    },
    mockCipherAdapter: {
      encrypt: ({ text, key }) => `ciphered:${text}:${key}`,
      decrypt: ({ cipher, key }) => cipher.replace('ciphered:', '').split(':')[0]
    },
    _state: {
      storedProperties: {}
    }
  };

  // Mock CryptoJS para evitar fallos por falta de librería
  globalThis.CryptoJS = {
    AES: {
      encrypt: (p, k) => ({ toString: () => `encrypted:${p}:${k}` }),
      decrypt: (p, k) => ({ toString: (enc) => p.replace('encrypted:', '').split(':')[0] })
    },
    enc: { Utf8: 'utf8' }
  };

  return { mocks, originals };
}

function _teardownSystemInitializerTests(originals) {
  // No hay globales que restaurar
}

// ============================================================
// SUITE DE TESTS PARA SYSTEMINITIALIZER
// ============================================================

function testSystemInitializer_InstalacionLimpia_debeCrearTodaLaEstructuraFisica() {
  const setup = _setupSystemInitializerTests();
  try {
    const initializer = createSystemInitializer({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      configurator: setup.mocks.mockConfigurator,
      tokenManager: setup.mocks.mockTokenManager,
      errorHandler: setup.mocks.mockErrorHandler,
      cipherAdapter: setup.mocks.mockCipherAdapter
    });

    const result = initializer.runBootstrap();

    // --- INICIO DE LA CORRECCIÓN: Aserciones más específicas y robustas ---
    assert.isTrue(setup.mocks.mockDriveAdapter._callLog.some(c => c.method === 'createFolder'), 'driveAdapter.createFolder debió ser llamado para la raíz.');
    assert.isTrue(setup.mocks.mockDriveAdapter._callLog.some(c => c.method === 'resolvePath'), 'driveAdapter.resolvePath debió ser llamado para el schema de carpetas.');
    assert.isTrue(setup.mocks.mockSheetAdapter._callLog.some(c => c.method === 'createSheet'), 'sheetAdapter.createSheet debió ser llamado.');

    const moveCall = setup.mocks.mockDriveAdapter._callLog.find(c => c.method === 'move');
    assert.isNotNull(moveCall, 'driveAdapter.move debió ser llamado para anclar el sheet.');
    assert.areEqual('new-sheet-id', moveCall.args[0].targetId, 'El targetId para mover debe ser el del nuevo sheet.');
    assert.areEqual('new-root-id', moveCall.args[0].destinationFolderId, 'El destino debe ser la nueva carpeta raíz.');

    assert.areEqual('configured_ok', result.status);
    // La aserción original era frágil. Esta es más fiable.
    assert.isTrue(result.actionsTaken.length > 0, 'Se debió registrar al menos una acción.');
    // --- FIN DE LA CORRECCIÓN ---

    return true;
  } finally {
    _teardownSystemInitializerTests(setup.originals);
  }
}

function testSystemInitializer_Verificacion_noDebeHacerNadaSiTodoEstaConfigurado() {
  const setup = _setupSystemInitializerTests();
  try {
    // Pre-configurar el estado para simular un sistema ya instalado
    setup.mocks._state.storedProperties['ORBITAL_CORE_ROOT_ID'] = 'root-id';
    setup.mocks._state.storedProperties['JOB_QUEUE_ID'] = 'sheet-id';
    setup.mocks._state.storedProperties['MASTER_ENCRYPTION_KEY'] = 'mock-master-key';
    setup.mocks._state.storedProperties['TOKENS_FILE_ID'] = 'mock-tokens-file-id';
    setup.mocks._state.storedProperties['ORBITAL_CORE_SATELLITE_API_KEY'] = 'mock-satellite-key';
    setup.mocks._state.storedProperties['ORBITAL_FOLDER_JSON_FLOWS_FOLDER_ID'] = 'folder-id';
    // Simular que las carpetas ya existen y no necesitan ser creadas
    setup.mocks.mockDriveAdapter.resolvePath = () => ({ created: false, folderId: 'folder-id' });

    const initializer = createSystemInitializer({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      configurator: setup.mocks.mockConfigurator,
      tokenManager: setup.mocks.mockTokenManager,
      errorHandler: setup.mocks.mockErrorHandler,
      cipherAdapter: setup.mocks.mockCipherAdapter
    });

    const result = initializer.runBootstrap();

    assert.arrayLength(setup.mocks.mockDriveAdapter._callLog.filter(c => c.method === 'createFolder'), 0, 'NO se debió crear ninguna carpeta raíz.');
    assert.arrayLength(setup.mocks.mockSheetAdapter._callLog.filter(c => c.method === 'createSheet'), 0, 'NO se debió crear ningún sheet.');
    assert.arrayLength(setup.mocks.mockDriveAdapter._callLog.filter(c => c.method === 'move'), 0, 'NO se debió mover ningún sheet.');

    assert.areEqual('verified_ok', result.status, 'El estado debe ser de verificación exitosa.');
    assert.arrayLength(result.actionsTaken, 0, 'No debieron registrarse acciones.');

    return true;
  } finally {
    _teardownSystemInitializerTests(setup.originals);
  }
}

function testSystemInitializer_ConfiguracionParcial_debeCrearSoloLaEstructuraFaltante() {
  const setup = _setupSystemInitializerTests();
  try {
    setup.mocks._state.storedProperties['ORBITAL_CORE_ROOT_ID'] = 'root-id';

    const initializer = createSystemInitializer({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      configurator: setup.mocks.mockConfigurator,
      tokenManager: setup.mocks.mockTokenManager,
      errorHandler: setup.mocks.mockErrorHandler,
      cipherAdapter: setup.mocks.mockCipherAdapter
    });

    const result = initializer.runBootstrap();

    assert.arrayLength(setup.mocks.mockSheetAdapter._callLog.filter(c => c.method === 'createSheet'), 1, 'Se debió crear el sheet faltante.');
    assert.arrayLength(setup.mocks.mockDriveAdapter._callLog.filter(c => c.method === 'move'), 1, 'Se debió mover el sheet recién creado.');

    assert.arrayLength(setup.mocks.mockDriveAdapter._callLog.filter(c => c.method === 'createFolder'), 0, 'NO se debió crear la carpeta raíz, que ya existía.');

    assert.areEqual('configured_ok', result.status);

    return true;
  } finally {
    _teardownSystemInitializerTests(setup.originals);
  }
}

/**
 * Test que verifica la inicialización del sistema de tokens y la migración de legados.
 */
function testSystemInitializer_TokenSystem_debeInicializarTokensYMigrarLegados() {
  const setup = _setupSystemInitializerTests();
  try {
    // Escenario: Sistema ya instalado pero sin tokens, y con una NOTION_API_KEY antigua
    setup.mocks._state.storedProperties['ORBITAL_CORE_ROOT_ID'] = 'root-id';
    setup.mocks._state.storedProperties['JOB_QUEUE_ID'] = 'sheet-id';
    setup.mocks._state.storedProperties['NOTION_API_KEY'] = 'legacy-notion-token-123';

    // Simular que las carpetas ya existen
    setup.mocks.mockDriveAdapter.resolvePath = () => ({ created: false, folderId: 'folder-id' });

    // Mock de store para capturar que se guarda el .tokens.json
    let tokensCreated = false;
    setup.mocks.mockDriveAdapter.store = function (p) {
      if (p.fileName === '.tokens.json') {
        tokensCreated = true;
        return { fileId: 'new-tokens-file-id' };
      }
      return { fileId: 'some-id' };
    };

    const initializer = createSystemInitializer({
      manifest: setup.mocks.mockManifest,
      driveAdapter: setup.mocks.mockDriveAdapter,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      configurator: setup.mocks.mockConfigurator,
      tokenManager: setup.mocks.mockTokenManager,
      errorHandler: setup.mocks.mockErrorHandler,
      cipherAdapter: setup.mocks.mockCipherAdapter
    });

    const result = initializer.runBootstrap();

    // Verificaciones
    assert.isTrue(tokensCreated, 'Se debió crear el archivo .tokens.json');
    assert.areEqual('new-tokens-file-id', setup.mocks._state.storedProperties['TOKENS_FILE_ID'], 'El ID del archivo de tokens debió guardarse.');
    assert.isNotNull(setup.mocks._state.storedProperties['MASTER_ENCRYPTION_KEY'], 'La clave maestra debió generarse.');

    // Verificación de Migración
    const migrationCall = setup.mocks.mockTokenManager._callLog.find(c => c.method === 'setToken' && c.args[0].provider === 'notion');
    assert.isNotNull(migrationCall, 'El token de Notion legado debió migrarse.');
    assert.areEqual('legacy-notion-token-123', migrationCall.args[0].tokenData.apiKey, 'El valor del token migrado no coincide.');
    assert.areEqual('Migrated from Legacy', migrationCall.args[0].tokenData.label);

    assert.areEqual('configured_ok', result.status);

    return true;
  } finally {
    _teardownSystemInitializerTests(setup.originals);
  }
}