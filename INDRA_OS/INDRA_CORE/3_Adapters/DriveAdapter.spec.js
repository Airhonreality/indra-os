// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// ARTEFACTO: 3_Adapters/DriveAdapter.spec.js (SINCRONIZADO)
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function _setupDriveAdapterTests() {
  const originals = {
    DriveApp: globalThis.DriveApp,
    Utilities: globalThis.Utilities
  };

  const _fs = {
    'root': { id: 'root', name: 'Root', parentId: null, children: {}, files: {} },
    'file_db': {},
    'folder_db': { 'root': { id: 'root', name: 'Root', parentId: null, children: {}, files: {} } }
  };

  function _createMockFile(id) {
    const fileData = _fs.file_db[id];
    if (!fileData) return null;
    return {
      getId: () => fileData.id,
      getName: () => fileData.name,
      getMimeType: () => fileData.mimeType,
      getBlob: () => ({ getDataAsString: () => fileData.content }),
      setContent: (content) => { fileData.content = content; },
      addViewer: () => { },
      addEditor: () => { },
      getLastUpdated: () => new Date(),
      getSize: () => 1024,
      setMimeType: (m) => { fileData.mimeType = m; },
      setName: (n) => { fileData.name = n; },
      moveTo: (destination) => {
        const parentFolder = _fs.folder_db[fileData.parentId];
        if (parentFolder) delete parentFolder.files[fileData.name];
        const destFolder = _fs.folder_db[destination.getId()];
        destFolder.files[fileData.name] = fileData.id;
        fileData.parentId = destination.getId();
      }
    };
  }

  function _createMockFolder(id) {
    const folderData = _fs.folder_db[id];
    if (!folderData) return null;
    return {
      getId: () => folderData.id,
      getName: () => folderData.name,
      getFoldersByName: (name) => {
        const childId = folderData.children[name];
        return { hasNext: () => !!childId, next: () => _createMockFolder(childId) };
      },
      getFilesByName: (name) => {
        const fileId = folderData.files[name];
        return { hasNext: () => !!fileId, next: () => _createMockFile(fileId) };
      },
      createFolder: (name) => {
        const newId = `folder_${name}_${Utilities.getUuid()}`;
        _fs.folder_db[newId] = { id: newId, name: name, parentId: id, children: {}, files: {} };
        folderData.children[name] = newId;
        return _createMockFolder(newId);
      },
      createFile: (blob) => {
        // En la simulación real, createFile usa las propiedades del blob.
        const newId = `file_${blob.getName()}_${Utilities.getUuid()}`;
        _fs.file_db[newId] = { id: newId, name: blob.getName(), mimeType: blob.getContentType(), content: blob.getDataAsString(), parentId: id };
        folderData.files[blob.getName()] = newId;
        return _createMockFile(newId);
      },
      moveTo: (destination) => {
        if (folderData.parentId) {
          const parentFolder = _fs.folder_db[folderData.parentId];
          delete parentFolder.children[folderData.name];
        }
        const destFolder = _fs.folder_db[destination.getId()];
        destFolder.children[folderData.name] = folderData.id;
        folderData.parentId = destination.getId();
      },
      getLastUpdated: () => new Date()
    };
  }

  const mocks = {
    mockErrorHandler: { createError: (code, msg) => { const e = new Error(msg); e.code = code; return e; } }
  };

  const mockUtilities = {};

  const methodsToPreserve = [
    'newBlob', 'getUuid', 'base64Encode', 'base64Decode'
  ];

  methodsToPreserve.forEach(m => {
    if (globalThis._SATTVA_NATIVE?.Utilities?.[m]) {
      mockUtilities[m] = globalThis._SATTVA_NATIVE.Utilities[m];
    } else if (globalThis.Utilities?.[m]) {
      mockUtilities[m] = globalThis.Utilities[m].bind(globalThis.Utilities);
    }
  });

  mockUtilities.CryptoAlgorithm = globalThis._SATTVA_NATIVE?.Utilities?.CryptoAlgorithm || globalThis.Utilities?.CryptoAlgorithm || { AES_CBC_256: 'AES_CBC_256' };
  mockUtilities.DigestAlgorithm = globalThis._SATTVA_NATIVE?.Utilities?.DigestAlgorithm || globalThis.Utilities?.DigestAlgorithm || { SHA_256: 'SHA_256' };
  mockUtilities.newBlob = (content, mimeType, name) => {
    let _content = content;
    let _mimeType = mimeType;
    let _name = name;
    return {
      getDataAsString: () => _content,
      getBytes: () => {
        // Simulación de byte[] para GAS
        const b = [];
        for (let i = 0; i < _content.length; i++) b.push(_content.charCodeAt(i));
        return b;
      },
      getContentType: () => _mimeType,
      getName: () => _name,
      setName: function (newName) { _name = newName; return this; },
      setContentType: function (newMimeType) { _mimeType = newMimeType; return this; }
    };
  };
  mockUtilities.getUuid = () => Math.random().toString();

  globalThis.Utilities = mockUtilities;
  globalThis.DriveApp = {
    searchFiles: () => ({ hasNext: () => false }),
    searchFolders: () => ({ hasNext: () => false }),
    getFileById: (id) => {
      if (!_fs.file_db[id]) throw new Error(`Mock File not found: ${id}`);
      return _createMockFile(id);
    },
    getFolderById: (id) => {
      if (id === 'root') return _createMockFolder('root');
      if (!_fs.folder_db[id]) throw new Error(`Mock Folder not found: ${id}`);
      return _createMockFolder(id);
    }
  };

  return { mocks, originals, mockUtilities, _internal_fs_ref_for_tests: _fs };
}

