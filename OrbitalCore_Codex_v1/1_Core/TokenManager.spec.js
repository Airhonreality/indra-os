// ======================================================================
// ARTEFACTO: 1_Core/TokenManager.spec.js
// PROPÓSITO: Suite de tests unitarios COMPLETA para TokenManager.gs
// ESTRATEGIA: Verificar encriptación, default accounts, y CRUD de tokens
// ======================================================================

/**
 * Helper de Setup centralizado para todos los tests de TokenManager
 */
function _setupTokenManagerTests() {
    const originals = {
        CryptoJS: globalThis.CryptoJS,
        Utilities: globalThis.Utilities
    };

    // Storage simulado para tokens
    const tokensStorage = {
        fileContent: null
    };

    // Mock Utilities nativo de GAS (Blindaje SATTVA)
    const mockUtilities = {};

    const methodsToPreserve = [
        'newBlob', 'getUuid', 'base64Encode', 'base64Decode', 'computeDigest', 'encryptBytes', 'decryptBytes', 'getRandomBytes'
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

    mockUtilities.base64Encode = (strOrBytes) => {
        // GAS native base64Encode handles both string and byte[]
        if (originals.Utilities && originals.Utilities.base64Encode) {
            return originals.Utilities.base64Encode(strOrBytes);
        }
        // Fallback para entornos no-GAS
        const str = Array.isArray(strOrBytes) ? String.fromCharCode.apply(null, strOrBytes) : strOrBytes;
        if (typeof Buffer !== 'undefined') return Buffer.from(str).toString('base64');
        if (typeof btoa !== 'undefined') return btoa(str);
        throw new Error("No base64Encode implementation found");
    };

    mockUtilities.base64Decode = (str) => {
        if (originals.Utilities && originals.Utilities.base64Decode) {
            return originals.Utilities.base64Decode(str);
        }
        // Fallback para entornos no-GAS
        let decoded;
        if (typeof Buffer !== 'undefined') decoded = Buffer.from(str, 'base64').toString('utf8');
        else if (typeof atob !== 'undefined') decoded = atob(str);
        else throw new Error("No base64Decode implementation found");

        // Simular retorno de byte[]
        const bytes = [];
        for (let i = 0; i < decoded.length; i++) bytes.push(decoded.charCodeAt(i));
        return bytes;
    };

    mockUtilities.newBlob = (data, contentType, name) => {
        if (originals.Utilities && originals.Utilities.newBlob) {
            return originals.Utilities.newBlob(data, contentType, name);
        }
        return {
            getDataAsString: () => typeof data === 'string' ? data : String.fromCharCode.apply(null, data),
            getBytes: () => Array.isArray(data) ? data : [],
            getName: () => name,
            getContentType: () => contentType
        };
    };

    mockUtilities.getUuid = () => "mock-uuid-" + Math.random();

    globalThis.Utilities = mockUtilities;

    const mocks = {
        mockErrorHandler: {
            createError: (code, msg, details) => {
                const e = new Error(msg);
                e.code = code;
                e.details = details;
                return e;
            }
        },
        mockDriveAdapter: {
            retrieve: ({ fileId, type }) => {
                if (!tokensStorage.fileContent) {
                    return { content: null };
                }
                const content = tokensStorage.fileContent;
                // Simular comportamiento del DriveAdapter real: si se pide JSON, retornar objeto.
                const finalContent = (type === 'json' && typeof content === 'string') ? JSON.parse(content) : content;
                return { content: finalContent };
            },
            store: ({ fileId, content }) => {
                tokensStorage.fileContent = content;
                return { fileId: 'mock-file-id-123' };
            }
        },
        mockConfigurator: {
            retrieveParameter: ({ key }) => {
                if (key === 'TOKENS_FILE_ID') return 'mock-file-id-123';
                if (key === 'MASTER_ENCRYPTION_KEY') return 'test-master-key-456';
                return null;
            }
        },
        mockCipherAdapter: {
            encrypt: (input) => {
                const payload = (typeof input === 'object' && input !== null) ? input : { text: input };
                const text = payload.text || payload.plainText || '';
                return `ciphered:${globalThis.Utilities.base64Encode(text)}`;
            },
            decrypt: (input) => {
                const payload = (typeof input === 'object' && input !== null) ? input : { cipher: input };
                const cipher = payload.cipher || payload.cipherText || '';
                if (cipher && typeof cipher === 'string' && cipher.startsWith('ciphered:')) {
                    const base64 = cipher.substring(9);
                    const bytes = globalThis.Utilities.base64Decode(base64);
                    return globalThis.Utilities.newBlob(bytes).getDataAsString();
                }
                return cipher;
            }
        },
        _helpers: {
            encryptForTest: (jsonObj) => {
                const text = JSON.stringify(jsonObj);
                return `ciphered:${globalThis.Utilities.base64Encode(text)}`;
            }
        },
        _state: {
            tokensStorage
        },
        mockUtilities // Ensure mockUtilities is accessible if needed
    };

    return { mocks, originals };
}

/**
 * Helper de Teardown
 */
function _teardownTokenManagerTests(originals) {
    globalThis.CryptoJS = originals.CryptoJS;
    globalThis.Utilities = originals.Utilities;
}

// ============================================================
// SUITE DE TESTS PARA TOKEN MANAGER
// ============================================================

/**
 * T1: Verificar AXIOMA #1 - Encriptación obligatoria
 */
function testTokenManager_SaveTokens_debeEncriptarElContenido() {
    const setup = _setupTokenManagerTests();
    try {
        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        const tokens = {
            version: '1.0',
            accounts: {
                notion: {
                    personal: { apiKey: 'secret_xxx', label: 'Personal', isDefault: true }
                }
            }
        };

        tokenManager.saveTokens({ tokens });

        // Verificar que el contenido guardado está encriptado (codificado en Base64 para Pureza GAS)
        const savedContent = setup.mocks._state.tokensStorage.fileContent;
        assert.isNotNull(savedContent, 'Debe guardar contenido');

        // El contenido NO debe ser JSON plano legible si el axioma dice encriptado
        assert.isFalse(savedContent.includes('"version":'), 'El contenido no debe ser JSON plano');

        // Debe seguir el patrón del mock de cipher
        assert.isTrue(savedContent.startsWith('ciphered:'), 'El contenido debe estar encriptado por el mock');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T2: Verificar AXIOMA #2 - Cuenta por defecto única
 */
function testTokenManager_SetToken_debeDesmarcarOtrasCuentasAlMarcarNuevaDefault() {
    const setup = _setupTokenManagerTests();
    try {
        // Inicializar con archivo existente
        const initialTokens = {
            version: '1.0',
            accounts: {
                notion: {
                    personal: { apiKey: 'key1', label: 'Personal', isDefault: true }
                }
            }
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        // Añadir segunda cuenta como default
        tokenManager.setToken({
            provider: 'notion',
            accountId: 'work',
            tokenData: { apiKey: 'key2', label: 'Work', isDefault: true }
        });

        // Cargar y verificar
        const tokens = tokenManager.loadTokens();
        assert.isFalse(tokens.accounts.notion.personal.isDefault, 'La primera cuenta ya no debe ser default');
        assert.isTrue(tokens.accounts.notion.work.isDefault, 'La segunda cuenta debe ser default');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T3: Verificar AXIOMA #3 - Fallback a cuenta por defecto
 */
function testTokenManager_GetToken_debeRetornarCuentaDefaultSiNoSeEspecificaAccountId() {
    const setup = _setupTokenManagerTests();
    try {
        const initialTokens = {
            version: '1.0',
            accounts: {
                notion: {
                    personal: { apiKey: 'default_key', label: 'Personal', isDefault: true },
                    work: { apiKey: 'work_key', label: 'Work', isDefault: false }
                }
            }
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        const token = tokenManager.getToken({ provider: 'notion' });

        assert.areEqual('default_key', token.apiKey, 'Debe retornar la cuenta default');
        assert.areEqual('Personal', token.label, 'Debe retornar la cuenta default');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T4: Verificar que getToken retorna null si la cuenta no existe
 */
function testTokenManager_GetToken_debeRetornarNullSiCuentaNoExiste() {
    const setup = _setupTokenManagerTests();
    try {
        const initialTokens = {
            version: '1.0',
            accounts: {
                notion: {
                    personal: { apiKey: 'key1', label: 'Personal', isDefault: true }
                }
            }
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        const token = tokenManager.getToken({ provider: 'notion', accountId: 'nonexistent' });

        assert.isNull(token, 'Debe retornar null si la cuenta no existe');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T5: Verificar que setToken marca primera cuenta como default automáticamente
 */
function testTokenManager_SetToken_debeMarcPrimeraCuentaComoDefault() {
    const setup = _setupTokenManagerTests();
    try {
        const initialTokens = {
            version: '1.0',
            accounts: {}
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        tokenManager.setToken({
            provider: 'notion',
            accountId: 'personal',
            tokenData: { apiKey: 'key1', label: 'Personal' }
        });

        const tokens = tokenManager.loadTokens();
        assert.isTrue(tokens.accounts.notion.personal.isDefault, 'La primera cuenta debe ser default automáticamente');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T6: Verificar que listAccounts retorna array vacío si proveedor no existe
 */
function testTokenManager_ListAccounts_debeRetornarArrayVacioSiProveedorNoExiste() {
    const setup = _setupTokenManagerTests();
    try {
        const initialTokens = {
            version: '1.0',
            accounts: {}
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        const accounts = tokenManager.listTokenAccounts({ provider: 'nonexistent' });

        assert.arrayLength(accounts, 0, 'Debe retornar array vacío');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T7: Verificar que listAccounts retorna estructura correcta
 */
function testTokenManager_ListAccounts_debeRetornarEstructuraCorrecta() {
    const setup = _setupTokenManagerTests();
    try {
        const initialTokens = {
            version: '1.0',
            accounts: {
                notion: {
                    personal: { apiKey: 'key1', label: 'Personal', isDefault: true },
                    work: { apiKey: 'key2', label: 'Work', isDefault: false }
                }
            }
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        const accounts = tokenManager.listTokenAccounts({ provider: 'notion' });

        assert.arrayLength(accounts, 2, 'Debe retornar 2 cuentas');
        assert.areEqual('personal', accounts[0].id, 'Debe incluir ID');
        assert.areEqual('Personal', accounts[0].label, 'Debe incluir label');
        assert.isTrue(accounts[0].isDefault, 'Debe incluir isDefault');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T8: Verificar validación de tokenData inválido
 */
function testTokenManager_SetToken_debeRechazarTokenDataSinApiKey() {
    const setup = _setupTokenManagerTests();
    try {
        const initialTokens = {
            version: '1.0',
            accounts: {}
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        assert.throws(() => {
            tokenManager.setToken({
                provider: 'notion',
                accountId: 'personal',
                tokenData: { label: 'Personal' } // Sin apiKey ni refreshToken
            });
        }, 'INVALID_TOKEN_DATA');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T9: Verificar que getToken lanza error si no hay cuenta default
 */
function testTokenManager_GetToken_debeLanzarErrorSiNoHayDefault() {
    const setup = _setupTokenManagerTests();
    try {
        const initialTokens = {
            version: '1.0',
            accounts: {
                notion: {
                    work: { apiKey: 'key1', label: 'Work', isDefault: false }
                }
            }
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        assert.throws(() => {
            tokenManager.getToken({ provider: 'notion' });
        }, 'NO_DEFAULT_ACCOUNT');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}

/**
 * T10: Verificar que setToken añade timestamp updatedAt
 */
function testTokenManager_SetToken_debeAnadirTimestamp() {
    const setup = _setupTokenManagerTests();
    try {
        const initialTokens = {
            version: '1.0',
            accounts: {}
        };
        setup.mocks._state.tokensStorage.fileContent = setup.mocks._helpers.encryptForTest(initialTokens);

        const tokenManager = createTokenManager({
            driveAdapter: setup.mocks.mockDriveAdapter,
            configurator: setup.mocks.mockConfigurator,
            errorHandler: setup.mocks.mockErrorHandler,
            cipherAdapter: setup.mocks.mockCipherAdapter
        });

        tokenManager.setToken({
            provider: 'notion',
            accountId: 'personal',
            tokenData: { apiKey: 'key1', label: 'Personal' }
        });

        const tokens = tokenManager.loadTokens();
        assert.isNotNull(tokens.accounts.notion.personal.updatedAt, 'Debe añadir updatedAt');
        assert.isTrue(tokens.accounts.notion.personal.updatedAt.includes('T'), 'Debe ser ISO timestamp');

        return true;
    } finally {
        _teardownTokenManagerTests(setup.originals);
    }
}