function _teardownDriveAdapterTests(originals) {
  globalThis.DriveApp = originals.DriveApp;
  globalThis.Utilities = originals.Utilities;
}

// ============================================================
// SUITE DE TESTS PARA DRIVEADAPTER (Sin cambios en la lógica de las pruebas)
// ============================================================

function testDriveAdapter_ResolvePath_debeCrearEstructuraAnidada() {
  const setup = _setupDriveAdapterTests();
  try {
    const driveAdapter = createDriveAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    const result = driveAdapter.resolvePath({ rootFolderId: 'root', path: 'Clientes/ACME', createIfNotExists: true });

    const fs = setup._internal_fs_ref_for_tests;
    const clientesId = fs.folder_db['root'].children['Clientes'];
    assert.isNotNull(clientesId, 'La carpeta "Clientes" debió ser creada.');
    const acmeId = fs.folder_db[clientesId].children['ACME'];
    assert.isNotNull(acmeId, 'La subcarpeta "ACME" debió ser creada.');
    assert.areEqual(acmeId, result.folderId);

    return true;
  } finally {
    _teardownDriveAdapterTests(setup.originals);
  }
}

function testDriveAdapter_Store_debeCrearYLuegoSobrescribirArchivo() {
  const setup = _setupDriveAdapterTests();
  try {
    const driveAdapter = createDriveAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    const fs = setup._internal_fs_ref_for_tests;

    const createResult = driveAdapter.store({ folderId: 'root', fileName: 'test.txt', content: 'Contenido inicial' });
    const fileId = createResult.fileId;
    assert.areEqual('Contenido inicial', fs.file_db[fileId].content);

    const updateResult = driveAdapter.store({ folderId: 'root', fileName: 'test.txt', content: 'Contenido actualizado' });
    assert.areEqual(fileId, updateResult.fileId);
    assert.areEqual('Contenido actualizado', fs.file_db[fileId].content);

    return true;
  } finally {
    _teardownDriveAdapterTests(setup.originals);
  }
}

function testDriveAdapter_Retrieve_debeLeerPorNombreYRetornarNullSiNoExiste() {
  const setup = _setupDriveAdapterTests();
  try {
    const driveAdapter = createDriveAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    driveAdapter.store({ folderId: 'root', fileName: 'data.json', content: '{"ok":true}' });

    const resultFound = driveAdapter.retrieve({ folderId: 'root', fileName: 'data.json', type: 'json' });
    assert.deepEqual({ ok: true }, resultFound.content);

    const resultNotFound = driveAdapter.retrieve({ folderId: 'root', fileName: 'no-existe.txt', type: 'json' });
    assert.areEqual(null, resultNotFound.content);
    assert.areEqual(null, resultNotFound.fileId);

    return true;
  } finally {
    _teardownDriveAdapterTests(setup.originals);
  }
}

function testDriveAdapter_CreateFolder_debeSerIdempotente() {
  const setup = _setupDriveAdapterTests();
  try {
    const driveAdapter = createDriveAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    const result1 = driveAdapter.createFolder({ parentFolderId: 'root', folderName: 'MiCarpeta' });
    const result2 = driveAdapter.createFolder({ parentFolderId: 'root', folderName: 'MiCarpeta' });
    assert.areEqual(result1.folderId, result2.folderId);
    return true;
  } finally {
    _teardownDriveAdapterTests(setup.originals);
  }
}

function testDriveAdapter_Move_debeCambiarElPadreDeUnArchivo() {
  const setup = _setupDriveAdapterTests();
  try {
    const driveAdapter = createDriveAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    const fs = setup._internal_fs_ref_for_tests;

    const origen = driveAdapter.createFolder({ parentFolderId: 'root', folderName: 'Origen' });
    const destino = driveAdapter.createFolder({ parentFolderId: 'root', folderName: 'Destino' });
    const file = driveAdapter.store({ folderId: origen.folderId, fileName: 'movible.txt', content: '...' });

    driveAdapter.move({ targetId: file.fileId, destinationFolderId: destino.folderId });

    const fileData = fs.file_db[file.fileId];
    assert.areEqual(destino.folderId, fileData.parentId);
    assert.isTrue(fs.folder_db[destino.folderId].files.hasOwnProperty('movible.txt'));
    assert.isFalse(fs.folder_db[origen.folderId].files.hasOwnProperty('movible.txt'));

    return true;
  } finally {
    _teardownDriveAdapterTests(setup.originals);
  }
}

function testDriveAdapter_Move_debeCambiarElPadreDeUnaCarpeta() {
  const setup = _setupDriveAdapterTests();
  try {
    const driveAdapter = createDriveAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    const fs = setup._internal_fs_ref_for_tests;

    const origen = driveAdapter.createFolder({ parentFolderId: 'root', folderName: 'Origen' });
    const subcarpeta = driveAdapter.createFolder({ parentFolderId: origen.folderId, folderName: 'Subcarpeta' });
    const destino = driveAdapter.createFolder({ parentFolderId: 'root', folderName: 'Destino' });

    driveAdapter.store({ folderId: subcarpeta.folderId, fileName: 'archivo.txt', content: 'test' });

    driveAdapter.move({ targetId: subcarpeta.folderId, destinationFolderId: destino.folderId });

    const subcarpetaData = fs.folder_db[subcarpeta.folderId];
    assert.areEqual(destino.folderId, subcarpetaData.parentId);
    assert.isFalse(fs.folder_db[origen.folderId].children.hasOwnProperty('Subcarpeta'));
    assert.isTrue(fs.folder_db[destino.folderId].children.hasOwnProperty('Subcarpeta'));

    return true;
  } finally {
    _teardownDriveAdapterTests(setup.originals);
  }
}

function testDriveAdapter_Aliases_debeSoportarMetodosLegados() {
  const setup = _setupDriveAdapterTests();
  try {
    const driveAdapter = createDriveAdapter({ errorHandler: setup.mocks.mockErrorHandler });

    // Test createFile (alias de store)
    const createResult = driveAdapter.createFile({ folderId: 'root', fileName: 'legacy.json', content: '{"status":"ok"}' });
    assert.isNotNull(createResult.fileId, 'createFile debió retornar un fileId');

    // Test readFile (alias de retrieve.content)
    const content = driveAdapter.readFile({ fileId: createResult.fileId });
    assert.deepEqual({ status: "ok" }, content, 'readFile debió retornar el objeto parseado');

    // Test updateFile (alias de store)
    driveAdapter.updateFile({ fileId: createResult.fileId, content: '{"status":"updated"}' });
    const updatedContent = driveAdapter.readFile({ fileId: createResult.fileId });
    assert.deepEqual({ status: "updated" }, updatedContent, 'updateFile debió actualizar el contenido');

    return true;
  } finally {
    _teardownDriveAdapterTests(setup.originals);
  }
}